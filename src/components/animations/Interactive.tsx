'use client'

import { useCallback, useMemo, useState } from 'react'
import { AnimationShell, type AnimationOptions } from './AnimationShell'
import { cn } from '@/lib/utils'

// ─── Control definition types ─────────────────────────────────────────────────

export interface SliderControl {
  type: 'slider'
  id: string
  label: string
  min: number
  max: number
  step: number
  defaultValue: number
  unit?: string
  formatValue?: (value: number) => string
}

export interface SelectOption {
  value: string
  label: string
}

export interface SelectControl {
  type: 'select'
  id: string
  label: string
  options: SelectOption[]
  defaultValue: string
}

export interface ToggleControl {
  type: 'toggle'
  id: string
  label: string
  defaultValue: boolean
}

export type ControlDef = SliderControl | SelectControl | ToggleControl

export type ControlValue = number | string | boolean
export type ControlValues = Record<string, ControlValue>

// ─── Props ────────────────────────────────────────────────────────────────────

interface Props {
  title: string
  description?: string
  controls: ControlDef[]
  /**
   * Render function called with the current control values and animation options.
   * Designed for use from TypeScript component files (not directly from MDX —
   * create a named wrapper component for MDX usage instead).
   */
  render: (values: ControlValues, options: AnimationOptions) => React.ReactNode
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function buildDefaults(controls: ControlDef[]): ControlValues {
  return Object.fromEntries(
    controls.map((c) => [c.id, c.defaultValue])
  ) as ControlValues
}

// ─── Individual control inputs ────────────────────────────────────────────────

interface SliderInputProps {
  control: SliderControl
  value: number
  onChange: (value: number) => void
}

function SliderInput({ control, value, onChange }: SliderInputProps) {
  const displayValue = control.formatValue
    ? control.formatValue(value)
    : control.unit
      ? `${value}${control.unit}`
      : String(value)

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center justify-between text-xs">
        <label
          htmlFor={control.id}
          className="font-medium text-foreground/80"
        >
          {control.label}
        </label>
        <span className="font-mono text-muted-foreground">{displayValue}</span>
      </div>
      <input
        id={control.id}
        type="range"
        min={control.min}
        max={control.max}
        step={control.step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className={cn(
          'h-2 w-full cursor-pointer appearance-none rounded-full',
          'bg-muted [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:w-4',
          '[&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full',
          '[&::-webkit-slider-thumb]:bg-[var(--anim-data)]'
        )}
        aria-label={`${control.label}: ${displayValue}`}
      />
      <div className="flex justify-between text-[10px] text-muted-foreground">
        <span>
          {control.formatValue
            ? control.formatValue(control.min)
            : `${control.min}${control.unit ?? ''}`}
        </span>
        <span>
          {control.formatValue
            ? control.formatValue(control.max)
            : `${control.max}${control.unit ?? ''}`}
        </span>
      </div>
    </div>
  )
}

interface SelectInputProps {
  control: SelectControl
  value: string
  onChange: (value: string) => void
}

function SelectInput({ control, value, onChange }: SelectInputProps) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={control.id} className="text-xs font-medium text-foreground/80">
        {control.label}
      </label>
      <select
        id={control.id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={cn(
          'min-h-11 w-full rounded-lg border border-border bg-background px-3 py-2',
          'text-sm text-foreground outline-none',
          'focus:ring-2 focus:ring-ring focus:ring-offset-1'
        )}
      >
        {control.options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  )
}

interface ToggleInputProps {
  control: ToggleControl
  value: boolean
  onChange: (value: boolean) => void
}

function ToggleInput({ control, value, onChange }: ToggleInputProps) {
  return (
    <div className="flex items-center justify-between gap-3">
      <label htmlFor={control.id} className="text-xs font-medium text-foreground/80">
        {control.label}
      </label>
      <button
        id={control.id}
        role="switch"
        aria-checked={value}
        onClick={() => onChange(!value)}
        className={cn(
          'relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center',
          'rounded-full border-2 border-transparent transition-colors duration-200',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
          value ? 'bg-[var(--anim-data)]' : 'bg-muted'
        )}
      >
        <span
          className={cn(
            'pointer-events-none inline-block h-4 w-4 rounded-full bg-white shadow-sm',
            'transform transition-transform duration-200',
            value ? 'translate-x-5' : 'translate-x-1'
          )}
        />
      </button>
    </div>
  )
}

// ─── Public component ─────────────────────────────────────────────────────────

export function Interactive({ title, description, controls, render }: Props) {
  const defaults = useMemo(() => buildDefaults(controls), [controls])
  const [values, setValues] = useState<ControlValues>(defaults)
  const [resetKey, setResetKey] = useState(0)

  const updateValue = useCallback((id: string, value: ControlValue) => {
    setValues((prev) => ({ ...prev, [id]: value }))
  }, [])

  const handleReset = useCallback(() => {
    setValues(defaults)
    setResetKey((k) => k + 1)
  }, [defaults])

  return (
    <AnimationShell title={title} description={description} onReset={handleReset} minHeight={320}>
      {(options) => (
        <div key={resetKey} className="flex h-full flex-col gap-4">
          {/* Visualization area — flex-1 so it fills available height */}
          <div className="flex-1">
            {render(values, options)}
          </div>

          {/* Control panel — at the bottom, above AnimationShell's speed bar */}
          {controls.length > 0 && (
            <div className="flex flex-col gap-3 rounded-lg border border-border bg-muted/40 p-3">
              {controls.map((control) => {
                if (control.type === 'slider') {
                  return (
                    <SliderInput
                      key={control.id}
                      control={control}
                      value={values[control.id] as number}
                      onChange={(v) => updateValue(control.id, v)}
                    />
                  )
                }
                if (control.type === 'select') {
                  return (
                    <SelectInput
                      key={control.id}
                      control={control}
                      value={values[control.id] as string}
                      onChange={(v) => updateValue(control.id, v)}
                    />
                  )
                }
                if (control.type === 'toggle') {
                  return (
                    <ToggleInput
                      key={control.id}
                      control={control}
                      value={values[control.id] as boolean}
                      onChange={(v) => updateValue(control.id, v)}
                    />
                  )
                }
                return null
              })}
            </div>
          )}
        </div>
      )}
    </AnimationShell>
  )
}
