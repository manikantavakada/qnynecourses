export const ACCESS_TOKEN_COOKIE = 'qnyne_access';
export const REFRESH_TOKEN_COOKIE = 'qnyne_refresh';

export type AuthUser = {
  id: string;
  name: string;
  email: string;
  role: 'STUDENT' | 'ADMIN';
  emailVerified: boolean;
};

export type ApiEnvelope<T> = {
  data: T;
};
