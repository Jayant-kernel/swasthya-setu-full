import React, { useRef, useEffect, useState, useCallback } from "react";
import { Hands } from '@mediapipe/hands';

const SEQUENCE_LENGTH = 30;
const NUM_LANDMARKS = 21;
const LANDMARK_DIMS = 3;
const FEATURES_PER_FRAME = NUM_LANDMARKS * LANDMARK_DIMS; // 63
const TOTAL_FEATURES = FEATURES_PER_FRAME * 2; // 126
const API_BASE = "/api";

const HAND_CONNECTIONS = [
  [0,1],[1,2],[2,3],[3,4],
  [0,5],[5,6],[6,7],[7,8],
  [0,9],[9,10],[11,12],
  [0,13],[13,14],[14,15],[15,16],
  [0,17],[17,18],[18,19],[19,20],
  [5,9],[9,13],[13,17],
];

export default function SignLanguageModal({ isOpen, onClose, onAddSymptom }) {
  const videoRef = useRef(null);
  const overlayCanvasRef = useRef(null);
  const handsRef = useRef(null);
  const sessionId = useRef("session-" + Date.now());
  const animFrameRef = useRef(null);
  const frameCountRef = useRef(0);

  const [apiConnected, setApiConnected] = useState(false);
  const [detections, setDetections] = useState([]);
  const [activeLabel, setActiveLabel] = useState(null);
  const [activeConf, setActiveConf] = useState(0);

  // ─── Health check ───
  useEffect(() => {
    if (!isOpen) return;
    fetch(`${API_BASE}/health`)
      .then((r) => r.json())
      .then((d) => setApiConnected(d.model_loaded))
      .catch(() => setApiConnected(false));
  }, [isOpen]);

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

  const drawHandSkeleton = useCallback((results) => {
    const canvas = overlayCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const w = canvas.width;
    const h = canvas.height;
    ctx.clearRect(0, 0, w, h);

    if (!results.multiHandLandmarks) return;

    results.multiHandLandmarks.forEach((hand) => {
      ctx.strokeStyle = "rgba(0,255,150,0.85)";
      ctx.lineWidth = 2;
      HAND_CONNECTIONS.forEach(([a, b]) => {
        if (hand[a] && hand[b]) {
           ctx.beginPath();
           ctx.moveTo(hand[a].x * w, hand[a].y * h);
           ctx.lineTo(hand[b].x * w, hand[b].y * h);
           ctx.stroke();
        }
      });
      hand.forEach((lm) => {
        const cx = lm.x * w;
        const cy = lm.y * h;
        ctx.beginPath();
        ctx.arc(cx, cy, 3, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(255,100,100,0.9)";
        ctx.fill();
      });
    });
  }, []);

  const sendFrame = useCallback(async (landmarks) => {
    if (!apiConnected) return;
    try {
      const res = await fetch(`${API_BASE}/predict_frame`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ session_id: sessionId.current, landmarks }),
      });
      const data = await res.json();
      if (data.detection) {
        setDetections((prev) => [...prev, data.detection]);
        setActiveLabel(data.detection.label);
        setActiveConf(data.detection.confidence);
      }
      if (data.active_label !== undefined) {
        setActiveLabel(data.active_label);
        setActiveConf(data.active_confidence);
      }
    } catch (e) {}
  }, [apiConnected]);

  useEffect(() => {
    if (!isOpen || !videoRef.current) return;

    const setup = async () => {
      const hands = new Hands({
        locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`,
      });

      hands.setOptions({
        maxNumHands: 2,
        modelComplexity: 1,
        minDetectionConfidence: 0.7,
        minTrackingConfidence: 0.5,
      });

      hands.onResults(async (results) => {
        drawHandSkeleton(results);
        frameCountRef.current += 1;
        if (frameCountRef.current % 2 === 0) {
          const lm = extractLandmarks(results);
          await sendFrame(lm);
        }
      });

      handsRef.current = hands;

      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await new Promise((res) => (videoRef.current.onloadedmetadata = res));
          videoRef.current.play();
        }

        const loop = async () => {
          if (videoRef.current && videoRef.current.readyState >= 2) {
            await hands.send({ image: videoRef.current });
          }
          animFrameRef.current = requestAnimationFrame(loop);
        };
        animFrameRef.current = requestAnimationFrame(loop);
      } catch (err) {
        console.error("Camera access denied", err);
      }
    };

    setup();

    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      if (handsRef.current) handsRef.current.close();
      if (videoRef.current?.srcObject) {
        videoRef.current.srcObject.getTracks().forEach((t) => t.stop());
      }
    };
  }, [isOpen, drawHandSkeleton, extractLandmarks, sendFrame]);

  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 2000,
      background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(4px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20
    }}>
      <div style={{
        background: '#0a0a0f', width: '100%', maxWidth: 500,
        borderRadius: 20, overflow: 'hidden', border: '1px solid #1a1a2a',
        boxShadow: '0 20px 50px rgba(0,0,0,0.5)', position: 'relative'
      }}>
        {/* Header */}
        <div style={{ padding: '12px 16px', borderBottom: '1px solid #1a1a2a', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: '#fff', letterSpacing: 1 }}>ISL SYMPTOM SCANNER</div>
          <button onClick={onClose} style={{ color: '#555', fontSize: 18 }}>✕</button>
        </div>

        {/* Video Area */}
        <div style={{ position: 'relative', width: '100%', aspectRatio: '4/3', background: '#000' }}>
          <video ref={videoRef} style={{ width: '100%', height: '100%', objectFit: 'cover', transform: 'scaleX(-1)' }} muted playsInline />
          <canvas ref={overlayCanvasRef} width={640} height={480} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', transform: 'scaleX(-1)' }} />
          
          {/* Prediction Overlay */}
          <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, background: 'linear-gradient(transparent, rgba(0,0,0,0.9))', padding: '20px 15px' }}>
            {activeLabel ? (
              <div style={{ color: '#00e664', fontSize: 24, fontWeight: 800, textTransform: 'uppercase' }}>
                {activeLabel.replace(/_/g, " ")}
                <div style={{ fontSize: 12, opacity: 0.7 }}>Confidence: {(activeConf * 100).toFixed(0)}%</div>
              </div>
            ) : (
              <div style={{ color: '#444', fontSize: 12, letterSpacing: 1 }}>WAITING FOR HAND SIGN...</div>
            )}
          </div>
        </div>

        {/* Action Area */}
        <div style={{ padding: 15 }}>
          <div style={{ fontSize: 11, color: '#555', marginBottom: 8 }}>RECENT DETECTIONS</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, maxHeight: 100, overflowY: 'auto', marginBottom: 15 }}>
            {detections.length === 0 && <span style={{ color: '#333', fontSize: 11 }}>No symptoms detected yet</span>}
            {[...new Set(detections.map(d => d.label))].map(label => (
              <button 
                key={label}
                onClick={() => onAddSymptom(label.replace(/_/g, ' '))}
                style={{ 
                  background: '#0F6E56', color: '#fff', border: 'none', 
                  borderRadius: 20, padding: '4px 12px', fontSize: 11, fontWeight: 600
                }}
              >
                + {label.replace(/_/g, ' ')}
              </button>
            ))}
          </div>
          <button 
            onClick={onClose}
            style={{ 
              width: '100%', padding: '12px', background: 'transparent', 
              border: '1px solid #1a1a2a', color: '#888', borderRadius: 10, fontSize: 13, fontWeight: 700 
            }}
          >
            DONE
          </button>
        </div>
      </div>
    </div>
  );
}
