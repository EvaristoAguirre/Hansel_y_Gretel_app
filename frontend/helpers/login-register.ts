import { LoginRequest, LoginResponse, RecoverRequest, RecoverResponse, RegisterRequest, RegisterResponse, ResetPasswordRequest, ResetPasswordResponse } from '@/components/Interfaces/IUsers';
import { URI_USER } from '@/components/URI/URI';



const postRequest = async <T, R>(endpoint: string, body: T): Promise<R> => {
  const response = await fetch(`${URI_USER}/${endpoint}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || 'Error en la solicitud');
  }

  return response.json();
};

export const registerUser = async (data: RegisterRequest): Promise<RegisterResponse> => {
  return await postRequest<RegisterRequest, RegisterResponse>('register', data);
};

export const loginUser = async (data: LoginRequest): Promise<LoginResponse> => {
  return await postRequest<LoginRequest, LoginResponse>('login', data);
};

export const recoverPassword = async (data: RecoverRequest): Promise<RecoverResponse> => {
  return await postRequest<RecoverRequest, RecoverResponse>('recover', data);
};

export const resetPassword = async (data: ResetPasswordRequest): Promise<ResetPasswordResponse> => {
  return await postRequest<ResetPasswordRequest, ResetPasswordResponse>('reset-password', data);
};
