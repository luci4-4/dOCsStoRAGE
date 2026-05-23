import { useEffect, useState } from 'react'
import api from '../api/client'

export default function TagPicker({ value = [], onChange, disabled = false }) {
  const [allTags, setAllTags] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/tags')
      .then((r) => {
        setAllTags(r.data || [])
      })
      .catch(() => {
        setAllTags([])
      })
      .finally(() => {
        setLoading(false)
      })
  }, [])

  const toggle = (id) => {
    if (disabled) {
      return
    }
    if (value.includes(id)) {
      onChange(value.filter((x) => x !== id))
    } else {
      onChange([...value, id])
    }
  }

  if (loading) {
    return <span className="text-muted-sm">Загрузка тегов...</span>
  }

  if (allTags.length === 0) {
    return (
      <span className="text-muted-sm">
        Сначала создайте теги в разделе «Теги»
      </span>
    )
  }

  return (
    <div className="tag-picker">
      {allTags.map((t) => (
        <button
          key={t.id}
          type="button"
          className={`tag-chip tag-chip-toggle${value.includes(t.id) ? ' active' : ''}`}
          onClick={() => toggle(t.id)}
          disabled={disabled}
        >
          {t.name}
        </button>
      ))}
    </div>
  )
}
