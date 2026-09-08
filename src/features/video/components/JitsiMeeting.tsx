import { useEffect, useRef, useState } from 'react'
import { Alert } from '../../../components/Alert'
import { Button } from '../../../components/Button'
import { Spinner } from '../../../components/Spinner'
import { getJitsiDomain, getJitsiProtocol, jitsiExternalApiUrl } from '../lib/jitsiConfig'
import { loadJitsiScript, type JitsiMeetExternalApi } from '../lib/loadJitsiScript'

type JitsiMeetingProps = {
  roomName: string
  displayName: string
  onLeft?: () => void
}

const MIN_EMBED_WIDTH = 320
const DEFAULT_HEIGHT = 480

export function JitsiMeeting({ roomName, displayName, onLeft }: JitsiMeetingProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const apiRef = useRef<JitsiMeetExternalApi | null>(null)
  const onLeftRef = useRef(onLeft)
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading')
  const [error, setError] = useState<string | null>(null)
  const [retryKey, setRetryKey] = useState(0)

  useEffect(() => {
    onLeftRef.current = onLeft
  }, [onLeft])

  useEffect(() => {
    let cancelled = false
    const domain = getJitsiDomain()
    const container = containerRef.current

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

        const width = Math.max(containerRef.current.clientWidth || MIN_EMBED_WIDTH, MIN_EMBED_WIDTH)
        const height = Math.max(containerRef.current.clientHeight || DEFAULT_HEIGHT, DEFAULT_HEIGHT)

        const api = new window.JitsiMeetExternalAPI(domain, {
          roomName,
          parentNode: containerRef.current,
          width,
          height,
          userInfo: {
            displayName,
          },
          configOverwrite: {
            prejoinConfig: {
              enabled: true,
            },
            disableDeepLinking: true,
            // Evita tela preta quando o embed fica estreito (< 320px).
            reducedUIEnabled: false,
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

        const iframe = api.getIFrame?.()
        if (iframe) {
          iframe.style.width = '100%'
          iframe.style.height = '100%'
          iframe.style.border = '0'
          iframe.setAttribute(
            'allow',
            'camera; microphone; display-capture; autoplay; clipboard-write; fullscreen',
          )
        }

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
      if (container) {
        container.replaceChildren()
      }
    }
  }, [roomName, displayName, retryKey])

  const domain = getJitsiDomain()
  const trustUrl = `${getJitsiProtocol(domain)}://${domain}`

  function trustCertificateAndRetry() {
    window.open(trustUrl, '_blank', 'noopener,noreferrer')
    // Dá tempo para o usuário aceitar o certificado na outra aba.
    window.setTimeout(() => setRetryKey((value) => value + 1), 1500)
  }

  return (
    <div className="relative min-w-[320px] overflow-hidden rounded-lg bg-slate-900">
      {status === 'loading' ? (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-slate-900/90">
          <Spinner label="Carregando videochamada" />
        </div>
      ) : null}
      {status === 'error' && error ? (
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-3 bg-slate-900/95 p-4">
          <Alert variant="error" className="max-w-md">
            {error}
          </Alert>
          <div className="flex flex-wrap justify-center gap-2">
            <Button size="sm" onClick={trustCertificateAndRetry}>
              Aceitar certificado e tentar de novo
            </Button>
            <Button size="sm" variant="secondary" onClick={() => setRetryKey((value) => value + 1)}>
              Só tentar de novo
            </Button>
          </div>
          <p className="max-w-md text-center text-xs text-slate-300">
            Cada navegador/perfil (ex.: anônimo do paciente) precisa aceitar{' '}
            <a className="underline" href={trustUrl} target="_blank" rel="noreferrer">
              {trustUrl}
            </a>{' '}
            uma vez. Script: {jitsiExternalApiUrl(domain)}
          </p>
        </div>
      ) : null}
      <div
        ref={containerRef}
        className="aspect-video min-h-[320px] w-full sm:min-h-[400px] lg:min-h-[480px]"
        aria-label="Sala de videochamada Jitsi"
      />
    </div>
  )
}
