import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

const heroSlides = [
  { src: '/images/hero1.webp', alt: 'ASHA worker with children' },
  { src: '/images/hero2.jpg',  alt: 'ASHA worker outreach' },
  { src: '/images/hero3.jpg',  alt: 'Doctor with patient' },
  { src: '/images/hero4.jpg',  alt: 'Nurse with patient' },
  { src: '/images/hero5.webp', alt: 'Sign language technology' },
]

const marqueeItems = [
  { text: 'Health is not a privilege — it reaches every door' },
  { text: 'ଘରେ ଘରେ ସ୍ୱାସ୍ଥ୍ୟ, ଗ୍ରାମ ଗ୍ରାମ ଆଶା' },
  { text: 'Your ASHA worker is closer than the nearest hospital' },
  { text: 'ଆମ ଗ୍ରାମ, ଆମ ଦାୟିତ୍ୱ — ସ୍ୱାସ୍ଥ୍ୟ ଆମ ଅଧିକାର' },
  { text: 'No village too far, no family left behind' },
]

function LogoIcon() {
  return (
    <svg width="64" height="64" viewBox="0 0 52 52" fill="none" aria-hidden="true">
      <rect width="52" height="52" rx="14" fill="var(--color-primary)" />
      <path d="M10 26h6l4-8 6 16 4-12 3 6h9" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function HeroSlider() {
  const [current, setCurrent] = useState(0)
  const [fading, setFading] = useState(false)

  useEffect(() => {
    const timer = setInterval(() => {
      setFading(true)
      setTimeout(() => { setCurrent(c => (c + 1) % heroSlides.length); setFading(false) }, 400)
    }, 3800)
    return () => clearInterval(timer)
  }, [])

  function goTo(idx) {
    setFading(true)
    setTimeout(() => { setCurrent(idx); setFading(false) }, 400)
  }

  return (
    <div style={{ width: '100%', position: 'relative', marginBottom: '2.5rem', overflow: 'hidden' }}>
      <div style={{ width: '100%', height: 420, position: 'relative', background: '#000' }}>
        <img
          src={heroSlides[current].src}
          alt={heroSlides[current].alt}
          style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: fading ? 0 : 1, transition: 'opacity 0.4s ease', display: 'block' }}
        />
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.45) 0%, transparent 60%)', pointerEvents: 'none' }} />
        <button onClick={() => goTo((current - 1 + heroSlides.length) % heroSlides.length)}
          style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', background: 'rgba(0,0,0,0.4)', border: 'none', borderRadius: '50%', width: 40, height: 40, color: '#fff', fontSize: '1.25rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          aria-label="Previous">‹</button>
        <button onClick={() => goTo((current + 1) % heroSlides.length)}
          style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'rgba(0,0,0,0.4)', border: 'none', borderRadius: '50%', width: 40, height: 40, color: '#fff', fontSize: '1.25rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          aria-label="Next">›</button>
        <div style={{ position: 'absolute', bottom: 14, left: '50%', transform: 'translateX(-50%)', display: 'flex', gap: '0.4rem' }}>
          {heroSlides.map((_, i) => (
            <button key={i} onClick={() => goTo(i)}
              style={{ width: i === current ? 20 : 8, height: 8, borderRadius: 999, background: i === current ? '#fff' : 'rgba(255,255,255,0.45)', border: 'none', cursor: 'pointer', padding: 0, transition: 'width 0.3s ease' }}
              aria-label={`Slide ${i + 1}`} />
          ))}
        </div>
        <div style={{ position: 'absolute', top: 12, right: 16, background: 'rgba(0,0,0,0.45)', color: '#fff', fontSize: '0.75rem', fontWeight: 600, padding: '0.25rem 0.625rem', borderRadius: 999 }}>
          {current + 1} / {heroSlides.length}
        </div>
      </div>
    </div>
  )
}

