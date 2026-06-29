import { redirect } from '@tanstack/react-router'

import type { AuthContext } from '@/lib/auth-context'
import { ALLOWED_EMAIL } from '@/lib/convex'

function isAllowedEmail(email: string | undefined): boolean {
  return email?.toLowerCase() === ALLOWED_EMAIL.toLowerCase()
}

export function requireAuth({
  context,
  location,
}: {
  context: { auth: AuthContext }
  location: { pathname: string }
}) {
  if (!context.auth.isAuthenticated) {
    throw redirect({
      to: '/login',
      search: { redirect: location.pathname },
    })
  }

  if (!isAllowedEmail(context.auth.email)) {
    throw redirect({ to: '/login' })
  }
}
