import type { GeminiService, ExtractedIntent } from '../../../infrastructure/services/gemini.service.js';
import type { ListSpacesUseCase } from '../spaces/list-spaces.use-case.js';
import type { GetSpaceAvailabilityUseCase } from '../availability/get-space-availability.use-case.js';
import type { CreateBookingUseCase } from '../bookings/create-booking.use-case.js';
import type { ListCatalogAmenitiesUseCase } from '../amenities/list-catalog-amenities.use-case.js';
import type { UserRepository } from '../../../domain/repositories/user.repository.js';
import { TooManyRequestsError, ConflictError } from '../../../shared/errors/index.js';

const CHAT_WAIT_MS = 15_000;
const OFF_TOPIC_PENALTY_MS = 5_000;
const OFF_TOPIC_MESSAGE = 'No se permite consultas ajenas al sistema';
const GREETING_MESSAGE =
  '¡Hola! Soy el asistente de WorkPlace. ¿En qué puedo ayudarte? Puedo buscarte espacios disponibles o guiarte para hacer una reserva.';
const MAX_RESULTS = 5;
const MAX_SLOTS_PER_SPACE = 4;

export interface ChatResult {
  reply: string;
  waitSeconds: number;
}

type SessionStep = 'selecting_space' | 'confirming_slot' | 'collecting_billing' | 'confirming_booking';

interface CandidateSlot {
  availableDate: string;
  startTime: string;
  endTime: string;
}

interface CandidateSpace {
  id: number;
  name: string;
  capacity: number;
  priceHour: string;
  amenities: string[];
  slots: CandidateSlot[];
}

interface NearMiss {
  space: CandidateSpace;
  failed: 'price' | 'amenities';
  distance: number;
}

interface BillingData {
  billingName?: string;
  billingEmail?: string;
  billingDocument?: string;
  billingPhone?: string;
  billingAddress?: string;
}

interface ChatSession {
  step: SessionStep;
  candidates: CandidateSpace[];
  selectedSpaceId?: number;
  date?: string;
  startTime?: string;
  endTime?: string;
  billing: BillingData;
  missingBilling: string[];
}

const FIELD_LABELS: Record<keyof BillingData, string> = {
  billingName: 'nombre',
  billingEmail: 'correo',
  billingDocument: 'RUC/CI',
  billingPhone: 'teléfono',
  billingAddress: 'dirección',
};

const INFO_SYSTEM_PROMPT = `Eres el asistente virtual de WorkPlace, un sistema de coworking. Responde en español, de forma breve, clara y amigable, guiando al usuario cliente sobre el uso del sistema.

Cómo se reserva un espacio en WorkPlace (este es el flujo real del sistema):
1. Ve a la opción "Espacios" del menú, donde está el catálogo "Espacios disponibles".
2. Puedes buscar por nombre o descripción y filtrar por recursos, capacidad o precio.
3. Selecciona el espacio que prefieras y presiona el botón "Pre Reservar".
4. Se abre el modal "Reservar espacio" con el mensaje "Tu pre-reserva ya está guardada. Completa los datos para confirmarla." Allí verás la información del espacio (capacidad, precio por hora y recursos) y el total estimado.
5. En la pestaña "Datos" elige la Fecha y el Horario disponible.
6. En la pestaña "Facturación" completa Nombre/Razón social, RUC/CI, Email, Teléfono y Dirección.
7. Presiona "Reservar" para confirmar la reserva.
8. Puedes ver el estado de tus reservas en la opción "Mis reservas" del menú, donde también puedes confirmar o cancelar una reserva.

Reglas:
- Describe siempre el flujo real indicado arriba; no inventes pasos ni funcionalidades.
- No hables de opciones de administración ni de staff.
- Si la consulta no corresponde a la funcionalidad del sistema, redirige amablemente a lo que sí puede hacer.`;

