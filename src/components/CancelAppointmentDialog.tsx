import { useState } from 'react'
import { Button } from './Button'
import { Field, inputClassName } from './Field'

type CancelAppointmentDialogProps = {
  open: boolean
  requireReason: boolean
  busy: boolean
  error?: string
  onClose: () => void
  onConfirm: (reason: string) => void
}

export function CancelAppointmentDialog({
  open,
  requireReason,
  busy,
  error,
  onClose,
  onConfirm,
}: CancelAppointmentDialogProps) {
  const [reason, setReason] = useState('')
  const trimmed = reason.trim()
  const reasonTooShort = requireReason && trimmed.length < 10

  if (!open) {
    return null
  }

  return (
    <div className="fixed inset-0 z-40 grid place-items-center bg-slate-900/40 p-4" role="presentation">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="cancel-title"
        className="w-full max-w-md rounded-xl bg-white p-5 shadow-xl"
      >
        <h2 id="cancel-title" className="text-lg font-semibold text-slate-900">
          Cancelar consulta?
        </h2>
        <p className="mt-2 text-sm text-slate-600">
          {requireReason
            ? 'O paciente será notificado com o motivo e poderá reagendar o horário.'
            : 'O horário será liberado e o médico receberá a notificação.'}
        </p>
        <form
          className="mt-4 space-y-4"
          onSubmit={(event) => {
            event.preventDefault()
            if (reasonTooShort) {
              return
            }
            onConfirm(trimmed)
          }}
        >
          <Field
            id="cancelReason"
            label={requireReason ? 'Motivo do cancelamento' : 'Motivo (opcional)'}
            hint={requireReason ? 'Mínimo de 10 caracteres. O paciente verá esta mensagem.' : undefined}
            error={error}
          >
            <textarea
              id="cancelReason"
              className={`${inputClassName} min-h-24 resize-y`}
              value={reason}
              onChange={(event) => setReason(event.target.value)}
              maxLength={500}
              required={requireReason}
              placeholder={requireReason ? 'Ex.: imprevisto no consultório, férias, emergência…' : 'Opcional'}
            />
          </Field>
          {reasonTooShort && trimmed.length > 0 ? (
            <p className="text-xs text-red-700">O motivo precisa ter pelo menos 10 caracteres.</p>
          ) : null}
          <div className="flex justify-end gap-2">
            <Button type="button" variant="secondary" onClick={onClose} disabled={busy}>
              Voltar
            </Button>
            <Button type="submit" variant="danger" disabled={busy || reasonTooShort}>
              {busy ? 'Cancelando…' : 'Cancelar consulta'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
