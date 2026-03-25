import React, { useEffect, useRef, useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'

const TEAL = '#0F6E56'
const TEAL_LIGHT = 'rgba(15,110,86,0.12)'

// ─── SVG Hand Diagrams ────────────────────────────────────────────────────────

function SvgFever() {
  return (
    <svg viewBox="0 0 120 160" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
      {/* Palm */}
      <rect x="30" y="90" width="60" height="55" rx="10" fill="#FDDCB5" stroke="#c8956a" strokeWidth="1.8"/>
      {/* Thumb */}
      <rect x="12" y="100" width="22" height="14" rx="7" fill="#FDDCB5" stroke="#c8956a" strokeWidth="1.8"/>
      {/* Index */}
      <rect x="31" y="42" width="13" height="52" rx="6" fill="#FDDCB5" stroke="#c8956a" strokeWidth="1.8"/>
      {/* Middle */}
      <rect x="47" y="32" width="13" height="62" rx="6" fill="#FDDCB5" stroke="#c8956a" strokeWidth="1.8"/>
      {/* Ring */}
      <rect x="63" y="38" width="13" height="56" rx="6" fill="#FDDCB5" stroke="#c8956a" strokeWidth="1.8"/>
      {/* Pinky */}
      <rect x="79" y="52" width="10" height="44" rx="5" fill="#FDDCB5" stroke="#c8956a" strokeWidth="1.8"/>
      <line x1="30" y1="90" x2="90" y2="90" stroke="#c8956a" strokeWidth="1.2"/>
      {/* Up arrow animated */}
      <g>
        <animateTransform attributeName="transform" type="translate" values="0,0;0,-6;0,0" dur="1.2s" repeatCount="indefinite"/>
        <polygon points="54,6 48,18 60,18" fill={TEAL}/>
        <line x1="54" y1="6" x2="54" y2="28" stroke={TEAL} strokeWidth="2.5"/>
      </g>
      <text x="60" y="155" textAnchor="middle" fontSize="10" fill="#6b7280" fontFamily="sans-serif">Open palm up</text>
    </svg>
  )
}

function SvgCough() {
  return (
    <svg viewBox="0 0 120 160" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
      {/* Chest line */}
      <line x1="10" y1="88" x2="110" y2="88" stroke="#e5e7eb" strokeWidth="2" strokeDasharray="5 3"/>
      <text x="60" y="84" textAnchor="middle" fontSize="8" fill="#9ca3af" fontFamily="sans-serif">chest</text>
      {/* Fist body */}
      <rect x="28" y="92" width="64" height="46" rx="10" fill="#FDDCB5" stroke="#c8956a" strokeWidth="1.8"/>
      {/* Curled fingers */}
      <rect x="29" y="82" width="14" height="24" rx="7" fill="#FDDCB5" stroke="#c8956a" strokeWidth="1.8"/>
      <rect x="45" y="77" width="14" height="26" rx="7" fill="#FDDCB5" stroke="#c8956a" strokeWidth="1.8"/>
      <rect x="61" y="80" width="14" height="24" rx="7" fill="#FDDCB5" stroke="#c8956a" strokeWidth="1.8"/>
      <rect x="76" y="86" width="12" height="20" rx="6" fill="#FDDCB5" stroke="#c8956a" strokeWidth="1.8"/>
      {/* Thumb */}
      <rect x="14" y="100" width="18" height="13" rx="6" fill="#FDDCB5" stroke="#c8956a" strokeWidth="1.8"/>
      <line x1="28" y1="100" x2="92" y2="100" stroke="#c8956a" strokeWidth="1.2"/>
      {/* Tap arrows */}
      <g>
        <animateTransform attributeName="transform" type="translate" values="0,0;0,6;0,0" dur="0.7s" repeatCount="indefinite"/>
        <polygon points="54,52 48,63 60,63" fill={TEAL}/>
        <line x1="54" y1="52" x2="54" y2="72" stroke={TEAL} strokeWidth="2.5"/>
      </g>
      <polygon points="76,52 70,63 82,63" fill={TEAL} opacity="0.4"/>
      <line x1="76" y1="52" x2="76" y2="72" stroke={TEAL} strokeWidth="2" opacity="0.4"/>
      <text x="60" y="155" textAnchor="middle" fontSize="10" fill="#6b7280" fontFamily="sans-serif">Fist taps chest</text>
    </svg>
  )
}

function SvgPain() {
  return (
    <svg viewBox="0 0 120 160" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
      {/* Palm */}
      <rect x="30" y="82" width="60" height="58" rx="10" fill="#FDDCB5" stroke="#c8956a" strokeWidth="1.8"/>
      {/* Index only — extended */}
      <rect x="33" y="28" width="14" height="58" rx="7" fill="#FDDCB5" stroke="#c8956a" strokeWidth="1.8"/>
      {/* Others curled */}
      <rect x="50" y="76" width="13" height="22" rx="6" fill="#FDDCB5" stroke="#c8956a" strokeWidth="1.8"/>
      <rect x="65" y="76" width="13" height="22" rx="6" fill="#FDDCB5" stroke="#c8956a" strokeWidth="1.8"/>
      <rect x="79" y="80" width="10" height="18" rx="5" fill="#FDDCB5" stroke="#c8956a" strokeWidth="1.8"/>
      {/* Thumb */}
      <rect x="14" y="92" width="20" height="13" rx="6" fill="#FDDCB5" stroke="#c8956a" strokeWidth="1.8"/>
      <line x1="30" y1="84" x2="90" y2="84" stroke="#c8956a" strokeWidth="1.2"/>
      {/* Rotation arc arrow */}
      <g>
        <animateTransform attributeName="transform" type="rotate" values="0 40 55;12 40 55;0 40 55;-12 40 55;0 40 55" dur="2s" repeatCount="indefinite"/>
        <path d="M 56 18 A 18 18 0 0 1 72 30" stroke={TEAL} strokeWidth="2.5" fill="none" strokeLinecap="round"/>
        <polygon points="72,30 78,20 64,22" fill={TEAL}/>
      </g>
      <text x="60" y="155" textAnchor="middle" fontSize="10" fill="#6b7280" fontFamily="sans-serif">Index only — twist</text>
    </svg>
  )
}

function SvgHeadache() {
  return (
    <svg viewBox="0 0 120 160" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
      {/* Palm */}
      <rect x="28" y="84" width="60" height="56" rx="10" fill="#FDDCB5" stroke="#c8956a" strokeWidth="1.8"/>
      {/* Index — extended */}
      <rect x="31" y="28" width="14" height="60" rx="7" fill="#FDDCB5" stroke="#c8956a" strokeWidth="1.8"/>
      {/* Middle — extended */}
      <rect x="48" y="22" width="14" height="66" rx="7" fill="#FDDCB5" stroke="#c8956a" strokeWidth="1.8"/>
      {/* Ring curled */}
      <rect x="64" y="78" width="13" height="22" rx="6" fill="#FDDCB5" stroke="#c8956a" strokeWidth="1.8"/>
      {/* Pinky curled */}
      <rect x="78" y="82" width="8" height="18" rx="4" fill="#FDDCB5" stroke="#c8956a" strokeWidth="1.8"/>
      {/* Thumb */}
      <rect x="12" y="94" width="20" height="13" rx="6" fill="#FDDCB5" stroke="#c8956a" strokeWidth="1.8"/>
      <line x1="28" y1="86" x2="88" y2="86" stroke="#c8956a" strokeWidth="1.2"/>
      {/* Arrow pointing left toward temple */}
      <g>
        <animateTransform attributeName="transform" type="translate" values="0,0;-5,0;0,0" dur="1.2s" repeatCount="indefinite"/>
        <polygon points="8,45 20,39 20,51" fill={TEAL}/>
        <line x1="8" y1="45" x2="28" y2="45" stroke={TEAL} strokeWidth="2.5"/>
      </g>
      <text x="60" y="155" textAnchor="middle" fontSize="10" fill="#6b7280" fontFamily="sans-serif">V sign → temple</text>
    </svg>
  )
}

function SvgVomiting() {
  return (
    <svg viewBox="0 0 120 160" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
      {/* Palm */}
      <rect x="28" y="84" width="62" height="56" rx="10" fill="#FDDCB5" stroke="#c8956a" strokeWidth="1.8"/>
      {/* Index curled */}
      <rect x="31" y="78" width="14" height="22" rx="7" fill="#FDDCB5" stroke="#c8956a" strokeWidth="1.8"/>
      {/* Middle curled */}
      <rect x="47" y="74" width="14" height="24" rx="7" fill="#FDDCB5" stroke="#c8956a" strokeWidth="1.8"/>
      {/* Ring — extended */}
      <rect x="63" y="30" width="13" height="58" rx="6" fill="#FDDCB5" stroke="#c8956a" strokeWidth="1.8"/>
      {/* Pinky — extended */}
      <rect x="78" y="38" width="10" height="50" rx="5" fill="#FDDCB5" stroke="#c8956a" strokeWidth="1.8"/>
      {/* Thumb */}
      <rect x="12" y="94" width="20" height="13" rx="6" fill="#FDDCB5" stroke="#c8956a" strokeWidth="1.8"/>
      <line x1="28" y1="86" x2="90" y2="86" stroke="#c8956a" strokeWidth="1.2"/>
      {/* Push forward arrow */}
      <g>
        <animateTransform attributeName="transform" type="translate" values="0,0;0,7;0,0" dur="1s" repeatCount="indefinite"/>
        <polygon points="60,110 54,122 66,122" fill={TEAL}/>
        <line x1="60" y1="108" x2="60" y2="130" stroke={TEAL} strokeWidth="2.5"/>
      </g>
      <text x="60" y="155" textAnchor="middle" fontSize="10" fill="#6b7280" fontFamily="sans-serif">Ring + pinky up</text>
    </svg>
  )
}

function SvgDiarrhea() {
  return (
    <svg viewBox="0 0 120 160" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
      {/* Palm */}
      <rect x="28" y="84" width="62" height="56" rx="10" fill="#FDDCB5" stroke="#c8956a" strokeWidth="1.8"/>
      {/* Index curled */}
      <rect x="31" y="78" width="14" height="22" rx="7" fill="#FDDCB5" stroke="#c8956a" strokeWidth="1.8"/>
      {/* Middle — extended */}
      <rect x="47" y="24" width="14" height="64" rx="7" fill="#FDDCB5" stroke="#c8956a" strokeWidth="1.8"/>
      {/* Ring — extended */}
      <rect x="63" y="30" width="13" height="58" rx="6" fill="#FDDCB5" stroke="#c8956a" strokeWidth="1.8"/>
      {/* Pinky curled */}
      <rect x="78" y="78" width="10" height="22" rx="5" fill="#FDDCB5" stroke="#c8956a" strokeWidth="1.8"/>
      {/* Thumb */}
      <rect x="12" y="94" width="20" height="13" rx="6" fill="#FDDCB5" stroke="#c8956a" strokeWidth="1.8"/>
      <line x1="28" y1="86" x2="90" y2="86" stroke="#c8956a" strokeWidth="1.2"/>
      {/* Swipe down arrow */}
      <g>
        <animateTransform attributeName="transform" type="translate" values="0,0;0,10;0,0" dur="0.9s" repeatCount="indefinite"/>
        <polygon points="95,100 89,115 101,115" fill={TEAL}/>
        <line x1="95" y1="98" x2="95" y2="122" stroke={TEAL} strokeWidth="2.5"/>
      </g>
      <text x="60" y="155" textAnchor="middle" fontSize="10" fill="#6b7280" fontFamily="sans-serif">Middle + ring — swipe ↓</text>
    </svg>
  )
}

function SvgHelp() {
  return (
    <svg viewBox="0 0 120 160" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
      {/* Fist body */}
      <rect x="28" y="75" width="64" height="55" rx="10" fill="#FDDCB5" stroke="#c8956a" strokeWidth="1.8"/>
      {/* Curled fingers on top */}
      <rect x="29" y="64" width="14" height="26" rx="7" fill="#FDDCB5" stroke="#c8956a" strokeWidth="1.8"/>
      <rect x="45" y="59" width="14" height="28" rx="7" fill="#FDDCB5" stroke="#c8956a" strokeWidth="1.8"/>
      <rect x="61" y="62" width="14" height="26" rx="7" fill="#FDDCB5" stroke="#c8956a" strokeWidth="1.8"/>
      <rect x="76" y="68" width="12" height="22" rx="6" fill="#FDDCB5" stroke="#c8956a" strokeWidth="1.8"/>
      {/* Thumb — extended upward */}
      <rect x="12" y="30" width="18" height="50" rx="9" fill="#FDDCB5" stroke="#c8956a" strokeWidth="2.2"/>
      <line x1="28" y1="82" x2="92" y2="82" stroke="#c8956a" strokeWidth="1.2"/>
      {/* Second hand flat underneath */}
      <rect x="20" y="132" width="80" height="12" rx="6" fill="#FDDCB5" stroke="#c8956a" strokeWidth="1.5" opacity="0.6"/>
      {/* Lift arrow */}
      <g>
        <animateTransform attributeName="transform" type="translate" values="0,0;0,-7;0,0" dur="1.1s" repeatCount="indefinite"/>
        <polygon points="60,8 54,20 66,20" fill={TEAL}/>
        <line x1="60" y1="8" x2="60" y2="24" stroke={TEAL} strokeWidth="2.5"/>
      </g>
      <text x="60" y="155" textAnchor="middle" fontSize="10" fill="#6b7280" fontFamily="sans-serif">Thumbs up — lift</text>
    </svg>
  )
}

function SvgYes() {
  return (
    <svg viewBox="0 0 120 160" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
      {/* Fist body */}
      <rect x="28" y="68" width="64" height="62" rx="10" fill="#FDDCB5" stroke="#c8956a" strokeWidth="1.8"/>
      {/* Curled fingers */}
      <rect x="29" y="57" width="14" height="26" rx="7" fill="#FDDCB5" stroke="#c8956a" strokeWidth="1.8"/>
      <rect x="45" y="52" width="14" height="28" rx="7" fill="#FDDCB5" stroke="#c8956a" strokeWidth="1.8"/>
      <rect x="61" y="55" width="14" height="26" rx="7" fill="#FDDCB5" stroke="#c8956a" strokeWidth="1.8"/>
      <rect x="76" y="61" width="12" height="22" rx="6" fill="#FDDCB5" stroke="#c8956a" strokeWidth="1.8"/>
      {/* Thumb side */}
      <rect x="12" y="78" width="20" height="14" rx="7" fill="#FDDCB5" stroke="#c8956a" strokeWidth="1.8"/>
      <line x1="28" y1="78" x2="92" y2="78" stroke="#c8956a" strokeWidth="1.2"/>
      {/* Nod arrows up and down */}
      <g>
        <animateTransform attributeName="transform" type="translate" values="0,-5;0,5;0,-5" dur="0.8s" repeatCount="indefinite"/>
        <polygon points="60,12 54,24 66,24" fill={TEAL}/>
        <line x1="60" y1="12" x2="60" y2="26" stroke={TEAL} strokeWidth="2.5"/>
        <polygon points="60,46 54,34 66,34" fill={TEAL} opacity="0.5"/>
        <line x1="60" y1="44" x2="60" y2="34" stroke={TEAL} strokeWidth="2" opacity="0.5"/>
      </g>
      <text x="60" y="155" textAnchor="middle" fontSize="10" fill="#6b7280" fontFamily="sans-serif">Fist nods up-down</text>
    </svg>
  )
}

function SvgNo() {
  return (
    <svg viewBox="0 0 120 160" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
      {/* Palm */}
      <rect x="28" y="84" width="62" height="56" rx="10" fill="#FDDCB5" stroke="#c8956a" strokeWidth="1.8"/>
      {/* Index — extended */}
      <rect x="31" y="28" width="14" height="60" rx="7" fill="#FDDCB5" stroke="#c8956a" strokeWidth="1.8"/>
      {/* Middle — extended, touching index */}
      <rect x="46" y="24" width="14" height="64" rx="7" fill="#FDDCB5" stroke="#c8956a" strokeWidth="1.8"/>
      {/* Ring curled */}
      <rect x="62" y="78" width="13" height="24" rx="6" fill="#FDDCB5" stroke="#c8956a" strokeWidth="1.8"/>
      {/* Pinky curled */}
      <rect x="77" y="82" width="10" height="20" rx="5" fill="#FDDCB5" stroke="#c8956a" strokeWidth="1.8"/>
      {/* Thumb */}
      <rect x="12" y="96" width="20" height="13" rx="6" fill="#FDDCB5" stroke="#c8956a" strokeWidth="1.8"/>
      <line x1="28" y1="86" x2="90" y2="86" stroke="#c8956a" strokeWidth="1.2"/>
      {/* Side-to-side wave arrow */}
      <g>
        <animateTransform attributeName="transform" type="translate" values="-8,0;8,0;-8,0" dur="1s" repeatCount="indefinite"/>
        <line x1="20" y1="45" x2="95" y2="45" stroke={TEAL} strokeWidth="2.5" strokeLinecap="round"/>
        <polygon points="20,45 32,39 32,51" fill={TEAL}/>
        <polygon points="95,45 83,39 83,51" fill={TEAL}/>
      </g>
      <text x="60" y="155" textAnchor="middle" fontSize="10" fill="#6b7280" fontFamily="sans-serif">V fingers wave L-R</text>
    </svg>
  )
}

// ─── Sign Data ────────────────────────────────────────────────────────────────
const SIGNS = [
  {
    sign: 'FEVER', odia: 'ଜ୍ୱର', Diagram: SvgFever,
    howTo: ['Open your palm wide', 'Face it outward toward camera', 'Hold still — all 5 fingers up'],
  },
  {
    sign: 'COUGH', odia: 'କାଶ', Diagram: SvgCough,
    howTo: ['Make a closed fist', 'Place fist on your chest', 'Tap chest twice firmly'],
  },
  {
    sign: 'PAIN', odia: 'ବ୍ୟଥା', Diagram: SvgPain,
    howTo: ['Close all four fingers into palm', 'Raise only your index finger', 'Twist wrist slightly inward'],
  },
  {
    sign: 'HEADACHE', odia: 'ମୁଣ୍ଡ ବ୍ୟଥା', Diagram: SvgHeadache,
    howTo: ['Make a V/peace sign (index + middle up)', 'Point fingers toward your temple', 'Hold for 2 seconds'],
  },
  {
    sign: 'VOMITING', odia: 'ବାନ୍ତି', Diagram: SvgVomiting,
    howTo: ['Curl index and middle fingers down', 'Keep ring and pinky extended up', 'Push hand forward and down twice'],
  },
  {
    sign: 'DIARRHEA', odia: 'ତରଳ ଝାଡ଼ା', Diagram: SvgDiarrhea,
    howTo: ['Raise middle and ring fingers only', 'Hold hand at stomach level', 'Swipe hand sharply downward'],
  },
  {
    sign: 'HELP', odia: 'ସାହାଯ୍ୟ', Diagram: SvgHelp,
    howTo: ['Make thumbs up with right hand', 'Place left palm under right fist', 'Lift both hands upward together'],
  },
  {
    sign: 'YES', odia: 'ହଁ', Diagram: SvgYes,
    howTo: ['Make a closed fist', 'Nod fist upward then downward', 'Repeat 2-3 times rhythmically'],
  },
  {
    sign: 'NO', odia: 'ନା', Diagram: SvgNo,
    howTo: ['Raise index and middle fingers together', 'Keep other fingers curled', 'Wave hand side to side'],
  },
]

// ─── Detection Logic ─────────────────────────────────────────────────────────

function getDistance(a, b) {
  return Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2 + (a.z - b.z) ** 2)
}

