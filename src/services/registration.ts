export async function saveRegistration(data: {
  yagyakarta_name: string;
  primary_mobile: string;
  secondary_mobile?: string;
  email?: string;
  city: string;
  state?: string;
  gotra?: string;
  participants: Array<{
    name: string;
    age?: number;
    gender?: string;
    relationship?: string;
    mobile?: string;
  }>;
  sessions: Array<{
    event_date: string;
    session: 'morning' | 'afternoon';
  }>;
}) {
  const response = await fetch('/api/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const err = await response.json();
    throw new Error(err.error || 'Registration failed');
  }

  const result = await response.json();
  return { bookingCode: result.bookingCode };
}
