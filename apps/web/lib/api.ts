export interface SessionUser {
  id: string;
  email: string;
  role: "operator" | "admin";
}

export interface DashboardRow {
  id: string;
  ownerId: string;
  name: string;
  status: "healthy" | "attention" | "offline";
  updatedAt: string;
}

interface LoginResponse {
  accessToken: string;
  expiresInSeconds: number;
  user: SessionUser;
}

const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

async function parseResponse<T>(response: Response): Promise<T> {
  const body = await response.json();
  if (!response.ok) {
    throw new Error(body?.error?.message ?? "Request failed");
  }
  return body as T;
}

export async function login(email: string, password: string): Promise<LoginResponse> {
  const response = await fetch(`${apiUrl}/api/auth/login`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  return parseResponse<LoginResponse>(response);
}

export async function fetchDashboard(accessToken: string): Promise<DashboardRow[]> {
  const response = await fetch(`${apiUrl}/api/dashboard`, {
    headers: { authorization: `Bearer ${accessToken}` },
  });
  const body = await parseResponse<{ data: DashboardRow[] }>(response);
  return body.data;
}

