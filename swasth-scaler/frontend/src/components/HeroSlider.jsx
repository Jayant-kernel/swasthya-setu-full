import React, { useState, useEffect } from 'react';

const images = [
  {
    url: '/images/hero1.webp',
    caption: 'Health is not a privilege — it reaches every door',
    captionOdia: 'ସ୍ୱାସ୍ଥ୍ୟ ଏକ ସୁବିଧା ନୁହେଁ - ଏହା ପ୍ରତି ଦ୍ୱାରରେ ପହଞ୍ଚେ'
  },
  {
    url: '/images/hero2.jpg',
    caption: 'Your ASHA worker is closer than the nearest hospital',
    captionOdia: 'ଆପଣଙ୍କ ଆଶା କର୍ମୀ ନିକଟସ୍ଥ ଡାକ୍ତରଖାନା ତୁଳନାରେ ନିକଟତର'
  },
  {
    url: '/images/hero3.webp',
    caption: 'Connecting villages to care',
    captionOdia: 'ଗ୍ରାମକୁ ସ୍ୱାସ୍ଥ୍ୟ ସେବା ସଂଯୋଗ'
  },
  {
    url: '/images/hero4.jpg',
    caption: 'Empowering communities through technology',
    captionOdia: 'ପ୍ରଯୁକ୍ତିବିଦ୍ୟା ମାଧ୍ୟମରେ ସମ୍ପ୍ରଦାୟକୁ ସଶକ୍ତ କରିବା'
  }
];

export default function HeroSlider() {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % images.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  const nextSlide = () => setCurrentIndex((prev) => (prev + 1) % images.length);
  const prevSlide = () => setCurrentIndex((prev) => (prev - 1 + images.length) % images.length);

  return (
    <div className="hero-slider-container" style={{
      width: '100vw',
      position: 'relative',
      left: '50%',
      transform: 'translateX(-50%)',
      overflow: 'hidden',
      background: '#eee',
      marginBottom: '3rem'
    }}>
      <div className="slides-wrapper" style={{
        position: 'relative',
        width: '100%'
      }}>
        {images.map((image, index) => (
          <div
            key={index}
            style={{
              position: index === 0 ? 'relative' : 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              opacity: index === currentIndex ? 1 : 0,
              transition: 'opacity 1s ease-in-out',
              display: 'flex',
              flexDirection: 'column',
              zIndex: index === currentIndex ? 1 : 0
            }}
          >
            <div className="slide-image-container">
              <img
                src={image.url}
                alt={image.caption}
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                  objectPosition: 'center top'
                }}
                onError={(e) => {
                  e.target.src = `https://via.placeholder.com/1200x480?text=Hero+Image+${index + 1}`;
                }}
              />
            </div>
            
            <div className="slide-caption-overlay" style={{
              position: 'absolute',
              bottom: 0,
              left: 0,
              right: 0,
              background: 'linear-gradient(to top, rgba(0,0,0,0.65) 0%, transparent 100%)',
              padding: '2.5rem 2rem 1.25rem',
              color: 'white',
              zIndex: 2
            }}>
              <div style={{ maxWidth: '70%' }}>
                <h3 style={{ fontSize: '1.125rem', fontWeight: 600, marginBottom: '0.25rem' }}>
                  {image.caption}
                </h3>
                <div style={{ fontFamily: "'Noto Sans Oriya', sans-serif", fontSize: '1.125rem', opacity: 0.9 }}>
                  {image.captionOdia}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Slide Counter */}
      <div style={{
        position: 'absolute',
        top: '16px',
        right: '20px',
        background: 'rgba(0,0,0,0.35)',
        padding: '4px 10px',
        borderRadius: '20px',
        color: 'white',
        fontSize: '0.8125rem',
        zIndex: 10
      }}>
        {currentIndex + 1} / {images.length}
      </div>

      {/* Arrows */}
      <button 
        onClick={prevSlide}
        className="slider-arrow"
        style={{
          position: 'absolute',
          top: '50%',
          left: '20px',
          transform: 'translateY(-50%)',
          width: '48px',
          height: '48px',
          borderRadius: '50%',
          background: 'rgba(255,255,255,0.25)',
          backdropFilter: 'blur(4px)',
          border: '1.5px solid rgba(255,255,255,0.5)',
          color: 'white',
          fontSize: '1.25rem',
          cursor: 'pointer',
          zIndex: 10,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transition: 'background 0.3s ease'
        }}
        onMouseEnter={(e) => e.target.style.background = 'rgba(255,255,255,0.45)'}
        onMouseLeave={(e) => e.target.style.background = 'rgba(255,255,255,0.25)'}
      >
        ←
      </button>
      <button 
        onClick={nextSlide}
        className="slider-arrow"
        style={{
          position: 'absolute',
          top: '50%',
          right: '20px',
          transform: 'translateY(-50%)',
          width: '48px',
          height: '48px',
          borderRadius: '50%',
          background: 'rgba(255,255,255,0.25)',
          backdropFilter: 'blur(4px)',
          border: '1.5px solid rgba(255,255,255,0.5)',
          color: 'white',
          fontSize: '1.25rem',
          cursor: 'pointer',
          zIndex: 10,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transition: 'background 0.3s ease'
        }}
        onMouseEnter={(e) => e.target.style.background = 'rgba(255,255,255,0.45)'}
        onMouseLeave={(e) => e.target.style.background = 'rgba(255,255,255,0.25)'}
      >
        →
      </button>

      {/* Dot Indicators */}
      <div style={{
        position: 'absolute',
        bottom: '16px',
        left: '50%',
        transform: 'translateX(-50%)',
        display: 'flex',
        gap: '8px',
        zIndex: 10
      }}>
        {images.map((_, index) => (
          <div
            key={index}
            onClick={() => setCurrentIndex(index)}
            style={{
              width: '9px',
              height: '9px',
              borderRadius: '50%',
              background: index === currentIndex ? 'white' : 'rgba(255,255,255,0.5)',
              transform: index === currentIndex ? 'scale(1.3)' : 'scale(1)',
              transition: 'all 0.3s ease',
              cursor: 'pointer'
            }}
          />
        ))}
      </div>

      <style>{`
        .slide-image-container {
          height: 480px;
        }
        @media (max-width: 768px) {
          .slide-image-container {
            height: 380px;
          }
        }
        @media (max-width: 640px) {
          .slide-image-container {
            height: 260px;
          }
          .hero-slider-container button {
            width: 36px !important;
            height: 36px !important;
            left: 10px !important;
          }
          .hero-slider-container button:last-of-type {
            right: 10px !important;
            left: auto !important;
          }
        }
      `}</style>
    </div>
  );
}
