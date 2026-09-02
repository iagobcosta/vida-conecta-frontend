import { useQuery } from '@tanstack/react-query'
import { Alert } from '../../../components/Alert'
import { Card } from '../../../components/Card'
import { EmptyState } from '../../../components/EmptyState'
import { PageHeader } from '../../../components/PageHeader'
import { Spinner } from '../../../components/Spinner'
import { errorMessage } from '../../../lib/errors'
import { formatDateTime } from '../../../lib/formatters'
import { queryKeys } from '../../../services/queryKeys'
import { useAuthStore } from '../../../stores/authStore'
import { listPrescriptions } from '../api'

export function PrescriptionsPage() {
  const role = useAuthStore((state) => state.user?.role)
  const query = useQuery({ queryKey: queryKeys.prescriptions, queryFn: listPrescriptions })

  return (
    <div>
      <PageHeader
        title={role === 'MEDICO' ? 'Receitas emitidas' : 'Minhas receitas'}
        description={
          role === 'MEDICO'
            ? 'A prescrição é emitida no contexto da consulta confirmada.'
            : 'Receitas digitais ligadas às suas consultas.'
        }
      />
      {query.isPending ? <Spinner label="Carregando receitas" /> : null}
      {query.isError ? <Alert variant="error">{errorMessage(query.error)}</Alert> : null}
      {query.data?.length === 0 ? (
        <EmptyState
          title="Nenhuma receita"
          description={
            role === 'MEDICO'
              ? 'Emita a receita na sala da consulta, depois que ela estiver confirmada.'
              : 'Quando o médico emitir uma receita, ela aparece aqui.'
          }
        />
      ) : null}
      <div className="space-y-3">
        {query.data?.map((prescription) => (
          <Card key={prescription.id} as="article">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <p className="font-medium text-slate-900">{prescription.doctorName}</p>
                <p className="text-sm text-slate-600">{formatDateTime(prescription.issuedAt)}</p>
              </div>
            </div>
            <ul className="mt-3 space-y-2">
              {prescription.items.map((item, index) => (
                <li key={`${prescription.id}-${index}`} className="rounded-lg bg-slate-50 px-3 py-2 text-sm">
                  <p className="font-medium text-slate-900">
                    {item.medication} · {item.dosage}
                  </p>
                  <p className="text-slate-600">{item.instructions}</p>
                </li>
              ))}
            </ul>
          </Card>
        ))}
      </div>
    </div>
  )
}
