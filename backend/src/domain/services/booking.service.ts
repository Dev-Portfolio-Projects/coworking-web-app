import { ConflictError } from '../../shared/errors/index.js';

export class BookingService {
  isTimeOverlap(startA: string, endA: string, startB: string, endB: string): boolean {
    return startA < endB && startB < endA;
  }

  assertValidRange(start: string, end: string): void {
    if (start >= end) {
      throw new ConflictError('La hora de fin debe ser posterior a la hora de inicio');
    }
  }

  hoursBetween(start: string, end: string): number {
    const [sh, sm] = start.split(':').map(Number);
    const [eh, em] = end.split(':').map(Number);
    const totalMinutes = eh * 60 + em - (sh * 60 + sm);
    return totalMinutes / 60;
  }

  calculatePrice(priceHour: string, hours: number): string {
    const total = parseFloat(priceHour) * hours;
    return total.toFixed(2);
  }
}
