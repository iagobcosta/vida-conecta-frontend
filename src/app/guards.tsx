import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuthStore } from '../stores/authStore'
import type { Role } from '../types/api'

export function RequireAuth() {
  const token = useAuthStore((state) => state.token)
  const location = useLocation()

  if (!token) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />
  }

  return <Outlet />
}

export function GuestOnly() {
  const token = useAuthStore((state) => state.token)
  if (token) {
    return <Navigate to="/agenda" replace />
  }
  return <Outlet />
}

export function RequireRole({ roles }: { roles: Role[] }) {
  const user = useAuthStore((state) => state.user)
  if (!user) {
    return <Navigate to="/login" replace />
  }
  if (!roles.includes(user.role)) {
    return <Navigate to="/agenda" replace />
  }
  return <Outlet />
}
