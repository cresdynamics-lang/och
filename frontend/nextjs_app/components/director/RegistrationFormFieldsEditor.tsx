'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/Button'
import { Plus, Trash2 } from 'lucide-react'

export interface FormFieldConfig {
  key: string
  label: string
  type: string
  required: boolean
}

const FIELD_TYPES = [
  { value: 'text', label: 'Short text' },
  { value: 'email', label: 'Email' },
  { value: 'tel', label: 'Phone' },
  { value: 'textarea', label: 'Long text' },
  { value: 'number', label: 'Number' },
  { value: 'url', label: 'URL' },
]

function slugify(label: string): string {
  return label
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_|_$/g, '') || 'field'
}

function ensureUniqueKey(key: string, existing: FormFieldConfig[]): string {
  const keys = new Set(existing.map((f) => f.key))
  if (!keys.has(key)) return key
  let i = 1
  while (keys.has(`${key}_${i}`)) i++
  return `${key}_${i}`
}

interface RegistrationFormFieldsEditorProps {
  studentFields: FormFieldConfig[]
  sponsorFields: FormFieldConfig[]
  onChange: (student: FormFieldConfig[], sponsor: FormFieldConfig[]) => void
  disabled?: boolean
}

export function RegistrationFormFieldsEditor({
  studentFields,
  sponsorFields,
  onChange,
  disabled = false,
}: RegistrationFormFieldsEditorProps) {
  const [editingStudent, setEditingStudent] = useState<number | null>(null)
  const [editingSponsor, setEditingSponsor] = useState<number | null>(null)

  const updateField = (
    type: 'student' | 'sponsor',
    index: number,
    updates: Partial<FormFieldConfig>
  ) => {
    const arr = type === 'student' ? [...studentFields] : [...sponsorFields]
    const prev = arr[index]
    arr[index] = { ...prev, ...updates }
    // Do NOT update key from label during typing - it causes React to remount the input and lose focus
    // Key is only set when creating a new field, or explicitly via updates.key
    if (updates.key !== undefined) {
      arr[index].key = ensureUniqueKey(updates.key, arr)
    }
    if (type === 'student') {
      onChange(arr, sponsorFields)
    } else {
      onChange(studentFields, arr)
    }
  }

  const finishEditingField = (type: 'student' | 'sponsor', index: number) => {
    const arr = type === 'student' ? [...studentFields] : [...sponsorFields]
    const f = arr[index]
    // Sync key from label when user finishes editing (for new fields with generic keys)
    if (f.key?.startsWith('custom_field') && f.label && f.label !== 'New question') {
      f.key = ensureUniqueKey(slugify(f.label), arr)
    }
    if (type === 'student') {
      onChange(arr, sponsorFields)
    } else {
      onChange(studentFields, arr)
    }
  }

  const addField = (type: 'student' | 'sponsor') => {
    const base = type === 'student' ? studentFields : sponsorFields
    const newField: FormFieldConfig = {
      key: ensureUniqueKey('custom_field', base),
      label: 'New question',
      type: 'text',
      required: false,
    }
    if (type === 'student') {
      onChange([...studentFields, newField], sponsorFields)
      setEditingStudent(studentFields.length)
    } else {
      onChange(studentFields, [...sponsorFields, newField])
      setEditingSponsor(sponsorFields.length)
    }
  }

  const removeField = (type: 'student' | 'sponsor', index: number) => {
    if (type === 'student') {
      onChange(studentFields.filter((_, i) => i !== index), sponsorFields)
      setEditingStudent(null)
    } else {
      onChange(studentFields, sponsorFields.filter((_, i) => i !== index))
      setEditingSponsor(null)
    }
  }

  const renderFieldList = (
    fields: FormFieldConfig[],
    type: 'student' | 'sponsor',
    editingIndex: number | null,
    setEditingIndex: (n: number | null) => void
  ) => (
    <div className="space-y-2">
      {fields.map((f, i) => (
        <div
          key={`${type}-${i}-${f.key}`}
          className="p-3 rounded-lg bg-och-midnight/50 border border-och-steel/20"
        >
          {editingIndex === i ? (
            <div className="space-y-3">
              <input
                type="text"
                value={f.label}
                onChange={(e) => updateField(type, i, { label: e.target.value })}
                placeholder="Label (e.g. Years of experience)"
                className="w-full px-3 py-2 bg-och-midnight border border-och-steel/30 rounded text-white text-sm"
              />
              <div className="flex gap-2">
                <select
                  value={f.type}
                  onChange={(e) => updateField(type, i, { type: e.target.value })}
                  className="flex-1 px-3 py-2 bg-och-midnight border border-och-steel/30 rounded text-white text-sm"
                >
                  {FIELD_TYPES.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
                <label className="flex items-center gap-1.5 text-sm text-och-steel shrink-0">
                  <input
                    type="checkbox"
                    checked={f.required}
                    onChange={(e) => updateField(type, i, { required: e.target.checked })}
                    className="rounded text-och-defender"
                  />
                  Required
                </label>
              </div>
              <div className="flex justify-between">
                <span className="text-xs text-och-steel">Key: {f.key}</span>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => removeField(type, i)}
                    disabled={disabled}
                    className="text-och-orange border-och-orange/50 hover:bg-och-orange/10"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      finishEditingField(type, i)
                      setEditingIndex(null)
                    }}
                  >
                    Done
                  </Button>
                </div>
              </div>
            </div>
          ) : (
            <div
              className="flex items-center justify-between cursor-pointer group"
              onClick={() => setEditingIndex(i)}
            >
              <div>
                <span className="text-white font-medium">{f.label}</span>
                {f.required && <span className="text-och-orange ml-1">*</span>}
                <span className="text-och-steel/70 text-xs ml-2">({f.type})</span>
              </div>
              {!disabled && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation()
                    removeField(type, i)
                  }}
                  className="opacity-0 group-hover:opacity-100 p-1 text-och-orange hover:bg-och-orange/10 rounded"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
          )}
        </div>
      ))}
      {!disabled && (
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => addField(type)}
          className="w-full border-dashed border-och-steel/40 text-och-steel hover:border-och-mint hover:text-och-mint"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add field
        </Button>
      )}
    </div>
  )

  return (
    <div className="space-y-4">
      <p className="text-xs text-och-steel">
        Include a field with key <code className="bg-och-midnight px-1 rounded">email</code> for students and <code className="bg-och-midnight px-1 rounded">contact_email</code> for sponsors so applications can be processed.
      </p>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div>
        <h4 className="text-sm font-semibold text-och-mint mb-3">Student application form</h4>
        {renderFieldList(
          studentFields,
          'student',
          editingStudent,
          setEditingStudent
        )}
      </div>
      <div>
        <h4 className="text-sm font-semibold text-och-gold mb-3">Sponsor registration form</h4>
        {renderFieldList(
          sponsorFields,
          'sponsor',
          editingSponsor,
          setEditingSponsor
        )}
      </div>
    </div>
    </div>
  )
}
