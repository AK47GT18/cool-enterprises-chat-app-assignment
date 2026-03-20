import { type NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  throw new Error("JWT_SECRET environment variable is missing.");
}
const secret = new TextEncoder().encode(JWT_SECRET);

export async function middleware(request: NextRequest) {
  const sessionToken = request.cookies.get('session')?.value;

  let isValid = false;

  if (sessionToken) {
    try {
      await jwtVerify(sessionToken, secret);
      isValid = true;
    } catch {
      isValid = false;
    }
  }

  const isAuthRoute = request.nextUrl.pathname.startsWith('/auth');
  const isApiRoute = request.nextUrl.pathname.startsWith('/api');
  const isAuthApi = request.nextUrl.pathname.startsWith('/api/auth');

  // If NOT authenticated and not on an auth page/api
  if (!isValid && !isAuthRoute && !isAuthApi) {
    // API routes get a 401 JSON response
    if (isApiRoute) {
      return NextResponse.json(
        { error: "Unauthorized", code: "SESSION_INVALID" },
        { status: 401 }
      );
    }
    // Page routes get redirected to login
    return NextResponse.redirect(new URL('/auth/login', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|manifest.webmanifest|sw.js|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
