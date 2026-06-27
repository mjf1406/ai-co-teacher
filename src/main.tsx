import { ConvexAuthProvider, useConvexAuth } from '@convex-dev/auth/react'
import { RouterProvider, createRouter } from '@tanstack/react-router'
import { useQuery } from 'convex/react'
import ReactDOM from 'react-dom/client'
import { useEffect, useRef } from 'react'

import { RoutePending } from '@/components/route-pending'
import { ThemeProvider } from '@/components/theme-provider'
import type { AuthContext } from '@/lib/auth-context'
import { convex } from '@/lib/convex'

import { api } from '../convex/_generated/api'
import { routeTree } from './routeTree.gen'

const router = createRouter({
  routeTree,
  defaultPreload: 'intent',
  scrollRestoration: true,
  defaultPendingComponent: RoutePending,
  defaultPendingMs: 200,
  defaultPendingMinMs: 300,
  context: {
    auth: undefined! as AuthContext,
  },
})

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router
  }
}

function InnerApp() {
  const { isLoading, isAuthenticated } = useConvexAuth()
  const user = useQuery(api.users.current, isAuthenticated ? {} : 'skip')
  const authReadyRef = useRef<{
    promise: Promise<void>
    resolve: () => void
  } | null>(null)

  const authIsLoading = isLoading || (isAuthenticated && user === undefined)

  function getAuthReadyPromise() {
    if (!authReadyRef.current) {
      let resolve!: () => void
      const promise = new Promise<void>((r) => {
        resolve = r
      })
      authReadyRef.current = { promise, resolve }
    }
    return authReadyRef.current.promise
  }

  useEffect(() => {
    if (!authIsLoading) {
      authReadyRef.current?.resolve()
      authReadyRef.current = null
    }
  }, [authIsLoading])

  const auth: AuthContext = {
    isLoading: authIsLoading,
    isAuthenticated,
    email: user?.email,
    name: user?.name,
    image: user?.image,
    waitUntilReady: () =>
      authIsLoading ? getAuthReadyPromise() : Promise.resolve(),
  }

  useEffect(() => {
    void router.invalidate()
  }, [auth.isLoading, auth.isAuthenticated, auth.email])

  return (
    <ThemeProvider>
      <RouterProvider router={router} context={{ auth }} />
    </ThemeProvider>
  )
}

function App() {
  return (
    <ConvexAuthProvider client={convex}>
      <InnerApp />
    </ConvexAuthProvider>
  )
}

const rootElement = document.getElementById('app')!

if (!rootElement.innerHTML) {
  const root = ReactDOM.createRoot(rootElement)
  root.render(<App />)
}
