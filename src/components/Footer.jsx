const links = [
  {
    label: 'Educación',
    href: 'https://www.linkedin.com/in/oscar-salas-633b5569/details/education/',
  },
  {
    label: 'Experiencia',
    href: 'https://www.linkedin.com/in/oscar-salas-633b5569/details/experience/',
  },
  {
    label: 'Certificaciones',
    href: 'https://www.linkedin.com/in/oscar-salas-633b5569/details/certifications/',
  },
]

export default function Footer() {
  return (
    <footer id="footer">
      <div className="container">
        <div className="row text-center">
          {links.map(({ label, href }) => (
            <div key={label} className="col-12 col-lg py-2">
              <a href={href} target="_blank" rel="noopener noreferrer">
                {label}
              </a>
            </div>
          ))}
        </div>
      </div>
    </footer>
  )
}
