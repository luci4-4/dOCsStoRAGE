import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import toast from 'react-hot-toast'
import Icon from './Icon'
import SearchBar from './SearchBar'

function NavItem({ to, icon, label }) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) => {
        return 'nav-item' + (isActive ? ' active' : '')
      }}
    >
      <Icon name={icon} size={16} />
      {label}
    </NavLink>
  )
}

export default function Layout({ theme, onToggleTheme }) {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const hasRole = (r) => {
    return user?.roles?.includes(r) || user?.roles?.includes('ROLE_ADMIN')
  }

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="sidebar-logo">
          <Icon name="book" size={20} className="sidebar-logo-icon" />
          Docs<span>Storage</span>
        </div>

        <NavItem to="/" icon="home" label="Главная" />
        <NavItem to="/search" icon="search" label="Поиск" />

        {user && (
          <>
            <div className="nav-section">Личный кабинет</div>
            <NavItem to="/documents" icon="upload" label="Мои документы" />
            <NavItem to="/notes" icon="note" label="Заметки" />
            <NavItem to="/favorites" icon="star" label="Избранное" />
            <NavItem to="/history" icon="history" label="История" />
            <NavItem to="/profile" icon="user" label="Профиль" />
          </>
        )}

        {hasRole('ROLE_CONTENT_MANAGER') && (
          <>
            <div className="nav-section">Контент</div>
            <NavItem to="/sources" icon="package" label="Источники" />
            <NavItem to="/tags" icon="tag" label="Теги" />
            <NavItem to="/logs" icon="list" label="Логи" />
          </>
        )}

        {hasRole('ROLE_ADMIN') && (
          <>
            <div className="nav-section">Администрирование</div>
            <NavItem to="/users" icon="users" label="Пользователи" />
            <NavItem to="/stats" icon="chart" label="Статистика" />
            <NavItem to="/settings" icon="cog" label="Настройки" />
          </>
        )}

        <div className="sidebar-footer">
          {user ? (
            <button
              type="button"
              className="nav-item"
              onClick={() => {
                logout()
                toast.success('Вы вышли')
                navigate('/')
              }}
            >
              <Icon name="logout" size={16} /> Выйти
            </button>
          ) : (
            <NavItem to="/login" icon="user" label="Войти" />
          )}
        </div>
      </aside>

      <div className="main-content">
        <header className="topbar">
          <SearchBar placeholder="Быстрый поиск..." />
          <div className="topbar-actions">
            <button
              type="button"
              className="icon-btn"
              onClick={onToggleTheme}
              title={theme === 'dark' ? 'Светлая тема' : 'Тёмная тема'}
            >
              <Icon name={theme === 'dark' ? 'sun' : 'moon'} size={18} />
            </button>
            {user && (
              <div className="topbar-user">
                <Icon name="user" size={14} />
                {user.displayName || user.username}
              </div>
            )}
          </div>
        </header>
        <main className="page-body">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
