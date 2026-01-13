import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// 공개 접근 가능한 경로 목록
const PUBLIC_PATHS = [
  '/login',
  '/api/auth',
  '/obituary',
  '/status-board',
];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 공개 경로 확인 - 로그인 없이 접근 가능
  const isPublicPath = PUBLIC_PATHS.some(path =>
    pathname === path || pathname.startsWith(path + '/')
  );

  if (isPublicPath) {
    return NextResponse.next();
  }

  // 세션 확인 (브라우저 쿠키 사용)
  const isAuthenticated = request.cookies.get('funeral_authenticated')?.value;
  const funeralHomeId = request.cookies.get('funeral_home_id')?.value;

  if (!isAuthenticated || !funeralHomeId) {
    return NextResponse.redirect(new URL('/login', request.url));
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
     * - public folder files
     */
    '/((?!_next/static|_next/image|favicon.ico|icon-512x512.png|.*\\.(?:jpg|jpeg|png|gif|svg|ico)$).*)',
  ],
};