export default function RoleSelectionPage() {
  const navigate = useNavigate()

  const roles = [
    { id: 'asha', title: 'ASHA Worker', titleOdia: 'ଆଶା କର୍ମୀ', icon: '🏥', path: '/login/asha' },
    { id: 'dmo', title: 'District Medical Officer', titleOdia: 'ଜିଲ୍ଲା ଚିକିତ୍ସା ଅଧିକାରୀ', icon: '🏛️', path: '/login/dmo' },
    { id: 'citizen', title: 'Citizen', titleOdia: 'ନାଗରିକ', icon: '👤', path: '/login/citizen' },
  ]

  return (
    <div style={{ minHeight: '100dvh', background: 'var(--color-bg)', display: 'flex', flexDirection: 'column', alignItems: 'stretch', overflowX: 'hidden' }}>

      {/* Header */}
      <div style={{ textAlign: 'center', padding: '3rem 1rem 2rem' }}>
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1.5rem' }}><LogoIcon /></div>
        <h1 style={{ color: 'var(--color-primary)', fontSize: '2.5rem', fontWeight: 800, marginBottom: '0.5rem' }}>Swasthya Setu</h1>
        <div style={{ fontFamily: "'Noto Sans Oriya', sans-serif", color: 'var(--color-text-muted)', fontSize: '1.5rem', fontWeight: 600 }}>ସ୍ୱାସ୍ଥ୍ୟ ସେତୁ</div>
      </div>

      {/* Marquee ticker */}
      <div style={{ width: '100%', background: 'var(--color-primary)', padding: '0.75rem 0', overflow: 'hidden', whiteSpace: 'nowrap', marginBottom: '2rem', borderTop: '1px solid rgba(255,255,255,0.1)', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
        <div style={{ display: 'inline-block', animation: 'marquee 30s linear infinite' }}>
          {[...marqueeItems, ...marqueeItems].map((item, i) => (
            <span key={i} style={{ color: 'white', fontSize: '1rem', fontWeight: 500, paddingRight: '3rem', display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{ color: '#ff6b6b' }}>✚</span>{item.text}
            </span>
          ))}
        </div>
      </div>

      {/* Hero slider */}
      <HeroSlider />

      {/* Role selection heading */}
      <div style={{ textAlign: 'center', marginBottom: '2rem', padding: '0 1rem' }}>
        <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--color-text)' }}>
          Select your role / ଆପଣଙ୍କ ଭୂମିକା ବାଛନ୍ତୁ
        </h2>
      </div>

      {/* Role cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem', width: '100%', maxWidth: '1000px', padding: '0 1rem', margin: '0 auto', paddingBottom: '4rem' }}>
        {roles.map(role => (
          <button key={role.id} onClick={() => navigate(role.path)}
            style={{ background: 'var(--color-white)', borderRadius: 'var(--radius-lg)', padding: '2.5rem 2rem', boxShadow: 'var(--shadow-md)', border: '2px solid transparent', transition: 'all 0.2s ease', textAlign: 'center', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}
            onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-5px)'; e.currentTarget.style.borderColor = 'var(--color-primary)'; e.currentTarget.style.boxShadow = 'var(--shadow-lg)' }}
            onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.borderColor = 'transparent'; e.currentTarget.style.boxShadow = 'var(--shadow-md)' }}
          >
            <span style={{ fontSize: '3rem', marginBottom: '0.5rem' }}>{role.icon}</span>
            <div>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--color-text)', marginBottom: '0.25rem' }}>{role.title}</h2>
              <div style={{ fontFamily: "'Noto Sans Oriya', sans-serif", fontSize: '1.125rem', color: 'var(--color-primary)', fontWeight: 600 }}>{role.titleOdia}</div>
            </div>
          </button>
        ))}
      </div>

      <style>{`@keyframes marquee { 0% { transform: translateX(0); } 100% { transform: translateX(-50%); } }`}</style>
    </div>
  )
}
