import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { BrowserRouter } from 'react-router-dom'
import { AppRoutes } from './router'
import { AuthBootstrap } from './AuthBootstrap'
import { ToastViewport } from '../components/ToastViewport'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
      staleTime: 20_000,
    },
  },
})

export function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AuthBootstrap>
          <ToastViewport />
          <AppRoutes />
        </AuthBootstrap>
      </BrowserRouter>
    </QueryClientProvider>
  )
}
