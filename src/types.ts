export type SessionType = 'morning' | 'afternoon';

export interface DaySchedule {
  date: string; // YYYY-MM-DD, e.g., '2026-12-14'
  dayLabel: string; // 'Day 1 - 14 Dec (Mon)'
  morning: boolean; // 8:00 AM - 11:00 AM
  afternoon: boolean; // 1:00 PM - 4:00 PM
}

export interface Participant {
  id: string;
  name: string;
  age: number | '';
  gender: 'male' | 'female' | 'other';
  relationship: string;
  mobile?: string;
  isYagyakarta: boolean;
  schedule: DaySchedule[];
}

export interface YagyakartaDetails {
  fullName: string;
  primaryMobile: string;
  secondaryMobile?: string;
  email?: string;
  city: string;
  state: string;
  pincode: string;
  gotra?: string;
  sankalpPurpose?: string;
}

export interface AllocatedSession {
  date: string;
  session: SessionType;
  kundNumber: number;
  zone: string;
  participantIds: string[];
  participantCount: number;
}

export interface Booking {
  id: string; // e.g., 'MY-2026-8491'
  createdAt: string;
  yagyakarta: YagyakartaDetails;
  participants: Participant[];
  allocations: AllocatedSession[];
  status: 'confirmed' | 'partially_cancelled' | 'cancelled';
  notes?: string;
}

export interface KundInfo {
  number: number;
  zone: string;
  zoneName: string;
  capacity: number; // 8
}

export interface BlockedKundRecord {
  id: string;
  kundNumber: number;
  date: string;
  session: SessionType;
  reason?: string;
  blockedByAdminId: string;
  blockedByAdminName: string;
  blockedAt: string;
  offlineFamilyDetails?: {
    groupName: string;
    contactPhone?: string;
    devoteeCount: number;
  };
}

export interface KundSessionOccupancy {
  kundNumber: number;
  zone: string;
  date: string;
  session: SessionType;
  occupiedSeats: number;
  capacity: number;
  isBlocked: boolean;
  blockRecord?: BlockedKundRecord;
  bookings: {
    bookingId: string;
    yagyakartaName: string;
    contactNumber: string;
    city: string;
    participantCount: number;
    participantNames: string[];
  }[];
}

export type AdminRole = 'super_admin' | 'operator';

export interface AdminUser {
  id: string;
  name: string;
  email: string;
  mobile: string;
  role: AdminRole;
  passwordHash: string; // Plaintext demo credential
  createdAt: string;
  lastLogin?: string;
}

export interface AdminAuditLog {
  id: string;
  timestamp: string;
  adminId: string;
  adminName: string;
  adminRole: AdminRole;
  action: 'BLOCK_KUND' | 'UNBLOCK_KUND' | 'BULK_BLOCK' | 'REASSIGN_KUND' | 'CANCEL_BOOKING' | 'ADD_ADMIN' | 'REMOVE_ADMIN' | 'EXPORT_DATA';
  details: string;
}
