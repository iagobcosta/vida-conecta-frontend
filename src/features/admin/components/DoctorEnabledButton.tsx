import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Button } from '../../../components/Button'
import { errorMessage } from '../../../lib/errors'
import { queryKeys } from '../../../services/queryKeys'
import { useToastStore } from '../../../stores/toastStore'
import { setDoctorEnabled } from '../../auth/api'
import type { ManagedDoctorResponse } from '../../../types/api'

export function DoctorEnabledButton({ doctor }: { doctor: ManagedDoctorResponse }) {
  const queryClient = useQueryClient()
  const pushToast = useToastStore((state) => state.push)
  const mutation = useMutation({
    mutationFn: () => setDoctorEnabled(doctor.id, !doctor.enabled),
    onSuccess: async (updated) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.adminDoctors }),
        queryClient.invalidateQueries({ queryKey: queryKeys.adminInsights }),
        queryClient.invalidateQueries({ queryKey: queryKeys.doctors }),
      ])
      pushToast(updated.enabled ? `${updated.fullName} foi reativado.` : `${updated.fullName} foi desativado e não aparece mais para pacientes.`)
    },
    onError: (error) => {
      pushToast(errorMessage(error), 'error')
    },
  })

  return (
    <Button
      size="sm"
      variant={doctor.enabled ? 'secondary' : 'primary'}
      disabled={mutation.isPending}
      onClick={() => mutation.mutate()}
    >
      {mutation.isPending ? 'Salvando…' : doctor.enabled ? 'Desativar' : 'Ativar'}
    </Button>
  )
}
