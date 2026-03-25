import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { supabase } from '../lib/supabase'

import img1 from '../images/image_3.jpg'
import img2 from '../images/image_1.webp'
import img3 from '../images/image_2.jpg'

import loginImg1 from '../images/login/image.png'
import loginImg2 from '../images/login/image2.png'
import loginImg3 from '../images/login/image3.png'

// Mock icons mapped to Lucide standard equivalents via raw SVG
const ArrowRight = () => <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5 12h14m-7-7 7 7-7 7" /></svg>
const PlayCircle = () => <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" /><path strokeLinejoin="round" d="m10 8 6 4-6 4z" /></svg>

export default function LandingPage() {
  const navigate = useNavigate()
  const auth = useAuth()
  const [showLoginModal, setShowLoginModal] = useState(false)
  const [hoveredPanel, setHoveredPanel] = useState(null)
  const [selectedRole, setSelectedRole] = useState(null)
  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  const [authEmail, setAuthEmail] = useState('')
  const [authPassword, setAuthPassword] = useState('')
  const [authError, setAuthError] = useState('')
  const [authLoading, setAuthLoading] = useState(false)
  const [isSignUpMode, setIsSignUpMode] = useState(false)
  const [authInfo, setAuthInfo] = useState('')

  const heroImages = [img1, img2, img3]

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentImageIndex(prev => (prev + 1) % heroImages.length)
    }, 2800)
    return () => clearInterval(timer)
  }, [])

  const roles = [
    { id: 'asha', title: 'ASHA Worker', icon: '🏥', path: '/login/asha', bg: '#ecfdf5', color: '#059669' },
    { id: 'dmo', title: 'District Medical Officer', icon: '🏛️', path: '/login/dmo', bg: '#eff6ff', color: '#2563eb' },
    { id: 'citizen', title: 'Citizen / Patient', icon: '👤', path: '/login/citizen', bg: '#fef2f2', color: '#dc2626' }
  ]

  return (
    <div style={{ minHeight: '100dvh', background: 'var(--surface)', display: 'flex', flexDirection: 'column', fontFamily: "'Inter', 'Noto Sans', sans-serif" }}>

      {/* Navigation */}
      <nav style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1.25rem 4%', maxWidth: 1400, margin: '0 auto', width: '100%' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 800, fontSize: '1.35rem', color: 'var(--text-main)', letterSpacing: '-0.02em' }}>
          Swasthya Setu
        </div>

        <div style={{ display: 'flex', gap: '2.5rem', fontSize: '0.9375rem', fontWeight: 600, color: 'var(--text-muted)' }} className="hide-mobile">
          <a href="#goal" style={{ color: 'inherit', textDecoration: 'none' }}>Our Goal</a>

          <a href="#about" style={{ color: 'inherit', textDecoration: 'none' }}>About us</a>

          <a href="#about" style={{ color: 'inherit', textDecoration: 'none' }}>Contact us</a>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <button onClick={() => setShowLoginModal(true)} style={{ padding: '0.625rem 1.25rem', borderRadius: 99, border: '1.5px solid var(--border)', background: 'transparent', color: 'var(--text-main)', fontWeight: 600, fontSize: '0.9375rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, transition: 'all 0.2s' }}>
            <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4M10 17l5-5-5-5M15 12H3" /></svg>
            Log in
          </button>
        </div>
      </nav>

      {/* Hero Section */}
      <div style={{ padding: '1rem 4%', maxWidth: 1400, margin: '0 auto', width: '100%' }}>
        <div className="hero-gradient" style={{ borderRadius: 36, padding: '3rem 5%', display: 'flex', alignItems: 'center', gap: '2rem', position: 'relative', overflow: 'hidden' }}>

          <div style={{ flex: 1, zIndex: 2 }}>
            <h1 style={{ fontSize: 'clamp(2.5rem, 3.5vw, 3.5rem)', fontWeight: 800, color: 'var(--text-main)', lineHeight: 1.1, letterSpacing: '-0.03em', marginBottom: '1.5rem' }}>
              Empowering<br />Lives Through<br />Health
              <span style={{ display: 'inline-flex', gap: 8, alignItems: 'center', verticalAlign: 'middle', background: 'var(--surface)', borderRadius: 99, padding: '6px 14px', border: '1px solid var(--border)', marginLeft: 16 }}>
                <span style={{ fontSize: '1.5rem' }}>💊</span><span style={{ fontSize: '1.5rem' }}>🧬</span>
              </span>
            </h1>
            <p style={{ fontSize: '1.125rem', color: 'var(--text-muted)', lineHeight: 1.6, maxWidth: 440, marginBottom: '2.5rem' }}>
              Navigating Health Together: Your Trusted Rural Medical Resource network directly bridging communities and medical officers.
            </p>
            <button onClick={() => setShowLoginModal(true)} style={{ padding: '1rem 2rem', borderRadius: 99, background: 'var(--text-main)', color: 'var(--bg)', fontWeight: 700, fontSize: '1.125rem', border: 'none', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 10, transition: 'transform 0.2s' }} onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.05)'} onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}>
              Get started now <ArrowRight />
            </button>
          </div>

          <div style={{ flex: 1, display: 'flex', justifyContent: 'center', position: 'relative', minHeight: 320, transform: 'scale(0.96)', transformOrigin: 'right center' }} className="hide-mobile">
            {/* SVG Abstract Backdrop */}
            <div style={{ position: 'absolute', width: 440, height: 340, background: '#0099ffff', borderRadius: '40% 60% 70% 30% / 40% 50% 60% 50%', right: '5%', top: '50%', transform: 'translateY(-50%)', opacity: 0.7 }} />

            {/* Hero Image Slider replacing the mock geometry */}
            <div style={{ position: 'absolute', right: '12%', top: '10%', width: 340, height: 340, background: 'var(--surface)', borderRadius: 36, border: '6px solid var(--bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', boxShadow: '0 24px 64px rgba(0,0,0,0.12)' }}>
              {heroImages.map((src, i) => (
                <img
                  key={i}
                  src={src}
                  alt="Presentation frame"
                  style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'cover', opacity: currentImageIndex === i ? 1 : 0, transform: currentImageIndex === i ? 'scale(1.05)' : 'scale(1)', transition: 'all 0.8s cubic-bezier(0.4, 0, 0.2, 1)' }}
                />
              ))}
            </div>

            {/* Floating details */}
            <div style={{ position: 'absolute', top: '10%', left: '20%', color: '#3b82f6', fontSize: '2rem' }}>✦</div>
            <div style={{ position: 'absolute', bottom: '20%', left: '5%', color: 'var(--primary)', fontSize: '3rem' }}>✚</div>
            <div style={{ position: 'absolute', top: '40%', right: '2%', color: '#f59e0b', fontSize: '1.5rem' }}>✧</div>
          </div>
        </div>
      </div>

      {/* About Us (One Service) Section */}
      <div id="goal" style={{ padding: '8rem 4%', background: '#0b0914', position: 'relative', overflow: 'hidden' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', position: 'relative', zIndex: 2 }}>

          <div style={{ textAlign: 'center', marginBottom: '5rem' }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', padding: '8px 20px', borderRadius: 99, color: '#e2e8f0', fontSize: '0.9375rem', fontWeight: 600, marginBottom: '2rem', boxShadow: '0 4px 12px rgba(0,0,0,0.2)' }}>
              <span style={{ color: '#a855f7' }}>✦</span> What we offer
            </span>
            <h2 style={{ fontSize: '3.5rem', fontWeight: 800, color: '#fff', letterSpacing: '-0.03em' }}>One service</h2>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '2rem' }}>

            {/* Card 1 */}
            <div style={{ background: 'linear-gradient(180deg, #1f1b3d 0%, #15122b 100%)', borderRadius: 32, border: '1px solid rgba(255,255,255,0.06)', padding: '0 0 3.5rem 0', display: 'flex', flexDirection: 'column', position: 'relative', overflow: 'hidden', boxShadow: '0 24px 48px rgba(0,0,0,0.4)', transition: 'transform 0.3s ease' }} onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-8px)'} onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}>
              <div style={{ height: 240, position: 'relative', overflow: 'hidden', marginBottom: '1.5rem', borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                <div style={{ position: 'absolute', top: '-10%', left: '50%', transform: 'translateX(-50%)', width: 250, height: 250, background: 'radial-gradient(circle, rgba(168,85,247,0.25) 0%, rgba(0,0,0,0) 70%)' }} />
                <svg viewBox="0 0 200 100" style={{ width: '100%', height: '100%', fill: 'none' }}>
                  <polyline points="0,60 40,60 55,30 75,90 90,60 130,60 140,45 155,60 200,60" stroke="rgba(255,255,255,0.4)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  <polyline points="-10,60 30,60 45,30 65,90 80,60 120,60 130,45 145,60 190,60" stroke="rgba(255,255,255,0.08)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" transform="translate(10, -5)" />
                  <circle cx="75" cy="90" r="2.5" fill="#fff" filter="drop-shadow(0 0 6px #fff)" />
                  <circle cx="55" cy="30" r="2" fill="#fff" filter="drop-shadow(0 0 4px #fff)" />
                </svg>
              </div>
              <div style={{ padding: '0 2.5rem' }}>
                <h3 style={{ fontSize: '1.75rem', fontWeight: 700, color: '#f8fafc', marginBottom: '1rem', lineHeight: 1.2, letterSpacing: '-0.02em' }}>Delivering seamless<br />experiences</h3>
                <p style={{ color: '#94a3b8', fontSize: '1.0625rem', lineHeight: 1.6 }}>Make it easy and comfortable just for you.</p>
              </div>
            </div>

            {/* Card 2 */}
            <div style={{ background: 'linear-gradient(180deg, #1f1b3d 0%, #15122b 100%)', borderRadius: 32, border: '1px solid rgba(255,255,255,0.06)', padding: '0 0 3.5rem 0', display: 'flex', flexDirection: 'column', position: 'relative', overflow: 'hidden', boxShadow: '0 24px 48px rgba(0,0,0,0.4)', transition: 'transform 0.3s ease' }} onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-8px)'} onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}>
              <div style={{ height: 240, position: 'relative', overflow: 'hidden', marginBottom: '1.5rem', borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                <div style={{ position: 'absolute', bottom: '0', left: '50%', transform: 'translateX(-50%)', width: 200, height: 200, background: 'radial-gradient(circle, rgba(99,102,241,0.25) 0%, rgba(0,0,0,0) 70%)' }} />
                <svg viewBox="0 0 200 100" style={{ width: '100%', height: '100%', fill: 'none' }}>
                  <path d="M 20,20 Q 60,80 100,50 T 180,80" stroke="rgba(255,255,255,0.3)" strokeWidth="1.5" />
                  <path d="M 20,80 Q 60,20 100,50 T 180,20" stroke="rgba(255,255,255,0.15)" strokeWidth="1.5" />
                  <line x1="42" y1="36" x2="42" y2="64" stroke="rgba(255,255,255,0.2)" strokeWidth="1" />
                  <line x1="60" y1="50" x2="60" y2="50" stroke="rgba(255,255,255,0.2)" strokeWidth="1" />
                  <line x1="78" y1="36" x2="78" y2="64" stroke="rgba(255,255,255,0.2)" strokeWidth="1" />
                  <line x1="122" y1="64" x2="122" y2="36" stroke="rgba(255,255,255,0.2)" strokeWidth="1" />
                  <line x1="158" y1="64" x2="158" y2="36" stroke="rgba(255,255,255,0.2)" strokeWidth="1" />
                  <circle cx="100" cy="50" r="3" fill="#fff" filter="drop-shadow(0 0 6px #fff)" />
                  <circle cx="42" cy="36" r="1.5" fill="#fff" filter="drop-shadow(0 0 4px #fff)" />
                  <circle cx="158" cy="64" r="2" fill="#fff" filter="drop-shadow(0 0 5px #fff)" />
                </svg>
              </div>
              <div style={{ padding: '0 2.5rem' }}>
                <h3 style={{ fontSize: '1.75rem', fontWeight: 700, color: '#f8fafc', marginBottom: '1rem', lineHeight: 1.2, letterSpacing: '-0.02em' }}>Orchestrating<br />unified frameworks</h3>
                <p style={{ color: '#94a3b8', fontSize: '1.0625rem', lineHeight: 1.6 }}>Unifying people and Technology from all aspects and places.</p>
              </div>
            </div>

            {/* Card 3 */}
            <div style={{ background: 'linear-gradient(180deg, #1f1b3d 0%, #15122b 100%)', borderRadius: 32, border: '1px solid rgba(255,255,255,0.06)', padding: '0 0 3.5rem 0', display: 'flex', flexDirection: 'column', position: 'relative', overflow: 'hidden', boxShadow: '0 24px 48px rgba(0,0,0,0.4)', transition: 'transform 0.3s ease' }} onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-8px)'} onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}>
              <div style={{ height: 240, position: 'relative', overflow: 'hidden', marginBottom: '1.5rem', borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                <div style={{ position: 'absolute', top: '20%', right: '10%', width: 200, height: 200, background: 'radial-gradient(circle, rgba(236,72,153,0.2) 0%, rgba(0,0,0,0) 70%)' }} />
                <svg viewBox="0 0 200 100" style={{ width: '100%', height: '100%', fill: 'none' }}>
                  <circle cx="100" cy="50" r="25" stroke="rgba(255,255,255,0.25)" strokeWidth="1" strokeDasharray="4 4" />
                  <circle cx="100" cy="50" r="40" stroke="rgba(255,255,255,0.1)" strokeWidth="1" />
                  <path d="M 94,35 h 12 v 10 h 10 v 10 h -10 v 10 h -12 v -10 h -10 v -10 h 10 z" fill="#fff" filter="drop-shadow(0 0 8px #fff)" opacity="0.9" />
                  <circle cx="100" cy="10" r="2" fill="#fff" filter="drop-shadow(0 0 4px #fff)" />
                  <circle cx="100" cy="90" r="2" fill="#fff" filter="drop-shadow(0 0 4px #fff)" />
                  <circle cx="60" cy="50" r="1.5" fill="#fff" filter="drop-shadow(0 0 4px #fff)" />
                  <circle cx="140" cy="50" r="1.5" fill="#fff" filter="drop-shadow(0 0 4px #fff)" />
                </svg>
              </div>
              <div style={{ padding: '0 2.5rem' }}>
                <h3 style={{ fontSize: '1.75rem', fontWeight: 700, color: '#f8fafc', marginBottom: '1rem', lineHeight: 1.2, letterSpacing: '-0.02em' }}>Compounding<br />partnership gains</h3>
                <p style={{ color: '#94a3b8', fontSize: '1.0625rem', lineHeight: 1.6 }}>Do good for people. We serve with Heart to impact what matters most.</p>
              </div>
            </div>

          </div>
        </div>

        {/* Giant background glow */}
        <div style={{ position: 'absolute', top: '-10%', left: '50%', transform: 'translateX(-50%)', width: '100%', height: 600, background: 'radial-gradient(ellipse, rgba(168,85,247,0.1) 0%, rgba(0,0,0,0) 60%)', filter: 'blur(60px)', zIndex: 1, pointerEvents: 'none' }} />
      </div>

      {/* Contact Us / Founders Section */}
      <div id="about" style={{ padding: '8rem 4%', background: 'var(--bg)', position: 'relative' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>

          <div style={{ textAlign: 'center', marginBottom: '4rem' }}>
            <h2 style={{ fontSize: '3.5rem', fontWeight: 800, color: 'var(--text-main)', letterSpacing: '-0.03em' }}>Meet the founders</h2>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(450px, 1fr))', gap: '3rem' }}>

            {/* Person 1 */}
            <div style={{ background: 'var(--surface)', borderRadius: 24, overflow: 'hidden', border: '1px solid var(--border)', display: 'flex', flexDirection: 'column', boxShadow: '0 20px 40px rgba(0,0,0,0.05)', transition: 'transform 0.3s ease' }} onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.02)'} onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}>
              <div style={{ height: 380, background: '#2d2d2d', position: 'relative' }}>
                <img src="https://images.unsplash.com/photo-1560250097-0b93528c311a?w=600&h=800&fit=crop" style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="Om" />
              </div>
              <div style={{ padding: '2rem 2.5rem', background: '#fff' }}>
                <h3 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#111827', marginBottom: 4 }}>Om</h3>
                <p style={{ fontSize: '1rem', color: '#6b7280', fontWeight: 600, marginBottom: '1rem' }}>Founder | Vision & Experience</p>
                <p style={{ fontSize: '0.9375rem', color: '#4b5563', lineHeight: 1.6 }}>Driven by a vision to democratize access to quality healthcare across India, Om leads the strategic direction and overall user experience of the Swasthya Setu platform.</p>
              </div>
              <div style={{ padding: '2rem 2.5rem', background: 'linear-gradient(135deg, #181124 0%, #2a1b38 100%)', color: '#e2e8f0', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                <p style={{ fontSize: '0.9375rem', lineHeight: 1.6, textAlign: 'center', marginBottom: '1.5rem', fontStyle: 'italic', color: '#f1f5f9' }}>
                  "Energy and persistence conquer all things. Well done is better than well said."
                </p>
                <p style={{ fontSize: '0.8125rem', color: '#94a3b8', textAlign: 'center', fontWeight: 600 }}>Benjamin Franklin</p>
              </div>
            </div>

            {/* Person 2 */}
            <div style={{ background: 'var(--surface)', borderRadius: 24, overflow: 'hidden', border: '1px solid var(--border)', display: 'flex', flexDirection: 'column', boxShadow: '0 20px 40px rgba(0,0,0,0.05)', transition: 'transform 0.3s ease' }} onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.02)'} onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}>
              <div style={{ height: 380, background: '#2d2d2d', position: 'relative' }}>
                <img src="https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=600&h=800&fit=crop" style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="Dr. Sharma" />
              </div>
              <div style={{ padding: '2rem 2.5rem', background: '#fff' }}>
                <h3 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#111827', marginBottom: 4 }}>Dr. Sharma</h3>
                <p style={{ fontSize: '1rem', color: '#6b7280', fontWeight: 600, marginBottom: '1rem' }}>Co-Founder | Operations</p>
                <p style={{ fontSize: '0.9375rem', color: '#4b5563', lineHeight: 1.6 }}>Deploying decades of field medical experience, Dr. Sharma ensures our operational framework seamlessly integrates with existing government health structures.</p>
              </div>
              <div style={{ padding: '2rem 2.5rem', background: 'linear-gradient(135deg, #12182b 0%, #1e293b 100%)', color: '#e2e8f0', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                <p style={{ fontSize: '0.9375rem', lineHeight: 1.6, textAlign: 'center', marginBottom: '1.5rem', fontStyle: 'italic', color: '#f1f5f9' }}>
                  "Everything that is really great and inspiring is created by individuals who can labor in freedom."
                </p>
                <p style={{ fontSize: '0.8125rem', color: '#94a3b8', textAlign: 'center', fontWeight: 600 }}>Albert Einstein</p>
              </div>
            </div>

            {/* Person 3 */}
            <div style={{ background: 'var(--surface)', borderRadius: 24, overflow: 'hidden', border: '1px solid var(--border)', display: 'flex', flexDirection: 'column', boxShadow: '0 20px 40px rgba(0,0,0,0.05)', transition: 'transform 0.3s ease' }} onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.02)'} onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}>
              <div style={{ height: 380, background: '#2d2d2d', position: 'relative' }}>
                <img src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=600&h=800&fit=crop" style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="Jane Doe" />
              </div>
              <div style={{ padding: '2rem 2.5rem', background: '#fff' }}>
                <h3 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#111827', marginBottom: 4 }}>Jane Doe</h3>
                <p style={{ fontSize: '1rem', color: '#6b7280', fontWeight: 600, marginBottom: '1rem' }}>Co-Founder | Technology</p>
                <p style={{ fontSize: '0.9375rem', color: '#4b5563', lineHeight: 1.6 }}>Architecting the scalable backend of Swasthya Setu, Jane builds the distributed networks that guarantee uptime for remote healthcare centers.</p>
              </div>
              <div style={{ padding: '2rem 2.5rem', background: 'linear-gradient(135deg, #1f1122 0%, #3b1c34 100%)', color: '#e2e8f0', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                <p style={{ fontSize: '0.9375rem', lineHeight: 1.6, textAlign: 'center', marginBottom: '1.5rem', fontStyle: 'italic', color: '#f1f5f9' }}>
                  "Our prime purpose in this life is to help others. And if you can't help them, at least don't hurt them."
                </p>
                <p style={{ fontSize: '0.8125rem', color: '#94a3b8', textAlign: 'center', fontWeight: 600 }}>Dalai Lama</p>
              </div>
            </div>

            {/* Person 4 */}
            <div style={{ background: 'var(--surface)', borderRadius: 24, overflow: 'hidden', border: '1px solid var(--border)', display: 'flex', flexDirection: 'column', boxShadow: '0 20px 40px rgba(0,0,0,0.05)', transition: 'transform 0.3s ease' }} onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.02)'} onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}>
              <div style={{ height: 380, background: '#2d2d2d', position: 'relative' }}>
                <img src="https://images.unsplash.com/photo-1594824436998-eba83af00b8e?w=600&h=800&fit=crop" style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="Dr. Patil" />
              </div>
              <div style={{ padding: '2rem 2.5rem', background: '#fff' }}>
                <h3 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#111827', marginBottom: 4 }}>Dr. Patil</h3>
                <p style={{ fontSize: '1rem', color: '#6b7280', fontWeight: 600, marginBottom: '1rem' }}>Co-Founder | Community Health</p>
                <p style={{ fontSize: '0.9375rem', color: '#4b5563', lineHeight: 1.6 }}>Specializing in on-ground implementation, Dr. Patil champions the enablement of ASHA workers mapping out localized logistics for village care.</p>
              </div>
              <div style={{ padding: '2rem 2.5rem', background: 'linear-gradient(135deg, #0f1c2e 0%, #1e1b4b 100%)', color: '#e2e8f0', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                <p style={{ fontSize: '0.9375rem', lineHeight: 1.6, textAlign: 'center', marginBottom: '1.5rem', fontStyle: 'italic', color: '#f1f5f9' }}>
                  "The best way to find yourself is to lose yourself in the service of others."
                </p>
                <p style={{ fontSize: '0.8125rem', color: '#94a3b8', textAlign: 'center', fontWeight: 600 }}>Mahatma Gandhi</p>
              </div>
            </div>

          </div>
        </div>
      </div>

      {/* Contact Section */}
      <div id="contact" style={{ padding: '8rem 4%', background: 'var(--surface)', position: 'relative' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', display: 'flex', flexWrap: 'wrap', gap: '4rem' }}>
          <div style={{ flex: '1 1 400px' }}>
            <span style={{ display: 'inline-block', color: 'var(--primary)', fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase', marginBottom: '1rem' }}>Get in Touch</span>
            <h2 style={{ fontSize: '3.5rem', fontWeight: 800, color: 'var(--text-main)', letterSpacing: '-0.02em', marginBottom: '2rem', lineHeight: 1.1 }}>Let's build a healthier future together.</h2>
            <p style={{ fontSize: '1.125rem', color: 'var(--text-muted)', lineHeight: 1.6, marginBottom: '3rem' }}>Have questions about the Swasthya Setu platform? Want to deploy it in your district? Reach out to our team instantly.</p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <div style={{ width: 56, height: 56, borderRadius: 16, background: 'rgba(16,185,129,0.1)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" /></svg>
                </div>
                <div>
                  <p style={{ fontWeight: 600, color: 'var(--text-main)', marginBottom: 2 }}>Phone</p>
                  <p style={{ color: 'var(--text-muted)' }}>+91 1800-456-7890</p>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <div style={{ width: 56, height: 56, borderRadius: 16, background: 'rgba(16,185,129,0.1)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" /><polyline points="22,6 12,13 2,6" /></svg>
                </div>
                <div>
                  <p style={{ fontWeight: 600, color: 'var(--text-main)', marginBottom: 2 }}>Email</p>
                  <p style={{ color: 'var(--text-muted)' }}>support@swasthyasetu.in</p>
                </div>
              </div>
            </div>
          </div>

          <div style={{ flex: '1 1 500px', background: 'var(--bg)', padding: '3.5rem', borderRadius: 32, boxShadow: '0 24px 64px rgba(0,0,0,0.08)', border: '1px solid var(--border)' }}>
            <form style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }} onSubmit={e => e.preventDefault()}>
              <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap' }}>
                <div style={{ flex: '1 1 200px', display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <label style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-main)' }}>First Name</label>
                  <input type="text" placeholder="John" style={{ width: '100%', padding: '1.25rem', borderRadius: 16, border: '1px solid var(--border)', background: 'var(--surface)', outline: 'none', transition: 'border-color 0.2s', color: 'var(--text-main)' }} />
                </div>
                <div style={{ flex: '1 1 200px', display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <label style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-main)' }}>Last Name</label>
                  <input type="text" placeholder="Doe" style={{ width: '100%', padding: '1.25rem', borderRadius: 16, border: '1px solid var(--border)', background: 'var(--surface)', outline: 'none', transition: 'border-color 0.2s', color: 'var(--text-main)' }} />
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <label style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-main)' }}>Email Address</label>
                <input type="email" placeholder="john@example.com" style={{ width: '100%', padding: '1.25rem', borderRadius: 16, border: '1px solid var(--border)', background: 'var(--surface)', outline: 'none', transition: 'border-color 0.2s', color: 'var(--text-main)' }} />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <label style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-main)' }}>Message</label>
                <textarea placeholder="How can we help you?" rows="5" style={{ width: '100%', padding: '1.25rem', borderRadius: 16, border: '1px solid var(--border)', background: 'var(--surface)', outline: 'none', resize: 'vertical', transition: 'border-color 0.2s', color: 'var(--text-main)' }} />
              </div>
              <button style={{ background: 'linear-gradient(135deg, var(--primary) 0%, #0d9488 100%)', color: '#fff', border: 'none', padding: '1.25rem', borderRadius: 16, fontSize: '1rem', fontWeight: 700, cursor: 'pointer', marginTop: '1rem', boxShadow: '0 8px 16px rgba(16,185,129,0.2)', transition: 'transform 0.2s' }} onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-2px)'} onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}>
                Send Message
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer style={{ background: '#080c16', padding: '6rem 4% 3rem', color: '#94a3b8' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', display: 'flex', flexWrap: 'wrap', gap: '4rem', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '4rem', marginBottom: '3rem' }}>
          <div style={{ flex: '1 1 300px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: '1.5rem' }}>
              <div style={{ background: 'linear-gradient(135deg, #10b981 0%, #3b82f6 100%)', width: 32, height: 32, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <span style={{ color: '#fff', fontSize: '1.25rem' }}>✚</span>
              </div>
              <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#fff', letterSpacing: '-0.02em' }}>Swasthya Setu</h1>
            </div>
            <p style={{ lineHeight: 1.6, marginBottom: '2rem', maxWidth: 300 }}>Bridging the healthcare gap in rural India with intelligent digital infrastructure.</p>
            <div style={{ display: 'flex', gap: '1rem' }}>
              <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: 'background 0.2s' }} onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'} onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}>𝕏</div>
              <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: 'background 0.2s' }} onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'} onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}>I</div>
              <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: 'background 0.2s' }} onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'} onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}>F</div>
            </div>
          </div>

          <div style={{ flex: '1 1 150px' }}>
            <p style={{ fontWeight: 600, color: '#fff', marginBottom: '1.5rem', fontSize: '1.125rem' }}>Platform</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <a href="#" style={{ color: 'inherit', textDecoration: 'none', transition: 'color 0.2s' }} onMouseEnter={e => e.currentTarget.style.color = '#fff'} onMouseLeave={e => e.currentTarget.style.color = 'inherit'}>Citizens</a>
              <a href="#" style={{ color: 'inherit', textDecoration: 'none', transition: 'color 0.2s' }} onMouseEnter={e => e.currentTarget.style.color = '#fff'} onMouseLeave={e => e.currentTarget.style.color = 'inherit'}>ASHA Workers</a>
              <a href="#" style={{ color: 'inherit', textDecoration: 'none', transition: 'color 0.2s' }} onMouseEnter={e => e.currentTarget.style.color = '#fff'} onMouseLeave={e => e.currentTarget.style.color = 'inherit'}>Medical Officers</a>
              <a href="#" style={{ color: 'inherit', textDecoration: 'none', transition: 'color 0.2s' }} onMouseEnter={e => e.currentTarget.style.color = '#fff'} onMouseLeave={e => e.currentTarget.style.color = 'inherit'}>Admin Dashboard</a>
            </div>
          </div>

          <div style={{ flex: '1 1 150px' }}>
            <p style={{ fontWeight: 600, color: '#fff', marginBottom: '1.5rem', fontSize: '1.125rem' }}>Company</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <a href="#about" style={{ color: 'inherit', textDecoration: 'none', transition: 'color 0.2s' }} onMouseEnter={e => e.currentTarget.style.color = '#fff'} onMouseLeave={e => e.currentTarget.style.color = 'inherit'}>About Us</a>
              <a href="#goal" style={{ color: 'inherit', textDecoration: 'none', transition: 'color 0.2s' }} onMouseEnter={e => e.currentTarget.style.color = '#fff'} onMouseLeave={e => e.currentTarget.style.color = 'inherit'}>Our Service</a>
              <a href="#contact" style={{ color: 'inherit', textDecoration: 'none', transition: 'color 0.2s' }} onMouseEnter={e => e.currentTarget.style.color = '#fff'} onMouseLeave={e => e.currentTarget.style.color = 'inherit'}>Contact</a>
              <a href="#" style={{ color: 'inherit', textDecoration: 'none', transition: 'color 0.2s' }} onMouseEnter={e => e.currentTarget.style.color = '#fff'} onMouseLeave={e => e.currentTarget.style.color = 'inherit'}>Privacy Policy</a>
            </div>
          </div>
        </div>
        <div style={{ maxWidth: 1200, margin: '0 auto', display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem', fontSize: '0.875rem' }}>
          <p>© {new Date().getFullYear()} Swasthya Setu Platform. All rights reserved.</p>
          <p>Designed for Rural Health</p>
        </div>
      </footer>

      {/* Modals & Overlays */}
      {showLoginModal && (
        <div
          style={{ position: 'fixed', inset: 0, zIndex: 100, overflow: 'hidden' }}
          onClick={() => { setShowLoginModal(false); setSelectedRole(null); }}
        >
          {!selectedRole ? (
            /* ── Phase 1: Slanted Role Panels ── */
            <div style={{ display: 'flex', width: '100%', height: '100%' }} onClick={e => e.stopPropagation()}>

              {[
                {
                  id: 'asha',
                  title: 'ASHA Worker',
                  image: loginImg2,
                  desc: 'Track home visits, log patient data, and access community health protocols for your assigned village clusters.',
                  bg: 'linear-gradient(175deg, #2e6fa3 0%, #3a8cc9 60%, #4aaee0 100%)',
                  overlay: 'linear-gradient(to top, rgba(30,80,150,0.92) 0%, rgba(40,100,180,0.5) 60%, rgba(50,120,200,0.15) 100%)',
                  accent: '#7dd3fc',
                  path: '/home'
                },
                {
                  id: 'dmo',
                  title: 'District Officer',
                  image: loginImg3,
                  desc: 'Oversee district-wide health metrics, approve escalations, and coordinate response logistics from your control panel.',
                  bg: 'linear-gradient(175deg, #1a9cc4 0%, #29b8dc 60%, #3acfed 100%)',
                  overlay: 'linear-gradient(to top, rgba(10,100,150,0.92) 0%, rgba(15,130,180,0.5) 60%, rgba(20,160,210,0.15) 100%)',
                  accent: '#a5f3ff',
                  path: '/dashboard/dmo'
                },
                {
                  id: 'citizen',
                  title: 'Citizen',
                  image: loginImg1,
                  desc: 'Book appointments, check your health records, receive vaccination reminders, and connect with certified practitioners.',
                  bg: 'linear-gradient(175deg, #1db88a 0%, #28d4a0 60%, #3aebb8 100%)',
                  overlay: 'linear-gradient(to top, rgba(5,100,80,0.92) 0%, rgba(10,140,110,0.5) 60%, rgba(20,180,140,0.15) 100%)',
                  accent: '#6ee7c7',
                  path: '/dashboard/citizen'
                }
              ].map((panel, idx) => (
                <div
                  key={panel.id}
                  onMouseEnter={() => setHoveredPanel(panel.id)}
                  onMouseLeave={() => setHoveredPanel(null)}
                  onClick={() => setSelectedRole(panel)}
                  style={{
                    flex: hoveredPanel === panel.id ? '2.4' : '1',
                    background: panel.bg,
                    transition: 'flex 0.55s cubic-bezier(0.4, 0, 0.2, 1), transform 0.5s ease',
                    cursor: 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'flex-end',
                    /* skewX on the whole panel — tilts photo + color + everything */
                    transform: 'skewX(-12deg)',
                    marginLeft: idx === 0 ? '-5%' : '-6%',
                    marginRight: idx === 2 ? '-5%' : '0',
                    position: 'relative',
                    overflow: 'hidden',
                    animation: `panelSlideIn 0.8s cubic-bezier(0.23, 1, 0.32, 1) ${idx * 0.15}s backwards`,
                  }}
                >
                  {/* Full-bleed photo bg + gradient overlay */}
                  {/* Counter-skew the image so it fills without warping visually */}
                  <img src={panel.image} alt={panel.title} style={{ position: 'absolute', inset: '-5% -8%', width: '116%', height: '116%', objectFit: 'cover', opacity: 0.45, transform: 'skewX(12deg)', transformOrigin: 'center', transition: 'opacity 0.5s ease' }} />
                  <div style={{ position: 'absolute', inset: 0, background: panel.overlay }} />

                  {/* Close button - first panel only */}
                  {idx === 0 && (
                    <button onClick={e => { e.stopPropagation(); setShowLoginModal(false); setSelectedRole(null); }} style={{ position: 'absolute', top: '2rem', left: '3.5rem', zIndex: 10, width: 40, height: 40, borderRadius: '50%', background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.3)', color: '#fff', fontSize: '1.1rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(4px)', transform: 'skewX(12deg)' }}>✕</button>
                  )}

                  {/* Glow blob */}
                  <div style={{ position: 'absolute', top: '-20%', right: '-20%', width: '60%', height: '60%', borderRadius: '50%', background: `radial-gradient(circle, ${panel.accent}44 0%, transparent 70%)`, pointerEvents: 'none' }} />

                  {/* Counter-skew the content so text is perfectly upright */}
                  <div style={{ position: 'relative', zIndex: 2, transform: 'skewX(12deg)', padding: '0 1rem 4rem', paddingLeft: idx === 0 ? '7rem' : '2rem' }}>
                    <h2 style={{ fontSize: 'clamp(1.5rem, 2.5vw, 2.25rem)', fontWeight: 800, color: '#fff', letterSpacing: '-0.02em', marginBottom: '1.25rem', lineHeight: 1.1, textShadow: '0 2px 12px rgba(0,0,0,0.5)' }}>{panel.title}</h2>
                    <p style={{ color: 'rgba(255,255,255,0.88)', fontSize: '1rem', lineHeight: 1.6, maxWidth: 280, opacity: hoveredPanel === panel.id ? 1 : 0, transform: hoveredPanel === panel.id ? 'translateY(0)' : 'translateY(12px)', transition: 'all 0.4s ease', marginBottom: '2rem' }}>{panel.desc}</p>
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 10, background: panel.accent, color: '#0f1a2e', padding: '0.875rem 1.75rem', borderRadius: 99, fontWeight: 700, fontSize: '1rem', opacity: hoveredPanel === panel.id ? 1 : 0, transform: hoveredPanel === panel.id ? 'translateY(0)' : 'translateY(12px)', transition: 'all 0.45s ease', width: 'fit-content', whiteSpace: 'nowrap' }}>
                      Sign in as {panel.title} <span style={{ marginLeft: 4 }}>→</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            /* ── Phase 2: Full-screen Credential Form ── */
            <div
              style={{ position: 'fixed', inset: 0, display: 'flex' }}
              onClick={() => { setShowLoginModal(false); setSelectedRole(null); }}
            >
              {/* Left panel — colored brand side */}
              <div style={{ flex: '1 1 55%', background: selectedRole ? selectedRole.bg : '#0b0f1e', position: 'relative', overflow: 'hidden', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', padding: '5rem' }}>
                <img src={selectedRole?.image} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', opacity: 0.35 }} />
                <div style={{ position: 'absolute', inset: 0, background: selectedRole ? selectedRole.overlay : 'rgba(0,0,0,0.7)' }} />
                <div style={{ position: 'relative', zIndex: 2 }}>
                  <div style={{ display: 'inline-block', background: 'rgba(255,255,255,0.12)', backdropFilter: 'blur(8px)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: 99, padding: '0.5rem 1.25rem', fontSize: '0.875rem', fontWeight: 600, color: '#fff', marginBottom: '2rem' }}>{selectedRole?.title} Portal</div>
                  <h2 style={{ fontSize: 'clamp(2.5rem, 5vw, 4.5rem)', fontWeight: 900, color: '#fff', letterSpacing: '-0.04em', lineHeight: 1, marginBottom: '1.5rem' }}>Welcome<br />Back.</h2>
                  <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '1.125rem', lineHeight: 1.6, maxWidth: 400 }}>{selectedRole?.desc}</p>
                </div>
              </div>

              {/* Right panel — form */}
              <div style={{ flex: '1 1 45%', background: '#fff', display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '1.5rem 6rem 5rem', position: 'relative' }} onClick={e => e.stopPropagation()}>
                <button onClick={() => setSelectedRole(null)} style={{ position: 'absolute', top: '1.5rem', left: '2.5rem', background: '#f3f4f6', border: 'none', borderRadius: 99, padding: '0.625rem 1.25rem', fontSize: '0.875rem', fontWeight: 600, cursor: 'pointer', color: '#374151', display: 'flex', alignItems: 'center', gap: 6, zIndex: 10 }}>← Back</button>
                <button onClick={() => { setShowLoginModal(false); setSelectedRole(null); }} style={{ position: 'absolute', top: '1.5rem', right: '2.5rem', background: '#f3f4f6', border: 'none', borderRadius: '50%', width: 40, height: 40, fontSize: '1rem', cursor: 'pointer', color: '#374151', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10 }}>✕</button>

                <div style={{ marginBottom: '2.5rem', marginTop: '3rem' }}>
                  <h1 style={{ fontSize: 'clamp(1.75rem, 3.5vw, 2.5rem)', fontWeight: 900, color: '#111827', letterSpacing: '-0.04em', lineHeight: 1.1, marginBottom: '0.75rem' }}>
                    {isSignUpMode ? 'Create Your\nAccount' : 'Login to Your\nAccount'}
                  </h1>
                </div>

                <form style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }} onSubmit={async e => {
                  e.preventDefault();
                  setAuthError('');
                  setAuthInfo('');
                  setAuthLoading(true);
                  try {
                    if (isSignUpMode) {
                      const { error } = await supabase.auth.signUp({ email: authEmail, password: authPassword });
                      if (error) throw error;
                      setAuthInfo('Account created! Please check your email to confirm, then sign in.');
                      setIsSignUpMode(false);
                    } else {
                      await auth.login(authEmail, authPassword, selectedRole.id);
                      navigate(selectedRole.path);
                    }
                  } catch (err) {
                    setAuthError(err.message);
                  } finally {
                    setAuthLoading(false);
                  }
                }}>
                  {authError && (
                    <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 12, padding: '0.875rem 1.25rem', color: '#dc2626', fontSize: '0.9375rem', fontWeight: 500 }}>{authError}</div>
                  )}
                  {authInfo && (
                    <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 12, padding: '0.875rem 1.25rem', color: '#166534', fontSize: '0.9375rem', fontWeight: 500 }}>{authInfo}</div>
                  )}
                  <input
                    type="email"
                    placeholder="Email Address"
                    value={authEmail}
                    onChange={e => setAuthEmail(e.target.value)}
                    required
                    style={{ width: '100%', padding: '1.25rem 1.75rem', borderRadius: 99, border: '1.5px solid #e5e7eb', outline: 'none', fontSize: '1.0625rem', color: '#111827', background: '#fafafa', boxSizing: 'border-box' }}
                  />
                  <input
                    type="password"
                    placeholder="Password"
                    value={authPassword}
                    onChange={e => setAuthPassword(e.target.value)}
                    required
                    style={{ width: '100%', padding: '1.25rem 1.75rem', borderRadius: 99, border: '1.5px solid #e5e7eb', outline: 'none', fontSize: '1.0625rem', color: '#111827', background: '#fafafa', boxSizing: 'border-box' }}
                  />
                  <button type="submit" disabled={authLoading} style={{ width: '100%', padding: '1.25rem', borderRadius: 99, background: authLoading ? '#6b7280' : '#111827', color: '#fff', border: 'none', fontSize: '1.0625rem', fontWeight: 700, cursor: authLoading ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '0.75rem', transition: 'background 0.2s' }}>
                    <span>{authLoading ? (isSignUpMode ? 'Creating Account…' : 'Signing in…') : (isSignUpMode ? 'Create Account' : 'Login to Your Account')}</span>
                    <span style={{ background: '#fff', color: '#111827', borderRadius: '50%', width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{authLoading ? '…' : '→'}</span>
                  </button>

                  {/* Divider */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', margin: '0.5rem 0' }}>
                    <div style={{ flex: 1, height: 1, background: '#e5e7eb' }} />
                    <span style={{ color: '#9ca3af', fontSize: '0.875rem', whiteSpace: 'nowrap' }}>or continue with</span>
                    <div style={{ flex: 1, height: 1, background: '#e5e7eb' }} />
                  </div>

                  {/* OAuth Buttons */}
                  <div style={{ display: 'flex', gap: '1rem' }}>
                    <button
                      type="button"
                      onClick={async () => {
                        localStorage.setItem('userRole', selectedRole.id);
                        await supabase.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: `${window.location.origin}${selectedRole.path}` } });
                      }}
                      style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.625rem', padding: '0.875rem', borderRadius: 99, border: '1.5px solid #e5e7eb', background: '#fff', color: '#374151', fontWeight: 600, fontSize: '0.9375rem', cursor: 'pointer', transition: 'border-color 0.2s, box-shadow 0.2s' }}
                      onMouseEnter={e => { e.currentTarget.style.borderColor = '#d1d5db'; e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.08)'; }}
                      onMouseLeave={e => { e.currentTarget.style.borderColor = '#e5e7eb'; e.currentTarget.style.boxShadow = 'none'; }}
                    >
                      {/* Google G logo */}
                      <svg width="18" height="18" viewBox="0 0 48 48"><path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" /><path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" /><path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" /><path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" /></svg>
                      Google
                    </button>
                    <button
                      type="button"
                      onClick={async () => {
                        localStorage.setItem('userRole', selectedRole.id);
                        await supabase.auth.signInWithOAuth({ provider: 'apple', options: { redirectTo: `${window.location.origin}${selectedRole.path}` } });
                      }}
                      style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.625rem', padding: '0.875rem', borderRadius: 99, border: '1.5px solid #e5e7eb', background: '#fff', color: '#374151', fontWeight: 600, fontSize: '0.9375rem', cursor: 'pointer', transition: 'border-color 0.2s, box-shadow 0.2s' }}
                      onMouseEnter={e => { e.currentTarget.style.borderColor = '#d1d5db'; e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.08)'; }}
                      onMouseLeave={e => { e.currentTarget.style.borderColor = '#e5e7eb'; e.currentTarget.style.boxShadow = 'none'; }}
                    >
                      {/* Apple logo */}
                      <svg width="18" height="18" viewBox="0 0 814 1000"><path d="M788.1 340.9c-5.8 4.5-108.2 62.2-108.2 190.5 0 148.4 130.3 200.9 134.2 202.2-.6 3.2-20.7 71.9-68.7 141.9-42.8 61.6-87.5 123.1-155.5 123.1s-85.5-39.5-164-39.5c-76 0-103.7 40.8-165.9 40.8s-105-57.8-155.5-127.4C46 790.8 0 663 0 541.8c0-207.7 134.7-317.7 266.9-317.7 99.1 0 160.1 65.5 214.1 65.5 51.7 0 122.7-68.8 232.2-68.8 37.9 0 137.1 3.2 210.2 84.9zm-246.7-161.7c43.3-51.8 74.6-124.1 74.6-196.3 0-9.6-.6-19.3-2.6-28.3-69.3 2.6-152.4 48.3-202.1 107.3-37.9 43.8-74.6 116.1-74.6 189.6 0 10.3.6 20.7 3.2 29.6 6.5.5 13 1.3 20.1 1.3 61.3 0 138.3-41.5 181.4-103.2z" /></svg>
                      Apple
                    </button>
                  </div>
                </form>

                {selectedRole.id !== 'dmo' && (
                  <p style={{ textAlign: 'center', marginTop: '2.5rem', color: '#6b7280', fontSize: '0.9375rem' }}>
                    {isSignUpMode ? 'Already have an account?' : "Don't have an account?"}{' '}
                    <span
                      onClick={() => { setIsSignUpMode(!isSignUpMode); setAuthError(''); setAuthInfo(''); }}
                      style={{ color: '#111827', fontWeight: 700, cursor: 'pointer', textDecoration: 'underline' }}
                    >
                      {isSignUpMode ? 'Sign in here' : 'Sign up here'}
                    </span>
                  </p>
                )}

                <p style={{ textAlign: 'center', marginTop: '2.5rem', color: '#9ca3af', fontSize: '0.9375rem', cursor: 'pointer' }}>Forgot Passcode?</p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Global Embedded Styles */}
      <style>{`
        :root {
          --hero-g1: #e0f2fe;
          --hero-g2: #dcfce3;
        }
        [data-theme='dark'] {
          --hero-g1: #020b1e;
          --hero-g2: #02241e;
        }
        .hero-gradient {
          background: linear-gradient(270deg, var(--hero-g1), var(--hero-g2), var(--hero-g1));
          background-size: 200% 200%;
          animation: heroGradientPulse 15s ease infinite;
        }
        @keyframes heroGradientPulse {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        @keyframes panelSlideIn {
          from { transform: translateX(100vw) skewX(-12deg); opacity: 0; }
          to { transform: translateX(0) skewX(-12deg); opacity: 1; }
        }
        @media (max-width: 900px) {
          .hide-mobile { display: none !important; }
        }
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');
       `}</style>
    </div>
  )
}
