import { useEffect, useState, useRef } from 'react'
import { Link, useParams } from 'react-router-dom'
import api from '../api/client'
import { useAuth } from '../context/AuthContext'
import { toast } from 'react-hot-toast'
import MarkdownView from '../components/MarkdownView'
import TableOfContents from '../components/TableOfContents'
import Icon from '../components/Icon'
import TagPicker from '../components/TagPicker'
import { buildTocFromHtml, prepareScrapedHtml } from '../utils/docHtml'

function canManageTags(user) {
  return user?.roles?.some((r) => {
    return r === 'ROLE_CONTENT_MANAGER' || r === 'ROLE_ADMIN'
  })
}

function csvToTable(raw) {
  const lines = raw.trim().split('\n').filter(Boolean)
  if (!lines.length) {
    return '<p>Пустой файл</p>'
  }
  const parse = (line) => {
    const cols = []
    let cur = ''
    let inQ = false
    for (const ch of line) {
      if (ch === '"') {
        inQ = !inQ
      } else if (ch === ',' && !inQ) {
        cols.push(cur)
        cur = ''
      } else {
        cur += ch
      }
    }
    cols.push(cur)
    return cols.map((c) => c.trim())
  }
  const [header, ...rows] = lines
  const th = parse(header).map((c) => `<th>${c}</th>`).join('')
  const trs = rows
    .map((r) => {
      return `<tr>${parse(r).map((c) => `<td>${c}</td>`).join('')}</tr>`
    })
    .join('\n')
  return `<table class="csv-table"><thead><tr>${th}</tr></thead><tbody>${trs}</tbody></table>`
}

function getViewMode(doc) {
  const fmt = doc.contentFormat || 'text'
  const mime = doc.mimeType || ''
  const fn = (doc.filename || doc.originalFilename || '').toLowerCase()

  if (doc.docType === 'scraped') {
    return 'scraped'
  }
  if (fmt === 'html' || fmt === 'htm' || fn.endsWith('.html') || fn.endsWith('.htm')) {
    return 'html'
  }
  if (fmt === 'markdown' || fn.endsWith('.md') || fn.endsWith('.markdown')) {
    return 'markdown'
  }
  if (fn.endsWith('.csv') || mime.includes('csv')) {
    return 'csv'
  }
  if (mime.includes('pdf') || fn.endsWith('.pdf')) {
    return 'pdf'
  }
  if (mime.includes('wordprocessingml') || fn.endsWith('.docx') || fn.endsWith('.doc')) {
    return 'office'
  }
  if (fmt === 'json' || fn.endsWith('.json')) {
    return 'json'
  }
  return 'text'
}

function DocContent({ doc, scrapedHtml = '' }) {
  const mode = getViewMode(doc)
  const content = doc.viewContent || doc.content || ''

  const [blobUrl, setBlobUrl] = useState(null)
  const [blobLoading, setBlobLoading] = useState(false)

  useEffect(() => {
    if (mode !== 'pdf' && mode !== 'office') {
      return undefined
    }
    if (!doc.documentId && !doc.hasDownload) {
      return undefined
    }

    setBlobLoading(true)
    let objectUrl = null

    api.get(`/documents/${doc.documentId}/file`, { responseType: 'blob' })
      .then((r) => {
        objectUrl = URL.createObjectURL(r.data)
        setBlobUrl(objectUrl)
      })
      .catch(() => {
        toast.error('Не удалось загрузить файл')
      })
      .finally(() => {
        setBlobLoading(false)
      })

    return () => {
      if (objectUrl) {
        URL.revokeObjectURL(objectUrl)
      }
    }
  }, [doc.documentId, doc.hasDownload, mode])

  if (mode === 'scraped') {
    return (
      <div
        className="doc-html-content"
        dangerouslySetInnerHTML={{ __html: scrapedHtml }}
      />
    )
  }

  if (mode === 'html') {
    return <HtmlFrame html={content} title={doc.title} />
  }

  if (mode === 'csv') {
    return (
      <div
        className="doc-csv-render table-wrap"
        dangerouslySetInnerHTML={{ __html: csvToTable(content) }}
      />
    )
  }

  if (mode === 'json') {
    let pretty = content
    try {
      pretty = JSON.stringify(JSON.parse(content), null, 2)
    } catch {
      pretty = content
    }
    return <pre className="doc-plain-text doc-json-pre">{pretty}</pre>
  }

  if (mode === 'pdf') {
    if (blobLoading) {
      return (
        <div className="page-loading">
          <span className="spinner spinner-dark" />
        </div>
      )
    }
    if (blobUrl) {
      return (
        <iframe
          src={blobUrl}
          className="doc-pdf-frame"
          title={doc.title}
        />
      )
    }
    return (
      <div>
        <div className="doc-format-notice">
          <Icon name="info" size={14} />
          PDF отображается в текстовом виде. Скачайте файл для просмотра оригинала.
        </div>
        <pre className="doc-plain-text">{content}</pre>
      </div>
    )
  }

  if (mode === 'office') {
    if (blobLoading) {
      return (
        <div className="page-loading">
          <span className="spinner spinner-dark" />
        </div>
      )
    }
    return (
      <div>
        <div className="doc-format-notice">
          <Icon name="info" size={14} />
          Word-документы отображаются в текстовом виде. Используйте кнопку «Скачать» для оригинала.
        </div>
        <pre className="doc-plain-text">{content}</pre>
      </div>
    )
  }

  if (mode === 'markdown') {
    return <MarkdownView content={content} />
  }

  return <pre className="doc-plain-text">{content}</pre>
}

