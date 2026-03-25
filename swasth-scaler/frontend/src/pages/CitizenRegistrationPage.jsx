import React, { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'

export default function CitizenRegistrationPage() {
  const navigate = useNavigate()
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    village: '',
    district: '',
    password: '',
    confirmPassword: ''
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match.')
      return
    }
    setLoading(true)
    setError('')
    try {
      // Create user in Supabase (mocking with email)
      const email = `${formData.phone}@citizen.com`
      const { error } = await supabase.auth.signUp({ 
        email, 
        password: formData.password,
        options: {
          data: {
            full_name: formData.name,
            village: formData.village,
            district: formData.district,
            role: 'citizen'
          }
        }
      })
      if (error) throw error
      alert('Registration successful! You can now log in.')
      navigate('/login/citizen')
    } catch (err) {
      setError(err.message || 'Registration failed.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ minHeight: '100dvh', background: 'var(--color-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
      <div className="card" style={{ width: '100%', maxWidth: '500px' }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <h1 style={{ color: 'var(--color-primary)', fontSize: '1.5rem', marginBottom: '0.5rem' }}>
            Citizen Registration / ନାଗରିକ ପଞ୍ଜିକରଣ
          </h1>
          <p className="text-muted">Create your account to access health services</p>
        </div>

        {error && <div className="alert alert-error">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Full Name / ପୂର୍ଣ୍ଣ ନାମ</label>
            <input name="name" className="form-input" value={formData.name} onChange={handleChange} required />
          </div>

          <div className="form-group">
            <label className="form-label">Mobile Number / ମୋବାଇଲ ନଂ</label>
            <div className="input-prefix-group">
              <span className="input-prefix">+91</span>
              <input name="phone" className="input-prefix-field" type="tel" value={formData.phone} onChange={handleChange} required />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="form-group">
              <label className="form-label">Village / ଗ୍ରାମ</label>
              <input name="village" className="form-input" value={formData.village} onChange={handleChange} required />
            </div>
            <div className="form-group">
              <label className="form-label">District / ଜିଲ୍ଲା</label>
              <input name="district" className="form-input" value={formData.district} onChange={handleChange} required />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Password / पासवर्ड</label>
            <input name="password" type="password" className="form-input" value={formData.password} onChange={handleChange} required />
          </div>

          <div className="form-group">
            <label className="form-label">Confirm Password / ନିଶ୍ଚିତ କରନ୍ତୁ</label>
            <input name="confirmPassword" type="password" className="form-input" value={formData.confirmPassword} onChange={handleChange} required />
          </div>

          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? 'Registering...' : 'Register / ପଞ୍ଜିକରଣ'}
          </button>
        </form>

        <div style={{ marginTop: '1.5rem', textAlign: 'center' }}>
          <Link to="/login/citizen" style={{ fontSize: '0.875rem' }}>Already have an account? Sign In</Link>
        </div>
      </div>
    </div>
  )
}
