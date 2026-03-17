import { useState } from 'react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Plus, Check, X } from 'lucide-react'

interface SelectWithAddProps {
  options: string[]
  value: string
  onChange: (value: string) => void
  onAddOption: (newOption: string) => void
  placeholder?: string
  id?: string
}

export function SelectWithAdd({
  options,
  value,
  onChange,
  onAddOption,
  placeholder,
  id,
}: SelectWithAddProps) {
  const [isAdding, setIsAdding] = useState(false)
  const [newValue, setNewValue] = useState('')
  const [error, setError] = useState('')

  const handleAdd = () => {
    const trimmed = newValue.trim()
    if (!trimmed) return
    if (trimmed.includes(',')) {
      setError('Commas are not allowed')
      return
    }
    onAddOption(trimmed)
    onChange(trimmed)
    setNewValue('')
    setError('')
    setIsAdding(false)
  }

  const handleCancel = () => {
    setNewValue('')
    setError('')
    setIsAdding(false)
  }

  if (isAdding) {
    return (
      <div className="space-y-1">
        <div className="flex gap-1">
          <Input
            value={newValue}
            onChange={(e) => { setNewValue(e.target.value); setError('') }}
            placeholder="New option..."
            className="flex-1"
            autoFocus
            onKeyDown={(e) => {
              if (e.key === 'Enter') { e.preventDefault(); handleAdd() }
              if (e.key === 'Escape') handleCancel()
            }}
          />
          <Button type="button" variant="ghost" size="icon" onClick={handleAdd}>
            <Check className="h-4 w-4" />
          </Button>
          <Button type="button" variant="ghost" size="icon" onClick={handleCancel}>
            <X className="h-4 w-4" />
          </Button>
        </div>
        {error && <p className="text-xs text-red-400">{error}</p>}
      </div>
    )
  }

  return (
    <Select value={value} onValueChange={(v) => {
      if (v === '__add_new__') {
        setIsAdding(true)
      } else {
        onChange(v)
      }
    }}>
      <SelectTrigger id={id}>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        {options.map((opt) => (
          <SelectItem key={opt} value={opt}>{opt}</SelectItem>
        ))}
        <SelectItem value="__add_new__">
          <span className="flex items-center gap-1 text-[var(--accent-cyan)]">
            <Plus className="h-3 w-3" /> Add new...
          </span>
        </SelectItem>
      </SelectContent>
    </Select>
  )
}
