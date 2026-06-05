import { apiClient } from '@/lib/api-client';
import type { LoginResponse } from '@/types/auth';

export async function login(email: string, password: string) {
  const { data } = await apiClient.post<{ data: LoginResponse }>('/auth/login', {
    email,
    password,
  });
  return data.data;
}

export async function register(payload: {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  organizationName?: string;
}) {
  const { data } = await apiClient.post<{ data: LoginResponse }>('/auth/register', payload);
  return data.data;
}

export async function logoutApi() {
  await apiClient.post('/auth/logout');
}

export async function fetchMe() {
  const { data } = await apiClient.get<{ data: unknown }>('/auth/me');
  return data.data;
}
