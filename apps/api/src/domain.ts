export type UserRole = "operator" | "admin";

export interface UserRecord {
  id: string;
  email: string;
  passwordHash: string;
  role: UserRole;
}

export type DashboardStatus = "healthy" | "attention" | "offline";

export interface DashboardRecord {
  id: string;
  ownerId: string;
  name: string;
  status: DashboardStatus;
  updatedAt: string;
}

export interface DataStore {
  findUserByEmail(email: string): Promise<UserRecord | null>;
  listDashboard(ownerId: string): Promise<DashboardRecord[]>;
}