function getFingerStates(hand) {
  const wrist = hand[0]
  const palmSize = getDistance(hand[0], hand[9])

  // Finger is extended when tip-to-wrist distance is clearly larger than base-to-wrist
  // Using 1.15 ratio — stricter to prevent hallucinations on curled fingers
  const isExtended = (tipIdx, baseIdx) => {
    const tipDist  = getDistance(hand[tipIdx], wrist)
    const baseDist = getDistance(hand[baseIdx], wrist)
    return tipDist > baseDist * 1.15
  }

  // Finger is curled when tip is closer to wrist than base (tip folds inward)
  const isCurled = (tipIdx, baseIdx) => {
    const tipDist  = getDistance(hand[tipIdx], wrist)
    const baseDist = getDistance(hand[baseIdx], wrist)
    return tipDist < baseDist * 1.0
  }

  // Thumb: must be clearly extended — tip(4) much farther than knuckle(2)
  // Use higher threshold (1.2) because thumb at rest still sticks out a bit
  const thumbTipDist  = getDistance(hand[4], wrist)
  const thumbBaseDist = getDistance(hand[2], wrist)
  const thumbExtended = thumbTipDist > thumbBaseDist * 1.2

  return {
    thumbExtended,
    indexUp:  isExtended(8, 5),
    middleUp: isExtended(12, 9),
    ringUp:   isExtended(16, 13),
    pinkyUp:  isExtended(20, 17),
    indexCurled:  isCurled(8, 5),
    middleCurled: isCurled(12, 9),
    ringCurled:   isCurled(16, 13),
    pinkyCurled:  isCurled(20, 17),
    palmSize,
  }
}

