export class AuthError extends Error {
  constructor(
    message: string,
    public readonly code: AuthErrorCode,
    public readonly statusCode: number = 401
  ) {
    super(message);
    this.name = "AuthError";
    Object.setPrototypeOf(this, AuthError.prototype);
  }
}

export type AuthErrorCode =
  | "INVALID_CREDENTIALS"
  | "TOKEN_EXPIRED"
  | "INVALID_TOKEN"
  | "USER_NOT_FOUND"
  | "EMAIL_ALREADY_EXISTS";

export function invalidCredentials(): AuthError {
  return new AuthError("Invalid email or password", "INVALID_CREDENTIALS", 401);
}

export function tokenExpired(): AuthError {
  return new AuthError("Token has expired", "TOKEN_EXPIRED", 401);
}

export function invalidToken(): AuthError {
  return new AuthError("Invalid token", "INVALID_TOKEN", 401);
}

export function userNotFound(): AuthError {
  return new AuthError("User not found", "USER_NOT_FOUND", 404);
}

export function emailAlreadyExists(): AuthError {
  return new AuthError("Email already registered", "EMAIL_ALREADY_EXISTS", 400);
}
