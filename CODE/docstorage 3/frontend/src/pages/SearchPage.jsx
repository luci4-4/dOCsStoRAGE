import { useEffect, useState } from 'react'
import { useSearchParams, Link } from 'react-router-dom'
import api from '../api/client'
import { useAuth } from '../context/AuthContext'
import PageHeader from '../components/PageHeader'
import Icon from '../components/Icon'

const LANGS = ['Все', 'JavaScript', 'Python', 'PHP', 'TypeScript', 'Go', 'Rust']

export default function SearchPage() {
  const { user } = useAuth()
  const [sp, setSp] = useSearchParams()
  const q = sp.get('q') || ''
  const tagParam = sp.get('tag') || ''
  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(false)
  const [filter, setFilter] = useState('Все')
  const [scope, setScope] = useState('all')
  const [tags, setTags] = useState([])
  const [activeTag, setActiveTag] = useState(tagParam)

  useEffect(() => {
    api.get('/tags')
      .then((r) => {
        setTags(r.data || [])
      })
      .catch(() => {
      })
  }, [])

  useEffect(() => {
    setActiveTag(tagParam)
  }, [tagParam])

  useEffect(() => {
    if (!q && !activeTag) {
      setResults([])
      return
    }

    setLoading(true)
    api.get('/search', {
      params: {
        q: q || '',
        lang: filter === 'Все' ? undefined : filter,
        tag: activeTag || undefined,
        mine: scope === 'mine' ? 1 : undefined,
      },
    })
      .then((r) => {
        setResults(r.data.hits || [])
      })
      .catch(() => {
        setResults([])
      })
      .finally(() => {
        setLoading(false)
      })
  }, [q, filter, scope, activeTag])

  const selectTag = (name) => {
    const next = activeTag === name ? '' : name
    setActiveTag(next)
    const params = {}
    if (q) {
      params.q = q
    }
    if (next) {
      params.tag = next
    }
    setSp(params)
  }

  const subtitle = () => {
    const parts = []
    if (q) {
      parts.push(`запрос «${q}»`)
    }
    if (activeTag) {
      parts.push(`тег «${activeTag}»`)
    }
    if (!loading && results.length > 0) {
      parts.push(`${results.length} результатов`)
    }
    return parts.length ? parts.join(' · ') : undefined
  }

  return (
    <div style={{ maxWidth: 800 }}>
      <PageHeader
        icon="search"
        title={
          q || activeTag ? (
            <>Результаты{q ? <> по <span className="accent-text">«{q}»</span></> : null}</>
          ) : (
            'Поиск'
          )
        }
        subtitle={subtitle()}
      />

      {activeTag && (
        <div className="active-tag-banner">
          <Icon name="tag" size={14} />
          Фильтр: <strong>{activeTag}</strong>
          <button type="button" className="btn btn-secondary btn-sm" onClick={() => selectTag(activeTag)}>
            Сбросить
          </button>
        </div>
      )}

      {tags.length > 0 && (
        <div className="filter-bar">
          <span className="filter-bar-label">Теги:</span>
          {tags.map((t) => (
            <button
              key={t.id}
              type="button"
              className={`filter-chip${activeTag === t.name ? ' active' : ''}`}
              onClick={() => selectTag(t.name)}
            >
              {t.name}
              {t.docCount > 0 ? ` (${t.docCount})` : ''}
            </button>
          ))}
        </div>
      )}

      <div className="filter-bar">
        {LANGS.map((l) => (
          <button
            key={l}
            type="button"
            className={`filter-chip${filter === l ? ' active' : ''}`}
            onClick={() => setFilter(l)}
          >
            {l}
          </button>
        ))}
        {user && (
          <>
            <span className="filter-divider" />
            <button
              type="button"
              className={`filter-chip${scope === 'all' ? ' active' : ''}`}
              onClick={() => setScope('all')}
            >
              Везде
            </button>
            <button
              type="button"
              className={`filter-chip${scope === 'mine' ? ' active' : ''}`}
              onClick={() => setScope('mine')}
            >
              Мои файлы
            </button>
          </>
        )}
      </div>

      <div className="card">
        {loading ? (
          <div className="page-loading">
            <span className="spinner spinner-dark" />
          </div>
        ) : results.length === 0 ? (
          <div className="empty-state">
            <Icon name="search" size={40} />
            {q || activeTag ? 'Ничего не найдено' : 'Введите запрос на главной или выберите тег'}
          </div>
        ) : (
          results.map((r) => (
            <Link key={r.id} to={`/docs/${r.id}`} className="result-item-link">
              <div className="result-item">
                <div className="result-source">
                  {r.source}
                  {r.language ? ` / ${r.language}` : ''}
                  {r.tags?.length > 0 && (
                    <span className="result-tags">
                      {r.tags.map((t) => (
                        <span key={t} className="tag-chip tag-chip-sm">{t}</span>
                      ))}
                    </span>
                  )}
                </div>
                <div
                  className="result-title"
                  dangerouslySetInnerHTML={{ __html: r._formatted?.title || r.title }}
                />
                <div
                  className="result-snippet"
                  dangerouslySetInnerHTML={{
                    __html: `${(r._formatted?.content || r.content || '').slice(0, 180)}...`,
                  }}
                />
              </div>
            </Link>
          ))
        )}
      </div>
    </div>
  )
}
