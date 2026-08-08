import { describe, it, expect, vi, afterEach } from 'vitest';
import { ChatUseCase } from './chat.use-case.js';
import { TooManyRequestsError, ConflictError } from '../../../shared/errors/index.js';
import type { GeminiService, ExtractedIntent } from '../../../infrastructure/services/gemini.service.js';
import type { ListSpacesUseCase } from '../spaces/list-spaces.use-case.js';
import type { GetSpaceAvailabilityUseCase } from '../availability/get-space-availability.use-case.js';
import type { CreateBookingUseCase } from '../bookings/create-booking.use-case.js';
import type { ListCatalogAmenitiesUseCase } from '../amenities/list-catalog-amenities.use-case.js';
import type { UserRepository } from '../../../domain/repositories/user.repository.js';

const infoIntent: ExtractedIntent = { type: 'info', params: {} };
const offtopicIntent: ExtractedIntent = { type: 'offtopic', params: {} };
const greetingIntent: ExtractedIntent = { type: 'greeting', params: {} };
const searchIntent: ExtractedIntent = {
  type: 'search',
  params: { capacity: 150, date: '2026-08-10', startTime: '09:00' },
};
const slotSearchIntent: ExtractedIntent = {
  type: 'search',
  params: { capacity: 150, date: '2026-08-10', startTime: '09:00', endTime: '11:00' },
};
const filteredSearchIntent: ExtractedIntent = {
  type: 'search',
  params: {
    capacity: 45,
    date: '2026-08-10',
    startTime: '09:00',
    endTime: '11:00',
    priceMax: 12.5,
    amenities: ['impresora'],
  },
};

const availableSpaces = [
  { id: 1, name: 'Sala A', description: 'Sala grande', capacity: 150, priceHour: '21.50', images: null, status: 'AVAILABLE' as const, amenities: [{ id: 1, name: 'Proyector' }] },
  { id: 2, name: 'Sala B', description: 'Auditorio', capacity: 45, priceHour: '12.85', images: null, status: 'AVAILABLE' as const, amenities: [{ id: 2, name: 'Impresora' }] },
  { id: 3, name: 'Sala UG', description: 'Sala con recursos', capacity: 45, priceHour: '12.11', images: null, status: 'AVAILABLE' as const, amenities: [{ id: 1, name: 'Proyector' }, { id: 2, name: 'Impresora' }] },
];

function buildUseCase() {
  const gemini = {
    extractIntent: vi.fn<GeminiService['extractIntent']>(async () => infoIntent),
    generateAnswer: vi.fn<GeminiService['generateAnswer']>(async () => 'respuesta del asistente'),
  };

  const listSpaces = {
    execute: vi.fn<ListSpacesUseCase['execute']>(async () => ({
      items: [],
      meta: { page: 1, limit: 0, total: 0, totalPages: 0 },
    })),
  };

  const getAvailability = {
    execute: vi.fn<GetSpaceAvailabilityUseCase['execute']>(async () => ({
      spaceId: 1,
      slots: [],
    })),
  };

  const createBooking = {
    execute: vi.fn<CreateBookingUseCase['execute']>(async () => ({
      id: 1,
      userId: 1,
      spaceId: 1,
      status: 'CONFIRMED',
      date: '2026-08-10',
      startTime: '09:00',
      endTime: '11:00',
      totalPrice: '20.00',
      createdAt: new Date(),
      updatedAt: new Date(),
    })),
  };

  const userRepository = {
    findById: vi.fn<UserRepository['findById']>(async () => ({
      id: 1,
      name: 'Juan Pérez',
      email: 'juan@workplace.com',
      roleId: 3,
      password: 'hashed',
      createdAt: new Date(),
      updatedAt: new Date(),
    })),
  };

  const listCatalogAmenities = {
    execute: vi.fn<ListCatalogAmenitiesUseCase['execute']>(async () => [
      { id: 1, name: 'Proyector' },
      { id: 2, name: 'Impresora' },
      { id: 3, name: 'WiFi rápido' },
    ]),
  };

  const useCase = new ChatUseCase(
    gemini as unknown as GeminiService,
    listSpaces as unknown as ListSpacesUseCase,
    getAvailability as unknown as GetSpaceAvailabilityUseCase,
    createBooking as unknown as CreateBookingUseCase,
    userRepository as unknown as UserRepository,
    listCatalogAmenities as unknown as ListCatalogAmenitiesUseCase,
  );

  return { useCase, gemini, listSpaces, getAvailability, createBooking, userRepository, listCatalogAmenities };
}

