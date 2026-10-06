const ACCESS = "gr8r_token";
const REFRESH = "gr8r_refresh";

function read(name: string) {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : null;
}

function write(name: string, value: string, days = 30) {
  if (typeof document === "undefined") return;
  const expires = new Date(Date.now() + days * 864e5).toUTCString();
  document.cookie = `${name}=${encodeURIComponent(value)}; path=/; expires=${expires}; samesite=lax`;
}

function drop(name: string) {
  if (typeof document === "undefined") return;
  document.cookie = `${name}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT`;
}

export function getAccessToken() {
  return read(ACCESS);
}

export function getRefreshToken() {
  return read(REFRESH);
}

export function setAccessTokenCookie(token: string) {
  write(ACCESS, token);
}

export function setRefreshTokenCookie(token: string) {
  write(REFRESH, token);
}

export function clearAuthCookies() {
  drop(ACCESS);
  drop(REFRESH);
}
