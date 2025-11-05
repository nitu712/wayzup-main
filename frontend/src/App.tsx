import { Outlet, NavLink } from 'react-router-dom'
import { ToastContainer } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'

export default function App() {
  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      <nav className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex items-center justify-between h-14">
            <div className="text-xl font-semibold">WayzUp</div>
            <div className="flex gap-4">
              <NavLink to="/" className={({isActive}) => `hover:text-blue-600 ${isActive ? 'text-blue-600' : ''}`}>Home</NavLink>
              <NavLink to="/report" className={({isActive}) => `hover:text-blue-600 ${isActive ? 'text-blue-600' : ''}`}>Report Hazard</NavLink>
              <NavLink to="/map" className={({isActive}) => `hover:text-blue-600 ${isActive ? 'text-blue-600' : ''}`}>View Map</NavLink>
              {/* About and Admin links removed */}
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-6xl mx-auto p-4">
        <Outlet />
      </main>

      <ToastContainer position="top-right" autoClose={2500} hideProgressBar={false} newestOnTop closeOnClick pauseOnHover />
    </div>
  )
}


