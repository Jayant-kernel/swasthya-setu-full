import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';
import { useNavigate } from 'react-router-dom';

import loginImg1 from '../images/login/image.png';
import loginImg2 from '../images/login/image2.png';
import loginImg3 from '../images/login/image3.png';

const ROLES = [
  {
    id: 'asha',
    title: 'ASHA Worker',
    titleOdia: 'ଆଶା କର୍ମୀ',
    icon: '🏥',
    image: loginImg2,
    description: 'Track village visits, log health data & support community care.',
    path: '/home',
    color: '#1a7fc4',
    accent: '#bae6fd',
    bg: 'linear-gradient(160deg, #0c3a6d 0%, #1a6cad 100%)',
    border: '#3b9de0',
  },
  {
    id: 'dmo',
    title: 'District Officer',
    titleOdia: 'ଜିଲ୍ଲା ଅଧିକାରୀ',
    icon: '🏛️',
    image: loginImg3,
    description: 'Oversee district health metrics and coordinate response logistics.',
    path: '/dashboard/dmo',
    color: '#0e8f8f',
    accent: '#99f6e4',
    bg: 'linear-gradient(160deg, #043838 0%, #0b7a7a 100%)',
    border: '#2dd4d4',
  },
  {
    id: 'citizen',
    title: 'Citizen',
    titleOdia: 'ନାଗରିକ',
    icon: '👤',
    image: loginImg1,
    description: 'Book appointments, access records & connect with practitioners.',
    path: '/dashboard/citizen',
    color: '#059669',
    accent: '#6ee7b7',
    bg: 'linear-gradient(160deg, #032b1e 0%, #076e4c 100%)',
    border: '#34d399',
  },
];

/**
 * LoginRoleModal
 * Props:
 *   onClose: () => void
 */
