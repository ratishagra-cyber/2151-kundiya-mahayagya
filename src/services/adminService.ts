import * as XLSX from 'xlsx';
import { AdminUser, AdminRole, BlockedKundRecord, AdminAuditLog, Booking, SessionType } from '../types';
import { EVENT_DETAILS, getZoneForKund } from '../data/eventConfig';

const ADMINS_STORAGE_KEY = 'mahayagya_admins_v1';
const BLOCKED_KUNDS_KEY = 'mahayagya_blocked_kunds_v1';
const AUDIT_LOGS_KEY = 'mahayagya_audit_logs_v1';
const CURRENT_ADMIN_SESSION_KEY = 'mahayagya_current_admin_session_v1';

// Initial pre-seeded admins
export const INITIAL_ADMINS: AdminUser[] = [
  {
    id: 'admin-super-1',
    name: 'Acharya Somnath (Maha Samiti)',
    email: 'superadmin@mahayagya.org',
    mobile: '9820012345',
    role: 'super_admin',
    passwordHash: 'superadmin2026',
    createdAt: '2026-10-01T00:00:00Z',
    lastLogin: '2026-10-19T20:00:00Z',
  },
  {
    id: 'admin-op-2',
    name: 'Vipul Verma (Seating Seva Desk)',
    email: 'operator@mahayagya.org',
    mobile: '9412054321',
    role: 'operator',
    passwordHash: 'operator2026',
    createdAt: '2026-10-05T00:00:00Z',
    lastLogin: '2026-10-19T21:30:00Z',
  },
];

// Initial seeded blocked kunds (reserved for offline VIP mathura/varanasi ashram)
export const INITIAL_BLOCKED_KUNDS: BlockedKundRecord[] = [
  {
    id: 'block-1',
    kundNumber: 2001,
    date: '2026-12-14',
    session: 'morning',
    reason: 'Reserved for Mathura Ashram Sangh (Offline)',
    blockedByAdminId: 'admin-super-1',
    blockedByAdminName: 'Acharya Somnath',
    blockedAt: '2026-10-18T10:00:00Z',
    offlineFamilyDetails: {
      groupName: 'Mathura Ashram Sadhu Mandal',
      contactPhone: '9412099900',
      devoteeCount: 8,
    },
  },
  {
    id: 'block-2',
    kundNumber: 2002,
    date: '2026-12-14',
    session: 'morning',
    reason: 'Varanasi Vedic Scholars Group (Offline)',
    blockedByAdminId: 'admin-super-1',
    blockedByAdminName: 'Acharya Somnath',
    blockedAt: '2026-10-18T10:00:00Z',
    offlineFamilyDetails: {
      groupName: 'Varanasi Vidvat Parishad',
      contactPhone: '9412099911',
      devoteeCount: 8,
    },
  },
];

export const INITIAL_AUDIT_LOGS: AdminAuditLog[] = [
  {
    id: 'log-1',
    timestamp: '2026-10-18T10:00:00Z',
    adminId: 'admin-super-1',
    adminName: 'Acharya Somnath',
    adminRole: 'super_admin',
    action: 'BULK_BLOCK',
    details: 'Blocked Kunds #2001 and #2002 on 2026-12-14 (morning) for Mathura & Varanasi Offline Sanghs.',
  },
];

// Admins Management
export function getAdminUsers(): AdminUser[] {
  try {
    const raw = localStorage.getItem(ADMINS_STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(ADMINS_STORAGE_KEY, JSON.stringify(INITIAL_ADMINS));
      return INITIAL_ADMINS;
    }
    return JSON.parse(raw);
  } catch (e) {
    return INITIAL_ADMINS;
  }
}

export function saveAdminUsers(admins: AdminUser[]): void {
  localStorage.setItem(ADMINS_STORAGE_KEY, JSON.stringify(admins));
}

