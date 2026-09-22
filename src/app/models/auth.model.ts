export interface AuthUser {
  id: string;
  email: string;
  name: string | null;
  emailVerified: boolean;
}

export interface AuthProject {
  id: string;
  name: string;
  ingestKey: string;
}

export interface AuthSession {
  accessToken: string;
  user: AuthUser;
  project: AuthProject | null;
}
