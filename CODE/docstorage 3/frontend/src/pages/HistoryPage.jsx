import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import api from '../api/client'
import toast from 'react-hot-toast'
import PageHeader from '../components/PageHeader'
import Icon from '../components/Icon'

export default function HistoryPage() {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)

  const load = () => {
    api.get('/history')
      .then((r) => {
        setItems(r.data)
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

  const clear = async () => {
    if (!confirm('Очистить всю историю просмотров?')) {
      return
    }
    try {
      await api.delete('/history')
      setItems([])
      toast.success('История очищена')
    } catch {
      toast.error('Ошибка')
    }
  }

  return (
    <div style={{ maxWidth: 800 }}>
      <PageHeader
        icon="history"
        title="История"
        subtitle={`${items.length} последних просмотров`}
        actions={
          items.length > 0 && (
            <button type="button" className="btn btn-secondary btn-sm" onClick={clear}>
              <Icon name="trash" size={14} /> Очистить
            </button>
          )
        }
      />
      <div className="card">
        {loading ? (
          <div className="page-loading"><span className="spinner spinner-dark" /></div>
        ) : items.length === 0 ? (
          <div className="empty-state"><Icon name="history" size={40} />История пуста</div>
        ) : (
          items.map((h, i) => (
            <div key={i} className="result-item history-row">
              <Link to={`/docs/${h.docId}`} className="history-link">
                <div className="result-source">{h.docSource}</div>
                <div className="result-title">{h.docTitle}</div>
              </Link>
              <div className="note-date">{new Date(h.viewedAt).toLocaleString('ru')}</div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
