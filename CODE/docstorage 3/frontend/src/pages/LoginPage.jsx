import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import toast from 'react-hot-toast'
import Icon from '../components/Icon'

export default function LoginPage() {
  const [form, setForm] = useState({ username:'', password:'' })
  const [loading, setLoading] = useState(false)
  const { login } = useAuth()
  const navigate = useNavigate()

  const submit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      await login(form.username, form.password)
      toast.success('Добро пожаловать!')
      navigate('/')
    } catch {
      toast.error('Неверный логин или пароль')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', background:'var(--bg-primary)', padding:'1rem'}}>
      <div style={{width:'100%', maxWidth:'360px'}}>
        <div style={{textAlign:'center', marginBottom:'2rem'}}>
          <h1 style={{fontSize:'1.5rem', fontWeight:800, letterSpacing:'-0.025em', display:'flex', alignItems:'center', justifyContent:'center', gap:'0.5rem'}}>
            <Icon name="book" size={24} />Docs<span style={{color:'var(--accent)'}}>Storage</span>
          </h1>
          <p style={{color:'var(--text-muted)', marginTop:'0.375rem', fontSize:'0.875rem'}}>Войдите в аккаунт</p>
        </div>
        <div className="card">
          <form className="card-body" onSubmit={submit} style={{display:'flex', flexDirection:'column', gap:'1rem'}}>
            <div className="form-group">
              <label className="form-label">Логин</label>
              <input
                className="form-input"
                value={form.username}
                onChange={(e) => {
                  setForm((f) => ({ ...f, username: e.target.value }))
                }}
                required
                autoFocus
              />
            </div>
            <div className="form-group">
              <label className="form-label">Пароль</label>
              <input
                className="form-input"
                type="password"
                value={form.password}
                onChange={(e) => {
                  setForm((f) => ({ ...f, password: e.target.value }))
                }}
                required
              />
            </div>
            <button className="btn btn-primary btn-full" type="submit" disabled={loading}>
              {loading ? <span className="spinner" /> : <><Icon name="user" size={14} /> Войти</>}
            </button>
          </form>
          <div className="card-footer" style={{justifyContent:'center', fontSize:'0.8125rem', color:'var(--text-muted)'}}>
            Нет аккаунта?&nbsp;<Link to="/register" style={{color:'var(--accent)', textDecoration:'none', fontWeight:500}}>Регистрация</Link>
          </div>
        </div>
      </div>
    </div>
  )
}
