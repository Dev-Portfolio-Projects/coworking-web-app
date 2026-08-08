import type { BookingStatus } from '../../shared/types/index.js';

export interface DashboardCounters {
  availableSpaces: number;
  totalSpaces: number;
  confirmedBookings: number;
  pendingBookings: number;
  cancelledBookings: number;
  revenue: number;
  clients: number;
}

export interface BookingByDay {
  date: string;
  total: number;
}

export interface BookingByStatus {
  status: BookingStatus;
  total: number;
}

export interface BookingBySpace {
  spaceId: number;
  spaceName: string;
  total: number;
}

export interface RecentBooking {
  id: number;
  spaceName: string;
  userName: string;
  date: string | null;
  startTime: string | null;
  endTime: string | null;
  totalPrice: string | null;
  status: BookingStatus;
}

export interface DashboardData {
  counters: DashboardCounters;
  bookingsByDay: BookingByDay[];
  bookingsByStatus: BookingByStatus[];
  bookingsBySpace: BookingBySpace[];
  recentBookings: RecentBooking[];
}

export interface DashboardRepository {
  getData(): Promise<DashboardData>;
}
