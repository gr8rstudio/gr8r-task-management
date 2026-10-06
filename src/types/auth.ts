export type AuthUser = {
  id: string;
  name: string;
  email: string;
  role: string;
};

export type ApiResponse<T> = {
  data: T;
};
