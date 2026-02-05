export enum UnitType {
  CHALET = 'Chalet',
  VILLA = 'Villa',
  PALACE = 'Palace'
}

export enum BookingStatus {
  CONFIRMED = 'Confirmed',
  PENDING = 'Pending',
  CANCELLED = 'Cancelled'
}

export enum PaymentStatus {
  PAID = 'Paid',
  UNPAID = 'Unpaid'
}

export interface Unit {
  id: string;
  name: string;
  type: UnitType;
  created_at: string;
}

export interface Booking {
  id: string;
  tenant_name: string;
  phone: string;
  start_date: string; // ISO Date string
  nights: number;
  end_date: string; // ISO Date string
  unit_id: string;
  nightly_rate: number; // Base Rate
  village_fee: number; // New: Daily Village Fee
  total_rental_price: number; // Grand Total (Tenant Pays)
  housekeeping_enabled: boolean;
  housekeeping_price: number;
  deposit_enabled: boolean;
  deposit_amount: number;
  notes?: string;
  payment_status: PaymentStatus;
  status: BookingStatus;
  tenant_rating_good: boolean; // True = Welcome Again, False = Not Welcome
  created_at: string;
}

export interface Expense {
  id: string;
  unit_id: string;
  title: string;
  category: string;
  amount: number;
  date: string;
  description?: string;
  created_at: string;
}

export interface User {
  id: string;
  email: string;
  full_name?: string;
}

export type Language = 'en' | 'ar';
export type Theme = 'light' | 'dark';

export interface AppState {
  units: Unit[];
  bookings: Booking[];
  expenses: Expense[];
}