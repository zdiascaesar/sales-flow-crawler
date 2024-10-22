import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Define public routes that don't require authentication
const publicRoutes = ['/', '/login', '/api', '/_next']

// Simple rate limiting for logging
let lastLogTime = Date.now()
const LOG_INTERVAL = 5000 // 5 seconds

function log(message: string) {
  const now = Date.now()
  if (now - lastLogTime > LOG_INTERVAL) {
    const timestamp = new Date().toISOString()
    console.log(`${timestamp}: ${message}`)
    lastLogTime = now
  }
}

export async function middleware(req: NextRequest) {
  const res = NextResponse.next()
  const supabase = createMiddlewareClient({ req, res })

  log(`Current path: ${req.nextUrl.pathname}`)

  // Skip middleware for API routes and static assets
  if (req.nextUrl.pathname.startsWith('/api') || req.nextUrl.pathname.startsWith('/_next') || req.nextUrl.pathname.includes('.')) {
    log('Skipping for API route or static asset')
    return res
  }

  let session;
  try {
    const { data: { session: authSession } } = await supabase.auth.getSession()
    session = authSession
  } catch (error) {
    log(`Error getting session: ${(error as Error).message}`)
    // In case of error, we'll proceed as if there's no session
  }

  log(`Session exists: ${!!session}`)
  if (session) {
    log(`User ID: ${session.user.id}`)
    log(`User email: ${session.user.email}`)
  }

  // Check if the current route is public
  const isPublicRoute = publicRoutes.some(route => req.nextUrl.pathname.startsWith(route))
  log(`Is public route: ${isPublicRoute}`)

  // If not a public route and user is not authenticated, redirect to login
  if (!isPublicRoute && !session) {
    log('No session, redirecting to /login')
    const redirectUrl = req.nextUrl.clone()
    redirectUrl.pathname = '/login'
    redirectUrl.searchParams.set(`redirectedFrom`, req.nextUrl.pathname)
    return NextResponse.redirect(redirectUrl)
  }

  // Check for admin access (for now, all authenticated users are considered admins)
  if (session && req.nextUrl.pathname.startsWith('/admin')) {
    log('Checking admin access')
    // In a real-world scenario, you'd check for an admin role here
    // For now, we'll allow all authenticated users
    // If not an admin, you'd redirect to an unauthorized page
  }

  // If the user is authenticated and trying to access login page, redirect to dashboard
  if (session && req.nextUrl.pathname === '/login') {
    log('Session exists, redirecting to /dashboard')
    const redirectUrl = req.nextUrl.clone()
    redirectUrl.pathname = '/dashboard'
    return NextResponse.redirect(redirectUrl)
  }

  log('Proceeding with request')
  return res
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
