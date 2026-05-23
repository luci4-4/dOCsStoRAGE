import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { useState, useEffect } from 'react'
import { AuthProvider, useAuth } from './context/AuthContext'
import Layout from './components/Layout'

import HomePage      from './pages/HomePage'
import SearchPage    from './pages/SearchPage'
import DocPage       from './pages/DocPage'
import LoginPage     from './pages/LoginPage'
import RegisterPage  from './pages/RegisterPage'
import NotesPage     from './pages/NotesPage'
import FavoritesPage from './pages/FavoritesPage'
import HistoryPage   from './pages/HistoryPage'
import ProfilePage   from './pages/ProfilePage'
import MyDocumentsPage from './pages/MyDocumentsPage'
import SourcesPage   from './pages/SourcesPage'
import TagsPage      from './pages/TagsPage'
import LogsPage      from './pages/LogsPage'
import UsersPage     from './pages/UsersPage'
import StatsPage     from './pages/StatsPage'
import SettingsPage  from './pages/SettingsPage'

function Protected({ children, roles }) {
  const { user } = useAuth()
  if (!user) {
    return <Navigate to="/login" replace />
  }
  if (roles && !roles.some((r) => user.roles?.includes(r) || user.roles?.includes('ROLE_ADMIN'))) {
    return <Navigate to="/" replace />
  }
  return children
}

export default function App() {
  const [theme, setTheme] = useState(() => localStorage.getItem('ds_theme') || 'dark')

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
    localStorage.setItem('ds_theme', theme)
  }, [theme])

  return (
    <AuthProvider>
      <BrowserRouter>
        <Toaster
          toastOptions={{
            style: {
              background: 'var(--bg-secondary)',
              border: '1px solid var(--border-color)',
              color: 'var(--text-primary)',
            },
          }}
        />
        <Routes>
          <Route path="/login"    element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/" element={
            <Layout
              theme={theme}
              onToggleTheme={() => {
                setTheme((t) => {
                  if (t === 'dark') {
                    return 'light'
                  }
                  return 'dark'
                })
              }}
            />
          }>
            <Route index element={<HomePage />} />
            <Route path="search" element={<SearchPage />} />
            <Route path="docs/:id" element={<DocPage />} />
            <Route path="notes"     element={<Protected roles={['ROLE_USER']}><NotesPage /></Protected>} />
            <Route path="favorites" element={<Protected roles={['ROLE_USER']}><FavoritesPage /></Protected>} />
            <Route path="history"   element={<Protected roles={['ROLE_USER']}><HistoryPage /></Protected>} />
            <Route path="profile"   element={<Protected roles={['ROLE_USER']}><ProfilePage /></Protected>} />
            <Route path="documents" element={<Protected roles={['ROLE_USER']}><MyDocumentsPage /></Protected>} />
            <Route path="sources"   element={<Protected roles={['ROLE_CONTENT_MANAGER']}><SourcesPage /></Protected>} />
            <Route path="tags"      element={<Protected roles={['ROLE_CONTENT_MANAGER']}><TagsPage /></Protected>} />
            <Route path="logs"      element={<Protected roles={['ROLE_CONTENT_MANAGER']}><LogsPage /></Protected>} />
            <Route path="users"     element={<Protected roles={['ROLE_ADMIN']}><UsersPage /></Protected>} />
            <Route path="stats"     element={<Protected roles={['ROLE_ADMIN']}><StatsPage /></Protected>} />
            <Route path="settings"  element={<Protected roles={['ROLE_ADMIN']}><SettingsPage /></Protected>} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}
