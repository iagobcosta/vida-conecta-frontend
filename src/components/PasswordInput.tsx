import { useState, type InputHTMLAttributes } from 'react'
import { inputClassName } from './Field'

type PasswordInputProps = Omit<InputHTMLAttributes<HTMLInputElement>, 'type' | 'id'> & {
  id: string
}

export function PasswordInput({ id, autoComplete, className, ...props }: PasswordInputProps) {
  const [visible, setVisible] = useState(false)
  return (
    <div className="relative">
      <input
        id={id}
        autoComplete={autoComplete}
        className={`${inputClassName} pr-24 ${className ?? ''}`}
        {...props}
        type={visible ? 'text' : 'password'}
      />
      <button
        type="button"
        className="absolute inset-y-0 right-2 cursor-pointer text-sm font-medium text-teal-800"
        onClick={() => setVisible((value) => !value)}
        aria-pressed={visible}
      >
        {visible ? 'Ocultar' : 'Mostrar'}
      </button>
    </div>
  )
}
