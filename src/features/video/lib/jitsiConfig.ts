const DEFAULT_JITSI_DOMAIN = 'localhost:8443'

/** Domínio do servidor Jitsi (sem protocolo/porta opcional). Ex.: localhost:8443 ou meet.jit.si */
export function getJitsiDomain(): string {
  const configured = import.meta.env.VITE_JITSI_DOMAIN?.trim()
  if (!configured) {
    return DEFAULT_JITSI_DOMAIN
  }
  return configured.replace(/^https?:\/\//, '').replace(/\/$/, '')
}

function isLocalHost(domain: string): boolean {
  const host = domain.split(':')[0]
  return host === 'localhost' || host === '127.0.0.1' || host === '[::1]'
}

/**
 * Protocolo do Jitsi.
 * - localhost:8000 → http (DISABLE_HTTPS=1)
 * - localhost:8443 / demais → https (a IFrame API do Jitsi sempre usa https no embed)
 */
export function getJitsiProtocol(domain = getJitsiDomain()): 'http' | 'https' {
  const configured = import.meta.env.VITE_JITSI_PROTOCOL?.trim().toLowerCase()
  if (configured === 'http' || configured === 'https') {
    return configured
  }
  if (isLocalHost(domain) && domain.endsWith(':8000')) {
    return 'http'
  }
  return 'https'
}

/** meet.jit.si / 8x8 exigem login de moderador; OAuth costuma falhar no iframe. */
export function isPublicMeetJitsi(domain = getJitsiDomain()): boolean {
  const host = domain.split(':')[0]
  return host === 'meet.jit.si' || host === '8x8.vc'
}

export function jitsiRoomUrl(roomName: string, domain = getJitsiDomain()): string {
  return `${getJitsiProtocol(domain)}://${domain}/${encodeURIComponent(roomName)}`
}

export function jitsiExternalApiUrl(domain = getJitsiDomain()): string {
  return `${getJitsiProtocol(domain)}://${domain}/external_api.js`
}
