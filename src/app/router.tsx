import { Navigate, Route, Routes } from 'react-router-dom'
import { AppLayout } from './AppLayout'
import { AuthLayout } from './AuthLayout'
import { GuestOnly, RequireAuth, RequireRole } from './guards'
import { LoginPage } from '../features/auth/pages/LoginPage'
import { RegisterPage } from '../features/auth/pages/RegisterPage'
import { AgendaPage } from '../features/scheduling/pages/AgendaPage'
import { AvailabilityPage } from '../features/scheduling/pages/AvailabilityPage'
import { NewAppointmentPage } from '../features/scheduling/pages/NewAppointmentPage'
import { ConsentsPage } from '../features/consent/pages/ConsentsPage'
import { EhrPage } from '../features/ehr/pages/EhrPage'
import { PrescriptionsPage } from '../features/prescription/pages/PrescriptionsPage'
import { ConsultationPage } from '../features/video/pages/ConsultationPage'
import { HomePage } from '../features/home/pages/HomePage'
import { NotificationsPage } from '../features/notification/pages/NotificationsPage'

export function AppRoutes() {
  return (
    <Routes>
      <Route element={<GuestOnly />}>
        <Route element={<AuthLayout />}>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/cadastro" element={<RegisterPage />} />
        </Route>
      </Route>

      <Route element={<RequireAuth />}>
        <Route element={<AppLayout />}>
          <Route path="/" element={<Navigate to="/inicio" replace />} />
          <Route path="/inicio" element={<HomePage />} />
          <Route path="/notificacoes" element={<NotificationsPage />} />
          <Route path="/agenda" element={<AgendaPage />} />
          <Route element={<RequireRole roles={['PACIENTE']} />}>
            <Route path="/agenda/nova" element={<NewAppointmentPage />} />
            <Route path="/consentimentos" element={<ConsentsPage />} />
          </Route>
          <Route element={<RequireRole roles={['MEDICO']} />}>
            <Route path="/horarios" element={<AvailabilityPage />} />
          </Route>
          <Route path="/prontuario" element={<EhrPage />} />
          <Route path="/receitas" element={<PrescriptionsPage />} />
          <Route path="/consulta/:appointmentId" element={<ConsultationPage />} />
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
