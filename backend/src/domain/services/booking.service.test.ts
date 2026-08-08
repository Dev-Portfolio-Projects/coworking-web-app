import { describe, it, expect } from 'vitest';
import { BookingService } from './booking.service.js';

describe('BookingService', () => {
  const service = new BookingService();

  describe('isTimeOverlap', () => {
    it('detecta solapamiento parcial', () => {
      expect(service.isTimeOverlap('10:00', '12:00', '11:00', '13:00')).toBe(true);
    });

    it('detecta un rango contenido en otro', () => {
      expect(service.isTimeOverlap('09:00', '13:00', '10:00', '11:00')).toBe(true);
    });

    it('no solapa cuando son contiguos', () => {
      expect(service.isTimeOverlap('10:00', '11:00', '11:00', '12:00')).toBe(false);
    });

    it('no solapa cuando están separados', () => {
      expect(service.isTimeOverlap('10:00', '11:00', '12:00', '13:00')).toBe(false);
    });
  });

  describe('assertValidRange', () => {
    it('acepta un rango válido', () => {
      expect(() => service.assertValidRange('09:00', '10:00')).not.toThrow();
    });

    it('rechaza un rango invertido', () => {
      expect(() => service.assertValidRange('10:00', '09:00')).toThrow();
    });

    it('rechaza inicio igual a fin', () => {
      expect(() => service.assertValidRange('10:00', '10:00')).toThrow();
    });
  });

  describe('hoursBetween', () => {
    it('calcula horas enteras', () => {
      expect(service.hoursBetween('09:00', '11:00')).toBe(2);
    });

    it('calcula horas con fracciones', () => {
      expect(service.hoursBetween('09:00', '11:30')).toBe(2.5);
    });
  });

  describe('calculatePrice', () => {
    it('multiplica precio hora por horas', () => {
      expect(service.calculatePrice('25.50', 2)).toBe('51.00');
    });

    it('formatea a dos decimales', () => {
      expect(service.calculatePrice('10.00', 1.5)).toBe('15.00');
    });
  });
});
