import { Link } from 'react-router-dom'
import projects from '../data/projects'

function Badge({ text, bg, textColor }) {
  return (
    <span className={`badge bg-${bg}${textColor ? ` text-${textColor}` : ''} me-1 mb-1`}>
      {text}
    </span>
  )
}

function ProjectCard({ project }) {
  const { title, description, image, badges, link, comingSoon, internal } = project

  const renderAction = () => {
    if (comingSoon) {
      return (
        <span className="badge bg-warning text-dark px-3 py-2 fs-6 mt-auto align-self-start">
          Próximamente
        </span>
      )
    }
    if (internal) {
      return (
        <Link to={link} className="btn btn-linkedin mt-auto align-self-start">
          Jugar ahora
        </Link>
      )
    }
    return (
      <a
        href={link}
        target="_blank"
        rel="noopener noreferrer"
        className="btn btn-linkedin mt-auto align-self-start"
      >
        Conoce más
      </a>
    )
  }

  return (
    <div className="card project-card">
      <img
        className="card-img-top"
        src={image}
        alt={title}
        loading="lazy"
      />
      <div className="card-body">
        <div className="mb-2">
          {badges.map((b, i) => (
            <Badge key={i} {...b} />
          ))}
        </div>
        <h5 className="card-title">{title}</h5>
        <p className="card-text text-muted">{description}</p>
        {renderAction()}
      </div>
    </div>
  )
}

export default function Projects() {
  return (
    <section id="projects" className="py-5 bg-light">
      <div className="container">
        <div className="text-center mb-5">
          <small className="text-uppercase text-muted fw-semibold">Conoce mis</small>
          <h2 className="section-title mt-1">Proyectos</h2>
        </div>

        <div className="row g-4">
          {projects.map(project => (
            <div key={project.id} className="col-12 col-md-6 col-lg-4">
              <ProjectCard project={project} />
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