async function send(useCase: ChatUseCase, userId: number, message: string): Promise<{ reply: string; waitSeconds: number }> {
  const pending = useCase.execute(userId, message);
  await vi.advanceTimersByTimeAsync(15_000);
  return await pending;
}

describe('ChatUseCase', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('responde consultas de tipo info sin tocar la búsqueda de espacios', async () => {
    const { useCase, gemini, listSpaces } = buildUseCase();

    const result = await useCase.execute(1, '¿Cómo reservo un espacio?');

    expect(result.reply).toBe('respuesta del asistente');
    expect(result.waitSeconds).toBe(15);
    expect(listSpaces.execute).not.toHaveBeenCalled();
    expect(gemini.generateAnswer).toHaveBeenCalledWith(expect.stringContaining('WorkPlace'), expect.stringContaining('¿Cómo reservo un espacio?'));
  });

  it('busca espacios por capacidad y horario para consultas de tipo search', async () => {
    const { useCase, gemini, listSpaces, getAvailability } = buildUseCase();
    listSpaces.execute.mockResolvedValue({
      items: [
        { id: 1, name: 'Sala A', description: 'Sala grande', capacity: 150, priceHour: '10.00', images: null, status: 'AVAILABLE' },
        { id: 2, name: 'Sala B', description: 'Auditorio', capacity: 200, priceHour: '15.00', images: null, status: 'AVAILABLE' },
      ],
      meta: { page: 1, limit: 0, total: 2, totalPages: 1 },
    });
    getAvailability.execute.mockResolvedValue({
      spaceId: 1,
      slots: [
        { id: 1, availableDate: '2026-08-10', startTime: '09:00', endTime: '11:00', booked: false },
        { id: 2, availableDate: '2026-08-10', startTime: '14:00', endTime: '16:00', booked: false },
      ],
    });
    gemini.extractIntent.mockResolvedValue(searchIntent);

    const result = await useCase.execute(
      1,
      'necesito un espacio para 150 personas el 10 de agosto a las 9',
    );

    expect(listSpaces.execute).toHaveBeenCalledWith(
      expect.objectContaining({ status: 'AVAILABLE', capacityMin: 150, limit: 0 }),
    );
    expect(result.reply).toContain('Sala A');
    expect(result.reply).toContain('¿Cuál quieres reservar?');
    expect(gemini.generateAnswer).not.toHaveBeenCalled();
  });

  it('pasa el precio máximo a la búsqueda de espacios', async () => {
    const { useCase, gemini, listSpaces, getAvailability } = buildUseCase();
    gemini.extractIntent.mockResolvedValue(filteredSearchIntent);
    listSpaces.execute.mockResolvedValue({
      items: availableSpaces,
      meta: { page: 1, limit: 0, total: 3, totalPages: 1 },
    });
    getAvailability.execute.mockResolvedValue({
      spaceId: 1,
      slots: [{ id: 1, availableDate: '2026-08-10', startTime: '09:00', endTime: '11:00', booked: false }],
    });

    await useCase.execute(1, 'un espacio para 45 personas que cueste menos de $12.5 la hora');

    expect(listSpaces.execute).toHaveBeenCalledWith(
      expect.objectContaining({ status: 'AVAILABLE', capacityMin: 45, priceMax: 12.5 }),
    );
  });

  it('filtra por recursos y muestra los recursos en la lista ordenada', async () => {
    vi.useFakeTimers();
    const { useCase, gemini, listSpaces, getAvailability, listCatalogAmenities } = buildUseCase();
    gemini.extractIntent.mockResolvedValue(filteredSearchIntent);
    listSpaces.execute.mockResolvedValue({
      items: availableSpaces,
      meta: { page: 1, limit: 0, total: 3, totalPages: 1 },
    });
    getAvailability.execute.mockResolvedValue({
      spaceId: 1,
      slots: [{ id: 1, availableDate: '2026-08-10', startTime: '09:00', endTime: '11:00', booked: false }],
    });

    const result = await send(useCase, 1, 'un espacio para 45 personas que tenga impresora');

    expect(listCatalogAmenities.execute).toHaveBeenCalled();
    expect(result.reply).not.toContain('Sala A');
    expect(result.reply).toContain('Sala UG');
    expect(result.reply).not.toContain('Sala B');
    expect(result.reply).toContain('Recursos: Proyector, Impresora');
    const firstLine = result.reply.split('\n').find((l) => l.startsWith('1.'));
    expect(firstLine).toContain('Sala UG');
  });

  it('explica que no encontró resultados cuando los filtros no coinciden', async () => {
    const { useCase, gemini, listSpaces, getAvailability } = buildUseCase();
    gemini.extractIntent.mockResolvedValue({ ...filteredSearchIntent, params: { ...filteredSearchIntent.params, amenities: ['Café gratis'] } });
    listSpaces.execute.mockResolvedValue({
      items: availableSpaces,
      meta: { page: 1, limit: 0, total: 3, totalPages: 1 },
    });
    getAvailability.execute.mockResolvedValue({
      spaceId: 1,
      slots: [{ id: 1, availableDate: '2026-08-10', startTime: '09:00', endTime: '11:00', booked: false }],
    });

    const result = await useCase.execute(1, 'un espacio que tenga cafetería');

    expect(result.reply).toContain('No encontré espacios disponibles');
  });

  it('mantiene la reserva en curso si el usuario pregunta algo ajeno entre paso y paso', async () => {
    vi.useFakeTimers();
    const { useCase, gemini, listSpaces, getAvailability } = buildUseCase();
    gemini.extractIntent
      .mockResolvedValueOnce(slotSearchIntent)
      .mockResolvedValueOnce(offtopicIntent);
    listSpaces.execute.mockResolvedValue({
      items: availableSpaces,
      meta: { page: 1, limit: 0, total: 3, totalPages: 1 },
    });
    getAvailability.execute.mockResolvedValue({
      spaceId: 1,
      slots: [{ id: 1, availableDate: '2026-08-10', startTime: '09:00', endTime: '11:00', booked: false }],
    });

    const search = await send(useCase, 1, 'necesito un espacio el 10 de agosto de 9 a 11');
    expect(search.reply).toContain('¿Cuál quieres reservar?');

    const off = await send(useCase, 1, 'que es agua');
    expect(off.reply).toBe('No se permite consultas ajenas al sistema');

    const choice = await send(useCase, 1, 'la 1');
    expect(choice.reply).toContain('Sala A');
    expect(choice.reply).toContain('RUC/CI');
    expect(gemini.extractIntent).toHaveBeenCalledTimes(2);
  });

  it('mantiene la reserva en curso si el usuario hace una consulta informativa entre paso y paso', async () => {
    vi.useFakeTimers();
    const { useCase, gemini, listSpaces, getAvailability } = buildUseCase();
    gemini.extractIntent
      .mockResolvedValueOnce(slotSearchIntent)
      .mockResolvedValueOnce(infoIntent);
    listSpaces.execute.mockResolvedValue({
      items: availableSpaces,
      meta: { page: 1, limit: 0, total: 3, totalPages: 1 },
    });
    getAvailability.execute.mockResolvedValue({
      spaceId: 1,
      slots: [{ id: 1, availableDate: '2026-08-10', startTime: '09:00', endTime: '11:00', booked: false }],
    });

    await send(useCase, 1, 'necesito un espacio el 10 de agosto de 9 a 11');

    const info = await send(useCase, 1, '¿cómo cancelo una reserva?');
    expect(info.reply).toBe('respuesta del asistente');

    const choice = await send(useCase, 1, 'la 1');
    expect(choice.reply).toContain('RUC/CI');
    expect(gemini.extractIntent).toHaveBeenCalledTimes(2);
  });

  it('reconoce la elección de espacio por capacidad', async () => {
    vi.useFakeTimers();
    const { useCase, gemini, listSpaces, getAvailability } = buildUseCase();
    gemini.extractIntent.mockResolvedValue(slotSearchIntent);
    listSpaces.execute.mockResolvedValue({
      items: availableSpaces,
      meta: { page: 1, limit: 0, total: 3, totalPages: 1 },
    });
    getAvailability.execute.mockResolvedValue({
      spaceId: 1,
      slots: [{ id: 1, availableDate: '2026-08-10', startTime: '09:00', endTime: '11:00', booked: false }],
    });

    await send(useCase, 1, 'necesito un espacio el 10 de agosto de 9 a 11');

    const choice = await send(useCase, 1, 'la de 45 personas');
    expect(choice.reply).toContain('Sala UG');
    expect(choice.reply).toContain('RUC/CI');
    expect(gemini.extractIntent).toHaveBeenCalledTimes(1);
  });

  it('espera 15 segundos entre consultas consecutivas', async () => {
    vi.useFakeTimers();
    const { useCase } = buildUseCase();

    await useCase.execute(1, 'primera consulta');

    let done = false;
    const second = useCase.execute(1, 'segunda consulta').then(() => {
      done = true;
    });

    await vi.advanceTimersByTimeAsync(14_000);
    expect(done).toBe(false);

    await vi.advanceTimersByTimeAsync(2_000);
    await second;
    expect(done).toBe(true);
  });

  it('responde un saludo breve sin mostrar la guía completa', async () => {
    const { useCase, gemini } = buildUseCase();
    gemini.extractIntent.mockResolvedValue(greetingIntent);

    const result = await useCase.execute(1, 'hola');

    expect(result.reply).toBe(
      '¡Hola! Soy el asistente de WorkPlace. ¿En qué puedo ayudarte? Puedo buscarte espacios disponibles o guiarte para hacer una reserva.',
    );
    expect(result.waitSeconds).toBe(15);
    expect(gemini.generateAnswer).not.toHaveBeenCalled();
  });

  it('responde el mensaje fijo para consultas ajenas al sistema', async () => {
    const { useCase, gemini } = buildUseCase();
    gemini.extractIntent.mockResolvedValue(offtopicIntent);

    const result = await useCase.execute(1, 'cuéntame un chiste');

    expect(result.reply).toBe('No se permite consultas ajenas al sistema');
    expect(result.waitSeconds).toBe(15);
    expect(gemini.generateAnswer).not.toHaveBeenCalled();
  });

  it('aumenta 5 segundos la espera por cada consulta ajena consecutiva', async () => {
    vi.useFakeTimers();
    const { useCase, gemini } = buildUseCase();
    gemini.extractIntent.mockResolvedValue(offtopicIntent);

    const first = await useCase.execute(1, 'chiste uno');
    expect(first.waitSeconds).toBe(15);

    const second = useCase.execute(1, 'chiste dos').then((r) => r);
    await vi.advanceTimersByTimeAsync(15_000);
    const secondResult = await second;
    expect(secondResult.waitSeconds).toBe(20);

    let done = false;
    const third = useCase.execute(1, 'chiste tres').then((r) => {
      done = true;
      return r;
    });

    await vi.advanceTimersByTimeAsync(19_000);
    expect(done).toBe(false);

    await vi.advanceTimersByTimeAsync(2_000);
    const thirdResult = await third;
    expect(thirdResult.waitSeconds).toBe(25);
    expect(done).toBe(true);
  });

  it('reinicia la penalización cuando la consulta es del sistema', async () => {
    vi.useFakeTimers();
    const { useCase, gemini } = buildUseCase();
    gemini.extractIntent.mockResolvedValue(offtopicIntent);

    await useCase.execute(1, 'chiste uno');
    gemini.extractIntent.mockResolvedValue(infoIntent);
    const infoCall = useCase.execute(1, '¿cómo reservo?');
    await vi.advanceTimersByTimeAsync(15_000);
    const infoResult = await infoCall;
    expect(infoResult.waitSeconds).toBe(15);

    gemini.extractIntent.mockResolvedValue(offtopicIntent);
    let done = false;
    const third = useCase.execute(1, 'chiste tres').then(() => {
      done = true;
    });

    await vi.advanceTimersByTimeAsync(14_000);
    expect(done).toBe(false);

    await vi.advanceTimersByTimeAsync(2_000);
    await third;
    expect(done).toBe(true);
  });

  it('rechaza con 429 si hay una consulta en proceso', async () => {
    vi.useFakeTimers();
    const { useCase, gemini } = buildUseCase();
    gemini.extractIntent.mockImplementation(() => new Promise(() => {}));

    const first = useCase.execute(1, 'consulta lenta');
    const second = useCase.execute(1, 'consulta rápida');

    await expect(second).rejects.toBeInstanceOf(TooManyRequestsError);

    void first;
  });

  it('completa una reserva por chat con datos de facturación', async () => {
    vi.useFakeTimers();
    const { useCase, gemini, listSpaces, getAvailability, createBooking, userRepository } = buildUseCase();
    gemini.extractIntent.mockResolvedValue(slotSearchIntent);
    listSpaces.execute.mockResolvedValue({
      items: availableSpaces,
      meta: { page: 1, limit: 0, total: 2, totalPages: 1 },
    });
    getAvailability.execute.mockResolvedValue({
      spaceId: 1,
      slots: [
        { id: 1, availableDate: '2026-08-10', startTime: '09:00', endTime: '11:00', booked: false },
      ],
    });

    const search = await send(useCase, 1, 'necesito un espacio para 150 personas el 10 de agosto de 9 a 11');
    expect(search.reply).toContain('Sala A');
    expect(search.reply).toContain('¿Cuál quieres reservar?');

    const choice = await send(useCase, 1, 'la 1');
    expect(choice.reply).toContain('RUC/CI');

    const document = await send(useCase, 1, '1712345678');
    expect(document.reply).toContain('teléfono');

    const phone = await send(useCase, 1, '0991234567');
    expect(phone.reply).toContain('dirección');

    const address = await send(useCase, 1, 'Av. Siempre Viva 123');
    expect(address.reply).toContain('¿Confirmas la reserva?');

    const confirm = await send(useCase, 1, 'sí');
    expect(confirm.reply).toContain('¡Reserva confirmada!');
    expect(confirm.reply).toContain('Sala A');
    expect(confirm.reply).toContain('10/08/2026');
    expect(confirm.reply).toContain('$20.00');

    expect(userRepository.findById).toHaveBeenCalledWith(1);
    expect(createBooking.execute).toHaveBeenCalledWith(1, {
      spaceId: 1,
      date: '2026-08-10',
      startTime: '09:00',
      endTime: '11:00',
      billingName: 'Juan Pérez',
      billingEmail: 'juan@workplace.com',
      billingDocument: '1712345678',
      billingPhone: '0991234567',
      billingAddress: 'Av. Siempre Viva 123',
    });
  });

  it('responde un mensaje amable cuando el horario ya fue reservado', async () => {
    vi.useFakeTimers();
    const { useCase, gemini, listSpaces, getAvailability, createBooking } = buildUseCase();
    gemini.extractIntent.mockResolvedValue(slotSearchIntent);
    listSpaces.execute.mockResolvedValue({
      items: availableSpaces,
      meta: { page: 1, limit: 0, total: 2, totalPages: 1 },
    });
    getAvailability.execute.mockResolvedValue({
      spaceId: 1,
      slots: [
        { id: 1, availableDate: '2026-08-10', startTime: '09:00', endTime: '11:00', booked: false },
      ],
    });
    createBooking.execute.mockRejectedValue(new ConflictError('El horario ya está reservado'));

    await send(useCase, 1, 'necesito un espacio el 10 de agosto de 9 a 11');
    await send(useCase, 1, 'la 1');
    await send(useCase, 1, '1712345678');
    await send(useCase, 1, '0991234567');
    await send(useCase, 1, 'Av. Siempre Viva 123');
    const confirm = await send(useCase, 1, 'sí');

    expect(confirm.reply).toContain('ya fue reservado');
  });

  it('cancela la reserva si el usuario responde no en la confirmación final', async () => {
    vi.useFakeTimers();
    const { useCase, gemini, listSpaces, getAvailability, createBooking } = buildUseCase();
    gemini.extractIntent.mockResolvedValue(slotSearchIntent);
    listSpaces.execute.mockResolvedValue({
      items: availableSpaces,
      meta: { page: 1, limit: 0, total: 2, totalPages: 1 },
    });
    getAvailability.execute.mockResolvedValue({
      spaceId: 1,
      slots: [
        { id: 1, availableDate: '2026-08-10', startTime: '09:00', endTime: '11:00', booked: false },
      ],
    });

    await send(useCase, 1, 'necesito un espacio el 10 de agosto de 9 a 11');
    await send(useCase, 1, 'la 1');
    await send(useCase, 1, '1712345678');
    await send(useCase, 1, '0991234567');
    await send(useCase, 1, 'Av. Siempre Viva 123');
    const confirm = await send(useCase, 1, 'no');

    expect(confirm.reply).toContain('no hago la reserva');
    expect(createBooking.execute).not.toHaveBeenCalled();
  });

  it('revalida un campo de facturación inválido', async () => {
    vi.useFakeTimers();
    const { useCase, gemini, listSpaces, getAvailability, createBooking } = buildUseCase();
    gemini.extractIntent.mockResolvedValue(slotSearchIntent);
    listSpaces.execute.mockResolvedValue({
      items: availableSpaces,
      meta: { page: 1, limit: 0, total: 2, totalPages: 1 },
    });
    getAvailability.execute.mockResolvedValue({
      spaceId: 1,
      slots: [
        { id: 1, availableDate: '2026-08-10', startTime: '09:00', endTime: '11:00', booked: false },
      ],
    });

    await send(useCase, 1, 'necesito un espacio el 10 de agosto de 9 a 11');
    await send(useCase, 1, 'la 1');

    const invalid = await send(useCase, 1, '123');
    expect(invalid.reply).toContain('RUC/CI');

    const valid = await send(useCase, 1, '1712345678');
    expect(valid.reply).toContain('teléfono');
    expect(createBooking.execute).not.toHaveBeenCalled();
  });

  it('no consume el campo de facturación si el usuario pregunta algo ajeno', async () => {
    vi.useFakeTimers();
    const { useCase, gemini, listSpaces, getAvailability, createBooking } = buildUseCase();
    gemini.extractIntent.mockResolvedValue(slotSearchIntent);
    listSpaces.execute.mockResolvedValue({
      items: availableSpaces,
      meta: { page: 1, limit: 0, total: 3, totalPages: 1 },
    });
    getAvailability.execute.mockResolvedValue({
      spaceId: 1,
      slots: [{ id: 1, availableDate: '2026-08-10', startTime: '09:00', endTime: '11:00', booked: false }],
    });

    await send(useCase, 1, 'necesito un espacio el 10 de agosto de 9 a 11');
    await send(useCase, 1, 'la 1');

    const off = await send(useCase, 1, 'que es agua');
    expect(off.reply).toContain('No se permite consultas ajenas al sistema');
    expect(off.reply).toContain('RUC/CI');

    const doc = await send(useCase, 1, '1712345678');
    expect(doc.reply).toContain('teléfono');
    expect(createBooking.execute).not.toHaveBeenCalled();
  });

  it('responde a preguntas ajenas sin cancelar la confirmación final', async () => {
    vi.useFakeTimers();
    const { useCase, gemini, listSpaces, getAvailability, createBooking } = buildUseCase();
    gemini.extractIntent.mockResolvedValue(slotSearchIntent);
    listSpaces.execute.mockResolvedValue({
      items: availableSpaces,
      meta: { page: 1, limit: 0, total: 3, totalPages: 1 },
    });
    getAvailability.execute.mockResolvedValue({
      spaceId: 1,
      slots: [{ id: 1, availableDate: '2026-08-10', startTime: '09:00', endTime: '11:00', booked: false }],
    });

    await send(useCase, 1, 'necesito un espacio el 10 de agosto de 9 a 11');
    await send(useCase, 1, 'la 1');
    await send(useCase, 1, '1712345678');
    await send(useCase, 1, '0991234567');
    await send(useCase, 1, 'Av. Siempre Viva 123');

    const off = await send(useCase, 1, 'porque la luna es un satelite');
    expect(off.reply).toContain('No se permite consultas ajenas al sistema');
    expect(off.reply).toContain('¿Confirmas la reserva?');

    const confirm = await send(useCase, 1, 'sí');
    expect(confirm.reply).toContain('¡Reserva confirmada!');
    expect(createBooking.execute).toHaveBeenCalled();
  });

  it('rechaza una dirección sin calle ni número', async () => {
    vi.useFakeTimers();
    const { useCase, gemini, listSpaces, getAvailability, createBooking } = buildUseCase();
    gemini.extractIntent.mockResolvedValue(slotSearchIntent);
    listSpaces.execute.mockResolvedValue({
      items: availableSpaces,
      meta: { page: 1, limit: 0, total: 3, totalPages: 1 },
    });
    getAvailability.execute.mockResolvedValue({
      spaceId: 1,
      slots: [{ id: 1, availableDate: '2026-08-10', startTime: '09:00', endTime: '11:00', booked: false }],
    });

    await send(useCase, 1, 'necesito un espacio el 10 de agosto de 9 a 11');
    await send(useCase, 1, 'la 1');
    await send(useCase, 1, '1712345678');
    await send(useCase, 1, '0991234567');

    const bad = await send(useCase, 1, 'sin numero');
    expect(bad.reply).toContain('La dirección debe incluir calle y número');

    const ok = await send(useCase, 1, 'Av. Siempre Viva 123');
    expect(ok.reply).toContain('¿Confirmas la reserva?');
    expect(createBooking.execute).not.toHaveBeenCalled();
  });

  it('sugiere el espacio más cercano cuando ninguno cumple el presupuesto', async () => {
    vi.useFakeTimers();
    const { useCase, gemini, listSpaces, getAvailability } = buildUseCase();
    gemini.extractIntent.mockResolvedValue({
      type: 'search',
      params: {
        capacity: 74,
        date: '2026-08-10',
        startTime: '09:00',
        endTime: '11:00',
        priceMax: 12.5,
        amenities: ['impresora'],
      },
    });
    listSpaces.execute.mockResolvedValue({
      items: [
        { id: 1, name: 'Sala Ejecutiva', description: 'Sala', capacity: 74, priceHour: '21.50', images: null, status: 'AVAILABLE', amenities: [{ id: 2, name: 'Impresora' }] },
      ],
      meta: { page: 1, limit: 0, total: 1, totalPages: 1 },
    });
    getAvailability.execute.mockResolvedValue({
      spaceId: 1,
      slots: [{ id: 1, availableDate: '2026-08-10', startTime: '09:00', endTime: '11:00', booked: false }],
    });

    const result = await send(
      useCase,
      1,
      'espacio para 74 personas con impresora por menos de $12.5 la hora el 10 de agosto de 9 a 11',
    );

    expect(result.reply).toContain('No encontré espacios disponibles');
    expect(result.reply).toContain('El más cercano es Sala Ejecutiva');
    expect(result.reply).toContain('por encima de tu presupuesto de $12.5/h');
  });
});
