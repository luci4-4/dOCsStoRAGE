import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import api from '../api/client'
import toast from 'react-hot-toast'
import PageHeader from '../components/PageHeader'
import Icon from '../components/Icon'

export default function TagsPage() {
  const [tags, setTags] = useState([])
  const [name, setName] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const load = () => {
    return api.get('/tags')
      .then((r) => {
        setTags(r.data)
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

  const add = async (e) => {
    e.preventDefault()
    if (!name.trim()) {
      return
    }
    setSaving(true)
    try {
      await api.post('/tags', { name: name.trim() })
      setName('')
      toast.success('Тег добавлен')
      await load()
    } catch (err) {
      toast.error(err.response?.data?.error || 'Ошибка')
    } finally {
      setSaving(false)
    }
  }

  const del = async (id) => {
    if (!confirm('Удалить тег? Он будет снят со всех документов.')) {
      return
    }
    try {
      await api.delete(`/tags/${id}`)
      toast.success('Удалено')
      await load()
    } catch {
      toast.error('Ошибка удаления')
    }
  }

  return (
    <div style={{ maxWidth: 720 }}>
      <PageHeader
        icon="tag"
        title="Теги"
        subtitle="Группируйте документы и фильтруйте поиск по тегам"
      />

      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <form className="card-body" onSubmit={add} style={{ display: 'flex', gap: '0.75rem' }}>
          <input
            className="form-input"
            placeholder="Название тега (например, React)"
            value={name}
            onChange={(e) => setName(e.target.value)}
            style={{ flex: 1 }}
          />
          <button className="btn btn-primary" type="submit" disabled={saving}>
            {saving ? <span className="spinner" /> : 'Добавить'}
          </button>
        </form>
      </div>

      <div className="card">
        <div className="card-header">Все теги</div>
        <div className="card-body tags-list-body">
          {loading && <div className="spinner spinner-dark" />}
          {!loading && tags.length === 0 && (
            <span className="text-muted-sm">Нет тегов — создайте первый выше</span>
          )}
          {!loading && tags.map((t) => (
            <div key={t.id} className="tag-row">
              <Link
                to={`/search?tag=${encodeURIComponent(t.name)}`}
                className="tag-chip tag-chip-link"
              >
                <Icon name="tag" size={12} />
                {t.name}
                <span className="tag-count">{t.docCount ?? 0}</span>
              </Link>
              <button
                type="button"
                className="icon-btn tag-row-del"
                onClick={() => del(t.id)}
                title="Удалить тег"
              >
                ✕
              </button>
            </div>
          ))}
        </div>
        <div className="infra-hint" style={{ paddingTop: 0 }}>
          Нажмите на тег, чтобы открыть документы с этим тегом. Назначайте теги на странице документа.
        </div>
      </div>
    </div>
  )
}
