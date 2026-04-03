import { useEffect, useRef } from 'react'

const slides = [
  { src: '/assets/images/poblacion.jpg', alt: 'Población' },
  { src: '/assets/images/ai.jpg', alt: 'Inteligencia Artificial' },
  { src: '/assets/images/code.jpg', alt: 'Código' },
]

export default function Hero() {
  const carouselRef = useRef(null)

  useEffect(() => {
    const el = carouselRef.current
    if (!el) return
    // Bootstrap 5 — init carousel programmatically to avoid duplicate instances
    const { Carousel } = window.bootstrap || {}
    if (Carousel) {
      const instance = new Carousel(el, { ride: true, pause: false, interval: 4000 })
      return () => instance.dispose()
    }
  }, [])

  return (
    <section id="main">
      <div
        ref={carouselRef}
        id="heroCarousel"
        className="carousel slide carousel-fade"
      >
        <div className="carousel-inner">
          {slides.map((slide, i) => (
            <div key={i} className={`carousel-item${i === 0 ? ' active' : ''}`}>
              <img
                className="hero-img"
                src={slide.src}
                alt={slide.alt}
                loading={i === 0 ? 'eager' : 'lazy'}
              />
            </div>
          ))}
        </div>

      </div>

      {/* Overlay encima del carousel, relativo a la sección */}
      <div className="hero-overlay">
        <div className="container text-center text-white px-3">
          <h1 className="display-4 fw-bold mb-3">Inteligencia Artificial</h1>
          <p className="lead mb-4 mx-auto" style={{ maxWidth: 520 }}>
            "Bienvenido a mi página de Inteligencia Artificial. Aquí comparto mis conocimientos
            técnicos y desarrollo proyectos prácticos. ¡Ven y aprende conmigo!"
          </p>
          <div className="d-flex flex-wrap gap-3 justify-content-center">
            <a href="#projects" className="btn btn-outline-light btn-lg">
              Consultar proyectos
            </a>
            <a
              href="https://www.linkedin.com/in/oscar-salas-633b5569/"
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-linkedin btn-lg"
            >
              Contactar autor
            </a>
          </div>
        </div>
      </div>
    </section>
  )
}
