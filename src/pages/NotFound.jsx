import { Link } from 'react-router-dom'
import { FaHome, FaBoxOpen } from 'react-icons/fa'

const NotFound = () => {
  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-center p-4">
      <div className="text-center">
        <div className="flex justify-center mb-4">
          <FaBoxOpen className="text-6xl text-primary-600" />
        </div>
        
        <h1 className="text-4xl font-bold text-gray-800 mb-2">404</h1>
        <h2 className="text-2xl font-semibold text-gray-700 mb-4">Page Not Found</h2>
        
        <p className="text-gray-600 max-w-md mx-auto mb-6">
          The page you're looking for doesn't exist or has been moved.
        </p>
        
        <Link to="/dashboard" className="btn-primary inline-flex items-center">
          <FaHome className="mr-2" />
          Back to Dashboard
        </Link>
      </div>
    </div>
  )
}

export default NotFound