import { SignJWT, jwtVerify } from "jose";

const secret = new TextEncoder().encode(process.env.JWT_SECRET || "fallback");

export async function createToken(payload) {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setExpirationTime("24h")
    .sign(secret);
}

export async function verifyToken(token) {
  try {
    const { payload } = await jwtVerify(token, secret);
    return payload;
  } catch {
    return null;
  }
}

export async function requireAuth(request) {
  const cookie = request.headers.get("cookie") || "";
  const match = cookie.match(/auth_token=([^;]+)/);
  if (!match) return null;
  return verifyToken(match[1]);
}
