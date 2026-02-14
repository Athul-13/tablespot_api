import { AuthUser } from "@/types/auth";
import { LoginInput, SignupInput } from "@/validation/auth";


export interface LoginResult {
    user: AuthUser;
    accessToken: string;
    refreshToken: string;
  }

export interface IAuthService {
    signup(input: SignupInput): Promise<{ user: AuthUser }>;

    login(input: LoginInput): Promise<LoginResult>;

    refresh(refreshToken: string | undefined): Promise<LoginResult | null>;

    logout(refreshToken: string | undefined): Promise<void>;

    requestPasswordReset(email: string): Promise<void>;

    resetPassword(token: string, newPassword: string): Promise<void>;

    changePassword(userId: string, currentPassword: string, newPassword: string): Promise<void>;
}