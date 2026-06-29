import { createRouter as createTanStackRouter } from '@tanstack/react-router'

import type { AuthContext } from '@/lib/auth-context'

import { routeTree } from './routeTree.gen'

const defaultAuth: AuthContext = {
  isLoading: true,
  isAuthenticated: false,
  email: undefined,
  name: undefined,
  image: undefined,
}

export function getRouter() {
  const router = createTanStackRouter({
    routeTree,
    scrollRestoration: true,
    defaultPreload: 'intent',
    defaultPreloadStaleTime: 0,
    context: {
      auth: defaultAuth,
    },
  })

  return router
}

declare module '@tanstack/react-router' {
  interface Register {
    router: ReturnType<typeof getRouter>
  }
}
