import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import api from '../api/client'
import toast from 'react-hot-toast'
import PageHeader from '../components/PageHeader'
import Icon from '../components/Icon'
import TagPicker from '../components/TagPicker'

function formatSize(bytes) {
  if (bytes < 1024) {
    return bytes + ' B'
  }
  if (bytes < 1024 * 1024) {
    return (bytes / 1024).toFixed(1) + ' KB'
  }
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
}

export default function MyDocumentsPage() {
  const [docs, setDocs] = useState([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [title, setTitle] = useState('')
  const [tagIds, setTagIds] = useState([])
  const [drag, setDrag] = useState(false)
  const inputRef = useRef(null)

  const load = () => {
    api.get('/documents')
      .then((r) => {
        setDocs(r.data)
      })
      .catch(() => {
        toast.error('Не удалось загрузить список')
      })
      .finally(() => {
        setLoading(false)
      })
  }

  useEffect(() => {
    load()
  }, [])

  const upload = async (file) => {
    if (!file) {
      return
    }
    setUploading(true)
    const fd = new FormData()
    fd.append('file', file)
    if (title.trim()) {
      fd.append('title', title.trim())
    }
    if (tagIds.length) {
      fd.append('tagIds', JSON.stringify(tagIds))
    }
    try {
      const { data } = await api.post('/documents', fd)
      toast.success('Файл загружен и проиндексирован')
      setTitle('')
      setDocs((prev) => [data, ...prev])
    } catch (e) {
      toast.error(e.response?.data?.error || 'Ошибка загрузки')
    } finally {
      setUploading(false)
    }
  }

  const onDrop = (e) => {
    e.preventDefault()
    setDrag(false)
    const file = e.dataTransfer.files?.[0]
    if (file) {
      upload(file)
    }
  }

  const remove = async (id) => {
    if (!confirm('Удалить документ?')) {
      return
    }
    try {
      await api.delete(`/documents/${id}`)
      setDocs((prev) => prev.filter((d) => d.id !== id))
      toast.success('Удалено')
    } catch {
      toast.error('Ошибка удаления')
    }
  }

  const download = async (doc) => {
    try {
      const r = await api.get(`/documents/${doc.id}/file`, { responseType: 'blob' })
      const url = URL.createObjectURL(r.data)
      const a = document.createElement('a')
      a.href = url
      a.download = doc.originalFilename
      a.click()
      URL.revokeObjectURL(url)
    } catch {
      toast.error('Не удалось скачать файл')
    }
  }

  return (
    <div style={{ maxWidth: 900 }}>
      <PageHeader icon="upload" title="Мои документы" subtitle="txt, md, html, json, csv, pdf, docx — до 5 МБ" />

      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <div className="card-body">
          <input
            className="form-input"
            placeholder="Название (необязательно)"
            value={title}
            onChange={(e) => {
              setTitle(e.target.value)
            }}
            style={{ marginBottom: '1rem' }}
          />
          <div style={{ marginBottom: '1rem' }}>
            <div className="doc-tags-editor-label">Теги (необязательно)</div>
            <TagPicker value={tagIds} onChange={setTagIds} />
          </div>
          <div
            className={'upload-zone' + (drag ? ' drag' : '')}
            onDragOver={(e) => {
              e.preventDefault()
              setDrag(true)
            }}
            onDragLeave={() => {
              setDrag(false)
            }}
            onDrop={onDrop}
            onClick={() => {
              inputRef.current?.click()
            }}
          >
            <input
              ref={inputRef}
              type="file"
              hidden
              accept=".txt,.md,.markdown,.html,.htm,.json,.csv,.pdf,.docx,.doc,.rst"
              onChange={(e) => {
                upload(e.target.files?.[0])
              }}
            />
            {uploading ? (
              <><span className="spinner spinner-dark" /> Обработка файла...</>
            ) : (
              <><Icon name="upload" size={24} style={{ margin: '0 auto 0.5rem', display: 'block', opacity: 0.5 }} />
              Перетащите файл сюда или нажмите для выбора</>
            )}
          </div>
        </div>
      </div>

      <div className="card">
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '3rem' }}>
            <span className="spinner spinner-dark"/>
          </div>
        ) : docs.length === 0 ? (
          <div className="empty-state">Пока нет загруженных документов</div>
        ) : (
          docs.map((d) => (
            <div key={d.id} className="result-item" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div className="result-source">{d.originalFilename} · {formatSize(d.size)}</div>
                <Link to={`/docs/${d.meiliDocId}`} className="result-title" style={{ display: 'block' }}>
                  {d.title}
                </Link>
                <div className="note-date">{new Date(d.createdAt).toLocaleString('ru')}</div>
              </div>
              <div style={{ display: 'flex', gap: '0.5rem', flexShrink: 0 }}>
                <Link to={`/docs/${d.meiliDocId}`} className="btn btn-primary btn-sm">
                  <Icon name="eye" size={14} /> Открыть
                </Link>
                <button type="button" className="btn btn-secondary btn-sm" onClick={() => download(d)}>
                  <Icon name="download" size={14} />
                </button>
                <button type="button" className="btn btn-danger btn-sm" onClick={() => remove(d.id)}>
                  <Icon name="trash" size={14} />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
