import { useEffect, useState, type ReactNode } from 'react'
import { useQuery } from '@tanstack/react-query'
import { fetchMe } from '../features/auth/api'
import { queryKeys } from '../services/queryKeys'
import { useAuthStore } from '../stores/authStore'
import { Spinner } from '../components/Spinner'

type AuthBootstrapProps = {
  children: ReactNode
}

export function AuthBootstrap({ children }: AuthBootstrapProps) {
  const token = useAuthStore((state) => state.token)
  const setUser = useAuthStore((state) => state.setUser)
  const clearSession = useAuthStore((state) => state.clearSession)
  const [hydrated, setHydrated] = useState(() => useAuthStore.persist.hasHydrated())

  useEffect(() => {
    const unsubscribe = useAuthStore.persist.onFinishHydration(() => setHydrated(true))
    if (useAuthStore.persist.hasHydrated()) {
      setHydrated(true)
    }
    return unsubscribe
  }, [])

  const meQuery = useQuery({
    queryKey: queryKeys.me,
    queryFn: fetchMe,
    enabled: hydrated && Boolean(token),
    retry: false,
  })

  useEffect(() => {
    if (meQuery.data) {
      setUser(meQuery.data)
    }
  }, [meQuery.data, setUser])

  useEffect(() => {
    if (meQuery.isError) {
      clearSession()
    }
  }, [meQuery.isError, clearSession])

  if (!hydrated || (token && meQuery.isPending)) {
    return (
      <div className="grid min-h-svh place-items-center bg-slate-50">
        <Spinner label="Carregando sessão" />
      </div>
    )
  }

  return children
}
