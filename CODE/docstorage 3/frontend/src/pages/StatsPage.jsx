import { useEffect, useState } from 'react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'
import api from '../api/client'
import PageHeader from '../components/PageHeader'
import Icon from '../components/Icon'
import toast from 'react-hot-toast'

const INFRA_DEFAULT = [
  { id: 'meilisearch', name: 'MeiliSearch', address: 'localhost:7700' },
  { id: 'scraper', name: 'FastAPI', address: 'localhost:8001' },
  { id: 'symfony', name: 'Symfony', address: 'localhost:8000' },
  { id: 'postgres', name: 'PostgreSQL', address: 'localhost:5432' },
]

export default function StatsPage() {
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [infra, setInfra] = useState(INFRA_DEFAULT)
  const [infraChecked, setInfraChecked] = useState(false)
  const [infraLoading, setInfraLoading] = useState(false)
  const [checkedAt, setCheckedAt] = useState(null)

  useEffect(() => {
    api.get('/admin/stats')
      .then((r) => {
        setStats(r.data)
      })
      .catch(() => {
      })
      .finally(() => setLoading(false))
  }, [])

  const checkInfra = async () => {
    setInfraLoading(true)
    try {
      const r = await api.get('/admin/health')
      const list = r.data.services || []
      setInfra(list.length ? list : INFRA_DEFAULT)
      setCheckedAt(r.data.checkedAt || null)
      setInfraChecked(true)
      const down = list.filter((s) => s.ok === false).length
      if (down === 0) {
        toast.success('Все сервисы доступны')
      } else {
        toast.error(`Недоступно сервисов: ${down}`)
      }
    } catch {
      toast.error('Не удалось проверить сервисы')
    } finally {
      setInfraLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="page-loading">
        <span className="spinner spinner-dark" />
      </div>
    )
  }

  const chartData = [
    { name: 'Пользователи', value: stats?.totalUsers ?? 0 },
    { name: 'Просмотры', value: stats?.totalViews ?? 0 },
    { name: 'Заметки', value: stats?.totalNotes ?? 0 },
    { name: 'Документы', value: stats?.totalDocs ?? 0 },
  ]

  const dotClass = (service) => {
    if (!infraChecked) {
      return 'unknown'
    }
    return service.ok ? 'ok' : 'down'
  }

  return (
    <div style={{ maxWidth: 960 }}>
      <PageHeader icon="chart" title="Статистика" subtitle="Сводка по платформе" />

      <div className="stats-grid">
        {[
          ['search', 'Поисков', stats?.totalSearches],
          ['eye', 'Просмотров', stats?.totalViews],
          ['users', 'Пользователей', stats?.totalUsers],
          ['book', 'Документов', stats?.totalDocs],
        ].map(([icon, label, val]) => (
          <div key={label} className="stat-card">
            <div className="stat-icon-wrap">
              <Icon name={icon} size={20} />
            </div>
            <div className="stat-value">{val?.toLocaleString('ru') ?? '—'}</div>
            <div className="stat-label">{label}</div>
          </div>
        ))}
      </div>

      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <div className="card-header">Активность платформы</div>
        <div className="card-body" style={{ height: 280 }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" />
              <XAxis dataKey="name" tick={{ fill: 'var(--text-muted)', fontSize: 12 }} />
              <YAxis tick={{ fill: 'var(--text-muted)', fontSize: 12 }} />
              <Tooltip
                contentStyle={{
                  background: 'var(--bg-secondary)',
                  border: '1px solid var(--border-color)',
                  borderRadius: 8,
                  color: 'var(--text-primary)',
                }}
              />
              <Bar dataKey="value" fill="var(--accent)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="card">
        <div className="card-header infra-card-header">
          <span>Инфраструктура</span>
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={checkInfra}
            disabled={infraLoading}
          >
            {infraLoading ? (
              <span className="spinner" />
            ) : (
              <>
                <Icon name="server" size={14} />
                Проверить
              </>
            )}
          </button>
        </div>
        <div className="card-body infra-grid">
          {infra.map((service) => (
            <div key={service.id} className="infra-item">
              <span className={`infra-dot ${dotClass(service)}`} title={service.message} />
              <Icon name="server" size={16} />
              <div className="infra-item-body">
                <div className="infra-name">{service.name}</div>
                <div className="infra-addr">{service.address}</div>
                {infraChecked && (
                  <div className={`infra-status ${service.ok ? 'ok' : 'down'}`}>
                    {service.ok ? 'Онлайн' : 'Офлайн'}
                    {service.latencyMs != null && service.ok ? ` · ${service.latencyMs} мс` : ''}
                    {!service.ok && service.message ? ` — ${service.message}` : ''}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
        {!infraChecked && (
          <div className="infra-hint">Нажмите «Проверить», чтобы обновить статус сервисов</div>
        )}
        {infraChecked && checkedAt && (
          <div className="infra-hint">
            Проверено: {new Date(checkedAt).toLocaleString('ru')}
          </div>
        )}
      </div>
    </div>
  )
}
