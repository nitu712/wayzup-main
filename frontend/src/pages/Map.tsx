import { useEffect, useState, useMemo } from 'react'
import { GoogleMap, useLoadScript, Marker, InfoWindow } from '@react-google-maps/api'

type Hazard = {
  id: string
  lat: number
  lng: number
  description: string
  imagePreview?: string
}

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000'
const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY as string

export default function MapPage() {
  const { isLoaded } = useLoadScript({ googleMapsApiKey: GOOGLE_MAPS_API_KEY })
  const [hazards, setHazards] = useState<Hazard[]>([])
  const [selected, setSelected] = useState<Hazard | null>(null)
  const [useMock, setUseMock] = useState(true)
  const [nearbyOnly, setNearbyOnly] = useState(false)
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null)

  const MOCK_HAZARDS: Hazard[] = [
    { id: 'm1', lat: 28.6139, lng: 77.2090, description: 'Pothole near Connaught Place' },
    { id: 'm2', lat: 28.7041, lng: 77.1025, description: 'Fallen tree on main road' },
    { id: 'm3', lat: 28.4595, lng: 77.0266, description: 'Waterlogging after rain' },
  ]

  const fetchHazards = async () => {
    try {
      const res = await fetch(`${API_BASE}/hazards`)
      const data = await res.json()
      setHazards(data?.hazards || [])
    } catch (e) {
      console.error(e)
    }
  }

  useEffect(() => {
    if (!('geolocation' in navigator)) return
    navigator.geolocation.getCurrentPosition(
      (pos) => setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => setCoords(null),
      { enableHighAccuracy: true, timeout: 5000 }
    )
  }, [])

  useEffect(() => {
    fetchHazards()
    const id = setInterval(fetchHazards, 10000)
    return () => clearInterval(id)
  }, [])

  const dataToShow = useMemo(() => {
    const base = useMock && hazards.length === 0 ? MOCK_HAZARDS : hazards
    if (nearbyOnly && coords) {
      const within = (h: Hazard) => {
        const R = 6371000
        const toRad = (d: number) => d * Math.PI / 180
        const dphi = toRad(h.lat - coords.lat)
        const dlambda = toRad(h.lng - coords.lng)
        const a = Math.sin(dphi/2)**2 + Math.cos(toRad(coords.lat)) * Math.cos(toRad(h.lat)) * Math.sin(dlambda/2)**2
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))
        const d = R * c
        return d <= 2000 // 2km filter
      }
      return base.filter(within)
    }
    return base
  }, [useMock, hazards, nearbyOnly, coords])

  const center = useMemo(() => ({ lat: (dataToShow[0]?.lat) || 20.5937, lng: (dataToShow[0]?.lng) || 78.9629 }), [dataToShow])

  if (!GOOGLE_MAPS_API_KEY) {
    return <div className="text-red-600">Missing VITE_GOOGLE_MAPS_API_KEY</div>
  }

  if (!isLoaded) return <div>Loading map...</div>

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-2">
        <div className="text-sm text-gray-600">Verified hazards: {hazards.length} {useMock && hazards.length === 0 ? '(showing mock)' : ''}</div>
        <div className="flex items-center gap-3">
          <label className="inline-flex items-center gap-2 text-sm text-gray-700">
            <input type="checkbox" checked={useMock} onChange={(e) => setUseMock(e.target.checked)} />
            Show mock data if none
          </label>
          <label className="inline-flex items-center gap-2 text-sm text-gray-700">
            <input type="checkbox" checked={nearbyOnly} onChange={(e) => setNearbyOnly(e.target.checked)} />
            Nearby Hazards (≤2km)
          </label>
          <button onClick={fetchHazards} className="px-3 py-1.5 bg-gray-800 text-white rounded hover:bg-black">Refresh</button>
        </div>
      </div>
      <div className="h-[70vh] w-full rounded overflow-hidden border">
      <GoogleMap zoom={dataToShow.length ? 12 : 5} center={center} mapContainerClassName="h-full w-full">
        {dataToShow.map(h => (
          <Marker key={h.id} position={{ lat: h.lat, lng: h.lng }} onClick={() => setSelected(h)} />
        ))}
        {selected && (
          <InfoWindow position={{ lat: selected.lat, lng: selected.lng }} onCloseClick={() => setSelected(null)}>
            <div className="max-w-[220px]">
              <p className="text-sm font-semibold mb-1">Hazard</p>
              <p className="text-sm mb-2">{selected.description || 'No description'}</p>
              {selected.imagePreview && (
                <img src={selected.imagePreview} alt="hazard" className="rounded border max-h-40 object-cover" />
              )}
            </div>
          </InfoWindow>
        )}
      </GoogleMap>
      </div>
    </div>
  )
}


