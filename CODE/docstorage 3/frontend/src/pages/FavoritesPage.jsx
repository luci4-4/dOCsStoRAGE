import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import api from '../api/client'
import toast from 'react-hot-toast'
import PageHeader from '../components/PageHeader'
import Icon from '../components/Icon'

export default function FavoritesPage() {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)

  const load = () => {
    api.get('/favorites')
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

  const remove = async (id) => {
    await api.delete(`/favorites/${id}`)
    toast.success('Удалено')
    load()
  }

  return (
    <div style={{ maxWidth: 800 }}>
      <PageHeader icon="star" title="Избранное" subtitle={`${items.length} документов`} />
      <div className="card">
        {loading ? (
          <div className="page-loading"><span className="spinner spinner-dark" /></div>
        ) : items.length === 0 ? (
          <div className="empty-state"><Icon name="star" size={40} />Ничего в избранном</div>
        ) : (
          items.map((f) => (
            <div key={f.id} className="result-item fav-row">
              <Link to={`/docs/${f.docId}`} className="history-link">
                <div className="result-source">{f.docSource}</div>
                <div className="result-title">{f.docTitle}</div>
              </Link>
              <button
                type="button"
                className="btn btn-danger btn-sm"
                onClick={() => remove(f.docId)}
                aria-label="Удалить"
              >
                <Icon name="trash" size={14} />
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
