import React from 'react'
import { useNavigate } from 'react-router-dom'
import LogoIcon from '../../components/common/LogoIcon.jsx'
import HeroSlider from '../../components/landing/HeroSlider.jsx'

const marqueeItems = [
  { text: 'Health is not a privilege — it reaches every door', lang: 'en' },
  { text: 'ଘରେ ଘରେ ସ୍ୱାସ୍ଥ୍ୟ, ଗ୍ରାମ ଗ୍ରାମ ଆଶା', lang: 'or' },
  { text: 'Your ASHA worker is closer than the nearest hospital', lang: 'en' },
  { text: 'ଆମ ଗ୍ରାମ, ଆମ ଦାୟିତ୍ୱ — ସ୍ୱାସ୍ଥ୍ୟ ଆମ ଅଧିକାର', lang: 'or' },
  { text: 'No village too far, no family left behind', lang: 'en' }
]

export default function RoleSelectionPage() {
  const navigate = useNavigate()

  const roles = [
    {
      id: 'asha',
      title: 'ASHA Worker',
      titleOdia: 'ଆଶା କର୍ମୀ',
      icon: '🏥',
      path: '/login/asha',
      color: '#0F6E56'
    },
    {
      id: 'dmo',
      title: 'District Medical Officer',
      titleOdia: 'ଜିଲ୍ଲା ଚିକିତ୍ସା ଅଧିକାରୀ',
      icon: '🏛️',
      path: '/login/dmo',
      color: '#0a5040'
    },
  ]

  return (
    <div style={{
      minHeight: '100dvh',
      background: 'var(--color-bg)',
      display: 'flex',
      flexDirection: 'column',
      padding: '0 0 4rem 0',
      overflowX: 'hidden'
    }}>
      {/* Header */}
      <div style={{ textAlign: 'center', padding: '3rem 1rem 2rem' }}>
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1.5rem' }}>
          <LogoIcon />
        </div>
        <h1 style={{ color: 'var(--color-primary)', fontSize: '2.5rem', fontWeight: 800, marginBottom: '0.5rem' }}>
          Swasthya Setu
        </h1>
        <div style={{ color: 'var(--color-text-muted)', fontSize: '1.5rem', fontWeight: 600, marginBottom: '1rem' }}>
          ଆରୋଗ୍ୟ ସେତୁ
        </div>
      </div>

      {/* Marquee Ticker */}
      <div style={{
        width: '100%',
        background: 'var(--color-primary)',
        padding: '0.75rem 0',
        overflow: 'hidden',
        whiteSpace: 'nowrap',
        marginBottom: '2rem',
        borderTop: '1px solid rgba(255,255,255,0.1)',
        borderBottom: '1px solid rgba(255,255,255,0.1)'
      }}>
        <div style={{
          display: 'inline-block',
          animation: 'marquee 30s linear infinite'
        }}>
          {[...marqueeItems, ...marqueeItems].map((item, i) => (
            <span key={i} style={{
              color: 'white',
              fontSize: '1rem',
              fontWeight: 500,
              paddingRight: '3rem',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}>
              <span style={{ color: '#ff6b6b' }}>✚</span>
              {item.text}
            </span>
          ))}
        </div>
      </div>

      <HeroSlider />

      <div style={{ textAlign: 'center', marginBottom: '2rem', padding: '0 1rem' }}>
         <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--color-text)' }}>
          Select your role / ଆପଣଙ୍କ ଭୂମିକା ବାଛନ୍ତୁ
        </h2>
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
        gap: '1.5rem',
        width: '100%',
        maxWidth: '1000px',
        padding: '0 1rem',
        margin: '0 auto'
      }}>
        {roles.map(role => (
          <button
            key={role.id}
            onClick={() => navigate(role.path)}
            style={{
              background: 'var(--color-white)',
              borderRadius: 'var(--radius-lg)',
              padding: '2.5rem 2rem',
              boxShadow: 'var(--shadow-md)',
              border: '2px solid transparent',
              transition: 'all 0.2s ease',
              textAlign: 'center',
              cursor: 'pointer',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '1rem'
            }}
            onMouseEnter={e => {
              e.currentTarget.style.transform = 'translateY(-5px)'
              e.currentTarget.style.borderColor = 'var(--color-primary)'
              e.currentTarget.style.boxShadow = 'var(--shadow-lg)'
            }}
            onMouseLeave={e => {
              e.currentTarget.style.transform = 'translateY(0)'
              e.currentTarget.style.borderColor = 'transparent'
              e.currentTarget.style.boxShadow = 'var(--shadow-md)'
            }}
          >
            <span style={{ fontSize: '3rem', marginBottom: '0.5rem' }}>{role.icon}</span>
            <div>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--color-text)', marginBottom: '0.25rem' }}>
                {role.title}
              </h2>
              <div style={{ fontSize: '1.125rem', color: 'var(--color-primary)', fontWeight: 600 }}>
                {role.titleOdia}
              </div>
            </div>
          </button>
        ))}
      </div>

      <style>{`
        @keyframes marquee {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
      `}</style>
    </div>
  )
}
