/**
 * Authentication types shared by client and server code.
 *
 * These are intentionally tiny: an authenticated user never carries a password,
 * a token or any other credential into the browser bundle. The JWT itself stays
 * in an HTTP-only cookie and is only read by the server.
 */
export interface AuthUser {
  id: string;
  name: string;
  email: string;
  phone?: string;
  avatar?: string | null;
}

export interface AuthUserEnvelope {
  user: AuthUser;
}

export interface AuthMessageResponse {
  message: string;
  data: AuthUserEnvelope;
}
