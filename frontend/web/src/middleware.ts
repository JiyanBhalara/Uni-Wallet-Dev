import { auth } from "@/app/api/auth/[...nextauth]/route";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export async function middleware(req: NextRequest) {
  // Allow all API routes
  if (req.nextUrl.pathname.startsWith("/api/")) {
    return NextResponse.next();
  }

  const session = await auth();
  const isAuthenticated = !!session?.user;
  const isAuthPage = req.nextUrl.pathname === "/login" || 
                     req.nextUrl.pathname === "/signup";

  // If user is not authenticated and trying to access protected pages
  if (!isAuthenticated && !isAuthPage) {
    const loginUrl = new URL("/login", req.url);
    if (req.nextUrl.pathname !== "/") {
      loginUrl.searchParams.set("callbackUrl", req.nextUrl.pathname);
    }
    return NextResponse.redirect(loginUrl);
  }

  // If user is authenticated and trying to access auth pages, redirect to home
  if (isAuthenticated && isAuthPage) {
    return NextResponse.redirect(new URL("/", req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (public directory)
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
