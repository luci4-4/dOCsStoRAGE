import { useEffect, useState } from 'react'
import api from '../api/client'
import { useAuth } from '../context/AuthContext'
import toast from 'react-hot-toast'
import PageHeader from '../components/PageHeader'
import Icon from '../components/Icon'

const TECH_OPTIONS = ['JavaScript', 'TypeScript', 'React', 'Python', 'PHP', 'Symfony', 'Go', 'Rust', 'Docker', 'PostgreSQL']

export default function ProfilePage() {
  const { user } = useAuth()
  const [form, setForm] = useState({
    email: '',
    displayName: '',
    currentPassword: '',
    newPassword: '',
    preferredTechnologies: [],
  })
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    api.get('/profile')
      .then((r) => {
        setForm((f) => ({
          ...f,
          email: r.data.email || '',
          displayName: r.data.displayName || '',
          preferredTechnologies: r.data.preferredTechnologies || [],
        }))
      })
      .catch(() => {
      })
  }, [])

  const toggleTech = (tech) => {
    setForm((f) => ({
      ...f,
      preferredTechnologies: f.preferredTechnologies.includes(tech)
        ? f.preferredTechnologies.filter((t) => t !== tech)
        : [...f.preferredTechnologies, tech],
    }))
  }

  const save = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      await api.patch('/profile', {
        email: form.email,
        displayName: form.displayName,
        preferredTechnologies: form.preferredTechnologies,
        currentPassword: form.currentPassword,
        newPassword: form.newPassword || undefined,
      })
      const stored = JSON.parse(localStorage.getItem('ds_user') || '{}')
      localStorage.setItem('ds_user', JSON.stringify({
        ...stored,
        displayName: form.displayName,
      }))
      toast.success('Профиль обновлён')
    } catch {
      toast.error('Ошибка обновления')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div style={{ maxWidth: 520 }}>
      <PageHeader icon="user" title="Профиль" />

      <div className="card">
        <div className="card-header profile-header">
          <div className="profile-avatar">
            <Icon name="user" size={28} />
          </div>
          <div>
            <div className="profile-name">{form.displayName || user?.username}</div>
            <div className="profile-username">@{user?.username}</div>
            <div className="profile-badges">
              {user?.roles?.map((r) => (
                <span key={r} className="badge badge-blue">{r.replace('ROLE_', '')}</span>
              ))}
            </div>
          </div>
        </div>
        <form className="card-body profile-form" onSubmit={save}>
          <div className="form-group">
            <label className="form-label">Отображаемое имя</label>
            <input
              className="form-input"
              value={form.displayName}
              onChange={(e) => {
                setForm((f) => ({ ...f, displayName: e.target.value }))
              }}
              placeholder={user?.username}
            />
          </div>
          <div className="form-group">
            <label className="form-label">Email</label>
            <input
              className="form-input"
              type="email"
              value={form.email}
              onChange={(e) => {
                setForm((f) => ({ ...f, email: e.target.value }))
              }}
            />
          </div>
          <div className="form-group">
            <label className="form-label">Предпочитаемые технологии</label>
            <div className="tech-chips">
              {TECH_OPTIONS.map((t) => (
                <button
                  key={t}
                  type="button"
                  className={'filter-chip' + (form.preferredTechnologies.includes(t) ? ' active' : '')}
                  onClick={() => toggleTech(t)}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Текущий пароль</label>
            <input
              className="form-input"
              type="password"
              value={form.currentPassword}
              onChange={(e) => {
                setForm((f) => ({ ...f, currentPassword: e.target.value }))
              }}
              placeholder="Для смены пароля"
            />
          </div>
          <div className="form-group">
            <label className="form-label">Новый пароль</label>
            <input
              className="form-input"
              type="password"
              value={form.newPassword}
              onChange={(e) => {
                setForm((f) => ({ ...f, newPassword: e.target.value }))
              }}
              placeholder="Оставьте пустым, если не меняете"
            />
          </div>
          <button className="btn btn-primary" type="submit" disabled={saving}>
            {saving ? <span className="spinner" /> : <><Icon name="check" size={14} /> Сохранить</>}
          </button>
        </form>
      </div>
    </div>
  )
}
