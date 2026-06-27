export type AuthContext = {
  isLoading: boolean
  isAuthenticated: boolean
  email: string | undefined
  name: string | undefined
  image: string | undefined
  waitUntilReady: () => Promise<void>
}
