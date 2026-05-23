import { useEffect, useState, useRef } from 'react'
import api from '../api/client'
import PageHeader from '../components/PageHeader'
import Icon from '../components/Icon'

const LEVELS = [
  { id: 'all', label: 'Все' },
  { id: 'info', label: 'INFO' },
  { id: 'warn', label: 'WARN' },
  { id: 'error', label: 'ERROR' },
]

export default function LogsPage() {
  const [logs, setLogs] = useState([])
  const [level, setLevel] = useState('all')
  const [loading, setLoading] = useState(true)
  const bottomRef = useRef(null)

  useEffect(() => {
    api.get('/admin/logs')
      .then((r) => {
        setLogs(r.data)
      })
      .catch(() => {
      })
      .finally(() => {
        setLoading(false)
      })
  }, [])

  useEffect(() => {
    bottomRef.current?.scrollIntoView()
  }, [logs])

  const filtered = level === 'all' ? logs : logs.filter((l) => l.level === level)

  return (
    <div style={{ maxWidth: 1000 }}>
      <PageHeader
        icon="list"
        title="Логи скрапера"
        actions={
          <div className="filter-bar" style={{ marginBottom: 0 }}>
            {LEVELS.map((l) => (
              <button
                key={l.id}
                type="button"
                className={'filter-chip' + (level === l.id ? ' active' : '')}
                onClick={() => setLevel(l.id)}
              >
                {l.label}
              </button>
            ))}
          </div>
        }
      />
      <div className="card">
        <div className="card-body logs-scroll">
          {loading ? (
            <div className="page-loading"><span className="spinner spinner-dark" /></div>
          ) : filtered.length === 0 ? (
            <div className="empty-state"><Icon name="clipboard" size={40} />Нет логов</div>
          ) : (
            filtered.map((l, i) => (
              <div key={i} className="log-line">
                <span className="log-time">{new Date(l.ts || l.time).toLocaleTimeString('ru')}</span>
                <span className={'log-level-' + (l.level || 'info')}>[{(l.level || 'INFO').toUpperCase()}]</span>
                <span className="log-msg">{l.message}</span>
              </div>
            ))
          )}
          <div ref={bottomRef} />
        </div>
      </div>
    </div>
  )
}
