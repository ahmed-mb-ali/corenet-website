const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

export interface AvailabilityResponse {
  timezone: string;
  duration: number;
  slots: Record<string, string[]>; // { "2026-03-11": ["09:00", "10:00"] }
}

export interface BookingPayload {
  date: string;
  startTime: string;
  name: string;
  email: string;
  company: string;
  phone?: string;
  message?: string;
}

export interface BookingResponse {
  success: boolean;
  bookingId: string;
  message: string;
  details: {
    date: string;
    startTime: string;
    endTime: string;
    timezone: string;
  };
}

export async function fetchAvailability(month: string): Promise<AvailabilityResponse> {
  const res = await fetch(`${API_URL}/api/booking/availability?month=${month}`);
  if (!res.ok) throw new Error("Failed to fetch availability");
  return res.json();
}

export async function submitBooking(payload: BookingPayload): Promise<BookingResponse> {
  const res = await fetch(`${API_URL}/api/booking`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (!res.ok) throw Object.assign(new Error(data.error || "Booking failed"), { status: res.status, data });
  return data;
}
