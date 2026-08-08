import { describe, it, expect } from 'vitest';
import { fallbackPriceMax } from './gemini.service.js';

describe('fallbackPriceMax', () => {
  it('extrae el monto con símbolo de dólar', () => {
    expect(fallbackPriceMax('que cueste menos de $12.5 la hora')).toBe(12.5);
    expect(fallbackPriceMax('más barato que $15 la hora')).toBe(15);
    expect(fallbackPriceMax('hasta $20')).toBe(20);
  });

  it('no interpreta cifras de capacidad como precio', () => {
    expect(fallbackPriceMax('necesito un espacio para 74 personas')).toBeUndefined();
    expect(fallbackPriceMax('para 10 personas el 10 de agosto de 9 a 11')).toBeUndefined();
  });

  it('acepta el formato con palabra dólares', () => {
    expect(fallbackPriceMax('menos de 12.5 dólares la hora')).toBe(12.5);
  });

  it('ignora montos sin contexto de precio', () => {
    expect(fallbackPriceMax('hola')).toBeUndefined();
    expect(fallbackPriceMax('')).toBeUndefined();
  });
});
