import { useState, useEffect } from 'react'

export function useTasks() {
  const [tasks, setTasks]     = useState([])
  const [grouped, setGrouped] = useState({})
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState(null)

  useEffect(() => {
    fetch('/api/tasks')
      .then(r => {
        if (!r.ok) throw new Error('Error al cargar tareas')
        return r.json()
      })
      .then(data => {
        if (data.error) throw new Error(data.error)
        setTasks(data)
        const g = {}
        data.forEach(t => {
          if (!g[t.grupo]) g[t.grupo] = []
          g[t.grupo].push(t)
        })
        setGrouped(g)
      })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false))
  }, [])

  return { tasks, grouped, loading, error }
}
