import React, { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'

export default function CitizenRegistrationPage() {
  const navigate = useNavigate()
  const [form, setForm] = useState({ name: '', phone: '', dob: '', gender: '', district: '' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const districts = ['Angul','Balangir','Balasore','Bargarh','Bhadrak','Boudh','Cuttack','Deogarh','Dhenkanal','Gajapati','Ganjam','Jagatsinghpur','Jajpur','Jharsuguda','Kalahandi','Kandhamal','Kendrapara','Kendujhar','Khordha','Koraput','Malkangiri','Mayurbhanj','Nabarangpur','Nayagarh','Nuapada','Puri','Rayagada','Sambalpur','Subarnapur','Sundargarh']

  function handleChange(e) { setForm(f => ({ ...f, [e.target.name]: e.target.value })) }

  function handleSubmit(e) {
    e.preventDefault()
    if (!form.name || !form.phone || !form.district) { setError('Please fill all required fields.'); return }
    if (form.phone.length < 10) { setError('Enter a valid 10-digit phone number.'); return }
    setError(''); setLoading(true)
    setTimeout(() => { localStorage.setItem('userRole', 'citizen'); navigate('/dashboard/citizen') }, 900)
  }

  return (
    <div style={{ minHeight: '100dvh', background: 'var(--color-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
      <div style={{ width: '100%', maxWidth: '480px', background: '#fff', borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-lg)', overflow: 'hidden' }}>
        <div style={{ background: 'linear-gradient(135deg, #1565C0 0%, #1976D2 100%)', padding: '1.75rem 2rem', textAlign: 'center' }}>
          <h1 style={{ color: '#fff', fontSize: '1.375rem' }}>Citizen Registration</h1>
          <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: '0.875rem', marginTop: '0.25rem' }}>ନାଗରିକ ପଞ୍ଜୀକରଣ</p>
        </div>
        <div style={{ padding: '2rem 1.5rem' }}>
          {error && <div className="alert alert-error"><span>⚠</span> {error}</div>}
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">Full Name * <span className="odia-label">ପୂର୍ଣ ନାମ</span></label>
              <input name="name" type="text" className="form-input" placeholder="Enter your full name" value={form.name} onChange={handleChange} required />
            </div>
            <div className="form-group">
              <label className="form-label">Mobile Number * <span className="odia-label">ମୋବାଇଲ ନମ୍ବର</span></label>
              <input name="phone" type="tel" className="form-input" placeholder="10-digit number" value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value.replace(/\D/g,'').slice(0,10) }))} required />
            </div>
            <div className="form-group">
              <label className="form-label">Date of Birth <span className="odia-label">ଜନ୍ମ ତାରିଖ</span></label>
              <input name="dob" type="date" className="form-input" value={form.dob} onChange={handleChange} />
            </div>
            <div className="form-group">
              <label className="form-label">Gender <span className="odia-label">ଲିଙ୍ଗ</span></label>
              <select name="gender" className="form-select" value={form.gender} onChange={handleChange}>
                <option value="">Select gender</option>
                <option value="male">Male / ପୁରୁଷ</option>
                <option value="female">Female / ମହିଳା</option>
                <option value="other">Other / ଅନ୍ୟ</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">District * <span className="odia-label">ଜିଲ୍ଲା</span></label>
              <select name="district" className="form-select" value={form.district} onChange={handleChange} required>
                <option value="">Select district</option>
                {districts.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>
            <button type="submit" className="btn btn-primary" disabled={loading} style={{ marginTop: '0.5rem' }}>
              {loading ? <><span className="spinner" /> Registering…</> : 'Register & Continue'}
            </button>
          </form>
          <div style={{ textAlign: 'center', marginTop: '1rem' }}>
            <Link to="/login/citizen" style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>Already registered? Sign In</Link>
          </div>
        </div>
      </div>
    </div>
  )
}
