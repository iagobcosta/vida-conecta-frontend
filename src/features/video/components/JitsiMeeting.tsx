import { useEffect, useRef, useState } from 'react'
import { Alert } from '../../../components/Alert'
import { Spinner } from '../../../components/Spinner'
import { getJitsiDomain } from '../lib/jitsiConfig'
import { loadJitsiScript, type JitsiMeetExternalApi } from '../lib/loadJitsiScript'

type JitsiMeetingProps = {
  roomName: string
  displayName: string
  onLeft?: () => void
}

export function JitsiMeeting({ roomName, displayName, onLeft }: JitsiMeetingProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const apiRef = useRef<JitsiMeetExternalApi | null>(null)
  const onLeftRef = useRef(onLeft)
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading')
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    onLeftRef.current = onLeft
  }, [onLeft])

  useEffect(() => {
    let cancelled = false
    const domain = getJitsiDomain()

    async function start() {
      setStatus('loading')
      setError(null)

      try {
        await loadJitsiScript(domain)
        if (cancelled || !containerRef.current || !window.JitsiMeetExternalAPI) {
          return
        }

        // Evita iframe residual se o efeito reexecutar (ex.: Strict Mode).
        containerRef.current.replaceChildren()

        const api = new window.JitsiMeetExternalAPI(domain, {
          roomName,
          parentNode: containerRef.current,
          width: '100%',
          height: '100%',
          userInfo: {
            displayName,
          },
          configOverwrite: {
            prejoinConfig: {
              enabled: true,
            },
            disableDeepLinking: true,
          },
          interfaceConfigOverwrite: {
            MOBILE_APP_PROMO: false,
          },
        })

        if (cancelled) {
          api.dispose()
          return
        }

        apiRef.current = api

        const handleJoined = () => {
          if (!cancelled) {
            setStatus('ready')
          }
        }

        const handleLeft = () => {
          if (!cancelled) {
            onLeftRef.current?.()
          }
        }

        const handleReadyToClose = () => {
          if (!cancelled) {
            onLeftRef.current?.()
          }
        }

        const handleConnectionFailed = () => {
          if (!cancelled) {
            setStatus('error')
            setError('Falha de conexão com a sala de vídeo. Tente novamente.')
          }
        }

        api.addListener('videoConferenceJoined', handleJoined)
        api.addListener('videoConferenceLeft', handleLeft)
        api.addListener('readyToClose', handleReadyToClose)
        api.addListener('connectionFailed', handleConnectionFailed)

        // Prejoin: considera pronto quando o iframe monta (usuário ainda pode confirmar câmera).
        setStatus('ready')
      } catch (cause) {
        if (!cancelled) {
          setStatus('error')
          setError(cause instanceof Error ? cause.message : 'Não foi possível iniciar a videochamada.')
        }
      }
    }

    void start()

    return () => {
      cancelled = true
      apiRef.current?.dispose()
      apiRef.current = null
      if (containerRef.current) {
        containerRef.current.replaceChildren()
      }
    }
  }, [roomName, displayName])

  return (
    <div className="relative overflow-hidden rounded-lg bg-slate-900">
      {status === 'loading' ? (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-slate-900/90">
          <Spinner label="Carregando videochamada" />
        </div>
      ) : null}
      {status === 'error' && error ? (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-slate-900/95 p-4">
          <Alert variant="error" className="max-w-md">
            {error}
          </Alert>
        </div>
      ) : null}
      <div
        ref={containerRef}
        className="aspect-video min-h-[280px] w-full sm:min-h-[360px] lg:min-h-[420px]"
        aria-label="Sala de videochamada Jitsi"
      />
    </div>
  )
}
