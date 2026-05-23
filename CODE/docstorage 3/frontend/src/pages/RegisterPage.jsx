import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import api from '../api/client'
import toast from 'react-hot-toast'

export default function RegisterPage() {
  const [form, setForm] = useState({ username:'', email:'', password:'' })
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  const submit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      await api.post('/register', form)
      toast.success('Аккаунт создан! Войдите.')
      navigate('/login')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Ошибка регистрации')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', background:'var(--bg-primary)', padding:'1rem'}}>
      <div style={{width:'100%', maxWidth:'360px'}}>
        <div style={{textAlign:'center', marginBottom:'2rem'}}>
          <h1 style={{fontSize:'1.5rem', fontWeight:800}}>Docs<span style={{color:'var(--accent)'}}>Storage</span></h1>
          <p style={{color:'var(--text-muted)', marginTop:'0.375rem', fontSize:'0.875rem'}}>Создайте аккаунт</p>
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
              <label className="form-label">Email</label>
              <input
                className="form-input"
                type="email"
                value={form.email}
                onChange={(e) => {
                  setForm((f) => ({ ...f, email: e.target.value }))
                }}
                required
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
                minLength={6}
              />
            </div>
            <button className="btn btn-primary btn-full" type="submit" disabled={loading}>
              {loading ? <span className="spinner"/> : null}{loading ? '' : 'Зарегистрироваться'}
            </button>
          </form>
          <div className="card-footer" style={{justifyContent:'center', fontSize:'0.8125rem', color:'var(--text-muted)'}}>
            Есть аккаунт?&nbsp;<Link to="/login" style={{color:'var(--accent)', textDecoration:'none', fontWeight:500}}>Войти</Link>
          </div>
        </div>
      </div>
    </div>
  )
}