export default function DocPage() {
  const { id } = useParams()
  const { user } = useAuth()
  const [doc, setDoc] = useState(null)
  const [loading, setLoading] = useState(true)
  const [fav, setFav] = useState(false)
  const [exporting, setExporting] = useState(false)
  const [toc, setToc] = useState([])
  const [scrapedHtml, setScrapedHtml] = useState('')
  const [allTags, setAllTags] = useState([])
  const [selectedTagIds, setSelectedTagIds] = useState([])
  const [tagSaving, setTagSaving] = useState(false)

  useEffect(() => {
    api.get(`/docs/${id}`)
      .then((r) => {
        setDoc(r.data)
        const mode = getViewMode(r.data)
        const html = r.data.viewContent || r.data.content || ''
        if (mode === 'scraped') {
          const prepared = prepareScrapedHtml(html)
          setScrapedHtml(prepared.html)
          setToc(prepared.toc)
        } else if (mode === 'html') {
          setScrapedHtml('')
          setToc(buildTocFromHtml(html))
        } else {
          setScrapedHtml('')
          setToc([])
        }
        if (user) {
          api.get('/favorites')
            .then((fr) => {
              setFav(fr.data.some((f) => f.docId === id))
            })
            .catch(() => {
            })
          api.post('/history', {
            docId: id,
            docTitle: r.data.title,
            docSource: r.data.source,
          }).catch(() => {
          })
        }
      })
      .catch(() => {
        toast.error('Документ не найден')
      })
      .finally(() => {
        setLoading(false)
      })
  }, [id, user])

  useEffect(() => {
    api.get('/tags')
      .then((r) => {
        setAllTags(r.data || [])
      })
      .catch(() => {
      })
  }, [])

  useEffect(() => {
    if (!doc?.tags?.length || !allTags.length) {
      setSelectedTagIds([])
      return
    }
    const ids = allTags
      .filter((t) => doc.tags.includes(t.name))
      .map((t) => t.id)
    setSelectedTagIds(ids)
  }, [doc, allTags])

  const isUpload = doc?.docType === 'upload'
  const isManager = canManageTags(user)

  const saveTags = async () => {
    setTagSaving(true)
    try {
      const r = await api.put(`/docs/${id}/tags`, { tagIds: selectedTagIds })
      setDoc((prev) => ({ ...prev, tags: r.data.tags || [] }))
      toast.success('Теги сохранены')
    } catch (err) {
      const msg = err.response?.data?.error || err.response?.data?.detail || 'Не удалось сохранить теги'
      toast.error(msg)
    } finally {
      setTagSaving(false)
    }
  }

  const toggleFav = async () => {
    if (!user) {
      return
    }
    try {
      if (fav) {
        await api.delete(`/favorites/${id}`)
        setFav(false)
      } else {
        await api.post('/favorites', {
          docId: id,
          docTitle: doc.title,
          docSource: doc.source,
        })
        setFav(true)
      }
    } catch {
      toast.error('Ошибка')
    }
  }

  const copyLink = () => {
    navigator.clipboard.writeText(window.location.href)
    toast.success('Ссылка скопирована')
  }

  const exportPdf = async () => {
    setExporting(true)
    try {
      const r = await api.get(`/export/${id}`, { responseType: 'blob' })
      const url = URL.createObjectURL(r.data)
      const a = document.createElement('a')
      a.href = url
      a.download = `${doc.title}.pdf`
      document.body.appendChild(a)
      a.click()
      URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch {
      toast.error('Ошибка экспорта')
    } finally {
      setExporting(false)
    }
  }

  const downloadOriginal = async () => {
    try {
      const r = await api.get(`/documents/${doc.documentId}/file`, { responseType: 'blob' })
      const url = URL.createObjectURL(r.data)
      const a = document.createElement('a')
      a.href = url
      a.download = doc.filename
      document.body.appendChild(a)
      a.click()
      URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch {
      toast.error('Ошибка скачивания')
    }
  }

  if (loading) {
    return (
      <div className="page-loading">
        <span className="spinner spinner-dark" />
      </div>
    )
  }

  if (!doc) {
    return (
      <div className="empty-state">
        <Icon name="alert" size={40} />
      </div>
    )
  }

  return (
    <div className="doc-layout">
      <div className="doc-main">
        <div className="doc-toolbar">
          <div>
            <div className="doc-meta">
              {doc.source}
              {doc.language ? ` · ${doc.language}` : ''}
              {isUpload && doc.filename ? ` · ${doc.filename}` : ''}
            </div>
            <h1 className="doc-page-title">{doc.title}</h1>
            {(doc.tags?.length > 0 || isManager) && (
              <div className="doc-tags-row">
                {doc.tags?.map((tagName) => (
                  <Link
                    key={tagName}
                    to={`/search?tag=${encodeURIComponent(tagName)}`}
                    className="tag-chip tag-chip-sm tag-chip-link"
                  >
                    <Icon name="tag" size={12} />
                    {tagName}
                  </Link>
                ))}
                {!doc.tags?.length && !isManager && (
                  <span className="text-muted-sm">Без тегов</span>
                )}
              </div>
            )}
            {isManager && (
              <div className="doc-tags-editor">
                <div className="doc-tags-editor-label">Теги документа</div>
                <TagPicker value={selectedTagIds} onChange={setSelectedTagIds} />
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={saveTags}
                  disabled={tagSaving}
                  style={{ marginTop: '0.5rem' }}
                >
                  {tagSaving ? <span className="spinner" /> : 'Сохранить теги'}
                </button>
              </div>
            )}
            {isUpload && user && (
              <Link to="/documents" className="doc-back-link">
                <Icon name="chevron" size={14} /> Мои документы
              </Link>
            )}
          </div>
          <div className="doc-actions">
            <button type="button" className="btn btn-secondary btn-sm" onClick={copyLink}>
              <Icon name="link" size={14} /> Копировать
            </button>
            {user && (
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={exportPdf}
                disabled={exporting}
              >
                <Icon name="export" size={14} /> {exporting ? '...' : 'PDF'}
              </button>
            )}
            {doc.hasDownload && doc.documentId && (
              <button type="button" className="btn btn-secondary btn-sm" onClick={downloadOriginal}>
                <Icon name="download" size={14} /> Скачать
              </button>
            )}
            {user && (
              <button
                type="button"
                className={`btn btn-sm ${fav ? 'btn-primary' : 'btn-secondary'}`}
                onClick={toggleFav}
              >
                <Icon name="star" size={14} fill={fav ? 'currentColor' : 'none'} />
              </button>
            )}
          </div>
        </div>

        <div className="card doc-viewer">
          <div className="card-body doc-viewer-body">
            <DocContent doc={doc} scrapedHtml={scrapedHtml} />
          </div>
        </div>
      </div>

      {toc.length > 0 && (
        <aside className="doc-sidebar">
          <TableOfContents items={toc} />
        </aside>
      )}
    </div>
  )
}

function HtmlFrame({ html, title }) {
  const iframeRef = useRef(null)
  const [height, setHeight] = useState(600)

  useEffect(() => {
    const iframe = iframeRef.current
    if (!iframe) {
      return undefined
    }

    const blob = new Blob([html], { type: 'text/html; charset=utf-8' })
    const url = URL.createObjectURL(blob)
    iframe.src = url

    const onLoad = () => {
      try {
        const h = iframe.contentDocument?.documentElement?.scrollHeight
        if (h && h > 100) {
          setHeight(Math.min(h + 32, 4000))
        }
      } catch {
      }
    }

    iframe.addEventListener('load', onLoad)
    return () => {
      iframe.removeEventListener('load', onLoad)
      URL.revokeObjectURL(url)
    }
  }, [html])

  return (
    <iframe
      ref={iframeRef}
      className="doc-html-frame"
      title={title}
      sandbox="allow-same-origin allow-scripts"
      style={{ height }}
    />
  )
}
