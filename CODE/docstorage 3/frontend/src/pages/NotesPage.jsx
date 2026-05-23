import { useEffect, useMemo, useState } from 'react'
import api from '../api/client'
import toast from 'react-hot-toast'
import Icon from '../components/Icon'
import PageHeader from '../components/PageHeader'
import Modal from '../components/Modal'
import MarkdownView from '../components/MarkdownView'

export default function NotesPage() {
  const [notes, setNotes] = useState([])
  const [active, setActive] = useState(null)
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [saving, setSaving] = useState(false)
  const [filter, setFilter] = useState('')
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [exporting, setExporting] = useState(false)

  const load = () => {
    api.get('/notes')
      .then((r) => {
        setNotes(r.data)
      })
      .catch(() => {
      })
  }

  useEffect(() => {
    load()
  }, [])

  const filtered = useMemo(() => {
    const q = filter.trim().toLowerCase()
    if (!q) {
      return notes
    }
    return notes.filter((n) => {
      return (n.title || '').toLowerCase().includes(q) || (n.content || '').toLowerCase().includes(q)
    })
  }, [notes, filter])

  const open = (n) => {
    setActive(n)
    setTitle(n.title)
    setBody(n.content || '')
  }

  const newNote = () => {
    setActive(null)
    setTitle('')
    setBody('')
  }

  const save = async () => {
    setSaving(true)
    try {
      if (active) {
        await api.put(`/notes/${active.id}`, { title, content: body })
        toast.success('Сохранено')
      } else {
        await api.post('/notes', { title, content: body })
        toast.success('Заметка создана')
      }
      await load()
      newNote()
    } catch {
      toast.error('Ошибка сохранения')
    } finally {
      setSaving(false)
    }
  }

  const del = async () => {
    if (!deleteTarget) {
      return
    }
    await api.delete(`/notes/${deleteTarget.id}`)
    toast.success('Удалено')
    setDeleteTarget(null)
    load()
    newNote()
  }

  const exportPdf = async () => {
    if (!active?.id) {
      toast.error('Сначала сохраните заметку')
      return
    }
    setExporting(true)
    try {
      const r = await api.get(`/export/note/${active.id}`, { responseType: 'blob' })
      const url = URL.createObjectURL(r.data)
      const a = document.createElement('a')
      a.href = url
      a.download = `${title || 'note'}.pdf`
      a.click()
      URL.revokeObjectURL(url)
      toast.success('PDF загружен')
    } catch (err) {
      const data = err.response?.data
      if (data instanceof Blob) {
        const text = await data.text()
        try {
          const json = JSON.parse(text)
          toast.error(json.error || 'Экспорт недоступен')
        } catch {
          toast.error('Экспорт недоступен')
        }
      } else {
        toast.error(err.response?.data?.error || 'Экспорт недоступен')
      }
    } finally {
      setExporting(false)
    }
  }

  return (
    <div className="notes-layout">
      <PageHeader icon="note" title="Заметки" subtitle="Markdown с live-превью" />

      <div className="notes-grid">
        <div className="card notes-list-panel">
          <div className="card-header">
            <input
              className="form-input notes-filter"
              placeholder="Поиск по названию..."
              value={filter}
              onChange={(e) => {
                setFilter(e.target.value)
              }}
            />
            <button type="button" className="btn btn-primary btn-sm" onClick={newNote}>
              <Icon name="plus" size={14} /> Новая
            </button>
          </div>
          <div className="notes-list-scroll">
            {filtered.length === 0 && <div className="empty-state">Нет заметок</div>}
            {filtered.map((n) => (
              <div
                key={n.id}
                className={'note-list-item' + (active?.id === n.id ? ' active' : '')}
                onClick={() => open(n)}
              >
                <div className="note-title">{n.title || 'Без названия'}</div>
                <div className="note-preview">{n.content?.slice(0, 60)}</div>
                <div className="note-date">{new Date(n.updatedAt || n.createdAt).toLocaleDateString('ru')}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="card notes-editor-panel">
          <div className="card-header">
            <input
              className="form-input notes-title-input"
              placeholder="Название заметки"
              value={title}
              onChange={(e) => {
                setTitle(e.target.value)
              }}
            />
            <div className="notes-editor-actions">
              {active && (
                <>
                  <button type="button" className="btn btn-secondary btn-sm" onClick={exportPdf} disabled={exporting}>
                    <Icon name="export" size={14} /> PDF
                  </button>
                  <button type="button" className="btn btn-danger btn-sm" onClick={() => setDeleteTarget(active)}>
                    <Icon name="trash" size={14} />
                  </button>
                </>
              )}
              <button type="button" className="btn btn-primary btn-sm" onClick={save} disabled={saving}>
                {saving ? <span className="spinner" /> : <><Icon name="check" size={14} /> Сохранить</>}
              </button>
            </div>
          </div>
          <div className="notes-split">
            <textarea
              className="notes-textarea"
              value={body}
              onChange={(e) => {
                setBody(e.target.value)
              }}
              placeholder="Пишите в Markdown..."
            />
            <div className="notes-preview">
              <div className="notes-preview-label">Превью</div>
              <MarkdownView content={body || '*Пусто*'} />
            </div>
          </div>
        </div>
      </div>

      {deleteTarget && (
        <Modal
          title="Удалить заметку?"
          onClose={() => setDeleteTarget(null)}
          footer={
            <>
              <button type="button" className="btn btn-secondary" onClick={() => setDeleteTarget(null)}>Отмена</button>
              <button type="button" className="btn btn-danger" onClick={del}>Удалить</button>
            </>
          }
        >
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
            «{deleteTarget.title || 'Без названия'}» будет удалена безвозвратно.
          </p>
        </Modal>
      )}
    </div>
  )
}