function normalize(s: string): string {
  return s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

function isConfirmation(text: string): boolean {
  const t = normalize(text.trim());
  return /^(s[ií]\b|s[ií]\s|ok\b|okay\b|dale\b|adelante\b|procede\b|confirmo\b|reservar\b|correcto\b|claro\b|perfecto\b|por supuesto\b|listo\b)/.test(t);
}

function isShortNegation(text: string): boolean {
  const t = normalize(text.trim()).replace(/[.,!?]+$/, '');
  if (t.split(/\s+/).filter(Boolean).length > 2) return false;
  return /^(no|cancelar|cancela|detente|suspende|ninguno|ninguna|nada|no quiero|no gracias)$/.test(t);
}

const STREET_KEYWORDS = [
  'av',
  'avenida',
  'calle',
  'carrera',
  'pasaje',
  'ciudadela',
  'cdla',
  'conjunto',
  'urbanizacion',
  'urb',
  'barrio',
  'sector',
  'villa',
  'edificio',
  'edif',
  'oficina',
  'departamento',
  'dpto',
  'km',
  'manzana',
  'mz',
  'via',
  'centro',
];

const OFF_TOPIC_PATTERNS = [
  /\b(?:que es|que son|que significa|que hago|que pasa|que paso|que tengo|que quiere decir|que pedo|que onda)\b/,
  /\b(?:por que|porque|para que|como se|como es|como funciona|cuando|donde|cual es|cuanto|quien|quienes)\b/,
  /\b(?:explica|dime|cuentame|sabes|explique)\b/,
];

function isOffTopicQuestion(text: string): boolean {
  const t = normalize(text.trim());
  if (!t) return false;
  if (t[t.length - 1] === '?') return true;
  return OFF_TOPIC_PATTERNS.some((re) => re.test(t));
}

function parseSpaceChoice(text: string, candidates: CandidateSpace[]): number | null {
  const normalized = normalize(text.trim());
  for (let i = 0; i < candidates.length; i++) {
    const name = normalize(candidates[i].name);
    if (name && normalized.includes(name)) return i;
  }
  const m = normalized.match(/(?:opcion|numero|la|el|#)\s*(\d+)/);
  if (m) {
    const n = parseInt(m[1], 10);
    if (n >= 1 && n <= candidates.length) return n - 1;
    return null;
  }
  const capM = normalized.match(/(?:para|de|capacidad)\s*(\d{1,4})/);
  if (capM) {
    const n = parseInt(capM[1], 10);
    const idx = candidates.findIndex((c) => c.capacity === n);
    if (idx !== -1) return idx;
  }
  if (normalized.split(/\s+/).filter(Boolean).length <= 3) {
    const pure = normalized.replace(/[^0-9]/g, '');
    if (pure.length >= 1 && pure.length <= 2) {
      const n = parseInt(pure, 10);
      if (n >= 1 && n <= candidates.length) return n - 1;
    }
  }
  return null;
}

function validateBillingField(field: keyof BillingData, value: string): string | null {
  const v = value.trim();
  switch (field) {
    case 'billingName':
      return v.length >= 2 && v.length <= 255 ? null : 'El nombre debe tener al menos 2 caracteres.';
    case 'billingDocument':
      return /^[A-Za-z0-9-]{6,20}$/.test(v)
        ? null
        : 'El RUC/CI debe tener entre 6 y 20 caracteres (letras o números).';
    case 'billingEmail':
      return /^\S+@\S+\.\S+$/.test(v) ? null : 'El correo no es válido.';
    case 'billingPhone':
      return /^[0-9+\-\s]{6,30}$/.test(v) ? null : 'El teléfono debe tener al menos 6 caracteres.';
    case 'billingAddress': {
      const tokens = v.split(/\s+/).filter(Boolean);
      const hasDigit = /\d/.test(v);
      const hasStreetWord = STREET_KEYWORDS.some((k) => v.toLowerCase().includes(k));
      if (
        v.length < 4 ||
        v.length > 500 ||
        tokens.length < 2 ||
        !(hasDigit || hasStreetWord || v.includes(','))
      ) {
        return 'La dirección debe incluir calle y número (ej. "Av. Amazonas 123").';
      }
      return null;
    }
    default:
      return null;
  }
}

function formatDate(iso: string): string {
  const [y, m, d] = iso.split('-');
  return `${d}/${m}/${y}`;
}

export class ChatUseCase {
  private readonly lastChatAt = new Map<number, number>();
  private readonly inFlight = new Set<number>();
  private readonly offTopicStreak = new Map<number, number>();
  private readonly sessions = new Map<number, ChatSession>();

  constructor(
    private readonly geminiService: GeminiService,
    private readonly listSpacesUseCase: ListSpacesUseCase,
    private readonly getSpaceAvailabilityUseCase: GetSpaceAvailabilityUseCase,
    private readonly createBookingUseCase: CreateBookingUseCase,
    private readonly userRepository: UserRepository,
    private readonly listCatalogAmenitiesUseCase: ListCatalogAmenitiesUseCase,
  ) {}

  async execute(userId: number, message: string): Promise<ChatResult> {
    if (this.inFlight.has(userId)) {
      throw new TooManyRequestsError('Ya tienes una consulta en proceso. Espera a que termine.');
    }

    const now = Date.now();
    const last = this.lastChatAt.get(userId) ?? 0;
    const streak = this.offTopicStreak.get(userId) ?? 0;
    const baseWaitMs = this.waitForStreak(streak);
    const waitMs = baseWaitMs - (now - last);
    if (waitMs > 0) {
      await this.sleep(waitMs);
    }

    this.inFlight.add(userId);
    try {
      const session = this.sessions.get(userId);
      let reply: string;
      let newStreak = 0;

      if (session) {
        const local = await this.tryHandleSession(userId, session, message);
        if (local !== null) {
          reply = local;
        } else {
          const intent = await this.geminiService.extractIntent(message);
          const handled = await this.handleIntent(userId, message, intent, streak);
          reply = handled.reply;
          newStreak = handled.newStreak;
        }
      } else {
        const intent = await this.geminiService.extractIntent(message);
        const handled = await this.handleIntent(userId, message, intent, streak);
        reply = handled.reply;
        newStreak = handled.newStreak;
      }

      this.offTopicStreak.set(userId, newStreak);
      return { reply, waitSeconds: this.waitForStreak(newStreak) / 1000 };
    } finally {
      this.inFlight.delete(userId);
      this.lastChatAt.set(userId, Date.now());
    }
  }

  private async handleIntent(
    userId: number,
    message: string,
    intent: ExtractedIntent,
    streak: number,
  ): Promise<{ reply: string; newStreak: number }> {
    if (intent.type === 'offtopic') {
      return { reply: OFF_TOPIC_MESSAGE, newStreak: streak + 1 };
    }
    if (intent.type === 'greeting') {
      return { reply: GREETING_MESSAGE, newStreak: 0 };
    }
    if (intent.type === 'search') {
      const { candidates, reply } = await this.runSearch(intent);
      if (candidates.length > 0) {
        this.sessions.set(userId, {
          step: 'selecting_space',
          candidates,
          date: intent.params.date,
          startTime: intent.params.startTime,
          endTime: intent.params.endTime,
          billing: {},
          missingBilling: [],
        });
      } else {
        this.sessions.delete(userId);
      }
      return { reply, newStreak: 0 };
    }
    const answer = await this.geminiService.generateAnswer(
      INFO_SYSTEM_PROMPT,
      `Consulta del usuario: "${message}"`,
    );
    return { reply: answer, newStreak: 0 };
  }

  private async tryHandleSession(
    userId: number,
    session: ChatSession,
    message: string,
  ): Promise<string | null> {
    switch (session.step) {
      case 'selecting_space':
        return this.handleSpaceChoice(userId, session, message);
      case 'confirming_slot':
        return this.handleSlotChoice(userId, session, message);
      case 'collecting_billing':
        return await this.handleBillingAnswer(userId, session, message);
      case 'confirming_booking':
        return await this.handleFinalConfirmation(userId, session, message);
      default:
        return null;
    }
  }

  private async runSearch(
    intent: ExtractedIntent,
  ): Promise<{ candidates: CandidateSpace[]; reply: string }> {
    const { capacity, date, startTime, endTime, priceMax, amenities } = intent.params;

    const result = await this.listSpacesUseCase.execute({
      status: 'AVAILABLE',
      capacityMin: capacity ?? undefined,
      priceMax,
      page: 1,
      limit: 0,
    });

    const wantedAmenities = amenities?.length
      ? this.resolveAmenities(amenities, await this.listCatalogAmenitiesUseCase.execute())
      : [];

    const candidates: CandidateSpace[] = [];
    for (const space of result.items) {
      const base = await this.buildCandidate(space, date, startTime, endTime);
      if (!base) continue;
      const priceOk = priceMax === undefined || parseFloat(space.priceHour) <= priceMax;
      const amenityOk = this.amenityMatch(space, wantedAmenities).ok;
      if (priceOk && amenityOk) candidates.push(base);
    }

    const nearMisses: NearMiss[] = [];
    if (candidates.length === 0 && (priceMax !== undefined || wantedAmenities.length > 0)) {
      const relaxed = await this.listSpacesUseCase.execute({
        status: 'AVAILABLE',
        capacityMin: capacity ?? undefined,
        page: 1,
        limit: 0,
      });
      const candidateIds = new Set(candidates.map((c) => c.id));
      for (const space of relaxed.items) {
        if (candidateIds.has(space.id)) continue;
        const base = await this.buildCandidate(space, date, startTime, endTime);
        if (!base) continue;
        const priceOk = priceMax === undefined || parseFloat(space.priceHour) <= priceMax;
        const amenity = this.amenityMatch(space, wantedAmenities);
        if (priceOk && amenity.ok) {
          candidates.push(base);
          continue;
        }
        const failures = (!priceOk ? 1 : 0) + (!amenity.ok ? 1 : 0);
        if (failures === 1) {
          nearMisses.push({
            space: base,
            failed: priceOk ? 'amenities' : 'price',
            distance: priceOk ? amenity.missing : parseFloat(space.priceHour) - (priceMax ?? 0),
          });
        }
      }
    }

    candidates.sort((a, b) => {
      if (capacity !== undefined) {
        const da = Math.abs(a.capacity - capacity);
        const db = Math.abs(b.capacity - capacity);
        if (da !== db) return da - db;
      }
      return parseFloat(a.priceHour) - parseFloat(b.priceHour);
    });

    const top = candidates.slice(0, MAX_RESULTS);

    let reply: string;
    if (top.length === 0) {
      const filters = [
        priceMax !== undefined ? `presupuesto de $${priceMax}/h` : null,
        wantedAmenities.length > 0 ? `recursos: ${amenities?.join(', ')}` : null,
        capacity !== undefined ? `capacidad para ${capacity} personas` : null,
        date ? `fecha ${formatDate(date)}` : null,
      ].filter((f): f is string => f !== null);
      const nearMiss = nearMisses.sort((a, b) => {
        if (capacity !== undefined) {
          const da = a.space.capacity - capacity;
          const db = b.space.capacity - capacity;
          if (da !== db) return da - db;
        }
        return a.distance - b.distance;
      })[0];
      if (nearMiss) {
        const s = nearMiss.space;
        const reason =
          nearMiss.failed === 'price'
            ? `pero cuesta $${s.priceHour}/h, por encima de tu presupuesto de $${priceMax}/h`
            : `pero no tiene ${amenities?.join(', ')}`;
        reply = `No encontré espacios disponibles que cumplan todos tus criterios (${filters.join(
          ', ',
        )}).\nEl más cercano es ${s.name} (capacidad ${s.capacity}, $${s.priceHour}/h${
          s.amenities.length > 0 ? `, recursos: ${s.amenities.join(', ')}` : ''
        }), disponible el ${formatDate(s.slots[0].availableDate)} de ${s.slots[0].startTime} a ${
          s.slots[0].endTime
        }, ${reason}. Intenta relajar ese filtro o cambiar la fecha u horario.`;
      } else {
        reply =
          filters.length > 0
            ? `No encontré espacios disponibles que cumplan tus criterios (${filters.join(
                ', ',
              )}). Intenta relajar algún filtro o cambiar la fecha u horario.`
            : 'No encontré espacios disponibles para ese horario. Intenta con otra fecha u horario.';
      }
    } else {
      const filtersNote = [
        priceMax !== undefined ? `por menos de $${priceMax}/h` : '',
        wantedAmenities.length > 0 ? `con ${amenities?.join(', ')}` : '',
      ]
        .filter(Boolean)
        .join(' y ');
      const lines = top.map(
        (c, i) =>
          `${i + 1}. ${c.name} - capacidad ${c.capacity}, $${c.priceHour}/h${
            c.amenities.length > 0 ? `. Recursos: ${c.amenities.join(', ')}` : ''
          }. Disponible: ${c.slots
            .map((s) => `${formatDate(s.availableDate)} de ${s.startTime} a ${s.endTime}`)
            .join(', ')}`,
      );
      reply = `¡Claro! ${
        filtersNote ? `Buscando espacios ${filtersNote}... ` : ''
      }Encontré estos espacios disponibles:\n${lines.join(
        '\n',
      )}\n¿Cuál quieres reservar? Responde con el número o el nombre.`;
    }

    return { candidates: top, reply };
  }

  private async buildCandidate(
    space: {
      id: number;
      name: string;
      capacity: number;
      priceHour: string;
      amenities?: { name: string }[];
    },
    date: string | undefined,
    startTime: string | undefined,
    endTime: string | undefined,
  ): Promise<CandidateSpace | null> {
    const availability = await this.getSpaceAvailabilityUseCase.execute(space.id);
    const slots = availability.slots.filter(
      (slot) =>
        (!date || slot.availableDate === date) &&
        (!startTime || slot.startTime === startTime) &&
        (!endTime || slot.endTime === endTime),
    );
    if (slots.length === 0) return null;
    return {
      id: space.id,
      name: space.name,
      capacity: space.capacity,
      priceHour: space.priceHour,
      amenities: (space.amenities ?? []).map((a) => a.name),
      slots: slots.slice(0, MAX_SLOTS_PER_SPACE),
    };
  }

  private amenityMatch(
    space: { amenities?: { name: string }[] },
    wanted: string[],
  ): { ok: boolean; missing: number } {
    const has = (space.amenities ?? []).map((a) => normalize(a.name));
    const missing = wanted.filter((w) => !has.includes(w));
    return { ok: wanted.length === 0 || missing.length === 0, missing: missing.length };
  }

  private resolveAmenities(requested: string[], catalog: { name: string }[]): string[] {
    const wanted: string[] = [];
    for (const raw of requested) {
      const n = normalize(raw);
      if (!n) continue;
      const matched = catalog.filter((a) => {
        const cn = normalize(a.name);
        return cn.includes(n) || n.includes(cn);
      });
      if (matched.length === 0) {
        if (!wanted.includes(n)) wanted.push(n);
        continue;
      }
      for (const m of matched) {
        const cn = normalize(m.name);
        if (!wanted.includes(cn)) wanted.push(cn);
      }
    }
    return wanted;
  }

  private async handleSpaceChoice(
    userId: number,
    session: ChatSession,
    message: string,
  ): Promise<string | null> {
    if (isShortNegation(message)) {
      this.sessions.delete(userId);
      return 'Entendido, cancelo la búsqueda. ¿En qué más puedo ayudarte?';
    }
    if (isConfirmation(message)) {
      return '¿Cuál espacio quieres reservar? Responde con el número o el nombre.';
    }
    const index = parseSpaceChoice(message, session.candidates);
    if (index === null) return null;
    const space = session.candidates[index];
    session.selectedSpaceId = space.id;

    if (!(session.date && session.startTime && session.endTime)) {
      session.step = 'confirming_slot';
      return `Perfecto, ${space.name} (capacidad ${space.capacity}, $${space.priceHour}/h). ¿Para qué fecha y horario? Ejemplo: "el 10 de agosto de 9 a 11".`;
    }
    return await this.startBilling(userId, session, space);
  }

  private async handleSlotChoice(
    userId: number,
    session: ChatSession,
    message: string,
  ): Promise<string | null> {
    if (isShortNegation(message)) {
      this.sessions.delete(userId);
      return 'Entendido, cancelo la reserva. ¿En qué más puedo ayudarte?';
    }
    const intent = await this.geminiService.extractIntent(message);
    const { date, startTime, endTime } = intent.params;
    if (!date || !startTime || !endTime) {
      return 'No entendí la fecha y el horario. Ejemplo: "el 10 de agosto de 9 a 11".';
    }
    const space = session.candidates.find((c) => c.id === session.selectedSpaceId);
    if (!space) return null;
    const valid = space.slots.some(
      (s) => s.availableDate === date && s.startTime === startTime && s.endTime === endTime,
    );
    if (!valid) {
      return `El espacio ${space.name} no tiene disponibilidad el ${formatDate(
        date,
      )} de ${startTime} a ${endTime}. Sus horarios libres son: ${space.slots
        .map((s) => `${formatDate(s.availableDate)} de ${s.startTime} a ${s.endTime}`)
        .join(', ')}. ¿Qué fecha y horario prefieres?`;
    }
    session.date = date;
    session.startTime = startTime;
    session.endTime = endTime;
    return this.startBilling(userId, session, space);
  }

  private async startBilling(userId: number, session: ChatSession, space: CandidateSpace): Promise<string> {
    const user = await this.userRepository.findById(userId);
    if (user) {
      session.billing.billingName = user.name;
      session.billing.billingEmail = user.email;
    }
    session.missingBilling = ['billingDocument', 'billingPhone', 'billingAddress'];
    session.step = 'collecting_billing';
    return `Perfecto, ${this.describeSelection(session, space)}\n\nPara confirmar la reserva necesito tus datos de facturación. ${
      session.billing.billingName && session.billing.billingEmail
        ? `Usaré tu perfil: ${session.billing.billingName} / ${session.billing.billingEmail}.`
        : 'Necesito tu nombre y correo.'
    }\n\nPrimero, ¿cuál es tu ${FIELD_LABELS.billingDocument}?`;
  }

  private async handleBillingAnswer(
    userId: number,
    session: ChatSession,
    message: string,
  ): Promise<string> {
    if (isShortNegation(message)) {
      this.sessions.delete(userId);
      return 'Entendido, cancelo la reserva. ¿En qué más puedo ayudarte?';
    }
    const field = session.missingBilling[0] as keyof BillingData | undefined;
    if (!field) {
      return this.askFinalConfirmation(session);
    }
    if (isOffTopicQuestion(message)) {
      return `${OFF_TOPIC_MESSAGE} ¿Cuál es tu ${FIELD_LABELS[field]}?`;
    }
    const value = message.trim();
    const error = validateBillingField(field, value);
    if (error) {
      return `${error} Por favor, ingresa tu ${FIELD_LABELS[field]} nuevamente.`;
    }
    session.billing[field] = value;
    session.missingBilling.shift();
    if (session.missingBilling.length === 0) {
      session.step = 'confirming_booking';
      return this.askFinalConfirmation(session);
    }
    return `Gracias. Ahora, ¿cuál es tu ${FIELD_LABELS[session.missingBilling[0] as keyof BillingData]}?`;
  }

  private async handleFinalConfirmation(
    userId: number,
    session: ChatSession,
    message: string,
  ): Promise<string | null> {
    const space = session.candidates.find((c) => c.id === session.selectedSpaceId);
    if (!space) return null;
    if (isConfirmation(message)) {
      try {
        const booking = await this.createBookingUseCase.execute(userId, {
          spaceId: session.selectedSpaceId!,
          date: session.date!,
          startTime: session.startTime!,
          endTime: session.endTime!,
          billingName: session.billing.billingName!,
          billingDocument: session.billing.billingDocument!,
          billingEmail: session.billing.billingEmail!,
          billingPhone: session.billing.billingPhone!,
          billingAddress: session.billing.billingAddress!,
        });
        this.sessions.delete(userId);
        return `¡Reserva confirmada!\n- Espacio: ${space.name}\n- Fecha: ${formatDate(
          booking.date ?? '',
        )} de ${booking.startTime} a ${booking.endTime}\n- Total: $${booking.totalPrice ?? ''}\nPuedes verla en "Mis reservas".`;
      } catch (error) {
        if (error instanceof ConflictError) {
          this.sessions.delete(userId);
          return 'Lo siento, ese horario ya fue reservado por otra persona. Vuelve a pedirme una búsqueda y con gusto te ayudo con otro espacio u horario.';
        }
        throw error;
      }
    }
    if (isShortNegation(message)) {
      this.sessions.delete(userId);
      return 'Entendido, no hago la reserva. ¿En qué más puedo ayudarte?';
    }
    if (isOffTopicQuestion(message)) {
      return `${OFF_TOPIC_MESSAGE} ¿Confirmas la reserva? Responde "sí" o "no".`;
    }
    return 'No entendí tu respuesta. ¿Confirmas la reserva? Responde "sí" o "no".';
  }

  private describeSelection(session: ChatSession, space: CandidateSpace): string {
    return `${space.name} - ${formatDate(session.date ?? '')} de ${session.startTime} a ${
      session.endTime
    }. Total estimado: $${this.estimatedTotal(space, session)}.`;
  }

  private estimatedTotal(space: CandidateSpace, session: ChatSession): string {
    const [sh, sm] = (session.startTime ?? '00:00').split(':').map(Number);
    const [eh, em] = (session.endTime ?? '00:00').split(':').map(Number);
    const hours = eh + em / 60 - (sh + sm / 60);
    if (hours <= 0) return '0.00';
    return (parseFloat(space.priceHour) * hours).toFixed(2);
  }

  private askFinalConfirmation(session: ChatSession): string {
    const space = session.candidates.find((c) => c.id === session.selectedSpaceId);
    const lines = [
      'Resumen de tu reserva:',
      `- Espacio: ${space?.name ?? ''}`,
      `- Fecha: ${formatDate(session.date ?? '')} de ${session.startTime} a ${session.endTime}`,
      `- Total estimado: $${space ? this.estimatedTotal(space, session) : ''}`,
      `- Facturación: ${session.billing.billingName ?? ''} / ${session.billing.billingEmail ?? ''} / ${
        session.billing.billingDocument ?? ''
      } / ${session.billing.billingPhone ?? ''} / ${session.billing.billingAddress ?? ''}`,
      '',
      '¿Confirmas la reserva? Responde "sí" o "no".',
    ];
    return lines.join('\n');
  }

  private waitForStreak(streak: number): number {
    return CHAT_WAIT_MS + Math.max(0, streak - 1) * OFF_TOPIC_PENALTY_MS;
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
