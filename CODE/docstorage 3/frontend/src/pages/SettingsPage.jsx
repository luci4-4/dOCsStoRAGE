import { useEffect, useState } from 'react'
import api from '../api/client'
import toast from 'react-hot-toast'
import PageHeader from '../components/PageHeader'
import Icon from '../components/Icon'

export default function SettingsPage() {
  const [s, setS] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    api.get('/admin/search-settings')
      .then((r) => {
        setS(r.data)
      })
      .catch(() => {
        toast.error('Ошибка')
      })
      .finally(() => {
        setLoading(false)
      })
  }, [])

  const save = async () => {
    setSaving(true)
    try {
      await api.post('/admin/search-settings', s)
      toast.success('Сохранено')
    } catch {
      toast.error('Ошибка')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="page-loading">
        <span className="spinner spinner-dark" />
      </div>
    )
  }

  return (
    <div style={{ maxWidth: 640 }}>
      <PageHeader icon="cog" title="Настройки MeiliSearch" subtitle="Стоп-слова, фильтры, опечатки" />
      <div className="card">
        <div className="card-body settings-form">
          <div className="form-group">
            <label className="form-label">Поисковые атрибуты</label>
            <input
              className="form-input mono"
              value={(s?.searchableAttributes || []).join(', ')}
              onChange={(e) => {
                setS((x) => ({
                  ...x,
                  searchableAttributes: e.target.value.split(',').map((v) => v.trim()).filter(Boolean),
                }))
              }}
            />
          </div>
          <div className="form-group">
            <label className="form-label">Фильтруемые атрибуты</label>
            <input
              className="form-input mono"
              value={(s?.filterableAttributes || []).join(', ')}
              onChange={(e) => {
                setS((x) => ({
                  ...x,
                  filterableAttributes: e.target.value.split(',').map((v) => v.trim()).filter(Boolean),
                }))
              }}
            />
          </div>
          <label className="checkbox-row">
            <input
              type="checkbox"
              checked={s?.typoTolerance?.enabled ?? true}
              onChange={(e) => {
                setS((x) => ({
                  ...x,
                  typoTolerance: { ...(x?.typoTolerance || {}), enabled: e.target.checked },
                }))
              }}
            />
            Включить поиск с учётом опечаток (Typo Tolerance)
          </label>
          <div className="json-preview">
            <div className="json-preview-label">JSON Preview</div>
            <pre>{JSON.stringify(s, null, 2)}</pre>
          </div>
        </div>
        <div className="card-footer">
          <button type="button" className="btn btn-primary btn-full" onClick={save} disabled={saving}>
            {saving ? <span className="spinner" /> : <><Icon name="check" size={14} /> Сохранить настройки</>}
          </button>
        </div>
      </div>
    </div>
  )
}
