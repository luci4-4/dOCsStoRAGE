import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Icon from './Icon'

export default function SearchBar({
  placeholder = 'Поиск по документации...',
  large = false,
  autoFocus = false,
  initialQuery = '',
  onSearch,
}) {
  const [q, setQ] = useState(initialQuery)
  const [debounced, setDebounced] = useState(initialQuery)
  const navigate = useNavigate()

  useEffect(() => {
    const t = setTimeout(() => {
      setDebounced(q.trim())
    }, 300)
    return () => clearTimeout(t)
  }, [q])

  useEffect(() => {
    if (onSearch && debounced) {
      onSearch(debounced)
    }
  }, [debounced, onSearch])

  const submit = () => {
    if (!q.trim()) {
      return
    }
    navigate(`/search?q=${encodeURIComponent(q.trim())}`)
  }

  return (
    <div className={large ? 'search-hero' : 'topbar-search'}>
      <Icon name="search" size={large ? 20 : 16} />
      <input
        value={q}
        onChange={(e) => {
          setQ(e.target.value)
        }}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            submit()
          }
        }}
        placeholder={placeholder}
        autoFocus={autoFocus}
        className={large ? '' : 'topbar-search-input'}
        style={large ? { paddingRight: '7.5rem' } : undefined}
      />
      {large && (
        <button
          type="button"
          className="btn btn-primary btn-sm search-hero-btn"
          onClick={submit}
        >
          Найти
        </button>
      )}
    </div>
  )
}
