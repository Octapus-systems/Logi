import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

/**
 * Middleware for protecting routes based on authentication and roles
 * - Redirects unauthenticated users to login
 * - Redirects staff trying to access admin routes
 * - Redirects admin trying to access staff routes
 */
export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token;
    const pathname = req.nextUrl.pathname;

    // If no token, redirect to login (handled by withAuth)
    if (!token) {
      return NextResponse.redirect(new URL("/login", req.url));
    }

    const userRole = token.role;

    // Protect admin routes - only admins can access
    if (pathname.startsWith("/admin") && userRole !== "admin") {
      return NextResponse.redirect(new URL("/staff/dashboard", req.url));
    }

    // Protect staff routes - only staff can access
    if (pathname.startsWith("/staff") && userRole !== "staff") {
      return NextResponse.redirect(new URL("/admin/dashboard", req.url));
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      authorized({ token }) {
        return !!token;
      },
    },
  }
);

/**
 * Matcher configuration for middleware
 * Protects all routes except public ones
 */
export const config = {
  matcher: [
    "/staff/:path*",
    "/admin/:path*",
    "/api/protected/:path*",
  ],
};
