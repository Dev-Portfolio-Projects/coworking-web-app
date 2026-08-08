import { env } from '../config/env.js';
import { AppError } from '../../shared/errors/index.js';

export interface ExtractedIntent {
  type: 'search' | 'info' | 'offtopic' | 'greeting';
  params: {
    capacity?: number;
    date?: string;
    startTime?: string;
    endTime?: string;
    priceMax?: number;
    amenities?: string[];
  };
}

interface GeminiResponse {
  candidates?: Array<{
    content?: {
      parts?: Array<{ text?: string }>;
    };
  }>;
}

const REQUEST_TIMEOUT_MS = 30_000;

export function fallbackPriceMax(message: string): number | undefined {
  const m =
    message.match(/\$\s*(\d+(?:[.,]\d+)?)/) ||
    message.match(/\b(\d+(?:[.,]\d+)?)\s*(?:d[oó]lares|usd)\b/i);
  if (!m) return undefined;
  const n = parseFloat(m[1].replace(',', '.'));
  return Number.isFinite(n) && n > 0 ? n : undefined;
}

function todayString(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function buildIntentSystemPrompt(): string {
  return `Eres el asistente del sistema de coworking WorkPlace. Convierte el mensaje del usuario en una consulta estructurada en JSON (sin markdown, solo JSON).

El sistema permite reservar espacios de coworking por hora. Los espacios tienen: nombre, descripción, capacidad (personas), precio por hora, estado (disponible/no disponible) y disponibilidad diaria con franjas horarias (inicio y fin).

Reglas:
- type "search": cuando el usuario pide buscar espacios disponibles/libres, o expresa intención de reservar un espacio (aunque no dé criterios). Extrae los parámetros que mencione.
- type "info": cuando pregunta cómo usar el sistema, cómo reservar, cancelar, pagar, ver sus reservas, o cualquier duda de funcionalidad. params debe ser {} vacío.
- type "greeting": cuando el usuario solo saluda (hola, buenas, buenos días, buenas tardes, hey, etc.) sin pedir nada más. params debe ser {} vacío. Si además de saludar pide o pregunta algo, clasifica según lo que pida.
- type "offtopic": cuando la consulta NO tiene relación alguna con el sistema de coworking WorkPlace (por ejemplo: pedir chistes, clima, noticias, política, deportes, temas personales, recomendaciones ajenas, etc.). params debe ser {} vacío.
- NO clasifiques como "offtopic" confirmaciones, negaciones o respuestas cortas como "sí", "si", "no", "ok", "dale", "adelante": si no están ligadas a una búsqueda o pregunta del sistema, clasifícalas como "info".

Formato de salida:
{"type":"search","params":{"capacity":150,"date":"YYYY-MM-DD","startTime":"HH:MM","endTime":"HH:MM","priceMax":12.5,"amenities":["Impresora","Proyector"]}}

- capacity: entero de personas, solo si lo menciona.
- date: formato YYYY-MM-DD. Hoy es ${todayString()}. Interpreta fechas relativas ("hoy", "mañana", "el lunes", "el próximo viernes") en relación a hoy. Solo si la menciona.
- startTime/endTime: formato HH:MM de 24 horas. Solo si los menciona.
- priceMax: número (precio máximo por hora) cuando el usuario limite el precio. Frases típicas: "que cueste menos de $12.5 la hora", "más barato que $15", "menor a $10", "hasta $20". Si la frase no menciona un monto numérico claro, omítelo.
- amenities: array de nombres de recursos/equipamiento que el usuario pida ("que tenga impresora", "con proyector", "que cuente con aire acondicionado y estacionamiento"). Usa el nombre tal como lo dice el usuario. Si no menciona recursos, omítelo.
- Si el usuario no menciona un parámetro, omítelo.
- No inventes parámetros que el usuario no pidió.
- Si la consulta es de búsqueda pero no menciona ni capacidad, ni fecha, ni horario, ni precio, ni recursos, responde con type "search" y params {} vacío.`;
}

export class GeminiService {
  private get apiKey(): string {
    return env.GEMINI_API_KEY;
  }

  private get model(): string {
    return env.GEMINI_MODEL;
  }

  private async call(systemPrompt: string, userPrompt: string, jsonMode = false): Promise<string> {
    if (!this.apiKey) {
      throw new AppError(500, 'La API key de Gemini no está configurada');
    }

    const url = `https://generativelanguage.googleapis.com/v1beta/models/${this.model}:generateContent?key=${this.apiKey}`;

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: systemPrompt }] },
          contents: [{ role: 'user', parts: [{ text: userPrompt }] }],
          generationConfig: {
            temperature: 0.2,
            ...(jsonMode ? { responseMimeType: 'application/json' } : {}),
          },
        }),
        signal: controller.signal,
      });

      if (!res.ok) {
        throw new AppError(502, 'El servicio de IA no respondió correctamente');
      }

      const data = (await res.json()) as GeminiResponse;
      const text = (data.candidates?.[0]?.content?.parts ?? [])
        .map((part) => part.text ?? '')
        .join('')
        .trim();

      if (!text) {
        throw new AppError(502, 'El servicio de IA no generó una respuesta');
      }

      return text;
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw new AppError(502, 'El servicio de IA no está disponible');
    } finally {
      clearTimeout(timeout);
    }
  }

  async extractIntent(message: string): Promise<ExtractedIntent> {
    const raw = await this.call(
      buildIntentSystemPrompt(),
      `Mensaje del usuario: "${message}"\nDevuelve únicamente el JSON.`,
      true,
    );

    try {
      const parsed = JSON.parse(raw) as {
        type?: string;
        params?: {
          capacity?: number;
          date?: string;
          startTime?: string;
          endTime?: string;
          priceMax?: number;
          amenities?: unknown;
        };
      };

      if (parsed.type === 'offtopic') {
        return { type: 'offtopic', params: {} };
      }

      if (parsed.type === 'greeting') {
        return { type: 'greeting', params: {} };
      }

      if (parsed.type === 'search') {
        const rawAmenities = Array.isArray(parsed.params?.amenities) ? parsed.params.amenities : [];
        const llmPriceMax =
          typeof parsed.params?.priceMax === 'number' && parsed.params.priceMax > 0
            ? parsed.params.priceMax
            : undefined;
        return {
          type: 'search',
          params: {
            capacity: typeof parsed.params?.capacity === 'number' ? Math.max(1, Math.round(parsed.params.capacity)) : undefined,
            date: parsed.params?.date || undefined,
            startTime: parsed.params?.startTime || undefined,
            endTime: parsed.params?.endTime || undefined,
            priceMax: fallbackPriceMax(message) ?? llmPriceMax,
            amenities: rawAmenities
              .map((a) => (typeof a === 'string' ? a.trim().replace(/\s+/g, ' ') : ''))
              .filter((a) => a.length > 0),
          },
        };
      }

      return { type: 'info', params: {} };
    } catch {
      return { type: 'info', params: {} };
    }
  }

  async generateAnswer(systemPrompt: string, context: string): Promise<string> {
    return this.call(systemPrompt, context);
  }
}
