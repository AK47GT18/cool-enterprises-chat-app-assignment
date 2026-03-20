import { SignJWT, jwtVerify } from 'jose';

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  throw new Error("JWT_SECRET environment variable is missing. Authentication cannot proceed.");
}
const secret = new TextEncoder().encode(JWT_SECRET);

export async function signJWT(payload: any) {
  return await new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(secret);
}

export async function verifyJWT(token: string) {
  try {
    const { payload } = await jwtVerify(token, secret);
    if (payload.exp && Date.now() >= payload.exp * 1000) {
      console.warn("JWT token explicit expiration triggered");
      return null;
    }
    return payload;
  } catch (error: any) {
    if (error?.code === 'ERR_JWT_EXPIRED') {
      console.warn("jose JWT validation explicitly triggered expiration");
    }
    return null;
  }
}
