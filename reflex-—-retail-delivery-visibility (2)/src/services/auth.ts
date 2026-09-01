import { apiRequest } from "./api";

export interface LoginResponse {
  access: string;
}

export async function login(
  email: string,
  password: string,
): Promise<LoginResponse> {
  const data = await apiRequest<LoginResponse>(
    "/api/auth/login/",
    {
      method: "POST",
      auth: false,
      body: JSON.stringify({
        email,
        password,
      }),
    },
  );

  localStorage.setItem(
    "access_token",
    data.access,
  );

  return data;
}

export function logout() {
  localStorage.removeItem("access_token");
}

export function isAuthenticated() {
  return Boolean(
    localStorage.getItem("access_token"),
  );
}
