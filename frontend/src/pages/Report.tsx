import { useEffect, useRef, useState } from 'react'
import { toast } from 'react-toastify'

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000'

export default function Report() {
  const [file, setFile] = useState<File | null>(null)
  const [description, setDescription] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [useLocation, setUseLocation] = useState(true)
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null)
  const [cameraOpen, setCameraOpen] = useState(false)
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)

  useEffect(() => {
    if (!useLocation) return
    if (!('geolocation' in navigator)) return
    navigator.geolocation.getCurrentPosition(
      (pos) => setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => setCoords(null),
      { enableHighAccuracy: true, timeout: 5000 }
    )
  }, [useLocation])

  useEffect(() => {
    if (file) {
      const url = URL.createObjectURL(file)
      setPreviewUrl(url)
      return () => URL.revokeObjectURL(url)
    }
    setPreviewUrl(null)
  }, [file])

  const openCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } })
      streamRef.current = stream
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        await videoRef.current.play()
      }
      setCameraOpen(true)
    } catch (e) {
      toast.error('Camera access denied or unavailable')
    }
  }

  const closeCamera = () => {
    streamRef.current?.getTracks().forEach(t => t.stop())
    streamRef.current = null
    setCameraOpen(false)
  }

  const capturePhoto = () => {
    if (!videoRef.current) return
    const video = videoRef.current
    const canvas = document.createElement('canvas')
    canvas.width = video.videoWidth
    canvas.height = video.videoHeight
    const ctx = canvas.getContext('2d')!
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
    canvas.toBlob((blob) => {
      if (blob) {
        const f = new File([blob], `capture_${Date.now()}.jpg`, { type: 'image/jpeg' })
        setFile(f)
        closeCamera()
      }
    }, 'image/jpeg', 0.9)
  }

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!file) {
      toast.error('Please choose a geo-tagged image')
      return
    }
    const form = new FormData()
    form.append('image', file)
    form.append('description', description)
    if (useLocation && coords) {
      form.append('lat', String(coords.lat))
      form.append('lng', String(coords.lng))
    }
    setSubmitting(true)
    try {
      const res = await fetch(`${API_BASE}/report`, { method: 'POST', body: form })
      const data = await res.json()
      if (!res.ok) {
        throw new Error(data?.error || 'Failed to report hazard')
      }
      toast.success('Hazard reported successfully')
      setFile(null)
      setDescription('')
    } catch (err: any) {
      toast.error(err.message || 'Something went wrong')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="max-w-xl">
      <h1 className="text-2xl font-semibold mb-4">Report Hazard</h1>
      <form onSubmit={onSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">Upload/Click Image</label>
          <input
            type="file"
            accept="image/*"
            capture="environment"
            onChange={(e) => setFile(e.target.files?.[0] || null)}
            className="block w-full"
          />
          <div className="flex gap-2 mt-2">
            <button type="button" onClick={openCamera} className="px-3 py-1.5 bg-gray-800 text-white rounded hover:bg-black">Use Camera</button>
            <label className="inline-flex items-center gap-2 text-sm text-gray-700">
              <input type="checkbox" checked={useLocation} onChange={(e) => setUseLocation(e.target.checked)} />
              Use current location if photo lacks GPS
            </label>
          </div>
          {previewUrl && (
            <img src={previewUrl} alt="preview" className="mt-3 rounded border max-h-64 object-contain" />
          )}
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Short Description</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="e.g., Fallen tree blocking the eastbound lane"
            className="w-full border rounded p-2 min-h-[96px]"
          />
        </div>
        <button
          type="submit"
          disabled={submitting}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-60"
        >
          {submitting ? 'Submitting...' : 'Submit Report'}
        </button>
      </form>
      <p className="text-xs text-gray-500 mt-3">Ensure your photo has GPS EXIF data or allow location.</p>

      {cameraOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded shadow w-full max-w-md p-3">
            <div className="flex items-center justify-between mb-2">
              <h2 className="font-semibold">Camera</h2>
              <button onClick={closeCamera} className="text-sm text-gray-600 hover:text-black">Close</button>
            </div>
            <video ref={videoRef} className="w-full rounded bg-black" playsInline muted />
            <div className="flex justify-end gap-2 mt-3">
              <button onClick={capturePhoto} className="px-3 py-1.5 bg-blue-600 text-white rounded hover:bg-blue-700">Capture</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}


