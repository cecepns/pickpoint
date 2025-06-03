import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import PropTypes from 'prop-types'
import { 
  FaBox, 
  FaTachometerAlt, 
  FaBoxes, 
  FaUsers, 
  FaBuilding, 
  FaMoneyBillWave,
  FaUsersCog,
  FaBell,
  FaBars,
  FaTimes,
  FaSignOutAlt,
  FaUser
} from 'react-icons/fa'

const DashboardLayout = ({ children }) => {
  const { user, logout } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  
  const isAdmin = user?.role === 'admin'
  
  const menuItems = [
    {
      name: 'Dashboard',
      path: '/dashboard',
      icon: <FaTachometerAlt className="mr-3" />,
      allowedRoles: ['admin', 'staff']
    },
    {
      name: 'Packages',
      path: '/packages',
      icon: <FaBoxes className="mr-3" />,
      allowedRoles: ['admin', 'staff']
    },
    {
      name: 'Recipients',
      path: '/recipients',
      icon: <FaUsers className="mr-3" />,
      allowedRoles: ['admin', 'staff']
    },
    {
      name: 'Staff Management',
      path: '/staff',
      icon: <FaUsersCog className="mr-3" />,
      allowedRoles: ['admin']
    },
    {
      name: 'Locations',
      path: '/locations',
      icon: <FaBuilding className="mr-3" />,
      allowedRoles: ['admin']
    },
    {
      name: 'Pricing',
      path: '/prices',
      icon: <FaMoneyBillWave className="mr-3" />,
      allowedRoles: ['admin']
    },
    {
      name: 'Notification Settings',
      path: '/notification-settings',
      icon: <FaBell className="mr-3" />,
      allowedRoles: ['admin']
    }
  ]
  
  const filteredMenuItems = menuItems.filter(item => 
    item.allowedRoles.includes(user?.role)
  )
  
  const handleLogout = () => {
    logout()
    navigate('/login')
  }
  
  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen)
  }
  
  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      {/* Top navigation */}
      <nav className="bg-white shadow-sm z-10">
        <div className="max-w-full px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-10">
            <div className="flex items-center">
              <button 
                onClick={toggleSidebar} 
                className="md:hidden p-2 rounded-md text-gray-600 hover:text-gray-900 focus:outline-none"
              >
                <FaBars className="h-3 w-3" />
              </button>
              <div className="flex-shrink-0 flex items-center">
                <FaBox className="h-4 w-4 text-primary-600" />
                <span className="ml-2 text-xl font-bold text-primary-800">PickPoint</span>
              </div>
            </div>
            
            <div className="flex items-center">
              <div className="hidden md:flex items-center">
                <div className="flex items-center space-x-2 mr-4">
                  <div className="h-4 w-4 rounded-full bg-primary-100 flex items-center justify-center text-primary-700">
                    <FaUser className="h-2 w-2" />
                  </div>
                  <div>
                    <div className="text-sm font-medium text-gray-700">{user?.fullName}</div>
                    <div className="text-xs text-gray-500 capitalize">{user?.role}</div>
                  </div>
                </div>
                <button 
                  onClick={handleLogout}
                  className="p-2 rounded-md text-gray-600 hover:text-gray-900 focus:outline-none"
                >
                  <FaSignOutAlt className="h-3 w-3" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </nav>
      
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 z-20 bg-gray-900 bg-opacity-50 md:hidden"
          onClick={toggleSidebar}
        ></div>
      )}
      
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <aside 
          className={`fixed inset-y-0 left-0 w-64 bg-white shadow-md transform transition-transform duration-300 ease-in-out z-30 md:translate-x-0 md:static md:h-auto ${
            sidebarOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
        >
          <div className="h-full flex flex-col justify-between">
            <div className="px-4 py-4">
              <button 
                onClick={toggleSidebar} 
                className="md:hidden absolute top-4 right-4 p-2 rounded-md text-gray-600 hover:text-gray-900 focus:outline-none"
              >
                <FaTimes className="h-3 w-3" />
              </button>
              
              <nav className="space-y-1 mt-4 md:mt-0">
                {filteredMenuItems.map((item) => (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`flex items-center p-2 text-sm rounded-md transition-colors ${
                      location.pathname === item.path
                        ? 'bg-primary-50 text-primary-700 font-medium'
                        : 'text-gray-600 hover:bg-gray-50'
                    }`}
                    onClick={() => setSidebarOpen(false)}
                  >
                    {item.icon}
                    {item.name}
                  </Link>
                ))}
              </nav>
            </div>
            
            <div className="p-4 border-t border-gray-200 md:hidden">
              <div className="flex items-center space-x-3 mb-3">
                <div className="h-4 w-4 rounded-full bg-primary-100 flex items-center justify-center text-primary-700">
                  <FaUser className="h-2 w-2" />
                </div>
                <div>
                  <div className="text-sm font-medium text-gray-700">{user?.fullName}</div>
                  <div className="text-xs text-gray-500 capitalize">{user?.role}</div>
                </div>
              </div>
              <button 
                onClick={handleLogout}
                className="flex items-center w-full px-4 py-2 text-sm text-gray-700 rounded-md hover:bg-gray-100"
              >
                <FaSignOutAlt className="mr-3 h-2 w-2 text-gray-500" />
                Sign out
              </button>
            </div>
          </div>
        </aside>
        
        {/* Main content */}
        <main className="flex-1 overflow-auto p-4 md:p-6">
          {children}
        </main>
      </div>
    </div>
  )
}

DashboardLayout.propTypes = {
  children: PropTypes.node.isRequired
}

export default DashboardLayout