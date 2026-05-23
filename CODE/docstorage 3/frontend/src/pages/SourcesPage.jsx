import { useEffect, useState } from 'react'
import api from '../api/client'
import toast from 'react-hot-toast'

function SourceModal({ onClose, onSave }) {
  const [form, setForm] = useState({ name:'', url:'', type:'docs' })
  const [saving, setSaving] = useState(false)

  const submit = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      await api.post('/sources', form)
      toast.success('Источник добавлен')
      onSave()
    } catch {
      toast.error('Ошибка')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal"
        onClick={(e) => {
          e.stopPropagation()
        }}
      >
        <div className="modal-header">
          <span className="modal-title">Новый источник</span>
          <button type="button" className="icon-btn" onClick={onClose} aria-label="Закрыть">×</button>
        </div>
        <form onSubmit={submit}>
          <div className="modal-body">
            <div className="form-group">
              <label className="form-label">Название</label>
              <input
                className="form-input"
                value={form.name}
                onChange={(e) => {
                  setForm((f) => ({ ...f, name: e.target.value }))
                }}
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">URL</label>
              <input
                className="form-input"
                type="url"
                value={form.url}
                onChange={(e) => {
                  setForm((f) => ({ ...f, url: e.target.value }))
                }}
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">Тип</label>
              <select
                className="form-select"
                value={form.type}
                onChange={(e) => {
                  setForm((f) => ({ ...f, type: e.target.value }))
                }}
              >
                <option value="docs">Документация</option>
                <option value="tutorial">Туториал</option>
                <option value="api">API Reference</option>
              </select>
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>Отмена</button>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? <span className="spinner"/> : 'Добавить'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default function SourcesPage() {
  const [sources, setSources] = useState([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState(false)
  const [ri, setRi] = useState({})

  const load = () => {
    api.get('/sources')
      .then((r) => {
        setSources(r.data)
      })
      .catch(() => {
      })
      .finally(() => {
        setLoading(false)
      })
  }

  useEffect(() => {
    load()
  }, [])

  const reindex = async (id) => {
    setRi((r) => ({ ...r, [id]: true }))
    try {
      await api.post(`/sources/${id}/reindex`)
      toast.success('Запущено')
    } catch {
      toast.error('Ошибка')
    } finally {
      setRi((r) => ({ ...r, [id]: false }))
    }
  }

  return (
    <div style={{maxWidth:900}}>
      {modal && (
        <SourceModal
          onClose={() => setModal(false)}
          onSave={() => {
            setModal(false)
            load()
          }}
        />
      )}
      <div className="page-header" style={{display:'flex', alignItems:'center', justifyContent:'space-between'}}>
        <div>
          <div className="page-title">📦 Источники</div>
          <div className="page-subtitle">Управление источниками документации</div>
        </div>
        <button className="btn btn-primary" onClick={() => setModal(true)}>+ Добавить</button>
      </div>
      <div className="card">
        {loading ? (
          <div style={{display:'flex', justifyContent:'center', padding:'3rem'}}>
            <div className="spinner spinner-dark"/>
          </div>
        ) : sources.length === 0 ? (
          <div className="empty-state">Нет источников</div>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Название</th>
                  <th>URL</th>
                  <th>Тип</th>
                  <th>Статус</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {sources.map((s) => (
                  <tr key={s.id}>
                    <td><span style={{fontWeight:600}}>{s.name}</span></td>
                    <td>
                      <a
                        href={s.url}
                        target="_blank"
                        rel="noreferrer"
                        style={{color:'var(--accent)', fontFamily:'monospace', fontSize:'0.8125rem'}}
                      >
                        {s.url}
                      </a>
                    </td>
                    <td><span className="badge badge-blue">{s.type}</span></td>
                    <td>
                      <span className={'badge ' + (s.status === 'active' ? 'badge-green' : 'badge-yellow')}>
                        {s.status || 'active'}
                      </span>
                    </td>
                    <td>
                      <button
                        className="btn btn-secondary btn-sm"
                        onClick={() => reindex(s.id)}
                        disabled={ri[s.id]}
                      >
                        {ri[s.id] ? <span className="spinner spinner-dark"/> : '↺'} Reindex
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
