// shared/endpoints/auth.ts
export const AUTH_BASE = "/v1/auth" as const;

export const AUTH_ENDPOINTS = {
  register: { method: "POST", path: `${AUTH_BASE}/register` } as const,
  login:    { method: "POST", path: `${AUTH_BASE}/login` } as const,
  me:       { method: "GET",  path: `${AUTH_BASE}/me` } as const,
  password: { method: "PATCH",path: `${AUTH_BASE}/password` } as const,
  logout:   { method: "POST", path: `${AUTH_BASE}/logout` } as const,
};
