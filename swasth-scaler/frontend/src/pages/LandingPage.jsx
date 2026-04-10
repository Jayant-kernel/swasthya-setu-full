import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import LoginRoleModal from '../components/LoginRoleModal'

import img1 from '../images/landing/hero1.jpg'
import img2 from '../images/landing/hero2.jpg'

import pushkarAvatar from '../images/landing/pushkar.jpg'
import jayantAvatar from '../images/landing/jayant.png'
import vaibhavAvatar from '../images/landing/vaibhav.png'
import logo from '../images/logo/logo.png'

const ArrowRight = () => <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5 12h14m-7-7 7 7-7 7" /></svg>
const PlayCircle = () => <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" /><path strokeLinejoin="round" d="m10 8 6 4-6 4z" /></svg>

export default function LandingPage() {
  const navigate = useNavigate()
  const [showLoginModal, setShowLoginModal] = useState(false)
  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  const [mounted, setMounted] = useState(false)
  const [isScrolled, setIsScrolled] = useState(false)

  const heroImages = [img1, img2]

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentImageIndex(prev => (prev + 1) % heroImages.length)
    }, 22800)
    return () => clearInterval(timer)
  }, [])

  useEffect(() => {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible')
          observer.unobserve(entry.target)
        }
      })
    }, { threshold: 0.15 })

    document.querySelectorAll('.observe-anim').forEach(el => observer.observe(el))

    const handleScroll = () => {
      setIsScrolled(window.scrollY > 80)
    }
    window.addEventListener('scroll', handleScroll, { passive: true })

    setMounted(true)
    return () => {
      observer.disconnect()
      window.removeEventListener('scroll', handleScroll)
    }
  }, [])

  return (
    <div className={`page-fade-in ${mounted ? 'is-mounted' : ''}`} style={{ minHeight: '100dvh', background: 'var(--surface)', display: 'flex', flexDirection: 'column', fontFamily: "'Inter', 'Noto Sans', sans-serif" }}>

      {/* Navigation — fixed with conditional dark bg */}
      <nav
        style={{
          position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
          background: isScrolled ? '#080c16' : 'transparent',
          boxShadow: isScrolled ? '0 1px 0 rgba(255,255,255,0.08)' : 'none',
          transition: 'background 0.3s ease, box-shadow 0.3s ease',
        }}
        className="landing-nav"
      >
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '1.5rem 5%', maxWidth: 1600, margin: '0 auto', width: '100%',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontWeight: 800, fontSize: '1.65rem', color: '#ffffff', letterSpacing: '-0.02em' }}>
            <img src={logo} alt="Logo" style={{ width: 48, height: 48, objectFit: 'contain', filter: 'drop-shadow(0 0 8px rgba(255,255,255,0.3))' }} />
            Swasthya Setu
          </div>

          <div style={{ display: 'flex', gap: '2.5rem', fontSize: '0.9375rem', fontWeight: 400, color: 'rgba(255,255,255,0.85)' }} className="hide-mobile">
            <a href="#about" style={{ color: 'inherit', textDecoration: 'none', transition: 'color 0.2s' }} onMouseEnter={e => e.target.style.color = '#ffffff'} onMouseLeave={e => e.target.style.color = 'rgba(255,255,255,0.85)'}>About Us</a>
            <a href="#goal" style={{ color: 'inherit', textDecoration: 'none', transition: 'color 0.2s' }} onMouseEnter={e => e.target.style.color = '#ffffff'} onMouseLeave={e => e.target.style.color = 'rgba(255,255,255,0.85)'}>Services</a>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <button
              onClick={() => setShowLoginModal(true)}
              className="landing-login-btn"
              style={{ padding: '0.625rem 1.5rem', borderRadius: 99, border: '1.5px solid rgba(45,143,94,0.8)', background: 'transparent', color: '#ffffff', fontWeight: 700, fontSize: '0.9375rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8, transition: 'all 0.2s' }}
              onMouseEnter={e => { e.currentTarget.style.background = 'rgba(45,143,94,0.2)' }}
              onMouseLeave={e => { e.currentTarget.style.background = 'transparent' }}
            >
              Log in
            </button>
          </div>
        </div>
      </nav>

      {/* Hero Section — full bleed, image as background */}
      <div style={{ position: 'relative', width: '100%', minHeight: '100vh', overflow: 'hidden', display: 'flex', alignItems: 'center' }} className="hero-section">
        {/* Background Images */}
        {[img1, img2].map((src, i) => (
          <img
            key={i}
            src={src}
            alt=""
            style={{
              position: 'absolute', top: 0, left: 0,
              width: '100%', height: '100%',
              objectFit: 'cover', objectPosition: 'center',
              opacity: currentImageIndex % 2 === i ? 1 : 0,
              transition: 'opacity 1.5s ease-in-out',
              zIndex: 0
            }}
          />
        ))}

        {/* Dark overlay */}
        <div style={{
          position: 'absolute', inset: 0, zIndex: 1,
          background: 'linear-gradient(to right, rgba(0,0,0,0.72) 0%, rgba(0,0,0,0.45) 60%, rgba(0,0,0,0.2) 100%)'
        }} />

        {/* Content */}
        <div style={{ position: 'relative', zIndex: 2, maxWidth: 1600, margin: '0 auto', width: '100%', padding: '8rem 5% 5rem' }} className="hero-left-content">

          <h1
            className="observe-anim animate-fade-up delay-150 hero-heading"
            style={{ fontWeight: 700, color: '#ffffff', lineHeight: 1.1, letterSpacing: '-0.03em', marginBottom: '2.5rem', maxWidth: 700, textShadow: '0 2px 20px rgba(0,0,0,0.3)' }}
          >
            We are here to help<br />you stay healthy.
          </h1>

          <button
            onClick={() => setShowLoginModal(true)}
            className="observe-anim animate-fade-up delay-300 hero-cta"
            style={{ padding: '1.25rem 2.5rem', borderRadius: 99, background: 'var(--primary)', color: '#fff', fontSize: '1.125rem', fontWeight: 700, border: 'none', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', transition: 'transform 0.2s', boxShadow: '0 12px 32px rgba(13,148,136,0.35)' }}
            onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-2px)'}
            onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
          >
            Make an appointment
          </button>
        </div>
      </div>

      {/* About Us (One Service) Section */}
      <div id="goal" style={{ padding: '8rem 4%', background: '#0b0914', position: 'relative', overflow: 'hidden' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', position: 'relative', zIndex: 2 }}>

          <div style={{ textAlign: 'center', marginBottom: '5rem' }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', padding: '8px 20px', borderRadius: 99, color: 'rgba(255,255,255,0.35)', fontSize: '11px', fontWeight: 400, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '2rem', boxShadow: '0 4px 12px rgba(0,0,0,0.2)' }}>
              <span style={{ color: 'var(--primary)' }}>✦</span> What we offer
            </span>
            <h2 style={{ fontSize: 'clamp(2rem, 6vw, 3.5rem)', fontWeight: 700, color: '#fff', letterSpacing: '-0.03em' }}>Built for rural India</h2>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(280px, 100%), 1fr))', gap: '1.5rem' }}>

            {/* Card 1 */}
            <div className="observe-anim animate-fade-up-card delay-c0" style={{ background: 'linear-gradient(180deg, #1f1b3d 0%, #15122b 100%)', borderRadius: 32, border: '1px solid rgba(255,255,255,0.06)', padding: '0 0 3.5rem 0', display: 'flex', flexDirection: 'column', position: 'relative', overflow: 'hidden', boxShadow: '0 24px 48px rgba(0,0,0,0.4)', transition: 'transform 0.3s ease' }} onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-8px)'} onMouseLeave={e => e.currentTarget.classList.contains('is-visible') ? e.currentTarget.style.transform = 'none' : null}>
              <div style={{ height: 240, position: 'relative', overflow: 'hidden', marginBottom: '1.5rem', borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                <div style={{ position: 'absolute', top: '-10%', left: '50%', transform: 'translateX(-50%)', width: 250, height: 250, background: 'radial-gradient(circle, rgba(168,85,247,0.25) 0%, rgba(0,0,0,0) 70%)' }} />
                <svg className="card-icon" viewBox="0 0 200 100" style={{ width: '100%', height: '100%', fill: 'none' }}>
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
            <div className="observe-anim animate-fade-up-card delay-c200" style={{ background: 'linear-gradient(180deg, #1f1b3d 0%, #15122b 100%)', borderRadius: 32, border: '1px solid rgba(255,255,255,0.06)', padding: '0 0 3.5rem 0', display: 'flex', flexDirection: 'column', position: 'relative', overflow: 'hidden', boxShadow: '0 24px 48px rgba(0,0,0,0.4)', transition: 'transform 0.3s ease' }} onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-8px)'} onMouseLeave={e => e.currentTarget.classList.contains('is-visible') ? e.currentTarget.style.transform = 'none' : null}>
              <div style={{ height: 240, position: 'relative', overflow: 'hidden', marginBottom: '1.5rem', borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                <div style={{ position: 'absolute', bottom: '0', left: '50%', transform: 'translateX(-50%)', width: 200, height: 200, background: 'radial-gradient(circle, rgba(99,102,241,0.25) 0%, rgba(0,0,0,0) 70%)' }} />
                <svg className="card-icon" viewBox="0 0 200 100" style={{ width: '100%', height: '100%', fill: 'none' }}>
                  <path d="M 20,20 Q 60,80 100,50 T 180,80" stroke="rgba(255,255,255,0.3)" strokeWidth="1.5" />
                  <path d="M 20,80 Q 60,20 100,50 T 180,20" stroke="rgba(255,255,255,0.15)" strokeWidth="1.5" />
                  <circle cx="100" cy="50" r="3" fill="#fff" filter="drop-shadow(0 0 6px #fff)" />
                  <circle cx="47" cy="50" r="1.5" fill="#fff" filter="drop-shadow(0 0 4px #fff)" />
                  <circle cx="153" cy="50" r="2" fill="#fff" filter="drop-shadow(0 0 5px #fff)" />
                </svg>
              </div>
              <div style={{ padding: '0 2.5rem' }}>
                <h3 style={{ fontSize: '1.75rem', fontWeight: 700, color: '#f8fafc', marginBottom: '1rem', lineHeight: 1.2, letterSpacing: '-0.02em' }}>Orchestrating<br />unified frameworks</h3>
                <p style={{ color: '#94a3b8', fontSize: '1.0625rem', lineHeight: 1.6 }}>Unifying people and Technology from all aspects and places.</p>
              </div>
            </div>

            {/* Card 3 */}
            <div className="observe-anim animate-fade-up-card delay-c400" style={{ background: 'linear-gradient(180deg, #1f1b3d 0%, #15122b 100%)', borderRadius: 32, border: '1px solid rgba(255,255,255,0.06)', padding: '0 0 3.5rem 0', display: 'flex', flexDirection: 'column', position: 'relative', overflow: 'hidden', boxShadow: '0 24px 48px rgba(0,0,0,0.4)', transition: 'transform 0.3s ease' }} onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-8px)'} onMouseLeave={e => e.currentTarget.classList.contains('is-visible') ? e.currentTarget.style.transform = 'none' : null}>
              <div style={{ height: 240, position: 'relative', overflow: 'hidden', marginBottom: '1.5rem', borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                <div style={{ position: 'absolute', top: '20%', right: '10%', width: 200, height: 200, background: 'radial-gradient(circle, rgba(236,72,153,0.2) 0%, rgba(0,0,0,0) 70%)' }} />
                <svg className="card-icon" viewBox="0 0 200 100" style={{ width: '100%', height: '100%', fill: 'none' }}>
                  <circle cx="100" cy="50" r="25" stroke="rgba(255,255,255,0.25)" strokeWidth="1" strokeDasharray="4 4" />
                  <circle cx="100" cy="50" r="40" stroke="rgba(255,255,255,0.1)" strokeWidth="1" />
                  <path d="M 94,35 h 12 v 10 h 10 v 10 h -10 v 10 h -12 v -10 h -10 v -10 h 10 z" fill="#fff" filter="drop-shadow(0 0 8px #fff)" opacity="0.9" />
                </svg>
              </div>
              <div style={{ padding: '0 2.5rem' }}>
                <h3 style={{ fontSize: '1.75rem', fontWeight: 700, color: '#f8fafc', marginBottom: '1rem', lineHeight: 1.2, letterSpacing: '-0.02em' }}>Compounding<br />partnership gains</h3>
                <p style={{ color: '#94a3b8', fontSize: '1.0625rem', lineHeight: 1.6 }}>Do good for people. We serve with Heart to impact what matters most.</p>
              </div>
            </div>

          </div>
        </div>
        <div style={{ position: 'absolute', top: '-10%', left: '50%', transform: 'translateX(-50%)', width: '100%', height: 600, background: 'radial-gradient(ellipse, rgba(168,85,247,0.1) 0%, rgba(0,0,0,0) 60%)', filter: 'blur(60px)', zIndex: 1, pointerEvents: 'none' }} />
      </div>

      {/* Meet the Founders */}
      <div id="about" style={{ padding: '8rem 4%', background: '#ffffff', position: 'relative' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '4rem' }} className="observe-anim animate-fade-up">
            <h2 style={{ fontSize: 'clamp(1.75rem, 5vw, 3.5rem)', fontWeight: 700, color: '#111827', letterSpacing: '-0.03em' }}>Meet the founders</h2>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(300px, 100%), 1fr))', gap: '2rem' }}>
            {[
              { src: pushkarAvatar, name: 'Pushkar Kulkarni', role: 'Team Lead and Main Coder', bio: 'Architecting the scalable backend of Swasthya Setu, Pushkar leads the core development team, building the robust and secure infrastructure that guarantees uptime for remote healthcare centers.', quote: `"Building systems that work without internet in remote villages is the hardest and most rewarding challenge I've taken on."`, grad: 'linear-gradient(135deg, #112822 0%, #0a1713 100%)' },
              { src: jayantAvatar, name: 'Jayant Saxena', role: 'Frontend and UI/UX Dev', bio: 'Driven by a vision to create intuitive user experiences, Jayant leads the frontend architecture. His aesthetic UI/UX designs make Swasthya Setu accessible to thousands of people across rural districts.', quote: `"Designing for someone who has never used a smartphone before completely changed how I think about interfaces."`, grad: 'linear-gradient(135deg, #112822 0%, #0a1713 100%)' },
              { src: vaibhavAvatar, name: 'Vaibhav Mishra', role: 'ASHA Operations Lead', bio: 'Specializing in community outreach and ground-level engagement, Vaibhav champions the enablement of ASHA workers and manages direct field operations.', quote: `"Every feature we ship has a real ASHA worker's workflow behind it. That keeps us honest."`, grad: 'linear-gradient(135deg, #112822 0%, #0a1713 100%)' },
            ].map(({ src, name, role, bio, quote, grad }, index) => (
              <div
                key={name}
                className="observe-anim animate-fade-up"
                style={{
                  background: '#fff',
                  borderRadius: 24,
                  overflow: 'hidden',
                  border: '1px solid rgba(0,0,0,0.06)',
                  display: 'flex',
                  flexDirection: 'column',
                  boxShadow: '0 20px 40px rgba(0,0,0,0.1)',
                  transition: 'transform 0.3s ease, opacity 0.8s cubic-bezier(0.16, 1, 0.3, 1), transform 0.8s cubic-bezier(0.16, 1, 0.3, 1)',
                  transitionDelay: `${index * 150}ms`
                }}
                onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-8px)'}
                onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
              >
                <div style={{ height: 380, background: '#2d2d2d', position: 'relative' }}>
                  <img src={src} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt={name} />
                </div>
                <div style={{ padding: '2rem 2.5rem', background: '#fff' }}>
                  <h3 style={{ fontSize: '1.75rem', fontWeight: 700, color: '#111827', marginBottom: 4 }}>{name}</h3>
                  <p style={{ fontSize: '1rem', color: '#6b7280', fontWeight: 400, marginBottom: '1rem' }}>{role}</p>
                  <p style={{ fontSize: '0.9375rem', color: '#4b5563', lineHeight: 1.6, fontWeight: 400 }}>{bio}</p>
                </div>
                <div style={{ padding: '2rem 2.5rem', background: grad, color: '#e2e8f0', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                  <p style={{ fontSize: '0.9375rem', lineHeight: 1.6, textAlign: 'center', color: '#f1f5f9', fontWeight: 400, margin: 0 }}>{quote}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer style={{ background: '#080c16', borderTop: '1px solid rgba(255,255,255,0.1)', padding: '60px 4% 40px', color: '#94a3b8' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', display: 'flex', flexWrap: 'wrap', gap: '4rem', marginBottom: '4rem' }}>
          <div style={{ flex: '2 1 300px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontWeight: 700, fontSize: '1.5rem', color: '#fff', letterSpacing: '-0.02em', marginBottom: '1.5rem' }}>
              <img src={logo} alt="Logo" style={{ width: 40, height: 40, objectFit: 'contain' }} />
              Swasthya Setu
            </div>
            <p style={{ lineHeight: 1.6, marginBottom: '2rem', maxWidth: 300, color: 'rgba(255,255,255,0.6)', fontSize: '14px', fontWeight: 400 }}>Bridging the healthcare gap in rural India with intelligent digital infrastructure.</p>
            <div style={{ display: 'flex', gap: '1rem' }}>
              {/* X / Twitter */}
              <button onClick={() => navigate('/under-construction')} style={{ width: 36, height: 36, borderRadius: 8, border: '1px solid rgba(255,255,255,0.15)', background: 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: 'background 0.2s', color: '#fff' }} onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.08)'} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                <svg width="14" height="14" fill="currentColor" viewBox="0 0 24 24"><path d="M18.901 1.153h3.68l-8.04 9.19L24 22.846h-7.406l-5.8-7.584-6.638 7.584H.474l8.6-9.83L0 1.154h7.594l5.243 6.932ZM17.61 20.644h2.039L6.486 3.24H4.298Z" /></svg>
              </button>
              {/* Instagram */}
              <button onClick={() => navigate('/under-construction')} style={{ width: 36, height: 36, borderRadius: 8, border: '1px solid rgba(255,255,255,0.15)', background: 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: 'background 0.2s', color: '#fff' }} onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.08)'} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><rect width="20" height="20" x="2" y="2" rx="5" ry="5" /><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" /><line x1="17.5" x2="17.51" y1="6.5" y2="6.5" /></svg>
              </button>
              {/* Facebook */}
              <button onClick={() => navigate('/under-construction')} style={{ width: 36, height: 36, borderRadius: 8, border: '1px solid rgba(255,255,255,0.15)', background: 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: 'background 0.2s', color: '#fff' }} onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.08)'} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" /></svg>
              </button>
            </div>
          </div>
          <div style={{ flex: '1 1 150px' }}>
            <p style={{ fontSize: '11px', letterSpacing: '0.08em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.35)', marginBottom: '20px', fontWeight: 400 }}>Platform</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {['ASHA Workers', 'Medical Officers', 'Admin Dashboard'].map(item => (
                <button key={item} onClick={() => navigate('/under-construction')} style={{ background: 'none', border: 'none', padding: 0, color: 'rgba(255,255,255,0.6)', fontSize: '14px', fontWeight: 400, textDecoration: 'none', transition: 'color 0.2s', cursor: 'pointer', textAlign: 'left' }} onMouseEnter={e => e.currentTarget.style.color = 'rgba(255,255,255,1)'} onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,0.6)'}>{item}</button>
              ))}
            </div>
          </div>
          <div style={{ flex: '1 1 150px' }}>
            <p style={{ fontSize: '11px', letterSpacing: '0.08em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.35)', marginBottom: '20px', fontWeight: 400 }}>Company</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {[['About Us', '#about'], ['Our Service', '#goal']].map(([label, href]) => (
                <a key={label} href={href} style={{ color: 'rgba(255,255,255,0.6)', fontSize: '14px', fontWeight: 400, textDecoration: 'none', transition: 'color 0.2s' }} onMouseEnter={e => e.currentTarget.style.color = 'rgba(255,255,255,1)'} onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,0.6)'}>{label}</a>
              ))}
              <button onClick={() => navigate('/under-construction')} style={{ background: 'none', border: 'none', padding: 0, color: 'rgba(255,255,255,0.6)', fontSize: '14px', fontWeight: 400, cursor: 'pointer', textAlign: 'left', transition: 'color 0.2s' }} onMouseEnter={e => e.currentTarget.style.color = 'rgba(255,255,255,1)'} onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,0.6)'}>Privacy Policy</button>
            </div>
          </div>
        </div>
        <div style={{ maxWidth: 1200, margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '24px', fontSize: '13px', color: 'rgba(255,255,255,0.4)', flexWrap: 'wrap', gap: '1rem' }}>
          <div>© 2026 Swasthya Setu.</div>
          <div>Designed for Rural Health.</div>
        </div>
      </footer>

      {showLoginModal && <LoginRoleModal onClose={() => setShowLoginModal(false)} />}

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;700;800&display=swap');
        
        .page-fade-in {
          opacity: 0;
          transition: opacity 400ms ease;
        }
        .page-fade-in.is-mounted {
          opacity: 1;
        }

        /* Entrance Animations */
        .animate-fade-up {
          opacity: 0;
          transform: translateY(48px);
          will-change: opacity, transform;
        }
        .animate-fade-up.is-visible {
          opacity: 1;
          transform: translateY(0);
          transition: opacity 800ms cubic-bezier(0.16, 1, 0.3, 1), transform 800ms cubic-bezier(0.16, 1, 0.3, 1);
        }
        .delay-150 { transition-delay: 200ms; }
        .delay-300 { transition-delay: 400ms; }

        .animate-fade-up-card {
          opacity: 0;
          transform: translateY(60px);
          will-change: opacity, transform;
        }
        .animate-fade-up-card.is-visible {
          opacity: 1;
          transform: translateY(0);
          transition: opacity 800ms cubic-bezier(0.16, 1, 0.3, 1), transform 800ms cubic-bezier(0.16, 1, 0.3, 1);
        }
        .delay-c0 { transition-delay: 0ms; }
        .delay-c200 { transition-delay: 250ms; }
        .delay-c400 { transition-delay: 500ms; }

        .card-icon {
          transform: scale(0.85);
          transition: transform 900ms cubic-bezier(0.16, 1, 0.3, 1);
          transform-origin: center;
          will-change: transform;
        }
        .animate-fade-up-card.is-visible .card-icon {
          transform: scale(1);
        }

        .hero-heading { font-size: clamp(2.5rem, 8vw, 4.5rem); }
        .hero-cta { padding: 0.875rem 1.75rem; font-size: clamp(0.9375rem, 2.5vw, 1.125rem); }
        @media (max-width: 900px) { .hide-mobile { display: none !important; } }
        @media (max-width: 768px) {
          .landing-nav { padding: 1rem 5% !important; }
          .hero-left-content { padding: 7rem 5% 4rem !important; }
          #goal { padding: 4rem 5% !important; }
          #about { padding: 4rem 5% !important; }
          footer { padding: 3rem 5% 2rem !important; }
        }
        @media (max-width: 480px) {
          .hero-heading { font-size: 2.5rem !important; letter-spacing: -0.02em !important; }
          #goal, #about { padding: 3rem 5% !important; }
        }
      `}</style>
    </div>
  )
}