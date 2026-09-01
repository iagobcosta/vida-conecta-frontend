import type { ReactNode } from 'react'
import { cn } from '../lib/cn'

type CardProps = {
  children: ReactNode
  className?: string
  as?: 'div' | 'section' | 'article'
}

export function Card({ children, className, as: Tag = 'div' }: CardProps) {
  return (
    <Tag className={cn('rounded-xl border border-slate-200 bg-white p-5 shadow-sm', className)}>
      {children}
    </Tag>
  )
}
