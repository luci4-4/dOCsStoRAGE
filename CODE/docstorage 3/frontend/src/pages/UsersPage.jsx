import { useEffect, useState } from 'react'
import api from '../api/client'
import toast from 'react-hot-toast'
import PageHeader from '../components/PageHeader'
import Icon from '../components/Icon'

const ROLES = ['ROLE_USER', 'ROLE_CONTENT_MANAGER', 'ROLE_ADMIN']
const RL = { ROLE_USER: 'User', ROLE_CONTENT_MANAGER: 'Manager', ROLE_ADMIN: 'Admin' }

export default function UsersPage() {
  const [users, setUsers] = useState([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)

  const load = () => {
    api.get('/admin/users')
      .then((r) => {
        setUsers(r.data)
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

  const changeRole = async (id, role) => {
    try {
      await api.patch(`/admin/users/${id}/role`, { role })
      toast.success('Роль изменена')
      load()
    } catch {
      toast.error('Ошибка')
    }
  }

  const toggle = async (id, active) => {
    try {
      await api.patch(`/admin/users/${id}/toggle`)
      toast.success(active ? 'Заблокирован' : 'Разблокирован')
      load()
    } catch {
      toast.error('Ошибка')
    }
  }

  const filtered = users.filter((u) => {
    return u.username?.toLowerCase().includes(search.toLowerCase()) ||
      u.email?.toLowerCase().includes(search.toLowerCase())
  })

  return (
    <div style={{ maxWidth: 1000 }}>
      <PageHeader
        icon="users"
        title="Пользователи"
        subtitle={`${users.length} аккаунтов`}
        actions={
          <div className="search-input-wrap">
            <Icon name="search" size={14} />
            <input
              className="form-input"
              placeholder="Поиск по логину / email"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value)
              }}
            />
          </div>
        }
      />
      <div className="card">
        {loading ? (
          <div className="page-loading"><span className="spinner spinner-dark" /></div>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr><th>#</th><th>Логин</th><th>Email</th><th>Роль</th><th>Статус</th><th /></tr>
              </thead>
              <tbody>
                {filtered.map((u) => (
                  <tr key={u.id}>
                    <td className="td-muted">{u.id}</td>
                    <td><strong>{u.username}</strong></td>
                    <td className="td-secondary">{u.email}</td>
                    <td>
                      <select
                        className="form-select form-select-sm"
                        value={u.roles?.[0] || 'ROLE_USER'}
                        onChange={(e) => changeRole(u.id, e.target.value)}
                      >
                        {ROLES.map((r) => (
                          <option key={r} value={r}>{RL[r]}</option>
                        ))}
                      </select>
                    </td>
                    <td>
                      <span className={'badge ' + (u.active !== false ? 'badge-green' : 'badge-red')}>
                        {u.active !== false ? 'Активен' : 'Блок'}
                      </span>
                    </td>
                    <td>
                      <button
                        type="button"
                        className={'btn btn-sm ' + (u.active !== false ? 'btn-danger' : 'btn-secondary')}
                        onClick={() => toggle(u.id, u.active !== false)}
                      >
                        {u.active !== false ? 'Блокировать' : 'Разблокировать'}
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
