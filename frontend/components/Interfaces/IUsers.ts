export enum UserRole {
  MOZO = 'mozo',
  ENCARGADO = 'encargado',
  ADMIN = 'admin',
}

// 📌 Interfaz para el registro de usuario
export interface RegisterRequest {
  username: string;
  password: string;
  role?: UserRole;
}

export interface RegisterResponse {
  message: string;
  userId: string;
  username: string;
  role: UserRole;
}

// 📌 Interfaz para el login de usuario
export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginResponse {
  message: string;
  username: string;
  role: UserRole;
  token?: string; // Si luego agregas autenticación con JWT
}

// 📌 Interfaz para la recuperación de contraseña
export interface RecoverRequest {
  username: string;
}

export interface RecoverResponse {
  message: string;
  recoveryCode: string;
}

// 📌 Interfaz para el reseteo de contraseña
export interface ResetPasswordRequest {
  username: string;
  recoveryCode: string;
  newPassword: string;
}

export interface ResetPasswordResponse {
  message: string;
}