export default function LoginRoleModal({ onClose }) {
  const [selected, setSelected] = useState(null);  // null | role object
  const [hoveredId, setHoveredId] = useState(null);
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authError, setAuthError] = useState('');
  const [authInfo, setAuthInfo] = useState('');
  const [authLoading, setAuthLoading] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const [mounted, setMounted] = useState(false);

  const auth = useAuth();
  const navigate = useNavigate();

  // Entrance animation
  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 10);
    return () => clearTimeout(t);
  }, []);

  const handleClose = () => {
    setMounted(false);
    setTimeout(onClose, 280);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setAuthError('');
    setAuthInfo('');
    setAuthLoading(true);
    try {
      if (isSignUp) {
        const { error } = await supabase.auth.signUp({ email: authEmail, password: authPassword });
        if (error) throw error;
        setAuthInfo('Account created! Check your email to confirm, then sign in.');
        setIsSignUp(false);
      } else {
        await auth.login(authEmail, authPassword, selected.id);
        navigate(selected.path);
      }
    } catch (err) {
      setAuthError(err.message);
    } finally {
      setAuthLoading(false);
    }
  };

  const handleOAuth = async (provider) => {
    localStorage.setItem('userRole', selected.id);
    await supabase.auth.signInWithOAuth({
      provider,
      options: { redirectTo: `${window.location.origin}${selected.path}` },
    });
  };

  return (
    /* ── Backdrop ── */
    <div
      onClick={handleClose}
      style={{
        position: 'fixed', inset: 0, zIndex: 200,
        background: 'rgba(0,0,0,0.6)',
        backdropFilter: 'blur(8px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '1rem',
        transition: 'opacity 0.28s ease',
        opacity: mounted ? 1 : 0,
      }}
    >
      {/* ── Modal card ── */}
      <div
        onClick={e => e.stopPropagation()}
        style={{
          width: '100%',
          maxWidth: selected ? '920px' : '860px',
          borderRadius: '1.5rem',
          overflow: 'hidden',
          boxShadow: '0 40px 100px rgba(0,0,0,0.55)',
          transition: 'max-width 0.4s ease, transform 0.28s ease, opacity 0.28s ease',
          transform: mounted ? 'translateY(0) scale(1)' : 'translateY(24px) scale(0.97)',
          opacity: mounted ? 1 : 0,
          fontFamily: "'Inter', 'Noto Sans', sans-serif",
        }}
      >
        {!selected ? (
          /* ════════════════════════════════
             Phase 1 — Role Selection
          ════════════════════════════════ */
          <div style={{ background: '#0d1117' }}>
            {/* Header */}
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '1.5rem 2rem',
              borderBottom: '1px solid rgba(255,255,255,0.07)',
            }}>
              <div>
                <h2 style={{ fontSize: '1.375rem', fontWeight: 800, color: '#f1f5f9', letterSpacing: '-0.02em', margin: 0 }}>
                  Choose your role
                </h2>
                <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: '0.875rem', margin: '0.25rem 0 0' }}>
                  Select how you'll access the platform today
                </p>
              </div>
              <button
                onClick={handleClose}
                aria-label="Close"
                style={{
                  width: 36, height: 36, borderRadius: '50%',
                  background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.12)',
                  color: 'rgba(255,255,255,0.6)', fontSize: '1.1rem', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  transition: 'background 0.2s',
                }}
                onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.15)'}
                onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.07)'}
              >✕</button>
            </div>

            {/* Role cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0' }}>
              {ROLES.map((role, idx) => {
                const isHovered = hoveredId === role.id;
                return (
                  <div
                    key={role.id}
                    onClick={() => setSelected(role)}
                    onMouseEnter={() => setHoveredId(role.id)}
                    onMouseLeave={() => setHoveredId(null)}
                    style={{
                      cursor: 'pointer',
                      position: 'relative',
                      overflow: 'hidden',
                      borderRight: idx < 2 ? '1px solid rgba(255,255,255,0.06)' : 'none',
                      transition: 'background 0.3s ease',
                      background: isHovered ? 'rgba(255,255,255,0.04)' : 'transparent',
                    }}
                  >
                    {/* Image area */}
                    <div style={{ position: 'relative', height: '200px', overflow: 'hidden' }}>
                      <div style={{ position: 'absolute', inset: 0, background: role.bg, opacity: 0.9 }} />
                      <img
                        src={role.image}
                        alt={role.title}
                        style={{
                          position: 'absolute', inset: 0, width: '100%', height: '100%',
                          objectFit: 'cover', objectPosition: 'center top',
                          opacity: isHovered ? 0.55 : 0.38,
                          transition: 'opacity 0.4s ease, transform 0.5s ease',
                          transform: isHovered ? 'scale(1.06)' : 'scale(1)',
                          mixBlendMode: 'luminosity',
                        }}
                      />
                      {/* Bottom gradient into card body */}
                      <div style={{
                        position: 'absolute', bottom: 0, left: 0, right: 0, height: '70%',
                        background: 'linear-gradient(to top, #0d1117 0%, transparent 100%)',
                      }} />
                      {/* Role icon badge */}
                      <div style={{
                        position: 'absolute', top: '1rem', left: '1rem',
                        width: 44, height: 44, borderRadius: '12px',
                        background: 'rgba(13,17,23,0.55)', backdropFilter: 'blur(8px)',
                        border: `1px solid ${role.border}44`,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: '1.375rem',
                        boxShadow: `0 0 12px ${role.color}33`,
                        transition: 'transform 0.3s ease',
                        transform: isHovered ? 'scale(1.1)' : 'scale(1)',
                      }}>
                        {role.icon}
                      </div>
                    </div>

                    {/* Card body */}
                    <div style={{ padding: '1.25rem 1.5rem 1.75rem' }}>
                      <h3 style={{
                        fontSize: '1.125rem', fontWeight: 800, color: '#f1f5f9',
                        margin: '0 0 0.2rem', letterSpacing: '-0.02em',
                      }}>
                        {role.title}
                      </h3>
                      <div style={{
                        fontFamily: "'Noto Sans Oriya', sans-serif",
                        fontSize: '0.875rem', color: role.accent, fontWeight: 600,
                        marginBottom: '0.75rem', opacity: 0.85,
                      }}>
                        {role.titleOdia}
                      </div>
                      <p style={{
                        color: 'rgba(255,255,255,0.5)', fontSize: '0.8125rem',
                        lineHeight: 1.55, marginBottom: '1.25rem',
                      }}>
                        {role.description}
                      </p>

                      {/* CTA */}
                      <div style={{
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                        padding: '0.6rem 1rem',
                        borderRadius: '99px',
                        background: isHovered ? role.color : 'rgba(255,255,255,0.07)',
                        border: `1px solid ${isHovered ? role.color : 'rgba(255,255,255,0.1)'}`,
                        color: isHovered ? '#fff' : 'rgba(255,255,255,0.7)',
                        fontSize: '0.875rem',
                        fontWeight: 700,
                        transition: 'all 0.3s ease',
                        boxShadow: isHovered ? `0 4px 16px ${role.color}55` : 'none',
                        letterSpacing: '-0.01em',
                      }}>
                        <span>Continue as {role.title}</span>
                        <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 12h14m-7-7 7 7-7 7" />
                        </svg>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Footer */}
            <div style={{
              padding: '1rem 2rem',
              borderTop: '1px solid rgba(255,255,255,0.06)',
              textAlign: 'center',
              color: 'rgba(255,255,255,0.3)',
              fontSize: '0.8125rem',
            }}>
              Swasthya Setu · Bridging healthcare across rural Odisha
            </div>
          </div>
        ) : (
          /* ════════════════════════════════
             Phase 2 — Login / Sign Up Form
          ════════════════════════════════ */
          <div style={{ display: 'flex', height: '580px' }}>
            {/* Left — brand panel */}
            <div style={{
              flex: '0 0 42%', position: 'relative', overflow: 'hidden',
              background: selected.bg,
              display: 'flex', flexDirection: 'column', justifyContent: 'flex-end',
              padding: '2.5rem',
            }}>
              <div style={{ position: 'absolute', inset: 0, background: `linear-gradient(to bottom, transparent 30%, rgba(0,0,0,0.45) 100%)` }} />
              <img
                src={selected.image} alt=""
                style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center top', opacity: 0.3, mixBlendMode: 'luminosity' }}
              />
              <div style={{ position: 'relative', zIndex: 2 }}>
                <span style={{ fontSize: '2.5rem' }}>{selected.icon}</span>
                <div style={{
                  display: 'inline-block', background: `${selected.accent}22`,
                  border: `1px solid ${selected.accent}44`, borderRadius: '99px',
                  padding: '0.3rem 0.875rem', color: selected.accent,
                  fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.04em',
                  textTransform: 'uppercase', marginTop: '1rem', marginBottom: '1rem',
                }}>
                  {selected.title} Portal
                </div>
                <h2 style={{ fontSize: '2.25rem', fontWeight: 900, color: '#fff', letterSpacing: '-0.04em', lineHeight: 1.05, marginBottom: '0.875rem' }}>
                  Welcome<br />Back.
                </h2>
                <p style={{ color: 'rgba(255,255,255,0.65)', fontSize: '0.9rem', lineHeight: 1.6, maxWidth: '260px' }}>
                  {selected.description}
                </p>
              </div>
            </div>

            {/* Right — form panel */}
            <div style={{
              flex: 1, background: '#fff', display: 'flex', flexDirection: 'column',
              justifyContent: 'center', padding: '2.5rem 3rem', position: 'relative',
              overflowY: 'auto',
            }}>
              {/* Back + Close buttons */}
              <button
                onClick={() => { setSelected(null); setAuthError(''); setAuthInfo(''); }}
                style={{
                  position: 'absolute', top: '1.25rem', left: '1.5rem',
                  background: '#f3f4f6', border: 'none', borderRadius: '99px',
                  padding: '0.5rem 1rem', fontSize: '0.8125rem', fontWeight: 600,
                  color: '#374151', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6,
                }}
              >← Back</button>
              <button
                onClick={handleClose}
                style={{
                  position: 'absolute', top: '1.25rem', right: '1.5rem',
                  background: '#f3f4f6', border: 'none', borderRadius: '50%',
                  width: 36, height: 36, fontSize: '1rem', cursor: 'pointer',
                  color: '#374151', display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}
              >✕</button>

              <div style={{ marginBottom: '1.75rem', marginTop: '2rem' }}>
                <h1 style={{ fontSize: '1.75rem', fontWeight: 900, color: '#111827', letterSpacing: '-0.03em', margin: '0 0 0.4rem' }}>
                  {isSignUp ? 'Create Account' : 'Sign In'}
                </h1>
                <p style={{ color: '#9ca3af', fontSize: '0.875rem', margin: 0 }}>
                  {isSignUp ? 'Join as ' : 'Continuing as '}<strong style={{ color: '#374151' }}>{selected.title}</strong>
                </p>
              </div>

              <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
                {authError && (
                  <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '10px', padding: '0.75rem 1rem', color: '#dc2626', fontSize: '0.875rem' }}>
                    {authError}
                  </div>
                )}
                {authInfo && (
                  <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '10px', padding: '0.75rem 1rem', color: '#166534', fontSize: '0.875rem' }}>
                    {authInfo}
                  </div>
                )}

                <input type="email" placeholder="Email address" value={authEmail} onChange={e => setAuthEmail(e.target.value)} required
                  style={{ width: '100%', padding: '0.9rem 1.25rem', borderRadius: '12px', border: '1.5px solid #e5e7eb', outline: 'none', fontSize: '0.9375rem', color: '#111827', background: '#f9fafb', boxSizing: 'border-box' }}
                  onFocus={e => e.target.style.borderColor = selected.color}
                  onBlur={e => e.target.style.borderColor = '#e5e7eb'}
                />
                <input type="password" placeholder="Password" value={authPassword} onChange={e => setAuthPassword(e.target.value)} required
                  style={{ width: '100%', padding: '0.9rem 1.25rem', borderRadius: '12px', border: '1.5px solid #e5e7eb', outline: 'none', fontSize: '0.9375rem', color: '#111827', background: '#f9fafb', boxSizing: 'border-box' }}
                  onFocus={e => e.target.style.borderColor = selected.color}
                  onBlur={e => e.target.style.borderColor = '#e5e7eb'}
                />

                <button
                  type="submit"
                  disabled={authLoading}
                  style={{
                    width: '100%', padding: '0.9rem',
                    borderRadius: '12px',
                    background: authLoading ? '#9ca3af' : '#111827',
                    color: '#fff', border: 'none',
                    fontSize: '0.9375rem', fontWeight: 700, cursor: authLoading ? 'not-allowed' : 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    marginTop: '0.25rem', transition: 'background 0.2s',
                  }}
                  onMouseEnter={e => { if (!authLoading) e.currentTarget.style.background = '#1f2937'; }}
                  onMouseLeave={e => { if (!authLoading) e.currentTarget.style.background = '#111827'; }}
                >
                  <span>{authLoading ? (isSignUp ? 'Creating…' : 'Signing in…') : (isSignUp ? 'Create Account' : 'Sign In')}</span>
                  <span style={{ background: '#fff', color: '#111827', borderRadius: '50%', width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: '1rem' }}>
                    {authLoading ? '…' : '→'}
                  </span>
                </button>

                {/* Divider */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', margin: '0.25rem 0' }}>
                  <div style={{ flex: 1, height: 1, background: '#e5e7eb' }} />
                  <span style={{ color: '#9ca3af', fontSize: '0.8125rem', whiteSpace: 'nowrap' }}>or continue with</span>
                  <div style={{ flex: 1, height: 1, background: '#e5e7eb' }} />
                </div>

                {/* OAuth */}
                <div style={{ display: 'flex', gap: '0.75rem' }}>
                  {[
                    {
                      label: 'Google', provider: 'google',
                      icon: <svg width="16" height="16" viewBox="0 0 48 48"><path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" /><path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" /><path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" /><path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" /></svg>
                    },
                    {
                      label: 'Apple', provider: 'apple',
                      icon: <svg width="16" height="16" viewBox="0 0 814 1000"><path d="M788.1 340.9c-5.8 4.5-108.2 62.2-108.2 190.5 0 148.4 130.3 200.9 134.2 202.2-.6 3.2-20.7 71.9-68.7 141.9-42.8 61.6-87.5 123.1-155.5 123.1s-85.5-39.5-164-39.5c-76 0-103.7 40.8-165.9 40.8s-105-57.8-155.5-127.4C46 790.8 0 663 0 541.8c0-207.7 134.7-317.7 266.9-317.7 99.1 0 160.1 65.5 214.1 65.5 51.7 0 122.7-68.8 232.2-68.8 37.9 0 137.1 3.2 210.2 84.9zm-246.7-161.7c43.3-51.8 74.6-124.1 74.6-196.3 0-9.6-.6-19.3-2.6-28.3-69.3 2.6-152.4 48.3-202.1 107.3-37.9 43.8-74.6 116.1-74.6 189.6 0 10.3.6 20.7 3.2 29.6 6.5.5 13 1.3 20.1 1.3 61.3 0 138.3-41.5 181.4-103.2z" /></svg>
                    },
                  ].map(({ label, provider, icon }) => (
                    <button
                      key={provider}
                      type="button"
                      onClick={() => handleOAuth(provider)}
                      style={{
                        flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
                        gap: '0.5rem', padding: '0.75rem',
                        borderRadius: '12px', border: '1.5px solid #e5e7eb',
                        background: '#fff', color: '#374151', fontWeight: 600,
                        fontSize: '0.875rem', cursor: 'pointer', transition: 'all 0.2s',
                      }}
                      onMouseEnter={e => { e.currentTarget.style.borderColor = '#d1d5db'; e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.07)'; }}
                      onMouseLeave={e => { e.currentTarget.style.borderColor = '#e5e7eb'; e.currentTarget.style.boxShadow = 'none'; }}
                    >
                      {icon} {label}
                    </button>
                  ))}
                </div>
              </form>

              {/* Sign up / sign in toggle */}
              {selected.id !== 'dmo' && (
                <p style={{ textAlign: 'center', marginTop: '1.5rem', color: '#6b7280', fontSize: '0.875rem' }}>
                  {isSignUp ? 'Already have an account? ' : "Don't have an account? "}
                  <span
                    onClick={() => { setIsSignUp(!isSignUp); setAuthError(''); setAuthInfo(''); }}
                    style={{ color: '#111827', fontWeight: 700, cursor: 'pointer', textDecoration: 'underline' }}
                  >
                    {isSignUp ? 'Sign in here' : 'Sign up here'}
                  </span>
                </p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
