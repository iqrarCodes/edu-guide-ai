import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            request.cookies.set(name, value)
          )
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()

  // ============================================================
  // ✅ PUBLIC ROUTES (No auth required)
  // ============================================================
  const publicRoutes = [
    '/',
    '/login',
    '/signup',
    '/auth/callback',
    '/templates',        // ✅ Templates folder public
    '/api/auth',         // ✅ Auth API public
  ]

  const pathname = request.nextUrl.pathname

  // ✅ Allow templates folder and its subfolders (thumbnails, etc.)
  if (pathname.startsWith('/templates')) {
    return response
  }

  // ✅ Allow auth API routes
  if (pathname.startsWith('/api/auth')) {
    return response
  }

  // ✅ Allow other public routes
  if (publicRoutes.includes(pathname)) {
    return response
  }

  // ============================================================
  // PROTECTED ROUTES – Redirect to login if not authenticated
  // ============================================================
  if (!user) {
    const redirectUrl = new URL('/login', request.url)
    return NextResponse.redirect(redirectUrl)
  }

  return response
}

// ============================================================
// ✅ MATCHER – Skip static files, templates, images, etc.
// ============================================================
export const config = {
  matcher: [
    /*
     * Match all request paths EXCEPT:
     * - _next/static (static files)
     * - _next/image (image optimization)
     * - favicon.ico
     * - templates (public templates folder with .pptx and .png)
     * - Any static file (svg, png, jpg, jpeg, gif, webp, pptx, docx, pdf)
     */
    '/((?!_next/static|_next/image|favicon.ico|templates|.*\\.(?:svg|png|jpg|jpeg|gif|webp|pptx|docx|pdf)$).*)',
  ],
}