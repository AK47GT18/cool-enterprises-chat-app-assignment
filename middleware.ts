import { type NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  throw new Error("JWT_SECRET environment variable is missing. Middleware cannot proceed.");
}
const secret = new TextEncoder().encode(JWT_SECRET);

export async function middleware(request: NextRequest) {
  const sessionToken = request.cookies.get('session')?.value;

  let isValid = false;
  if (sessionToken) {
    try {
      await jwtVerify(sessionToken, secret);
      isValid = true;
    } catch (error) {
      isValid = false;
    }
  }

  // Protect private application routes
  const privateRoutes = ['/chat', '/groups', '/settings', '/'];
  const isPrivateRoute = privateRoutes.some(route => 
    request.nextUrl.pathname.startsWith(route) || request.nextUrl.pathname === '/'
  );

  const isAuthRoute = request.nextUrl.pathname.startsWith('/auth');

  // If trying to access a private route without a valid session, redirect to login
  if (isPrivateRoute && !isValid && !isAuthRoute && !request.nextUrl.pathname.startsWith('/api')) {
    return NextResponse.redirect(new URL('/auth/login', request.url));
  }

  // Redirect authenticated users away from auth pages to root
  if (isAuthRoute && isValid) {
    return NextResponse.redirect(new URL('/', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|manifest.webmanifest|sw.js|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