// Track wrist Y over frames for COUGH tap detection
const wristHistory = []

function detectSign(allHandLandmarks) {
  if (!allHandLandmarks || allHandLandmarks.length === 0) {
    wristHistory.length = 0
    return null
  }
  const hand = allHandLandmarks[0]
  const f = getFingerStates(hand)

  const upCount = [f.indexUp, f.middleUp, f.ringUp, f.pinkyUp].filter(Boolean).length
  const curledCount = [f.indexCurled, f.middleCurled, f.ringCurled, f.pinkyCurled].filter(Boolean).length

  // ── Track wrist position for COUGH ──
  const wristY = hand[0].y
  wristHistory.push({ y: wristY, t: Date.now() })
  if (wristHistory.length > 30) wristHistory.shift()

  // ── COUGH: closed fist + tapping motion ──
  // All 4 fingers curled (at least 3), no fingers extended, thumb state doesn't matter
  const isFist = curledCount >= 3 && upCount === 0
  if (isFist) {
    // Check for tapping: count direction reversals in wrist Y over recent frames
    if (wristHistory.length >= 10) {
      const recent = wristHistory.slice(-12)
      let reversals = 0
      for (let i = 2; i < recent.length; i++) {
        const d1 = recent[i - 1].y - recent[i - 2].y
        const d2 = recent[i].y - recent[i - 1].y
        // Sign change with enough magnitude to be a real tap (not noise)
        if ((d1 > 0.008 && d2 < -0.008) || (d1 < -0.008 && d2 > 0.008)) {
          reversals++
        }
      }
      if (reversals >= 2) {
        return { sign: 'COUGH', odia: 'କାଶ', confidence: 0.90 }
      }
    }
    // Static fist at chest level (no tapping yet, but holding the position)
    // Return null — don't match YES/NO for a closed fist, wait for taps
    return null
  }

  // ── Finger-count signs (most fingers → fewest) ──

  if (upCount === 4)
    return { sign: 'FEVER', odia: 'ଜ୍ୱର', confidence: 0.93 }

  if (upCount === 3 && f.indexUp && f.middleUp && f.ringUp)
    return { sign: 'HELP', odia: 'ସାହାଯ୍ୟ', confidence: 0.87 }

  if (upCount === 2 && f.indexUp && f.middleUp)
    return { sign: 'HEADACHE', odia: 'ମୁଣ୍ଡ ବ୍ୟଥା', confidence: 0.88 }

  if (upCount === 2 && !f.indexUp && f.middleUp && f.ringUp)
    return { sign: 'DIARRHEA', odia: 'ତରଳ ଝାଡ଼ା', confidence: 0.85 }

  if (upCount === 2 && !f.indexUp && !f.middleUp && f.ringUp && f.pinkyUp)
    return { sign: 'VOMITING', odia: 'ବାନ୍ତି', confidence: 0.86 }

  if (upCount === 1 && f.indexUp)
    return { sign: 'PAIN', odia: 'ବ୍ୟଥା', confidence: 0.90 }

  if (upCount === 1 && f.pinkyUp)
    return { sign: 'COUGH', odia: 'କାଶ', confidence: 0.84 }

  // YES: thumb clearly sticking up, all 4 fingers down
  if (f.thumbExtended && upCount === 0)
    return { sign: 'YES', odia: 'ହଁ', confidence: 0.91 }

  // NO: relaxed hand, nothing extended, not a tight fist
  // (tight fist is handled above as COUGH-waiting)
  if (!f.thumbExtended && upCount === 0 && curledCount <= 2)
    return { sign: 'NO', odia: 'ନା', confidence: 0.89 }

  return null
}

