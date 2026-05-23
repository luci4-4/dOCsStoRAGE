import { useNavigate } from 'react-router-dom'
import SearchBar from '../components/SearchBar'
import Icon from '../components/Icon'

const SUGGESTIONS = ['React hooks', 'Symfony routing', 'MeiliSearch', 'Docker compose', 'FastAPI']

export default function HomePage() {
  const navigate = useNavigate()

  return (
    <div className="home-wrap">
      <div className="home-hero">
        <h1 className="home-title">
          <Icon name="book" size={32} className="home-title-icon" />
          Docs<span className="accent">Storage</span>
        </h1>
        <p className="home-subtitle">Умный поиск по технической документации с учётом опечаток</p>
      </div>

      <SearchBar large autoFocus placeholder="Поиск по документации, туториалам, API..." />

      <div className="filter-bar home-chips">
        {SUGGESTIONS.map((t) => (
          <button
            key={t}
            type="button"
            className="filter-chip"
            onClick={() => {
              navigate(`/search?q=${encodeURIComponent(t)}`)
            }}
          >
            {t}
          </button>
        ))}
      </div>

      <div className="stats-grid home-stats">
        <div className="stat-card">
          <div className="stat-icon-wrap"><Icon name="book" size={20} /></div>
          <div className="stat-value">12 400+</div>
          <div className="stat-label">Документов</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon-wrap"><Icon name="layers" size={20} /></div>
          <div className="stat-value">38</div>
          <div className="stat-label">Источников</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon-wrap"><Icon name="users" size={20} /></div>
          <div className="stat-value">1 200+</div>
          <div className="stat-label">Пользователей</div>
        </div>
      </div>
    </div>
  )
}
