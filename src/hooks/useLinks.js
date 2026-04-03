import { useState, useEffect } from 'react'

export function useLinks() {
  const [links,   setLinks]   = useState([])
  const [loading, setLoading] = useState(true)
  const [error,   setError]   = useState(null)

  useEffect(() => {
    fetch('/api/links')
      .then(r => {
        if (!r.ok) throw new Error('Error al cargar los links')
        return r.json()
      })
      .then(data => { setLinks(data); setLoading(false) })
      .catch(e  => { setError(e.message); setLoading(false) })
  }, [])

  // Agrupa por categoría preservando orden de aparición
  const grouped = links.reduce((acc, link) => {
    if (!acc[link.category]) acc[link.category] = []
    acc[link.category].push(link)
    return acc
  }, {})

  return { links, grouped, loading, error }
}
