import { useState, useEffect } from 'react'

export function useEntendimiento() {
  const [items,   setItems]   = useState([])
  const [grouped, setGrouped] = useState({})
  const [loading, setLoading] = useState(true)
  const [error,   setError]   = useState(null)

  useEffect(() => {
    fetch('/api/entendimiento')
      .then(r => {
        if (!r.ok) throw new Error('Error al cargar')
        return r.json()
      })
      .then(data => {
        if (data.error) throw new Error(data.error)
        setItems(data)
        const g = {}
        data.forEach(item => {
          if (!g[item.grupo]) g[item.grupo] = []
          g[item.grupo].push(item)
        })
        setGrouped(g)
      })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false))
  }, [])

  return { items, grouped, loading, error }
}
