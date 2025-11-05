import { Link } from 'react-router-dom'

export default function Home() {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">WayzUp – GIS-Based Community Hazard Alert System</h1>
      <p className="text-blue-700 font-medium">Your Local Road Safety Partner</p>
      <p className="text-gray-700 max-w-2xl">
        Report potholes, fallen trees, or waterlogging using a geo-tagged photo (or allow location). When more than
        one user reports the same spot, the hazard is auto-verified and shown on the map.
      </p>
      <div>
        <Link to="/report" className="inline-block px-6 py-3 bg-blue-600 text-white text-lg rounded hover:bg-blue-700">Report Hazard</Link>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="p-4 bg-white rounded border hover:shadow transition">
          <h3 className="font-semibold mb-2">Report a Hazard</h3>
          <p className="text-sm text-gray-600 mb-3">Click a photo or upload one, add a short note, and submit.</p>
          <Link to="/report" className="inline-block px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">Go to Report</Link>
        </div>
        <div className="p-4 bg-white rounded border hover:shadow transition">
          <h3 className="font-semibold mb-2">View Verified Hazards</h3>
          <p className="text-sm text-gray-600 mb-3">See nearby verified hazards on the map with photos.</p>
          <Link to="/map" className="inline-block px-4 py-2 bg-gray-900 text-white rounded hover:bg-black">Open Map</Link>
        </div>
      </div>
    </div>
  )
}


