const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

function getToken() {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("crm_token");
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getToken();
  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });
  if (res.status === 401) {
    localStorage.removeItem("crm_token");
    window.location.href = "/crm/login";
    throw new Error("Unauthorized");
  }
  const data = await res.json();
  if (!res.ok) throw Object.assign(new Error(data.error || "Request failed"), { status: res.status, data });
  return data;
}

export const crmApi = {
  login: (email: string, password: string) =>
    request<{ token: string; user: CRMUser }>("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    }),

  me: () => request<CRMUser>("/auth/me"),

  leads: {
    list: (params?: Record<string, string | number>) => {
      const q = params ? "?" + new URLSearchParams(params as Record<string, string>).toString() : "";
      return request<{ leads: Lead[]; total: number; page: number; limit: number }>(`/api/leads${q}`);
    },
    get: (id: string) => request<{ lead: Lead; activities: Activity[] }>(`/api/leads/${id}`),
    update: (id: string, body: Partial<Lead> & { note?: string }) =>
      request<Lead>(`/api/leads/${id}`, { method: "PATCH", body: JSON.stringify(body) }),
  },

  pipeline: {
    get: () => request<{ pipeline: Pipeline; stages: StageWithLeads[] }>("/api/pipeline"),
  },

  availability: {
    get: (userId?: string) => {
      const q = userId ? `?user_id=${userId}` : "";
      return request<{ workingHours: WorkingHour[]; blockedDates: BlockedDate[] }>(`/api/availability${q}`);
    },
    saveHours: (hours: HourEntry[], userId?: string) =>
      request<{ success: boolean }>("/api/availability/working-hours", {
        method: "PUT",
        body: JSON.stringify(userId ? { user_id: userId, hours } : { hours }),
      }),
    addBlock: (date: string, reason: string, userId?: string) =>
      request<BlockedDate>("/api/availability/block", {
        method: "POST",
        body: JSON.stringify(userId ? { user_id: userId, date, reason } : { date, reason }),
      }),
    removeBlock: (id: string) =>
      request<{ success: boolean }>(`/api/availability/block/${id}`, { method: "DELETE" }),
  },

  team: {
    list: () => request<CRMUser[]>("/api/settings/team"),
    create: (body: { name: string; email: string; phone?: string; role?: string }) =>
      request<CRMUser>("/api/settings/team", { method: "POST", body: JSON.stringify(body) }),
    update: (id: string, body: Partial<CRMUser>) =>
      request<CRMUser>(`/api/settings/team/${id}`, { method: "PATCH", body: JSON.stringify(body) }),
    deactivate: (id: string) =>
      request<{ success: boolean }>(`/api/settings/team/${id}`, { method: "DELETE" }),
    reorder: (order: { id: string; priority: number }[]) =>
      request<{ success: boolean }>("/api/settings/team/reorder", { method: "PUT", body: JSON.stringify({ order }) }),
  },
};

// Types
export interface CRMUser {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: string;
  priority: number;
  is_active: boolean;
  gcal_id?: string;
  created_at: string;
}

export interface Lead {
  id: string;
  first_name: string;
  last_name?: string;
  email: string;
  phone?: string;
  company?: string;
  message?: string;
  source: string;
  status: string;
  assigned_to?: string;
  assigned_to_name?: string;
  stage_id?: string;
  stage_name?: string;
  stage_color?: string;
  pipeline_id?: string;
  booking_date?: string;
  booking_start?: string;
  booking_status?: string;
  created_at: string;
  updated_at: string;
}

export interface Activity {
  id: string;
  type: string;
  note?: string;
  user_name?: string;
  metadata?: Record<string, unknown>;
  created_at: string;
}

export interface Pipeline {
  id: string;
  name: string;
}

export interface Stage {
  id: string;
  name: string;
  position: number;
  color: string;
}

export interface StageWithLeads extends Stage {
  leads: Lead[];
}

export interface WorkingHour {
  id: string;
  user_id: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
  is_blocked: false;
}

export interface BlockedDate {
  id: string;
  user_id: string;
  block_date: string;
  block_reason?: string;
  is_blocked: true;
}

export interface HourEntry {
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  enabled: boolean;
}
