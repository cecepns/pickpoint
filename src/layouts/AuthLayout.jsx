import PropTypes from 'prop-types'
import { FaBox } from 'react-icons/fa'

const AuthLayout = ({ children }) => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-secondary-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <div className="text-center mb-6 animate-fade-in">
          <div className="flex items-center justify-center mb-2">
            <FaBox className="text-primary-600 text-4xl mr-2" />
            <h1 className="text-3xl font-bold text-primary-800">PickPoint</h1>
          </div>
          <p className="text-gray-600">Package Management System</p>
        </div>
        
        <div className="bg-white rounded-lg shadow-lg p-6 animate-slide-in">
          {children}
        </div>
        
        <div className="mt-6 text-center text-sm text-gray-500">
          <p>© {new Date().getFullYear()} PickPoint. All rights reserved.</p>
        </div>
      </div>
    </div>
  )
}

AuthLayout.propTypes = {
  children: PropTypes.node.isRequired
}

export default AuthLayout