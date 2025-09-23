import { NextRequest, NextResponse } from "next/server";

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Public routes that don't require authentication
  const publicRoutes = [
    "/",
    "/auth",
    "/api/auth",
    "/api/health",
  ];

  // Check if the route is public
  const isPublicRoute = publicRoutes.some(route => 
    pathname.startsWith(route) || pathname === route
  );

  if (isPublicRoute) {
    return NextResponse.next();
  }

  // For now, redirect all protected routes to auth until we have a proper database setup
  // TODO: Re-enable session checking once database is configured
  const authUrl = new URL("/auth", request.url);
  authUrl.searchParams.set("redirect", pathname);
  return NextResponse.redirect(authUrl);
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};