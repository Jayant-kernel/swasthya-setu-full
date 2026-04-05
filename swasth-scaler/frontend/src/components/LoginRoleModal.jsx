import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';
import { useNavigate } from 'react-router-dom';

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
    glow: 'rgba(59,157,224,0.25)',
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
    glow: 'rgba(45,212,212,0.25)',
  },
];

export default function LoginRoleModal({ onClose }) {
  const [selected, setSelected] = useState(null);
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authError, setAuthError] = useState('');
  const [authInfo, setAuthInfo] = useState('');
  const [authLoading, setAuthLoading] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const [mounted, setMounted] = useState(false);

  const auth = useAuth();
  const navigate = useNavigate();

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
    <>
      <style>{`
        .lrm-backdrop {
          position: fixed; inset: 0; z-index: 200;
          background: rgba(0,0,0,0.7);
          backdrop-filter: blur(10px);
          display: flex; align-items: center; justify-content: center;
          padding: 1rem;
          overflow-y: auto;
          transition: opacity 0.28s ease;
        }
        .lrm-card {
          width: 100%;
          max-width: 560px;
          border-radius: 1.5rem;
          overflow: hidden;
          box-shadow: 0 40px 100px rgba(0,0,0,0.6);
          transition: transform 0.28s ease, opacity 0.28s ease;
          font-family: 'Inter', 'Noto Sans', sans-serif;
          background: #0d1117;
        }
        .lrm-role-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 0;
        }
        .lrm-role-card {
          cursor: pointer;
          position: relative;
          overflow: hidden;
          transition: background 0.3s ease;
          background: transparent;
          border: none;
          padding: 0;
          text-align: left;
        }
        .lrm-role-card:first-child {
          border-right: 1px solid rgba(255,255,255,0.07);
        }
        .lrm-phase2 {
          display: flex;
          min-height: 520px;
        }
        .lrm-brand-panel {
          flex: 0 0 40%;
          position: relative;
          overflow: hidden;
          display: flex;
          flex-direction: column;
          justify-content: flex-end;
          padding: 2rem;
        }
        .lrm-form-panel {
          flex: 1;
          background: #fff;
          display: flex;
          flex-direction: column;
          justify-content: center;
          padding: 2.5rem 2.5rem;
          position: relative;
          overflow-y: auto;
        }
        @media (max-width: 540px) {
          .lrm-card { border-radius: 1.25rem; }
          .lrm-phase2 { flex-direction: column; min-height: auto; }
          .lrm-brand-panel { display: none; }
          .lrm-form-panel { padding: 2rem 1.5rem; }
          .lrm-role-img { height: 150px !important; }
          .lrm-role-body { padding: 1rem 1rem 1.25rem !important; }
          .lrm-role-title { font-size: 1rem !important; }
          .lrm-role-desc { display: none !important; }
          .lrm-role-cta { font-size: 0.75rem !important; padding: 0.5rem 0.75rem !important; }
        }
      `}</style>

      {/* Backdrop */}
      <div
        className="lrm-backdrop"
        onClick={handleClose}
        style={{ opacity: mounted ? 1 : 0 }}
      >
        {/* Modal */}
        <div
          className="lrm-card"
          onClick={e => e.stopPropagation()}
          style={{
            transform: mounted ? 'translateY(0) scale(1)' : 'translateY(24px) scale(0.97)',
            opacity: mounted ? 1 : 0,
          }}
        >
          {!selected ? (
            /* ══════════════════════
               Phase 1 — Role picker
            ══════════════════════ */
            <div>
              {/* Header */}
              <div style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '1.25rem 1.5rem',
                borderBottom: '1px solid rgba(255,255,255,0.07)',
              }}>
                <div>
                  <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#f1f5f9', letterSpacing: '-0.02em', margin: 0 }}>
                    Choose your role
                  </h2>
                  <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.8125rem', margin: '0.2rem 0 0' }}>
                    Select how you'll access the platform today
                  </p>
                </div>
                <button
                  onClick={handleClose}
                  aria-label="Close"
                  style={{
                    width: 36, height: 36, borderRadius: '50%', flexShrink: 0,
                    background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.12)',
                    color: 'rgba(255,255,255,0.6)', fontSize: '1rem', cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    transition: 'background 0.2s',
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.15)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.07)'}
                >✕</button>
              </div>

              {/* 2-column role cards */}
              <div className="lrm-role-grid">
                {ROLES.map((role) => (
                  <button
                    key={role.id}
                    className="lrm-role-card"
                    onClick={() => setSelected(role)}
                    onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.04)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                  >
                    {/* Image area */}
                    <div className="lrm-role-img" style={{ position: 'relative', height: '180px', overflow: 'hidden' }}>
                      <div style={{ position: 'absolute', inset: 0, background: role.bg }} />
                      <img
                        src={role.image}
                        alt={role.title}
                        style={{
                          position: 'absolute', inset: 0, width: '100%', height: '100%',
                          objectFit: 'cover', objectPosition: 'center top',
                          opacity: 0.4, mixBlendMode: 'luminosity',
                          transition: 'transform 0.5s ease',
                        }}
                      />
                      {/* Bottom fade */}
                      <div style={{
                        position: 'absolute', bottom: 0, left: 0, right: 0, height: '60%',
                        background: 'linear-gradient(to top, #0d1117 0%, transparent 100%)',
                      }} />
                      {/* Glow */}
                      <div style={{
                        position: 'absolute', inset: 0,
                        background: `radial-gradient(ellipse at 50% 80%, ${role.glow} 0%, transparent 70%)`,
                      }} />
                      {/* Icon badge */}
                      <div style={{
                        position: 'absolute', top: '0.875rem', left: '0.875rem',
                        width: 40, height: 40, borderRadius: '10px',
                        background: 'rgba(13,17,23,0.6)', backdropFilter: 'blur(8px)',
                        border: `1px solid ${role.border}55`,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: '1.25rem',
                      }}>
                        {role.icon}
                      </div>
                    </div>

                    {/* Card body */}
                    <div className="lrm-role-body" style={{ padding: '1rem 1.25rem 1.5rem' }}>
                      <h3 className="lrm-role-title" style={{
                        fontSize: '1.0625rem', fontWeight: 800, color: '#f1f5f9',
                        margin: '0 0 0.2rem', letterSpacing: '-0.02em',
                      }}>
                        {role.title}
                      </h3>
                      <div style={{
                        fontFamily: "'Noto Sans Oriya', sans-serif",
                        fontSize: '0.8rem', color: role.accent, fontWeight: 600,
                        marginBottom: '0.625rem', opacity: 0.85,
                      }}>
                        {role.titleOdia}
                      </div>
                      <p className="lrm-role-desc" style={{
                        color: 'rgba(255,255,255,0.45)', fontSize: '0.75rem',
                        lineHeight: 1.5, marginBottom: '1rem',
                      }}>
                        {role.description}
                      </p>

                      {/* CTA pill */}
                      <div className="lrm-role-cta" style={{
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                        padding: '0.55rem 0.875rem',
                        borderRadius: '99px',
                        background: role.color,
                        color: '#fff',
                        fontSize: '0.8125rem',
                        fontWeight: 700,
                        letterSpacing: '-0.01em',
                        boxShadow: `0 4px 16px ${role.glow}`,
                      }}>
                        <span>Continue →</span>
                        <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 12h14m-7-7 7 7-7 7" />
                        </svg>
                      </div>
                    </div>
                  </button>
                ))}
              </div>

              {/* Footer */}
              <div style={{
                padding: '0.875rem 1.5rem',
                borderTop: '1px solid rgba(255,255,255,0.06)',
                textAlign: 'center',
                color: 'rgba(255,255,255,0.25)',
                fontSize: '0.75rem',
              }}>
                Swasthya Setu · Bridging healthcare across rural Odisha
              </div>
            </div>

          ) : (
            /* ══════════════════════
               Phase 2 — Login form
            ══════════════════════ */
            <div className="lrm-phase2">
              {/* Left — brand panel */}
              <div className="lrm-brand-panel" style={{ background: selected.bg }}>
                <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, transparent 30%, rgba(0,0,0,0.5) 100%)' }} />
                <img
                  src={selected.image} alt=""
                  style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center top', opacity: 0.3, mixBlendMode: 'luminosity' }}
                />
                <div style={{ position: 'relative', zIndex: 2 }}>
                  <span style={{ fontSize: '2.25rem' }}>{selected.icon}</span>
                  <div style={{
                    display: 'inline-block', background: `${selected.accent}22`,
                    border: `1px solid ${selected.accent}44`, borderRadius: '99px',
                    padding: '0.25rem 0.75rem', color: selected.accent,
                    fontSize: '0.6875rem', fontWeight: 700, letterSpacing: '0.06em',
                    textTransform: 'uppercase', marginTop: '0.875rem', marginBottom: '0.875rem',
                    display: 'block', width: 'fit-content',
                  }}>
                    {selected.title} Portal
                  </div>
                  <h2 style={{ fontSize: '2rem', fontWeight: 900, color: '#fff', letterSpacing: '-0.04em', lineHeight: 1.05, marginBottom: '0.75rem' }}>
                    Welcome<br />Back.
                  </h2>
                  <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.875rem', lineHeight: 1.6 }}>
                    {selected.description}
                  </p>
                </div>
              </div>

              {/* Right — form */}
              <div className="lrm-form-panel">
                {/* Back + Close */}
                <button
                  onClick={() => { setSelected(null); setAuthError(''); setAuthInfo(''); }}
                  style={{
                    position: 'absolute', top: '1rem', left: '1.25rem',
                    background: '#f3f4f6', border: 'none', borderRadius: '99px',
                    padding: '0.4rem 0.875rem', fontSize: '0.8125rem', fontWeight: 600,
                    color: '#374151', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4,
                    minHeight: 36,
                  }}
                >← Back</button>
                <button
                  onClick={handleClose}
                  style={{
                    position: 'absolute', top: '1rem', right: '1.25rem',
                    background: '#f3f4f6', border: 'none', borderRadius: '50%',
                    width: 36, height: 36, fontSize: '1rem', cursor: 'pointer',
                    color: '#374151', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}
                >✕</button>

                <div style={{ marginBottom: '1.5rem', marginTop: '2.5rem' }}>
                  <h1 style={{ fontSize: '1.625rem', fontWeight: 900, color: '#111827', letterSpacing: '-0.03em', margin: '0 0 0.375rem' }}>
                    {isSignUp ? 'Create Account' : 'Sign In'}
                  </h1>
                  <p style={{ color: '#9ca3af', fontSize: '0.875rem', margin: 0 }}>
                    {isSignUp ? 'Join as ' : 'Continuing as '}
                    <strong style={{ color: '#374151' }}>{selected.title}</strong>
                  </p>
                </div>

                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
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

                  <input
                    type="email" placeholder="Email address"
                    value={authEmail} onChange={e => setAuthEmail(e.target.value)} required
                    style={{ width: '100%', padding: '0.875rem 1.125rem', borderRadius: '12px', border: '1.5px solid #e5e7eb', outline: 'none', fontSize: '0.9375rem', color: '#111827', background: '#f9fafb', boxSizing: 'border-box', minHeight: 48 }}
                    onFocus={e => e.target.style.borderColor = selected.color}
                    onBlur={e => e.target.style.borderColor = '#e5e7eb'}
                  />
                  <input
                    type="password" placeholder="Password"
                    value={authPassword} onChange={e => setAuthPassword(e.target.value)} required
                    style={{ width: '100%', padding: '0.875rem 1.125rem', borderRadius: '12px', border: '1.5px solid #e5e7eb', outline: 'none', fontSize: '0.9375rem', color: '#111827', background: '#f9fafb', boxSizing: 'border-box', minHeight: 48 }}
                    onFocus={e => e.target.style.borderColor = selected.color}
                    onBlur={e => e.target.style.borderColor = '#e5e7eb'}
                  />

                  <button
                    type="submit" disabled={authLoading}
                    style={{
                      width: '100%', minHeight: 50,
                      borderRadius: '12px',
                      background: authLoading ? '#9ca3af' : '#111827',
                      color: '#fff', border: 'none',
                      fontSize: '0.9375rem', fontWeight: 700,
                      cursor: authLoading ? 'not-allowed' : 'pointer',
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      padding: '0 1.25rem',
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
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', margin: '0.125rem 0' }}>
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
                          gap: '0.5rem', minHeight: 46,
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

                {/* Sign up / sign in toggle — only for ASHA */}
                {selected.id === 'asha' && (
                  <p style={{ textAlign: 'center', marginTop: '1.25rem', color: '#6b7280', fontSize: '0.875rem' }}>
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
    </>
  );
}
