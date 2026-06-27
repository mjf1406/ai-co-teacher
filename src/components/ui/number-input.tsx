import { Minus, Plus } from 'lucide-react'
import * as React from 'react'

import { cn } from '@/lib/utils'

type NumberInputProps = {
  id?: string
  value: number | ''
  onValueChange: (value: number | '') => void
  min?: number
  max?: number
  step?: number
  disabled?: boolean
  className?: string
}

function NumberInput({
  id,
  value,
  onValueChange,
  min = 1,
  max = 10,
  step = 1,
  disabled = false,
  className,
}: NumberInputProps) {
  const canDecrement = value !== '' && value > min
  const canIncrement = value === '' || value < max

  function decrement() {
    if (disabled || !canDecrement) return
    onValueChange(Math.max(min, value - step))
  }

  function increment() {
    if (disabled || !canIncrement) return
    if (value === '') {
      onValueChange(min)
      return
    }
    onValueChange(Math.min(max, value + step))
  }

  function handleInputChange(event: React.ChangeEvent<HTMLInputElement>) {
    const raw = event.target.value
    if (raw === '') {
      onValueChange('')
      return
    }
    if (!/^\d+$/.test(raw)) return
    const parsed = Number.parseInt(raw, 10)
    onValueChange(Math.min(parsed, max))
  }

  function handleKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.key === 'ArrowUp') {
      event.preventDefault()
      increment()
    } else if (event.key === 'ArrowDown') {
      event.preventDefault()
      decrement()
    }
  }

  return (
    <div
      className={cn(
        'flex h-8 w-28 overflow-hidden rounded-2xl border border-transparent bg-input/50 transition-[color,box-shadow] duration-200 focus-within:border-ring focus-within:ring-3 focus-within:ring-ring/30',
        disabled && 'pointer-events-none opacity-50',
        className,
      )}
    >
      <button
        type="button"
        aria-label="Decrease"
        disabled={disabled || !canDecrement}
        onClick={decrement}
        className="inline-flex shrink-0 items-center justify-center rounded-l-2xl border-r border-border/60 px-2.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:pointer-events-none disabled:opacity-50"
      >
        <Minus className="size-3.5" />
      </button>
      <input
        id={id}
        type="text"
        inputMode="numeric"
        autoComplete="off"
        disabled={disabled}
        value={value === '' ? '' : String(value)}
        onChange={handleInputChange}
        onKeyDown={handleKeyDown}
        className="h-full min-w-0 flex-1 border-0 bg-transparent px-1 text-center text-base outline-none md:text-sm"
      />
      <button
        type="button"
        aria-label="Increase"
        disabled={disabled || !canIncrement}
        onClick={increment}
        className="inline-flex shrink-0 items-center justify-center rounded-r-2xl border-l border-border/60 px-2.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:pointer-events-none disabled:opacity-50"
      >
        <Plus className="size-3.5" />
      </button>
    </div>
  )
}

export { NumberInput }
