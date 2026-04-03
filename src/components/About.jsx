const skills = ['Inteligencia Artificial', 'Data Science', 'Business Intelligence', 'Machine Learning', 'Python', 'Power BI']

const stats = [
  { value: '9+', label: 'Proyectos' },
  { value: '5+', label: 'Años de exp.' },
  { value: '4', label: 'Tecnologías BI' },
]

export default function About() {
  return (
    <section id="about">
      <div className="container">
        <div className="about-inner">

          {/* Stats izquierda */}
          <div className="about-stats">
            {stats.map(({ value, label }) => (
              <div key={label} className="about-stat">
                <span className="about-stat-value">{value}</span>
                <span className="about-stat-label">{label}</span>
              </div>
            ))}
          </div>

          {/* Foto */}
          <div className="about-photo-wrap">
            <img
              src="/assets/images/TP.jpg"
              alt="Oscar Salas"
              className="profile-photo"
              loading="lazy"
            />
          </div>

          {/* Info */}
          <div className="about-info">
            <p className="about-label">Acerca de mí</p>
            <h2 className="about-name">Oscar Salas</h2>
            <p className="about-role">Ingeniero Industrial</p>

            <p className="about-bio">
              Apasionado por transformar datos en decisiones. Desarrollo proyectos
              de inteligencia artificial, análisis estadístico y visualización de
              datos para generar valor real en organizaciones.
            </p>

            <div className="about-skills">
              {skills.map(s => (
                <span key={s} className="about-skill-tag">{s}</span>
              ))}
            </div>

            <a
              href="https://www.linkedin.com/in/oscar-salas-633b5569/"
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-linkedin mt-4 px-4"
            >
              Ver perfil en LinkedIn
            </a>
          </div>
        </div>
      </div>
    </section>
  )
}
