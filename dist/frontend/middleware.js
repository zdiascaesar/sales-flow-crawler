"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.config = void 0;
exports.middleware = middleware;
const auth_helpers_nextjs_1 = require("@supabase/auth-helpers-nextjs");
const server_1 = require("next/server");
async function middleware(req) {
    const res = server_1.NextResponse.next();
    const supabase = (0, auth_helpers_nextjs_1.createMiddlewareClient)({ req, res });
    console.log('Middleware - Current path:', req.nextUrl.pathname);
    const { data: { session }, } = await supabase.auth.getSession();
    console.log('Middleware - Session exists:', !!session);
    if (session) {
        console.log('Middleware - User ID:', session.user.id);
        console.log('Middleware - User email:', session.user.email);
    }
    // Check if the user is authenticated
    if (!session && (req.nextUrl.pathname.startsWith('/dashboard') || req.nextUrl.pathname.startsWith('/admin'))) {
        console.log('Middleware - No session, redirecting to /login');
        const redirectUrl = req.nextUrl.clone();
        redirectUrl.pathname = '/login';
        redirectUrl.searchParams.set(`redirectedFrom`, req.nextUrl.pathname);
        return server_1.NextResponse.redirect(redirectUrl);
    }
    // Check for admin access (for now, all authenticated users are considered admins)
    if (session && req.nextUrl.pathname.startsWith('/admin')) {
        console.log('Middleware - Checking admin access');
        // In a real-world scenario, you'd check for an admin role here
        // For now, we'll allow all authenticated users
        // If not an admin, you'd redirect to an unauthorized page
    }
    // If the user is authenticated and trying to access login page, redirect to dashboard
    if (session && (req.nextUrl.pathname === '/login' || req.nextUrl.pathname === '/')) {
        console.log('Middleware - Session exists, redirecting to /dashboard');
        const redirectUrl = req.nextUrl.clone();
        redirectUrl.pathname = '/dashboard';
        return server_1.NextResponse.redirect(redirectUrl);
    }
    return res;
}
exports.config = {
    matcher: ['/', '/login', '/dashboard/:path*', '/admin/:path*'],
};
//# sourceMappingURL=middleware.js.map