// ─── Sign Card ────────────────────────────────────────────────────────────────
function SignCard({ sign, odia, Diagram, howTo, isActive, progress, flashGreen }) {
  const [expanded, setExpanded] = useState(false)
  const progressPct = Math.round((progress / 7) * 100)

  return (
    <div
      onClick={() => setExpanded(e => !e)}
      style={{
        background: flashGreen ? '#f0fdf4' : isActive ? TEAL_LIGHT : '#fff',
        border: `2.5px solid ${flashGreen ? '#22c55e' : isActive ? TEAL : '#e5e7eb'}`,
        borderRadius: 16,
        padding: '0.875rem',
        cursor: 'pointer',
        transition: 'all 0.2s',
        boxShadow: isActive ? `0 0 0 4px ${TEAL}2a` : flashGreen ? '0 0 0 4px #22c55e33' : '0 1px 3px rgba(0,0,0,0.06)',
        position: 'relative',
      }}
    >
      {/* Camera icon when detecting */}
      {isActive && (
        <div style={{ position: 'absolute', top: 8, right: 8, background: TEAL, borderRadius: '50%', width: 22, height: 22, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="white"><path d="M23 7l-7 5 7 5V7z"/><rect x="1" y="5" width="15" height="14" rx="2"/></svg>
        </div>
      )}

      {/* SVG Diagram — large */}
      <div style={{ width: '100%', height: 130, marginBottom: '0.625rem', background: '#fafafa', borderRadius: 10, padding: '0.375rem', border: '1px solid #f3f4f6', overflow: 'hidden' }}>
        <Diagram />
      </div>

      {/* Progress bar */}
      {isActive && progress > 0 && (
        <div style={{ height: 5, background: '#e5e7eb', borderRadius: 99, marginBottom: '0.5rem', overflow: 'hidden' }}>
          <div style={{ height: '100%', width: `${progressPct}%`, background: flashGreen ? '#22c55e' : TEAL, borderRadius: 99, transition: 'width 0.1s' }} />
        </div>
      )}

      {/* Labels */}
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontWeight: 800, fontSize: '0.9375rem', color: flashGreen ? '#16a34a' : isActive ? TEAL : '#111' }}>{sign}</div>
        <div style={{ fontFamily: "'Noto Sans Oriya', sans-serif", fontSize: '0.8125rem', color: '#6b7280' }}>{odia}</div>
        <div style={{ fontSize: '0.625rem', color: '#9ca3af', marginTop: 2 }}>tap for steps</div>
      </div>

      {/* Expanded steps */}
      {expanded && (
        <div style={{ borderTop: '1px solid #e5e7eb', paddingTop: '0.625rem', marginTop: '0.625rem' }}>
          {howTo.map((step, i) => (
            <div key={i} style={{ display: 'flex', gap: '0.5rem', fontSize: '0.75rem', color: '#374151', marginBottom: '0.375rem', alignItems: 'flex-start' }}>
              <span style={{ background: TEAL, color: '#fff', borderRadius: '50%', width: 17, height: 17, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.625rem', fontWeight: 700, flexShrink: 0 }}>{i + 1}</span>
              <span style={{ lineHeight: 1.4 }}>{step}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function ISLPage() {
  const navigate = useNavigate()
  const videoRef   = useRef(null)
  const canvasRef  = useRef(null)
  const handsRef   = useRef(null)
  const cameraRef  = useRef(null)
  const frameBuffer     = useRef([])
  const flashTimeout    = useRef(null)

  const mountedRef = useRef(true)

  const [cameraOn, setCameraOn]           = useState(false)
  const [loading, setLoading]             = useState(false)
  const [currentSign, setCurrentSign]     = useState(null)
  const [detectedSymptoms, setDetectedSymptoms] = useState([])
  const [flashSign, setFlashSign]         = useState(null)
  const [frameProgress, setFrameProgress] = useState(0)
  const [error, setError]                 = useState('')

  function loadScript(src) {
    return new Promise((resolve, reject) => {
      if (document.querySelector(`script[src="${src}"]`)) { resolve(); return }
      const s = document.createElement('script')
      s.src = src; s.onload = resolve; s.onerror = reject
      document.head.appendChild(s)
    })
  }

  const onResults = useCallback((results) => {
    if (!mountedRef.current) return
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')

    ctx.save()
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    ctx.drawImage(results.image, 0, 0, canvas.width, canvas.height)

    if (results.multiHandLandmarks?.length > 0) {
      if (window.drawConnectors && window.drawLandmarks && window.HAND_CONNECTIONS) {
        for (const lm of results.multiHandLandmarks) {
          window.drawConnectors(ctx, lm, window.HAND_CONNECTIONS, { color: '#00FF00', lineWidth: 2 })
          window.drawLandmarks(ctx, lm, { color: '#FF0000', lineWidth: 1, radius: 3 })
        }
      }

      const result = detectSign(results.multiHandLandmarks)
      setCurrentSign(result)

      // Stability buffer
      frameBuffer.current.push(result?.sign || null)
      if (frameBuffer.current.length > 7) frameBuffer.current.shift()

      const buf = frameBuffer.current
      const allSame = buf.length === 7 && buf.every(s => s === buf[0]) && buf[0]

      // Progress toward 7 frames
      if (result) {
        const recent = buf.slice(-7)
        const sameCount = recent.filter(s => s === result.sign).length
        setFrameProgress(sameCount)
      } else {
        setFrameProgress(0)
      }

      if (allSame) {
        const now = Date.now()
        const signName = buf[0]

        setDetectedSymptoms(prev => {
          const alreadyAdded = prev.some(s => s.sign === signName)
          if (alreadyAdded) return prev
          // Flash green only on new addition
          setFlashSign(signName)
          clearTimeout(flashTimeout.current)
          flashTimeout.current = setTimeout(() => setFlashSign(null), 800)
          return [...prev, {
            id: now,
            sign: signName,
            odia: result.odia,
            confidence: result.confidence,
            time: now,
          }]
        })

        frameBuffer.current = []
      }
    } else {
      frameBuffer.current = []
      setCurrentSign(null)
      setFrameProgress(0)
    }

    ctx.restore()
  }, [])

  async function startCamera() {
    setLoading(true); setError('')
    // Render the video element first before trying to use it
    setCameraOn(true)
    await new Promise(r => setTimeout(r, 50))
    try {
      await loadScript('https://cdn.jsdelivr.net/npm/@mediapipe/hands/hands.js')
      await loadScript('https://cdn.jsdelivr.net/npm/@mediapipe/drawing_utils/drawing_utils.js')
      await loadScript('https://cdn.jsdelivr.net/npm/@mediapipe/camera_utils/camera_utils.js')
      const stream = await navigator.mediaDevices.getUserMedia({ video: true })
      videoRef.current.srcObject = stream
      await videoRef.current.play()
      const hands = new window.Hands({ locateFile: f => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${f}` })
      hands.setOptions({ maxNumHands: 2, modelComplexity: 1, minDetectionConfidence: 0.5, minTrackingConfidence: 0.4, selfieMode: true })
      hands.onResults(onResults)
      handsRef.current = hands
      const camera = new window.Camera(videoRef.current, {
        onFrame: async () => {
          const video = videoRef.current
          const canvas = canvasRef.current
          if (!video || !canvas) return
          canvas.width = video.videoWidth
          canvas.height = video.videoHeight
          await hands.send({ image: video })
        },
        width: 480, height: 360,
      })
      camera.start()
      cameraRef.current = camera
    } catch (err) {
      setCameraOn(false)
      setError('Could not access camera. Please allow camera permission and try again.')
    } finally {
      setLoading(false)
    }
  }

  function stopCamera() {
    try { cameraRef.current?.stop() } catch {}
    try { handsRef.current?.close() } catch {}
    try {
      if (videoRef.current?.srcObject) {
        videoRef.current.srcObject.getTracks().forEach(t => t.stop())
        videoRef.current.srcObject = null
      }
    } catch {}
    frameBuffer.current = []
    if (mountedRef.current) {
      setCameraOn(false); setCurrentSign(null); setFrameProgress(0)
    }
  }

  useEffect(() => {
    mountedRef.current = true
    return () => {
      mountedRef.current = false
      clearTimeout(flashTimeout.current)
      try { cameraRef.current?.stop() } catch {}
      try { handsRef.current?.close() } catch {}
      try {
        if (videoRef.current?.srcObject) {
          videoRef.current.srcObject.getTracks().forEach(t => t.stop())
          videoRef.current.srcObject = null
        }
      } catch {}
    }
  }, [])

  function removeSymptom(id) {
    setDetectedSymptoms(prev => prev.filter(s => s.id !== id))
  }

  function addToPatient() {
    const text = detectedSymptoms.map(s => s.sign).join(', ')
    navigate('/patient', { state: { prefill: { symptomText: text } } })
  }

  function timeAgo(ts) {
    const s = Math.floor((Date.now() - ts) / 1000)
    if (s < 5) return 'just now'
    if (s < 60) return `${s}s ago`
    return `${Math.floor(s / 60)}m ago`
  }

  return (
    <div style={{ minHeight: '100dvh', background: '#f7f9f8', display: 'flex', flexDirection: 'column' }}>

      {/* Header */}
      <header style={{ background: '#fff', borderBottom: '1px solid #e5e7eb', padding: '0.875rem 1.25rem', display: 'flex', alignItems: 'center', gap: '0.875rem', position: 'sticky', top: 0, zIndex: 10 }}>
        <button onClick={() => { stopCamera(); navigate('/patient') }}
          style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: '0.25rem', display: 'flex', alignItems: 'center', color: TEAL }}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6"/>
          </svg>
        </button>
        <div>
          <div style={{ fontWeight: 700, fontSize: '1.0625rem', color: '#111' }}>ISL Sign Language</div>
          <div style={{ fontSize: '0.8125rem', color: '#6b7280' }}>Tap any card to see step-by-step instructions</div>
        </div>
      </header>

      <main style={{ flex: 1, padding: '1.25rem', maxWidth: 760, width: '100%', margin: '0 auto' }}>

        {/* Tip */}
        <div style={{ background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 10, padding: '0.625rem 0.875rem', marginBottom: '1.25rem', fontSize: '0.8125rem', color: '#92400e' }}>
          💡 Each card shows the correct ISL hand position with animated arrows. <strong>Tap a card</strong> for step-by-step instructions. Hold any sign for ~1 second to register it.
        </div>

        {/* Sign Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: '0.75rem', marginBottom: '1.5rem' }}>
          {SIGNS.map(s => (
            <SignCard
              key={s.sign}
              {...s}
              isActive={currentSign?.sign === s.sign}
              progress={currentSign?.sign === s.sign ? frameProgress : 0}
              flashGreen={flashSign === s.sign}
            />
          ))}
        </div>

        {/* Camera */}
        <div style={{ background: '#fff', borderRadius: 16, border: '1px solid #e5e7eb', overflow: 'hidden', marginBottom: '1rem' }}>
          <div style={{ background: '#111', minHeight: cameraOn ? 'auto' : 180, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {cameraOn ? (
              <div style={{ position: 'relative', width: '100%', maxWidth: '640px', margin: '0 auto' }}>
                <video
                  ref={videoRef}
                  style={{ width: '100%', height: 'auto', display: 'block', transform: 'scaleX(-1)' }}
                  autoPlay
                  muted
                  playsInline
                />
                <canvas
                  ref={canvasRef}
                  style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', transform: 'scaleX(-1)', pointerEvents: 'none' }}
                />
                {/* Live overlay label */}
                {currentSign && (
                  <div style={{ position: 'absolute', bottom: 10, left: '50%', transform: 'translateX(-50%)', background: 'rgba(0,0,0,0.72)', color: '#fff', borderRadius: 99, padding: '0.3rem 1.1rem', fontSize: '0.9rem', fontWeight: 700, whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span>{currentSign.sign}</span>
                    <span style={{ fontFamily: "'Noto Sans Oriya', sans-serif", fontSize: '0.8rem', opacity: 0.85 }}>{currentSign.odia}</span>
                    <span style={{ fontSize: '0.7rem', opacity: 0.7 }}>{Math.round(currentSign.confidence * 100)}%</span>
                  </div>
                )}
              </div>
            ) : (
              <div style={{ textAlign: 'center', color: '#9ca3af', padding: '2rem' }}>
                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ marginBottom: 8, opacity: 0.4 }}>
                  <path d="M23 7l-7 5 7 5V7z"/><rect x="1" y="5" width="15" height="14" rx="2"/>
                </svg>
                <div style={{ fontSize: '0.9rem' }}>Camera off</div>
              </div>
            )}
          </div>

          <div style={{ padding: '1rem' }}>
            {error && <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8, padding: '0.625rem', color: '#dc2626', fontSize: '0.875rem', marginBottom: '0.75rem' }}>⚠ {error}</div>}
            {!cameraOn ? (
              <button onClick={startCamera} disabled={loading}
                style={{ width: '100%', padding: '0.875rem', background: loading ? '#9ca3af' : TEAL, color: '#fff', border: 'none', borderRadius: 10, fontSize: '1rem', fontWeight: 700, cursor: loading ? 'default' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                {loading
                  ? <><span style={{ display: 'inline-block', width: 18, height: 18, border: '2px solid #fff4', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }}/>Loading hand detector…</>
                  : 'Start Camera'}
              </button>
            ) : (
              <button onClick={stopCamera}
                style={{ width: '100%', padding: '0.75rem', background: '#fee2e2', color: '#dc2626', border: '1.5px solid #fecaca', borderRadius: 10, fontSize: '0.9375rem', fontWeight: 700, cursor: 'pointer' }}>
                Stop Camera
              </button>
            )}
          </div>
        </div>

        {/* Detected Symptoms List */}
        <div style={{ background: '#fff', borderRadius: 16, border: '1px solid #e5e7eb', padding: '1.125rem', marginBottom: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.875rem' }}>
            <div>
              <div style={{ fontWeight: 700, fontSize: '0.9375rem', color: '#111' }}>
                Detected Symptoms
              </div>
              <div style={{ fontFamily: "'Noto Sans Oriya', sans-serif", fontSize: '0.8125rem', color: '#6b7280' }}>
                ଚିହ୍ନଟ ଲକ୍ଷଣ
              </div>
            </div>
            {detectedSymptoms.length > 0 && (
              <button onClick={() => setDetectedSymptoms([])}
                style={{ background: 'transparent', border: '1px solid #e5e7eb', borderRadius: 8, padding: '0.25rem 0.625rem', fontSize: '0.75rem', color: '#6b7280', cursor: 'pointer' }}>
                Clear All
              </button>
            )}
          </div>

          {detectedSymptoms.length === 0 ? (
            <div style={{ textAlign: 'center', color: '#9ca3af', fontSize: '0.875rem', padding: '1.5rem 0' }}>
              No symptoms detected yet — show a hand sign to the camera
            </div>
          ) : (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
              {detectedSymptoms.map(sym => (
                <div key={sym.id} style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', background: '#f0fdf4', border: '1.5px solid #bbf7d0', borderRadius: 99, padding: '0.3rem 0.75rem' }}>
                  <div>
                    <span style={{ fontWeight: 700, fontSize: '0.875rem', color: '#15803d' }}>{sym.sign}</span>
                    <span style={{ fontFamily: "'Noto Sans Oriya', sans-serif", fontSize: '0.75rem', color: '#16a34a', marginLeft: 4 }}>{sym.odia}</span>
                  </div>
                  <span style={{ fontSize: '0.625rem', color: '#86efac' }}>{timeAgo(sym.time)}</span>
                  <button onClick={() => removeSymptom(sym.id)}
                    style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#86efac', fontSize: '1rem', lineHeight: 1, padding: 0, marginLeft: 2 }}>
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}

          {detectedSymptoms.length > 0 && (
            <button onClick={addToPatient}
              style={{ marginTop: '1rem', width: '100%', padding: '0.875rem', background: TEAL, color: '#fff', border: 'none', borderRadius: 10, fontSize: '1rem', fontWeight: 700, cursor: 'pointer' }}>
              Add to Patient Form | ରୋଗୀ ଫର୍ମରେ ଯୋଗ କରନ୍ତୁ →
            </button>
          )}
        </div>
      </main>

      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
    </div>
  )
}
