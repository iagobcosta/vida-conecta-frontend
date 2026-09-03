import { jitsiExternalApiUrl } from './jitsiConfig'

type JitsiExternalApiConstructor = new (
  domain: string,
  options: Record<string, unknown>,
) => JitsiMeetExternalApi

export type JitsiMeetExternalApi = {
  addListener: (event: string, listener: (...args: unknown[]) => void) => void
  removeListener: (event: string, listener: (...args: unknown[]) => void) => void
  dispose: () => void
  executeCommand: (command: string, ...args: unknown[]) => void
}

declare global {
  interface Window {
    JitsiMeetExternalAPI?: JitsiExternalApiConstructor
  }
}

const scriptPromises = new Map<string, Promise<void>>()

export function loadJitsiScript(domain: string): Promise<void> {
  if (typeof window === 'undefined') {
    return Promise.reject(new Error('Jitsi só pode ser carregado no navegador.'))
  }

  if (window.JitsiMeetExternalAPI) {
    return Promise.resolve()
  }

  const src = jitsiExternalApiUrl(domain)
  const existing = scriptPromises.get(src)
  if (existing) {
    return existing
  }

  const promise = new Promise<void>((resolve, reject) => {
    const script = document.createElement('script')
    script.src = src
    script.async = true
    script.onload = () => {
      if (!window.JitsiMeetExternalAPI) {
        reject(new Error('Script do Jitsi carregou, mas a API não ficou disponível.'))
        return
      }
      resolve()
    }
    script.onerror = () => {
      scriptPromises.delete(src)
      reject(new Error(`Não foi possível carregar o script do Jitsi (${src}).`))
    }
    document.body.appendChild(script)
  })

  scriptPromises.set(src, promise)
  return promise
}
