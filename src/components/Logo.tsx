import { Link } from 'react-router-dom'
import { cn } from '../lib/cn'

type LogoProps = {
  light?: boolean
}

export function Logo({ light = false }: LogoProps) {
  return (
    <Link to="/" className="inline-flex items-center gap-2 no-underline">
      <span
        className={cn(
          'grid h-8 w-8 place-items-center rounded-lg text-sm font-bold',
          light ? 'bg-white text-teal-800' : 'bg-teal-700 text-white',
        )}
        aria-hidden
      >
        VC
      </span>
      <span className={cn('text-base font-semibold tracking-tight', light ? 'text-white' : 'text-slate-900')}>
        Vida Conecta
      </span>
    </Link>
  )
}
