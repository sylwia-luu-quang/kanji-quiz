import { defineMiddleware } from "astro:middleware";

import { createSupabaseServerInstance } from "../db/supabase.client.ts";

// Public paths that don't require authentication
const PUBLIC_PATHS = [
  // Auth pages
  "/auth/signin",
  "/auth/signup",
  // Auth API endpoints
  "/api/auth/signin",
  "/api/auth/signup",
  "/api/auth/signout",
  "/api/auth/session",
  // Public assets
  "/favicon.png",
];

/**
 * Check if a path is public (doesn't require authentication)
 */
function isPublicPath(pathname: string): boolean {
  return PUBLIC_PATHS.some((path) => pathname === path || pathname.startsWith(path));
}

export const onRequest = defineMiddleware(async (context, next) => {
  // Add standard Supabase client to context
  context.locals.supabase = createSupabaseServerInstance({
    cookies: context.cookies,
    headers: context.request.headers,
  });

  // Only check session for protected routes
  if (!isPublicPath(context.url.pathname)) {
    try {
      // Get user session
      const {
        data: { user },
        error,
      } = await context.locals.supabase.auth.getUser();

      if (error) {
        console.error("[Middleware] Error getting user:", error);
      }

      // Set user in locals if authenticated
      if (user) {
        context.locals.user = {
          id: user.id,
          email: user.email!,
        };

        // Get session for expiry info
        const {
          data: { session },
        } = await context.locals.supabase.auth.getSession();
        context.locals.session = session;
      } else {
        context.locals.user = null;
        context.locals.session = null;

        // Redirect to signin for protected routes
        return context.redirect(`/auth/signin?redirect=${encodeURIComponent(context.url.pathname)}`);
      }
    } catch (error) {
      console.error("[Middleware] Unexpected error checking session:", error);
      context.locals.user = null;
      context.locals.session = null;

      // Redirect to signin on error
      return context.redirect(`/auth/signin?redirect=${encodeURIComponent(context.url.pathname)}`);
    }
  } else {
    // For public paths, still set user/session if available (for redirect logic on auth pages)
    try {
      const {
        data: { user },
      } = await context.locals.supabase.auth.getUser();

      if (user) {
        context.locals.user = {
          id: user.id,
          email: user.email!,
        };

        const {
          data: { session },
        } = await context.locals.supabase.auth.getSession();
        context.locals.session = session;
      } else {
        context.locals.user = null;
        context.locals.session = null;
      }
    } catch (error) {
      // Silently fail for public paths
      context.locals.user = null;
      context.locals.session = null;
    }
  }

  return next();
});