export function getCurrentAdminSession(): AdminUser | null {
  try {
    const raw = localStorage.getItem(CURRENT_ADMIN_SESSION_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function setCurrentAdminSession(admin: AdminUser | null): void {
  if (admin) {
    localStorage.setItem(CURRENT_ADMIN_SESSION_KEY, JSON.stringify(admin));
  } else {
    localStorage.removeItem(CURRENT_ADMIN_SESSION_KEY);
  }
}

export function authenticateAdmin(emailOrMobile: string, pass: string): { success: boolean; admin?: AdminUser; error?: string } {
  const admins = getAdminUsers();
  const cleaned = emailOrMobile.trim().toLowerCase();
  const found = admins.find(
    (a) => a.email.toLowerCase() === cleaned || a.mobile.replace(/\D/g, '') === cleaned.replace(/\D/g, '')
  );

  if (!found) {
    return { success: false, error: 'Admin account not found with this email or mobile.' };
  }

  if (found.passwordHash !== pass) {
    return { success: false, error: 'Incorrect admin password.' };
  }

  // Update last login
  const updatedAdmin = { ...found, lastLogin: new Date().toISOString() };
  const updatedList = admins.map((a) => (a.id === found.id ? updatedAdmin : a));
  saveAdminUsers(updatedList);
  setCurrentAdminSession(updatedAdmin);

  return { success: true, admin: updatedAdmin };
}

export function addAdminUser(
  currentAdmin: AdminUser,
  newAdmin: { name: string; email: string; mobile: string; role: AdminRole; password: string }
): { success: boolean; message: string; admins?: AdminUser[] } {
  if (currentAdmin.role !== 'super_admin') {
    return { success: false, message: 'Permission denied: Only Super Admins can add new administrators.' };
  }

  const admins = getAdminUsers();
  if (admins.some((a) => a.email.toLowerCase() === newAdmin.email.toLowerCase())) {
    return { success: false, message: 'An admin with this email already exists.' };
  }

  const created: AdminUser = {
    id: `admin-${Date.now()}`,
    name: newAdmin.name,
    email: newAdmin.email.toLowerCase(),
    mobile: newAdmin.mobile.replace(/\D/g, ''),
    role: newAdmin.role,
    passwordHash: newAdmin.password,
    createdAt: new Date().toISOString(),
  };

  const updatedList = [...admins, created];
  saveAdminUsers(updatedList);

  logAdminAction(
    currentAdmin,
    'ADD_ADMIN',
    `Created new admin: ${created.name} (${created.email}) with role [${created.role}]`
  );

  return { success: true, message: `Admin ${created.name} created successfully.`, admins: updatedList };
}

export function removeAdminUser(
  currentAdmin: AdminUser,
  targetAdminId: string
): { success: boolean; message: string; admins?: AdminUser[] } {
  if (currentAdmin.role !== 'super_admin') {
    return { success: false, message: 'Permission denied: Only Super Admins can remove administrators.' };
  }

  const admins = getAdminUsers();
  const target = admins.find((a) => a.id === targetAdminId);
  if (!target) return { success: false, message: 'Admin not found.' };

  if (target.id === currentAdmin.id) {
    return { success: false, message: 'Cannot delete your own active super admin account.' };
  }

  const superAdminsCount = admins.filter((a) => a.role === 'super_admin').length;
  if (target.role === 'super_admin' && superAdminsCount <= 1) {
    return { success: false, message: 'Cannot remove the last remaining Super Admin.' };
  }

  const updatedList = admins.filter((a) => a.id !== targetAdminId);
  saveAdminUsers(updatedList);

  logAdminAction(
    currentAdmin,
    'REMOVE_ADMIN',
    `Removed admin: ${target.name} (${target.email})`
  );

  return { success: true, message: `Admin ${target.name} removed.`, admins: updatedList };
}

// Blocked Kunds Management
export function getBlockedKunds(): BlockedKundRecord[] {
  try {
    const raw = localStorage.getItem(BLOCKED_KUNDS_KEY);
    if (!raw) {
      localStorage.setItem(BLOCKED_KUNDS_KEY, JSON.stringify(INITIAL_BLOCKED_KUNDS));
      return INITIAL_BLOCKED_KUNDS;
    }
    return JSON.parse(raw);
  } catch {
    return INITIAL_BLOCKED_KUNDS;
  }
}

export function saveBlockedKunds(list: BlockedKundRecord[]): void {
  localStorage.setItem(BLOCKED_KUNDS_KEY, JSON.stringify(list));
}

export function isKundBlocked(kundNumber: number, date: string, session: SessionType): BlockedKundRecord | undefined {
  const blocks = getBlockedKunds();
  return blocks.find((b) => b.kundNumber === kundNumber && b.date === date && b.session === session);
}

export function blockKunds(
  currentAdmin: AdminUser,
  params: {
    kundNumbers: number[];
    date: string;
    session: SessionType;
    reason?: string;
    offlineFamilyDetails?: { groupName: string; contactPhone?: string; devoteeCount: number };
    allBookings: Booking[];
  }
): { success: boolean; message: string; blockedCount: number; skippedKunds: number[] } {
  const existingBlocks = getBlockedKunds();
  const newBlocks: BlockedKundRecord[] = [];
  const skippedKunds: number[] = [];

  for (const num of params.kundNumbers) {
    // Check if already blocked
    const alreadyBlocked = existingBlocks.some(
      (b) => b.kundNumber === num && b.date === params.date && b.session === params.session
    );
    if (alreadyBlocked) continue;

    // Check if occupied by confirmed online booking
    const isOccupiedByOnline = params.allBookings.some((b) =>
      b.status !== 'cancelled' &&
      b.allocations.some((a) => a.kundNumber === num && a.date === params.date && a.session === params.session)
    );

    if (isOccupiedByOnline) {
      skippedKunds.push(num);
      continue;
    }

    newBlocks.push({
      id: `block-${Date.now()}-${num}`,
      kundNumber: num,
      date: params.date,
      session: params.session,
      reason: params.reason || 'Offline/VIP Reservation',
      blockedByAdminId: currentAdmin.id,
      blockedByAdminName: currentAdmin.name,
      blockedAt: new Date().toISOString(),
      offlineFamilyDetails: params.offlineFamilyDetails,
    });
  }

  const updated = [...existingBlocks, ...newBlocks];
  saveBlockedKunds(updated);

  logAdminAction(
    currentAdmin,
    newBlocks.length > 1 ? 'BULK_BLOCK' : 'BLOCK_KUND',
    `Blocked ${newBlocks.length} kund(s) for ${params.date} (${params.session}). Kunds: [${newBlocks.map((b) => '#' + b.kundNumber).join(', ')}]. Reason: "${params.reason || 'Offline reservation'}". Skipped online occupied: [${skippedKunds.join(', ')}]`
  );

  return {
    success: true,
    message: `Successfully blocked ${newBlocks.length} Kund(s).${skippedKunds.length > 0 ? ` Skipped ${skippedKunds.length} kunds with confirmed online bookings.` : ''}`,
    blockedCount: newBlocks.length,
    skippedKunds,
  };
}

export function unblockKund(
  currentAdmin: AdminUser,
  kundNumber: number,
  date: string,
  session: SessionType
): { success: boolean; message: string } {
  const existingBlocks = getBlockedKunds();
  const target = existingBlocks.find((b) => b.kundNumber === kundNumber && b.date === date && b.session === session);
  if (!target) return { success: false, message: 'Kund is not currently blocked for this session.' };

  const updated = existingBlocks.filter((b) => b.id !== target.id);
  saveBlockedKunds(updated);

  logAdminAction(
    currentAdmin,
    'UNBLOCK_KUND',
    `Unblocked Kund #${kundNumber} on ${date} (${session}). Restored to online Best-Fit pool.`
  );

  return { success: true, message: `Kund #${kundNumber} unblocked and returned to the seating pool.` };
}

// Audit Logs
export function getAuditLogs(): AdminAuditLog[] {
  try {
    const raw = localStorage.getItem(AUDIT_LOGS_KEY);
    if (!raw) {
      localStorage.setItem(AUDIT_LOGS_KEY, JSON.stringify(INITIAL_AUDIT_LOGS));
      return INITIAL_AUDIT_LOGS;
    }
    return JSON.parse(raw);
  } catch {
    return INITIAL_AUDIT_LOGS;
  }
}

export function logAdminAction(admin: AdminUser, action: AdminAuditLog['action'], details: string): void {
  const current = getAuditLogs();
  const entry: AdminAuditLog = {
    id: `audit-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    timestamp: new Date().toISOString(),
    adminId: admin.id,
    adminName: admin.name,
    adminRole: admin.role,
    action,
    details,
  };
  const updated = [entry, ...current].slice(0, 500); // keep recent 500 logs
  localStorage.setItem(AUDIT_LOGS_KEY, JSON.stringify(updated));
}

// Excel Export Service (.xlsx)
export function exportExcelReport(
  reportType: 'bookings' | 'participants' | 'kund_allocations' | 'occupancy_summary',
  options: {
    dateFilter?: string; // 'all' or specific date
    sessionFilter?: SessionType | 'all';
    bookings: Booking[];
    blockedKunds: BlockedKundRecord[];
  }
): void {
  const wb = XLSX.utils.book_new();
  const timestamp = new Date().toISOString().slice(0, 10);

  if (reportType === 'bookings') {
    const rows = options.bookings
      .filter((b) => {
        if (!options.dateFilter || options.dateFilter === 'all') return true;
        return b.allocations.some((a) => a.date === options.dateFilter);
      })
      .map((b) => {
        const uniqueKunds = Array.from(new Set(b.allocations.map((a) => a.kundNumber)));
        return {
          'Booking ID': b.id,
          'Booking Date': b.createdAt.slice(0, 10),
          'Yagyakarta (Coordinator)': b.yagyakarta.fullName,
          'Primary Mobile': b.yagyakarta.primaryMobile,
          'Alternate Mobile': b.yagyakarta.secondaryMobile || 'N/A',
          'Address': b.yagyakarta.address || 'N/A',
          'City': b.yagyakarta.city,
          'State': b.yagyakarta.state,
          'Gotra': b.yagyakarta.gotra || 'N/A',
          'Sankalp Purpose': b.yagyakarta.sankalpPurpose || 'N/A',
          'Total Devotees': b.participants.length,
          'Participants List': b.participants.map((p) => `${p.name} (${p.relationship})`).join(', '),
          'Allocated Kund(s)': uniqueKunds.map((k) => `Kund #${k} (${getZoneForKund(k).name})`).join('; '),
          'Total Sessions': b.allocations.length,
          'Status': b.status.toUpperCase(),
        };
      });

    const ws = XLSX.utils.json_to_sheet(rows);
    XLSX.utils.book_append_sheet(wb, ws, 'Bookings_Report');
    XLSX.writeFile(wb, `Mahayagya_2151_Bookings_${timestamp}.xlsx`);
  } else if (reportType === 'participants') {
    const rows: any[] = [];
    options.bookings.forEach((b) => {
      b.participants.forEach((p, pIdx) => {
        const attendedSessionsCount = p.schedule.reduce(
          (sum, d) => sum + (d.morning ? 1 : 0) + (d.afternoon ? 1 : 0),
          0
        );

        rows.push({
          'Booking ID': b.id,
          'Coordinator': b.yagyakarta.fullName,
          'Coordinator Phone': b.yagyakarta.primaryMobile,
          'City': b.yagyakarta.city,
          'Participant Name': p.name,
          'Member Index': pIdx + 1,
          'Age': p.age || 'N/A',
          'Gender': p.gender,
          'Relationship': p.relationship,
          'Personal Phone': p.mobile || b.yagyakarta.primaryMobile,
          'Total Attended Sessions': attendedSessionsCount,
          'Status': b.status,
        });
      });
    });

    const ws = XLSX.utils.json_to_sheet(rows);
    XLSX.utils.book_append_sheet(wb, ws, 'Devotees_List');
    XLSX.writeFile(wb, `Mahayagya_2151_Devotees_${timestamp}.xlsx`);
  } else if (reportType === 'kund_allocations') {
    const rows: any[] = [];

    // Online confirmed bookings
    options.bookings.forEach((b) => {
      b.allocations.forEach((alloc) => {
        if (options.dateFilter && options.dateFilter !== 'all' && alloc.date !== options.dateFilter) return;
        if (options.sessionFilter && options.sessionFilter !== 'all' && alloc.session !== options.sessionFilter) return;

        rows.push({
          'Kund Number': alloc.kundNumber,
          'Zone': alloc.zone,
          'Enclosure Name': getZoneForKund(alloc.kundNumber).name,
          'Date': alloc.date,
          'Session': alloc.session.toUpperCase(),
          'Allocation Type': 'Online Registration',
          'Booking ID': b.id,
          'Yagyakarta': b.yagyakarta.fullName,
          'Contact Mobile': b.yagyakarta.primaryMobile,
          'City': b.yagyakarta.city,
          'Devotee Count': alloc.participantCount,
          'Devotee Names': b.participants.filter((p) => alloc.participantIds.includes(p.id)).map((p) => p.name).join(', '),
        });
      });
    });

    // Blocked Kunds
    options.blockedKunds.forEach((blk) => {
      if (options.dateFilter && options.dateFilter !== 'all' && blk.date !== options.dateFilter) return;
      if (options.sessionFilter && options.sessionFilter !== 'all' && blk.session !== options.sessionFilter) return;

      rows.push({
        'Kund Number': blk.kundNumber,
        'Zone': getZoneForKund(blk.kundNumber).id,
        'Enclosure Name': getZoneForKund(blk.kundNumber).name,
        'Date': blk.date,
        'Session': blk.session.toUpperCase(),
        'Allocation Type': 'Blocked / Offline Reserved',
        'Booking ID': blk.id,
        'Yagyakarta': blk.offlineFamilyDetails?.groupName || blk.reason || 'Offline Blocked',
        'Contact Mobile': blk.offlineFamilyDetails?.contactPhone || 'N/A',
        'City': 'Offline Camp',
        'Devotee Count': blk.offlineFamilyDetails?.devoteeCount || 8,
        'Devotee Names': `Blocked by ${blk.blockedByAdminName} (${blk.reason})`,
      });
    });

    rows.sort((a, b) => a['Kund Number'] - b['Kund Number']);

    const ws = XLSX.utils.json_to_sheet(rows);
    XLSX.utils.book_append_sheet(wb, ws, 'Kund_Allocations');
    XLSX.writeFile(wb, `Mahayagya_2151_Kund_Allocations_${timestamp}.xlsx`);
  } else if (reportType === 'occupancy_summary') {
    // Generate 8 days * 2 sessions occupancy KPI table
    const summaryRows: any[] = [];
    const totalKunds = EVENT_DETAILS.totalKunds;
    const totalSeatsPerSession = EVENT_DETAILS.seatsPerKund * totalKunds;

    const days = [
      '2026-12-14', '2026-12-15', '2026-12-16', '2026-12-17',
      '2026-12-18', '2026-12-19', '2026-12-20', '2026-12-21',
    ];
    const sessions: SessionType[] = ['morning', 'afternoon'];

    days.forEach((d, dIdx) => {
      sessions.forEach((s) => {
        // Calculate booked seats
        let bookedSeats = 0;
        options.bookings.forEach((b) => {
          if (b.status === 'cancelled') return;
          b.allocations.forEach((a) => {
            if (a.date === d && a.session === s) {
              bookedSeats += a.participantCount;
            }
          });
        });

        // Calculate blocked kunds
        const blockedCount = options.blockedKunds.filter((b) => b.date === d && b.session === s).length;
        const blockedSeats = blockedCount * 8;
        const totalUtilized = bookedSeats + blockedSeats;
        const remainingCapacity = totalSeatsPerSession - totalUtilized;

        summaryRows.push({
          'Day': `Day ${dIdx + 1}`,
          'Date': d,
          'Session': s.toUpperCase(),
          'Total Physical Kunds': totalKunds,
          'Total Seats': totalSeatsPerSession,
          'Online Booked Seats': bookedSeats,
          'Blocked / Offline Kunds': blockedCount,
          'Blocked / Offline Seats': blockedSeats,
          'Total Utilized Seats': totalUtilized,
          'Remaining Available Seats': remainingCapacity,
          'Utilization %': ((totalUtilized / totalSeatsPerSession) * 100).toFixed(2) + '%',
        });
      });
    });

    const ws = XLSX.utils.json_to_sheet(summaryRows);
    XLSX.utils.book_append_sheet(wb, ws, 'Occupancy_Summary');
    XLSX.writeFile(wb, `Mahayagya_2151_Occupancy_Summary_${timestamp}.xlsx`);
  }
}
