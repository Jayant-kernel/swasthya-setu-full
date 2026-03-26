import React, { useRef, useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import TopNav from '../components/TopNav.jsx';
import GlobalHeader from '../components/GlobalHeader.jsx';
import { Hands } from '@mediapipe/hands';

// ─── Config (mirrors config.py) ──────────────────────────────────
const SEQUENCE_LENGTH = 30;
const NUM_LANDMARKS = 21;
const LANDMARK_DIMS = 3;
const FEATURES_PER_FRAME = NUM_LANDMARKS * LANDMARK_DIMS; // 63
const TOTAL_FEATURES = FEATURES_PER_FRAME * 2; // 126

const CONFIRM_PREDICTIONS = 8;
const COOLDOWN_PREDICTIONS = 20;
const MIN_CONFIDENCE = 0.70;

const API_BASE = "/api";

// Hand skeleton connections (mirrors collect_data.py)
const HAND_CONNECTIONS = [
  [0,1],[1,2],[2,3],[3,4],
  [0,5],[5,6],[6,7],[7,8],
  [0,9],[9,10],[10,11],[11,12],
  [0,13],[13,14],[14,15],[15,16],
  [0,17],[17,18],[18,19],[19,20],
  [5,9],[9,13],[13,17],
];

function getConfidenceColor(conf) {
  if (conf >= 0.75) return "#00e664";
  if (conf >= 0.50) return "#00c8ff";
  return "#5050ff";
}

export default function ISLPage() {
  const navigate = useNavigate();
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const overlayCanvasRef = useRef(null);
  const handsRef = useRef(null);
  const sessionId = useRef("session-" + Date.now());
  const animFrameRef = useRef(null);

  // ─── State mirrors test_video.py's stabilizer ──────────────────
  const [apiState, setApiState] = useState({
    detection: null,
    active_label: null,
    active_confidence: 0,
    buffer_ready: false,
    all_detections: [],
  });

  // Local streak/cooldown state for the debug overlay (mirrors PredictionStabilizer)
  const streakRef = useRef({ label: null, count: 0 });
  const cooldownRef = useRef(0);
  const [debugInfo, setDebugInfo] = useState({
    streakLabel: null,
    streakCount: 0,
    cooldown: 0,
    bufferFill: 0,
    handsDetected: false,
    lastRawPrediction: null,
    lastRawConf: 0,
  });

  const [detections, setDetections] = useState([]);
  const [activeLabel, setActiveLabel] = useState(null);
  const [activeConf, setActiveConf] = useState(0);
  const [status, setStatus] = useState("Initializing MediaPipe...");
  const [apiConnected, setApiConnected] = useState(false);
  const frameCountRef = useRef(0);

  // ─── Health check ────────────────────────────────────────────────
  useEffect(() => {
    fetch(`${API_BASE}/health`)
      .then((r) => r.json())
      .then((d) => {
        setApiConnected(d.model_loaded);
        setStatus(d.model_loaded ? "Model loaded ✓" : "Model not loaded!");
      })
      .catch(() => {
        setApiConnected(false);
        setStatus("Cannot reach the Flask API via proxy");
      });
  }, []);

  // ─── Extract landmarks (mirrors collect_data.py) ─────────────────
  const extractLandmarks = useCallback((results) => {
    const landmarks = new Float32Array(TOTAL_FEATURES);
    if (results.multiHandLandmarks) {
      results.multiHandLandmarks.forEach((hand, handIdx) => {
        if (handIdx >= 2) return;
        const handedness = results.multiHandedness[handIdx]?.label;
        const offset = handedness === "Right" ? 0 : FEATURES_PER_FRAME;
        hand.forEach((lm, i) => {
          landmarks[offset + i * 3] = lm.x;
          landmarks[offset + i * 3 + 1] = lm.y;
          landmarks[offset + i * 3 + 2] = lm.z;
        });
      });
    }
    return Array.from(landmarks);
  }, []);

  // ─── Draw hand skeleton on overlay canvas (mirrors draw_hand_landmarks) ──
  const drawHandSkeleton = useCallback((results) => {
    const canvas = overlayCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const w = canvas.width;
    const h = canvas.height;
    ctx.clearRect(0, 0, w, h);

    if (!results.multiHandLandmarks) return;

    results.multiHandLandmarks.forEach((hand) => {
      // Draw connections
      ctx.strokeStyle = "rgba(0,255,150,0.85)";
      ctx.lineWidth = 2;
      HAND_CONNECTIONS.forEach(([a, b]) => {
        ctx.beginPath();
        ctx.moveTo(hand[a].x * w, hand[a].y * h);
        ctx.lineTo(hand[b].x * w, hand[b].y * h);
        ctx.stroke();
      });

      // Draw landmark dots
      hand.forEach((lm) => {
        const cx = lm.x * w;
        const cy = lm.y * h;
        ctx.beginPath();
        ctx.arc(cx, cy, 4, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(255,100,100,0.9)";
        ctx.fill();
        ctx.beginPath();
        ctx.arc(cx, cy, 6, 0, Math.PI * 2);
        ctx.strokeStyle = "rgba(255,255,255,0.7)";
        ctx.lineWidth = 1;
        ctx.stroke();
      });
    });
  }, []);

  // ─── Send frame to API ────────────────────────────────────────────
  const sendFrame = useCallback(
    async (landmarks, handsDetected) => {
      if (!apiConnected) return;
      try {
        const res = await fetch(`${API_BASE}/predict_frame`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            session_id: sessionId.current,
            landmarks,
          }),
        });
        const data = await res.json();

        setApiState(data);

        if (data.detection) {
          setDetections((prev) => [...prev, data.detection]);
          setActiveLabel(data.detection.label);
          setActiveConf(data.detection.confidence);
        }

        if (data.active_label !== undefined) {
          setActiveLabel(data.active_label);
          setActiveConf(data.active_confidence);
        }

        // Update debug info
        setDebugInfo((prev) => ({
          ...prev,
          bufferFill: data.buffer_ready ? 1 : prev.bufferFill,
          handsDetected,
        }));
      } catch (e) {
        // silent — don't spam
      }
    },
    [apiConnected]
  );

  // ─── MediaPipe setup ──────────────────────────────────────────────
  useEffect(() => {
    if (!videoRef.current) return;

    const loadMediaPipe = async () => {
      try {
        const hands = new Hands({
          locateFile: (file) =>
            `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`,
        });

        hands.setOptions({
          maxNumHands: 2,
          modelComplexity: 1,
          minDetectionConfidence: 0.7,
          minTrackingConfidence: 0.5,
        });

      hands.onResults(async (results) => {
        const handsDetected =
          results.multiHandLandmarks?.length > 0;

        drawHandSkeleton(results);

        frameCountRef.current += 1;
        // Send every 2 frames to match predict.py's frame_count % 5 behaviour
        // (browser is slower so every 2 is fine)
        if (frameCountRef.current % 2 === 0) {
          const lm = extractLandmarks(results);
          await sendFrame(lm, handsDetected);
          setDebugInfo((prev) => ({
            ...prev,
            handsDetected,
            bufferFill: Math.min(
              1,
              prev.bufferFill + 1 / SEQUENCE_LENGTH
            ),
          }));
        }
      });

      handsRef.current = hands;
      setStatus("MediaPipe ready");

      const video = videoRef.current;
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      video.srcObject = stream;
      await new Promise((res) => (video.onloadedmetadata = res));
      video.play();

      const loop = async () => {
        if (video.readyState >= 2) await hands.send({ image: video });
        animFrameRef.current = requestAnimationFrame(loop);
      };
      animFrameRef.current = requestAnimationFrame(loop);
      setStatus("Running");
      } catch (err) {
        setStatus("Error loading MediaPipe");
        console.error(err);
      }
    };

    loadMediaPipe();

    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      if (handsRef.current) handsRef.current.close();
      if (videoRef.current?.srcObject) {
        videoRef.current.srcObject.getTracks().forEach((t) => t.stop());
      }
    };
  }, [apiConnected, drawHandSkeleton, extractLandmarks, sendFrame]);

  // ─── Reset session ────────────────────────────────────────────────
  const handleReset = useCallback(async () => {
    await fetch(`${API_BASE}/reset`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ session_id: sessionId.current }),
    });
    setDetections([]);
    setActiveLabel(null);
    setActiveConf(0);
    setApiState({ detection: null, active_label: null, active_confidence: 0, buffer_ready: false, all_detections: [] });
    setDebugInfo({ streakLabel: null, streakCount: 0, cooldown: 0, bufferFill: 0, handsDetected: false, lastRawPrediction: null, lastRawConf: 0 });
    frameCountRef.current = 0;
  }, []);

  // ─── Derived display values ───────────────────────────────────────
  const bufferPct = apiState.buffer_ready ? 100 : Math.round((frameCountRef.current % SEQUENCE_LENGTH) / SEQUENCE_LENGTH * 100);
  const confColor = getConfidenceColor(activeConf);

  return (
    <div style={{ minHeight: '100dvh', background: '#0a0a0f', display: 'flex', flexDirection: 'column' }}>
      <GlobalHeader />
      <TopNav />
      
      <div style={{
        flex: 1,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "flex-start",
        padding: "20px",
        fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
        color: "#e0e0e0",
      }}>
        {/* Header */}
        <div style={{
          width: "100%",
          maxWidth: 900,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 16,
          borderBottom: "1px solid #222",
          paddingBottom: 12,
        }}>
          <div>
            <div style={{ fontSize: 11, color: "#555", letterSpacing: 3, textTransform: "uppercase" }}>
              Sign Language Recognition
            </div>
            <div style={{ fontSize: 18, fontWeight: 700, color: "#fff", letterSpacing: 1 }}>
              ISL — Debug Mode
            </div>
          </div>
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <div style={{
              width: 8, height: 8, borderRadius: "50%",
              background: apiConnected ? "#00e664" : "#ff4444",
              boxShadow: apiConnected ? "0 0 8px #00e664" : "0 0 8px #ff4444",
            }} />
            <span style={{ fontSize: 11, color: "#888" }}>
              {apiConnected ? "API CONNECTED" : "API OFFLINE"}
            </span>
            <button
              onClick={handleReset}
              style={{
                marginLeft: 12,
                padding: "5px 14px",
                background: "transparent",
                border: "1px solid #333",
                color: "#888",
                borderRadius: 4,
                fontSize: 11,
                cursor: "pointer",
                letterSpacing: 1,
                textTransform: "uppercase",
              }}
              onMouseEnter={(e) => { e.target.style.borderColor = "#555"; e.target.style.color = "#ccc"; }}
              onMouseLeave={(e) => { e.target.style.borderColor = "#333"; e.target.style.color = "#888"; }}
            >
              Reset
            </button>
          </div>
        </div>

        {/* Main layout */}
        <div style={{ display: "flex", gap: 16, width: "100%", maxWidth: 900, alignItems: "flex-start" }}>

          {/* Video + overlay */}
          <div style={{ flex: "0 0 auto", position: "relative" }}>
            {/* Header overlay — mirrors test_video.py header bar */}
            <div style={{
              position: "absolute", top: 0, left: 0, right: 0, zIndex: 10,
              background: "rgba(10,10,15,0.85)",
              borderRadius: "8px 8px 0 0",
              padding: "8px 12px",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              borderBottom: "1px solid #1a1a2a",
            }}>
              <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
                <span style={{ fontSize: 11, color: debugInfo.handsDetected ? "#00e664" : "#ff5050" }}>
                  {debugInfo.handsDetected ? "● HANDS DETECTED" : "○ NO HANDS"}
                </span>
                <span style={{ fontSize: 11, color: "#555" }}>
                  BUFFER: <span style={{ color: apiState.buffer_ready ? "#00e664" : "#888" }}>
                    {apiState.buffer_ready ? "READY" : `${bufferPct}%`}
                  </span>
                </span>
                <span style={{ fontSize: 11, color: "#555" }}>
                  DETECTED: <span style={{ color: "#aaa" }}>{detections.length}</span>
                </span>
              </div>
              <span style={{ fontSize: 10, color: "#333" }}>{status}</span>
            </div>

            {/* Video stack */}
            <div style={{ position: "relative", width: 640, height: 480, background: "#050508", borderRadius: 8, overflow: "hidden" }}>
              <video
                ref={videoRef}
                style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", objectFit: "cover", transform: "scaleX(-1)" }}
                muted
                playsInline
              />
              {/* Landmark canvas */}
              <canvas
                ref={overlayCanvasRef}
                width={640}
                height={480}
                style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", transform: "scaleX(-1)" }}
              />

              {/* Active prediction overlay — mimics test_video.py active detection display */}
              <div style={{
                position: "absolute", bottom: 0, left: 0, right: 0,
                background: "linear-gradient(transparent, rgba(0,0,0,0.85))",
                padding: "24px 16px 12px",
              }}>
                {activeLabel ? (
                  <div>
                    <div style={{
                      fontSize: 36, fontWeight: 800, color: confColor,
                      textShadow: `0 0 20px ${confColor}55`,
                      letterSpacing: 4, textTransform: "uppercase",
                      lineHeight: 1,
                    }}>
                      {activeLabel.replace(/_/g, " ")}
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 6 }}>
                      <div style={{
                        flex: 1,
                        height: 4,
                        background: "#1a1a1a",
                        borderRadius: 2,
                        overflow: "hidden",
                      }}>
                        <div style={{
                          width: `${activeConf * 100}%`,
                          height: "100%",
                          background: confColor,
                          boxShadow: `0 0 6px ${confColor}`,
                          borderRadius: 2,
                          transition: "width 0.3s ease",
                        }} />
                      </div>
                      <span style={{ fontSize: 13, color: confColor, minWidth: 48, textAlign: "right" }}>
                        {(activeConf * 100).toFixed(1)}%
                      </span>
                    </div>
                  </div>
                ) : (
                  <div style={{ fontSize: 13, color: "#444", letterSpacing: 2 }}>
                    WAITING FOR SIGN...
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Debug panel — right side, mirrors all the test_video.py overlay info */}
          <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 12 }}>

            {/* Stabilizer state */}
            <div style={{
              background: "#0d0d14",
              border: "1px solid #1a1a2a",
              borderRadius: 8,
              padding: 14,
            }}>
              <div style={{ fontSize: 10, color: "#444", letterSpacing: 2, marginBottom: 10, textTransform: "uppercase" }}>
                Stabilizer State
              </div>

              {/* Buffer fill */}
              <div style={{ marginBottom: 10 }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                  <span style={{ fontSize: 11, color: "#555" }}>BUFFER</span>
                  <span style={{ fontSize: 11, color: apiState.buffer_ready ? "#00e664" : "#888" }}>
                    {apiState.buffer_ready ? `${SEQUENCE_LENGTH}/${SEQUENCE_LENGTH}` : `filling...`}
                  </span>
                </div>
                <div style={{ height: 3, background: "#1a1a1a", borderRadius: 2, overflow: "hidden" }}>
                  <div style={{
                    width: apiState.buffer_ready ? "100%" : `${bufferPct}%`,
                    height: "100%",
                    background: apiState.buffer_ready ? "#00e664" : "#4488ff",
                    transition: "width 0.2s ease",
                  }} />
                </div>
              </div>

              {/* Streak / cooldown rows — exactly like test_video.py's indicators */}
              {apiState.all_detections?.length > 0 && (
                <div style={{ marginBottom: 10 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                    <span style={{ fontSize: 11, color: "#555" }}>COOLDOWN</span>
                    <span style={{ fontSize: 11, color: "#6060ff" }}>
                      {apiState.active_label ? "active" : "ready"}
                    </span>
                  </div>
                </div>
              )}

              {/* Threshold info */}
              <div style={{ display: "flex", flexDirection: "column", gap: 4, fontSize: 10, color: "#333", borderTop: "1px solid #141420", paddingTop: 8 }}>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span>CONFIRM STREAK</span>
                  <span style={{ color: "#555" }}>{CONFIRM_PREDICTIONS} frames</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span>COOLDOWN</span>
                  <span style={{ color: "#555" }}>{COOLDOWN_PREDICTIONS} frames</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span>MIN CONFIDENCE</span>
                  <span style={{ color: "#555" }}>{(MIN_CONFIDENCE * 100).toFixed(0)}%</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span>SEQUENCE LENGTH</span>
                  <span style={{ color: "#555" }}>{SEQUENCE_LENGTH} frames</span>
                </div>
              </div>
            </div>

            {/* Current prediction */}
            <div style={{
              background: "#0d0d14",
              border: `1px solid ${apiState.active_label ? "#1a3020" : "#1a1a2a"}`,
              borderRadius: 8,
              padding: 14,
            }}>
              <div style={{ fontSize: 10, color: "#444", letterSpacing: 2, marginBottom: 10, textTransform: "uppercase" }}>
                Active Detection
              </div>
              {apiState.active_label ? (
                <div>
                  <div style={{
                    fontSize: 22, fontWeight: 700,
                    color: confColor,
                    textTransform: "uppercase",
                    letterSpacing: 2,
                  }}>
                    {apiState.active_label.replace(/_/g, " ")}
                  </div>
                  <div style={{ fontSize: 12, color: "#555", marginTop: 2 }}>
                    confidence: <span style={{ color: confColor }}>{(apiState.active_confidence * 100).toFixed(1)}%</span>
                  </div>
                </div>
              ) : (
                <div style={{ fontSize: 12, color: "#333" }}>No active detection</div>
              )}
            </div>

            {/* Detections log — mirrors the "Detected signs" list in test_video.py */}
            <div style={{
              background: "#0d0d14",
              border: "1px solid #1a1a2a",
              borderRadius: 8,
              padding: 14,
              flex: 1,
              minHeight: 120,
              display: "flex",
              flexDirection: "column",
            }}>
              <div style={{
                fontSize: 10, color: "#444", letterSpacing: 2,
                marginBottom: 10, textTransform: "uppercase",
                display: "flex", justifyContent: "space-between",
              }}>
                <span>Detections Log</span>
                <span style={{ color: "#333" }}>{detections.length} total</span>
              </div>

              {detections.length === 0 ? (
                <div style={{ fontSize: 11, color: "#2a2a2a", flex: 1 }}>None yet...</div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 4, flex: 1 }}>
                  {[...detections].reverse().slice(0, 8).map((d, i) => (
                    <div key={d.index || i} style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                      padding: "5px 8px",
                      background: i === 0 ? "#111820" : "transparent",
                      borderRadius: 4,
                      borderLeft: i === 0 ? `2px solid ${getConfidenceColor(d.confidence)}` : "2px solid transparent",
                    }}>
                      <span style={{ fontSize: 10, color: "#333", minWidth: 20 }}>
                        #{d.index || detections.length - i}
                      </span>
                      <span style={{ fontSize: 12, color: i === 0 ? "#ddd" : "#555", textTransform: "uppercase", letterSpacing: 1, flex: 1 }}>
                        {d.label.replace(/_/g, " ")}
                      </span>
                      <span style={{ fontSize: 10, color: getConfidenceColor(d.confidence) }}>
                        {(d.confidence * 100).toFixed(0)}%
                      </span>
                    </div>
                  ))}
                </div>
              )}

              {/* Add to Patient Form Button directly replacing old implementation */}
              {detections.length > 0 && (
                <button onClick={() => {
                  const text = detections.map(d => d.label.replace(/_/g, ' ')).join(', ')
                  navigate('/patient', { state: { prefill: { symptomText: text } } })
                }}
                  style={{ marginTop: '1rem', width: '100%', padding: '0.875rem', background: '#0F6E56', color: '#fff', border: 'none', borderRadius: 10, fontSize: '0.9rem', fontWeight: 700, cursor: 'pointer' }}>
                  Add to Patient Form →
                </button>
              )}
            </div>

            {/* All class probabilities — bonus debug info */}
            <div style={{
              background: "#0d0d14",
              border: "1px solid #1a1a2a",
              borderRadius: 8,
              padding: 14,
              fontSize: 10,
              color: "#333",
            }}>
              <div style={{ letterSpacing: 2, marginBottom: 8, textTransform: "uppercase", color: "#444" }}>
                Model Info
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span>INPUT SHAPE</span>
                <span style={{ color: "#555" }}>30 × 126</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", marginTop: 3 }}>
                <span>HANDS</span>
                <span style={{ color: "#555" }}>2 × 21 landmarks</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", marginTop: 3 }}>
                <span>ARCH</span>
                <span style={{ color: "#555" }}>BiLSTM + Attention</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", marginTop: 3 }}>
                <span>SESSION</span>
                <span style={{ color: "#333", fontSize: 9 }}>{sessionId.current.slice(-8)}</span>
              </div>
            </div>

          </div>
        </div>

        {/* Bottom: no API fallback notice */}
        {!apiConnected && (
          <div style={{
            marginTop: 16,
            padding: "10px 20px",
            background: "#1a0a0a",
            border: "1px solid #3a1a1a",
            borderRadius: 6,
            fontSize: 12,
            color: "#aa4444",
            maxWidth: 900,
            width: "100%",
          }}>
            ⚠ API unreachable — ensure the Flask app is running on port 5000 and the Vite proxy is active.
          </div>
        )}
      </div>
    </div>
  );
}
