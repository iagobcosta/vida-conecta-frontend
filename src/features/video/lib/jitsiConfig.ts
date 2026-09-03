const DEFAULT_JITSI_DOMAIN = 'meet.jit.si'

/** Domínio do servidor Jitsi (sem protocolo). Ex.: meet.jit.si ou jitsi.seudominio.com */
export function getJitsiDomain(): string {
  const configured = import.meta.env.VITE_JITSI_DOMAIN?.trim()
  if (!configured) {
    return DEFAULT_JITSI_DOMAIN
  }
  return configured.replace(/^https?:\/\//, '').replace(/\/$/, '')
}

export function jitsiExternalApiUrl(domain = getJitsiDomain()): string {
  return `https://${domain}/external_api.js`
}
