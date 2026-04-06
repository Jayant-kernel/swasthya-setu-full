import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import LoginRoleModal from '../components/LoginRoleModal'

import img1 from '../images/hero1.jpg'
import img2 from '../images/hero2.jpg'

import pushkarAvatar from '../images/pushkar.jpg'
import jayantAvatar from '../images/jayant.png'
import vaibhavAvatar from '../images/vaibhav.png'

// Mock icons mapped to Lucide standard equivalents via raw SVG
const ArrowRight = () => <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5 12h14m-7-7 7 7-7 7" /></svg>
const PlayCircle = () => <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" /><path strokeLinejoin="round" d="m10 8 6 4-6 4z" /></svg>

export default function LandingPage() {
  const navigate = useNavigate()
  const [showLoginModal, setShowLoginModal] = useState(false)
  const [currentImageIndex, setCurrentImageIndex] = useState(0)

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
      <nav style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1.5rem 5%', maxWidth: 1600, margin: '0 auto', width: '100%', background: '#ffffff' }} className="landing-nav">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 800, fontSize: '1.5rem', color: '#111827', letterSpacing: '-0.02em' }}>
          Swasthya Setu
        </div>

        <div style={{ display: 'flex', gap: '2.5rem', fontSize: '0.9375rem', fontWeight: 600, color: '#4b5563' }} className="hide-mobile">
          <a href="#about" style={{ color: 'inherit', textDecoration: 'none', transition: 'color 0.2s' }} onMouseEnter={e => e.target.style.color = '#111827'} onMouseLeave={e => e.target.style.color = 'inherit'}>About Us</a>
          <a href="#goal" style={{ color: 'inherit', textDecoration: 'none', transition: 'color 0.2s' }} onMouseEnter={e => e.target.style.color = '#111827'} onMouseLeave={e => e.target.style.color = 'inherit'}>Services</a>
          <a href="#contact" style={{ color: 'inherit', textDecoration: 'none', transition: 'color 0.2s' }} onMouseEnter={e => e.target.style.color = '#111827'} onMouseLeave={e => e.target.style.color = 'inherit'}>Patient Resources</a>
          <a href="#contact" style={{ color: 'inherit', textDecoration: 'none', transition: 'color 0.2s' }} onMouseEnter={e => e.target.style.color = '#111827'} onMouseLeave={e => e.target.style.color = 'inherit'}>Contact Us</a>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <button onClick={() => setShowLoginModal(true)} className="landing-login-btn" style={{ padding: '0.625rem 1.5rem', borderRadius: 99, border: '1.5px solid var(--primary)', background: 'transparent', color: 'var(--primary)', fontWeight: 700, fontSize: '0.9375rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8, transition: 'all 0.2s' }} onMouseEnter={e => { e.currentTarget.style.background = 'var(--primary)'; e.currentTarget.style.color = '#fff' }} onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--primary)' }}>
            Log in
          </button>
        </div>
      </nav>

      {/* Hero Section */}
      <div style={{ background: '#f8fafc', width: '100%', position: 'relative', overflow: 'hidden' }} className="hero-section">
        <div style={{ maxWidth: 1600, margin: '0 auto', display: 'flex', alignItems: 'center', flexWrap: 'wrap', minHeight: '85vh' }}>

          {/* Left Content */}
          <div style={{ flex: '1 1 500px', padding: '4rem 5%', zIndex: 2 }} className="hero-left-content">
            {/* Trust Badge */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>
              <div style={{ display: 'flex' }}>
                <img src={pushkarAvatar} alt="patient" style={{ width: 40, height: 40, borderRadius: '50%', border: '2px solid #f8fafc', objectFit: 'cover', background: '#e2e8f0' }} />
                <img src={jayantAvatar} alt="patient" style={{ width: 40, height: 40, borderRadius: '50%', border: '2px solid #f8fafc', objectFit: 'cover', marginLeft: -12, background: '#e2e8f0' }} />
                <img src={vaibhavAvatar} alt="patient" style={{ width: 40, height: 40, borderRadius: '50%', border: '2px solid #f8fafc', objectFit: 'cover', marginLeft: -12, background: '#e2e8f0' }} />
                <div style={{ width: 40, height: 40, borderRadius: '50%', border: '2px solid #f8fafc', marginLeft: -12, background: '#e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', fontWeight: 700, color: '#64748b' }}>+</div>
              </div>
              <div style={{ fontWeight: 600, color: '#64748b', fontSize: '0.875rem', lineHeight: 1.3 }}>
                <span style={{ color: '#111827', fontWeight: 800, fontSize: '1rem' }}>10,000+</span><br />healthy patients
              </div>
            </div>

            <h1 className="hero-heading" style={{ fontWeight: 800, color: '#0f172a', lineHeight: 1.1, letterSpacing: '-0.03em', marginBottom: '2.5rem' }}>
              We are here to help<br />you stay healthy.
            </h1>

            <button onClick={() => setShowLoginModal(true)} className="hero-cta" style={{ padding: '1.25rem 2.5rem', borderRadius: 99, background: 'var(--primary)', color: '#fff', fontSize: '1.125rem', fontWeight: 700, border: 'none', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', transition: 'transform 0.2s', boxShadow: '0 12px 32px rgba(13, 148, 136, 0.25)' }} onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-2px)'} onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}>
              Make an appointment
            </button>

            {/* Bottom Stats */}
            <div style={{ display: 'flex', gap: '3rem', mt: '4rem', marginTop: '4rem', flexWrap: 'wrap' }}>
              <div>
                <div style={{ fontSize: '2.5rem', fontWeight: 800, color: '#0f172a', display: 'flex', alignItems: 'center', gap: 8, lineHeight: 1 }}>
                  4.9 <span style={{ color: '#f59e0b', fontSize: '1.75rem' }}>★</span>
                </div>
              </div>
              <div>
                <div style={{ fontSize: '2.5rem', fontWeight: 800, color: '#0f172a', lineHeight: 1, marginBottom: 4 }}>20+</div>
                <div style={{ color: '#64748b', fontSize: '0.9375rem', fontWeight: 600, lineHeight: 1.4 }}>years of successful<br />experience</div>
              </div>
            </div>
          </div>

          {/* Right Content - Full Bleed Image Fade */}
          <div style={{ flex: '1 1 500px', alignSelf: 'stretch', position: 'relative', minHeight: '600px' }} className="hero-image-pane">
            <div style={{ position: 'absolute', top: 0, bottom: 0, right: 0, left: 0, overflow: 'hidden', borderTopLeftRadius: 64, borderBottomLeftRadius: 64 }} className="hero-image-wrapper">
              {/* Only use the first two images in the 1-2 rotation */}
              {[img1, img2].map((src, i) => (
                <img
                  key={i}
                  src={src}
                  alt={`Care provider ${i + 1}`}
                  style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center', opacity: currentImageIndex % 2 === i ? 1 : 0, transition: 'opacity 1.5s ease-in-out' }}
                />
              ))}
            </div>
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
            <h2 style={{ fontSize: 'clamp(2rem, 6vw, 3.5rem)', fontWeight: 800, color: '#fff', letterSpacing: '-0.03em' }}>One service</h2>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(280px, 100%), 1fr))', gap: '1.5rem' }}>

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
            <h2 style={{ fontSize: 'clamp(1.75rem, 5vw, 3.5rem)', fontWeight: 800, color: 'var(--text-main)', letterSpacing: '-0.03em' }}>Meet the founders</h2>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(300px, 100%), 1fr))', gap: '2rem' }}>

            {/* Pushkar Kulkarni */}
            <div style={{ background: 'var(--surface)', borderRadius: 24, overflow: 'hidden', border: '1px solid var(--border)', display: 'flex', flexDirection: 'column', boxShadow: '0 20px 40px rgba(0,0,0,0.05)', transition: 'transform 0.3s ease' }} onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.02)'} onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}>
              <div style={{ height: 380, background: '#2d2d2d', position: 'relative' }}>
                <img src={pushkarAvatar} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="Pushkar Kulkarni" />
              </div>
              <div style={{ padding: '2rem 2.5rem', background: '#fff' }}>
                <h3 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#111827', marginBottom: 4 }}>Pushkar Kulkarni</h3>
                <p style={{ fontSize: '1rem', color: '#6b7280', fontWeight: 600, marginBottom: '1rem' }}>Team Lead and Main Coder</p>
                <p style={{ fontSize: '0.9375rem', color: '#4b5563', lineHeight: 1.6 }}>Architecting the scalable backend of Swasthya Setu, Pushkar leads the core development team, building the robust and secure infrastructure that guarantees uptime for remote healthcare centers.</p>
              </div>
              <div style={{ padding: '2rem 2.5rem', background: 'linear-gradient(135deg, #181124 0%, #2a1b38 100%)', color: '#e2e8f0', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                <p style={{ fontSize: '0.9375rem', lineHeight: 1.6, textAlign: 'center', marginBottom: '1.5rem', fontStyle: 'italic', color: '#f1f5f9' }}>
                  "Energy and persistence conquer all things. Well done is better than well said."
                </p>
                <p style={{ fontSize: '0.8125rem', color: '#94a3b8', textAlign: 'center', fontWeight: 600 }}>Benjamin Franklin</p>
              </div>
            </div>

            {/* Jayant Saxena */}
            <div style={{ background: 'var(--surface)', borderRadius: 24, overflow: 'hidden', border: '1px solid var(--border)', display: 'flex', flexDirection: 'column', boxShadow: '0 20px 40px rgba(0,0,0,0.05)', transition: 'transform 0.3s ease' }} onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.02)'} onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}>
              <div style={{ height: 380, background: '#2d2d2d', position: 'relative' }}>
                <img src={jayantAvatar} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="Jayant Saxena" />
              </div>
              <div style={{ padding: '2rem 2.5rem', background: '#fff' }}>
                <h3 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#111827', marginBottom: 4 }}>Jayant Saxena</h3>
                <p style={{ fontSize: '1rem', color: '#6b7280', fontWeight: 600, marginBottom: '1rem' }}>Frontend and UI/UX Dev</p>
                <p style={{ fontSize: '0.9375rem', color: '#4b5563', lineHeight: 1.6 }}>Driven by a vision to create intuitive user experiences, Jayant leads the frontend architecture. His aesthetic UI/UX designs make Swasthya Setu accessible to thousands of people across rural districts.</p>
              </div>
              <div style={{ padding: '2rem 2.5rem', background: 'linear-gradient(135deg, #12182b 0%, #1e293b 100%)', color: '#e2e8f0', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                <p style={{ fontSize: '0.9375rem', lineHeight: 1.6, textAlign: 'center', marginBottom: '1.5rem', fontStyle: 'italic', color: '#f1f5f9' }}>
                  "Everything that is really great and inspiring is created by individuals who can labor in freedom."
                </p>
                <p style={{ fontSize: '0.8125rem', color: '#94a3b8', textAlign: 'center', fontWeight: 600 }}>Albert Einstein</p>
              </div>
            </div>

            {/* Vaibhav Mishra */}
            <div style={{ background: 'var(--surface)', borderRadius: 24, overflow: 'hidden', border: '1px solid var(--border)', display: 'flex', flexDirection: 'column', boxShadow: '0 20px 40px rgba(0,0,0,0.05)', transition: 'transform 0.3s ease' }} onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.02)'} onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}>
              <div style={{ height: 380, background: '#2d2d2d', position: 'relative' }}>
                <img src={vaibhavAvatar} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="Vaibhav Mishra" />
              </div>
              <div style={{ padding: '2rem 2.5rem', background: '#fff' }}>
                <h3 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#111827', marginBottom: 4 }}>Vaibhav Mishra</h3>
                <p style={{ fontSize: '1rem', color: '#6b7280', fontWeight: 600, marginBottom: '1rem' }}>The calling and major citizen worker</p>
                <p style={{ fontSize: '0.9375rem', color: '#4b5563', lineHeight: 1.6 }}>Specializing in community outreach and ground-level engagement, Vaibhav champions the enablement of ASHA workers and manages direct citizen operations.</p>
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
        <div style={{ maxWidth: 1200, margin: '0 auto', display: 'flex', flexWrap: 'wrap', gap: '2.5rem' }}>
          <div style={{ flex: '1 1 280px' }}>
            <span style={{ display: 'inline-block', color: 'var(--primary)', fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase', marginBottom: '1rem' }}>Get in Touch</span>
            <h2 style={{ fontSize: 'clamp(1.75rem, 5vw, 3.5rem)', fontWeight: 800, color: 'var(--text-main)', letterSpacing: '-0.02em', marginBottom: '2rem', lineHeight: 1.1 }}>Let's build a healthier future together.</h2>
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

          <div style={{ flex: '1 1 300px', background: 'var(--bg)', padding: 'clamp(1.25rem, 4vw, 3.5rem)', borderRadius: 24, boxShadow: '0 24px 64px rgba(0,0,0,0.08)', border: '1px solid var(--border)' }}>
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

      {/* Login Role Modal */}
      {showLoginModal && (
        <LoginRoleModal onClose={() => setShowLoginModal(false)} />
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
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');

        .hero-heading { font-size: clamp(2rem, 8vw, 3.5rem); }
        .hero-sub { font-size: clamp(0.9375rem, 2.5vw, 1.125rem); }
        .hero-cta { padding: 0.875rem 1.75rem; font-size: clamp(0.9375rem, 2.5vw, 1.125rem); }

        @media (max-width: 900px) {
          .hide-mobile { display: none !important; }
        }

        @media (max-width: 768px) {
          .landing-nav { padding: 1rem 5% !important; }
          .hero-section { min-height: auto; }
          .hero-left-content { padding: 3rem 5% 4rem !important; }
          .hero-image-pane { min-height: 400px !important; }
          .hero-image-wrapper { border-radius: 0 !important; }
          
          /* Goal + about sections: tighter vertical padding */
          #goal { padding: 4rem 5% !important; }
          #about { padding: 4rem 5% !important; }
          #contact { padding: 4rem 5% !important; }

          /* Footer */
          footer { padding: 3rem 5% 2rem !important; }
        }

        @media (max-width: 480px) {
          .hero-heading { font-size: 2.5rem !important; letter-spacing: -0.02em !important; }
          #goal, #about, #contact { padding: 3rem 5% !important; }
        }
       `}</style>
    </div>
  )
}
