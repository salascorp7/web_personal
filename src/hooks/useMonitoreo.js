import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '../context/AuthContext'

export function useMonitoreo(tab) {
  const { getToken } = useAuth()
  const [data,    setData]    = useState([])
  const [loading, setLoading] = useState(true)
  const [error,   setError]   = useState(null)

  const load = useCallback(() => {
    setLoading(true)
    setError(null)
    const token = getToken()
    fetch(`/api/analytics?tab=${tab}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(r => { if (!r.ok) throw new Error('Error al cargar'); return r.json() })
      .then(d  => { if (d.error) throw new Error(d.error); setData(d) })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false))
  }, [tab, getToken])

  useEffect(() => { load() }, [load])

  return { data, loading, error, reload: load }
}
