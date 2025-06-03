import { useState, useEffect } from 'react'
import axios from 'axios'
import { API_URL } from '../config'
import { toast } from 'react-hot-toast'
import { 
  FaPlus, 
  FaEdit, 
  FaTrash, 
  FaSearch, 
  FaSpinner,
  FaTimesCircle,
  FaSave,
  FaUserShield
} from 'react-icons/fa'

const StaffManagement = () => {
  const [staff, setStaff] = useState([])
  const [locations, setLocations] = useState([])
  const [loading, setLoading] = useState(true)
  const [showAddModal, setShowAddModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [currentStaff, setCurrentStaff] = useState(null)
  
  // Pagination state
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(10)
  const [totalPages, setTotalPages] = useState(1)
  
  // Filters
  const [searchTerm, setSearchTerm] = useState('')
  const [locationFilter, setLocationFilter] = useState('')
  
  // Form state
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    fullName: '',
    locationId: ''
  })
  
  useEffect(() => {
    const fetchLocations = async () => {
      try {
        const token = localStorage.getItem('token')
        const response = await axios.get(`${API_URL}/locations`, {
          headers: { Authorization: `Bearer ${token}` }
        })
        setLocations(response.data)
      } catch (error) {
        console.error('Error fetching locations:', error)
        toast.error('Failed to load locations')
      }
    }
    
    fetchLocations()
  }, [])
  
  useEffect(() => {
    const fetchStaff = async () => {
      try {
        setLoading(true)
        const token = localStorage.getItem('token')
        
        const params = {
          page,
          limit,
          search: searchTerm || undefined,
          locationId: locationFilter || undefined
        }
        
        const response = await axios.get(`${API_URL}/users/staff`, {
          headers: { Authorization: `Bearer ${token}` },
          params
        })
        
        setStaff(response.data.staff)
        setTotalPages(response.data.totalPages)
      } catch (error) {
        console.error('Error fetching staff:', error)
        toast.error('Failed to load staff members')
      } finally {
        setLoading(false)
      }
    }
    
    fetchStaff()
  }, [page, limit, searchTerm, locationFilter])
  
  const resetForm = () => {
    setFormData({
      username: '',
      password: '',
      fullName: '',
      locationId: ''
    })
  }
  
  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }
  
  const handleAddStaff = async () => {
    try {
      // Validation
      if (!formData.username || !formData.password || !formData.fullName || !formData.locationId) {
        toast.error('Please fill all required fields')
        return
      }
      
      const token = localStorage.getItem('token')
      await axios.post(`${API_URL}/users/staff`, formData, {
        headers: { Authorization: `Bearer ${token}` }
      })
      
      toast.success('Staff member added successfully')
      setShowAddModal(false)
      resetForm()
      
      // Refresh staff list
      const response = await axios.get(`${API_URL}/users/staff`, {
        headers: { Authorization: `Bearer ${token}` },
        params: { page, limit }
      })
      
      setStaff(response.data.staff)
      setTotalPages(response.data.totalPages)
      
    } catch (error) {
      console.error('Error adding staff:', error)
      if (error.response?.status === 409) {
        toast.error('Username already exists')
      } else {
        toast.error('Failed to add staff member')
      }
    }
  }
  
  const handleEditClick = (staffMember) => {
    setCurrentStaff(staffMember)
    setFormData({
      username: staffMember.username,
      password: '',  // Don't include existing password
      fullName: staffMember.fullName,
      locationId: staffMember.location.id
    })
    setShowEditModal(true)
  }
  
  const handleUpdateStaff = async () => {
    try {
      // Validation
      if (!formData.username || !formData.fullName || !formData.locationId) {
        toast.error('Please fill all required fields')
        return
      }
      
      // Remove password if empty (no password change)
      const updateData = { ...formData }
      if (!updateData.password) {
        delete updateData.password
      }
      
      const token = localStorage.getItem('token')
      await axios.put(`${API_URL}/users/staff/${currentStaff.id}`, updateData, {
        headers: { Authorization: `Bearer ${token}` }
      })
      
      toast.success('Staff member updated successfully')
      setShowEditModal(false)
      
      // Refresh staff list
      const response = await axios.get(`${API_URL}/users/staff`, {
        headers: { Authorization: `Bearer ${token}` },
        params: { page, limit }
      })
      
      setStaff(response.data.staff)
      
    } catch (error) {
      console.error('Error updating staff:', error)
      if (error.response?.status === 409) {
        toast.error('Username already exists')
      } else {
        toast.error('Failed to update staff member')
      }
    }
  }
  
  const handleDeleteStaff = async (id) => {
    if (!confirm('Are you sure you want to delete this staff member?')) {
      return
    }
    
    try {
      const token = localStorage.getItem('token')
      await axios.delete(`${API_URL}/users/staff/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      
      toast.success('Staff member deleted successfully')
      
      // Refresh staff list
      const response = await axios.get(`${API_URL}/users/staff`, {
        headers: { Authorization: `Bearer ${token}` },
        params: { page, limit }
      })
      
      setStaff(response.data.staff)
      setTotalPages(response.data.totalPages)
      
    } catch (error) {
      console.error('Error deleting staff:', error)
      if (error.response?.status === 409) {
        toast.error('Cannot delete staff member with associated packages')
      } else {
        toast.error('Failed to delete staff member')
      }
    }
  }

  
  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Staff Management</h1>
          <p className="text-gray-600">Manage staff accounts</p>
        </div>
        <button
          className="btn-primary mt-3 sm:mt-0"
          onClick={() => {
            resetForm()
            setShowAddModal(true)
          }}
        >
          <FaPlus className="mr-2" />
          Add New Staff
        </button>
      </div>
      
      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow-sm mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Search */}
          <div>
            <label className="form-label">Search</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <FaSearch className="text-gray-400" />
              </div>
              <input
                type="text"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                placeholder="Username, Name..."
                className="input pl-8"
              />
            </div>
          </div>
          
          {/* Location filter */}
          <div>
            <label className="form-label">Location</label>
            <select
              value={locationFilter}
              onChange={e => setLocationFilter(e.target.value)}
              className="input"
            >
              <option value="">All Locations</option>
              {locations.map(location => (
                <option key={location.id} value={location.id}>
                  {location.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>
      
      {/* Staff Table */}
      <div className="table-container">
        <table className="table">
          <thead>
            <tr>
              <th>Username</th>
              <th>Full Name</th>
              <th>Location</th>
              <th>Packages Handled</th>
              <th>Created At</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="6" className="text-center py-4">
                  <FaSpinner className="animate-spin mx-auto text-primary-500 text-xl" />
                </td>
              </tr>
            ) : staff.length === 0 ? (
              <tr>
                <td colSpan="6" className="text-center py-4 text-gray-500">
                  No staff members found
                </td>
              </tr>
            ) : (
              // Using mock data for now, would be staff in production
              staff.map(staffMember => (
                <tr key={staffMember.id}>
                  <td>{staffMember.username}</td>
                  <td>{staffMember.fullName}</td>
                  <td>{staffMember.location.name}</td>
                  <td>{staffMember.packagesHandled}</td>
                  <td>{new Date(staffMember.createdAt).toLocaleDateString()}</td>
                  <td>
                    <div className="flex space-x-2">
                      <button 
                        className="p-1.5 text-gray-600 hover:text-primary-600 rounded-full hover:bg-gray-100"
                        onClick={() => handleEditClick(staffMember)}
                        title="Edit Staff"
                      >
                        <FaEdit size={14} />
                      </button>
                      <button
                        className="p-1.5 text-gray-600 hover:text-error-600 rounded-full hover:bg-gray-100"
                        onClick={() => handleDeleteStaff(staffMember.id)}
                        title="Delete Staff"
                      >
                        <FaTrash size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      
      {/* Pagination */}
      <div className="mt-4 flex justify-between items-center">
        <div>
          <select
            value={limit}
            onChange={e => {
              setLimit(Number(e.target.value))
              setPage(1)
            }}
            className="border rounded px-2 py-1 text-sm"
          >
            <option value="10">10 per page</option>
            <option value="20">20 per page</option>
            <option value="50">50 per page</option>
            <option value="100">100 per page</option>
          </select>
        </div>
        
        <div className="flex space-x-2">
          <button 
            className="btn-outline px-3 py-1"
            disabled={page === 1}
            onClick={() => setPage(page - 1)}
          >
            Previous
          </button>
          <span className="px-4 py-1 border rounded bg-gray-50">
            Page {page} of {totalPages || 1}
          </span>
          <button 
            className="btn-outline px-3 py-1"
            disabled={page === totalPages || totalPages === 0}
            onClick={() => setPage(page + 1)}
          >
            Next
          </button>
        </div>
      </div>
      
      {/* Add Staff Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity" aria-hidden="true">
              <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
            </div>
            
            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-medium text-gray-900">Add New Staff</h3>
                  <button 
                    className="text-gray-400 hover:text-gray-500"
                    onClick={() => setShowAddModal(false)}
                  >
                    <FaTimesCircle />
                  </button>
                </div>
                
                <div className="mt-2 space-y-4">
                  <div className="form-group">
                    <label className="form-label" htmlFor="username">
                      Username *
                    </label>
                    <input
                      type="text"
                      id="username"
                      name="username"
                      value={formData.username}
                      onChange={handleInputChange}
                      className="input"
                    />
                  </div>
                  
                  <div className="form-group">
                    <label className="form-label" htmlFor="password">
                      Password *
                    </label>
                    <input
                      type="password"
                      id="password"
                      name="password"
                      value={formData.password}
                      onChange={handleInputChange}
                      className="input"
                    />
                  </div>
                  
                  <div className="form-group">
                    <label className="form-label" htmlFor="fullName">
                      Full Name *
                    </label>
                    <input
                      type="text"
                      id="fullName"
                      name="fullName"
                      value={formData.fullName}
                      onChange={handleInputChange}
                      className="input"
                    />
                  </div>
                  
                  <div className="form-group">
                    <label className="form-label" htmlFor="locationId">
                      Location *
                    </label>
                    <select
                      id="locationId"
                      name="locationId"
                      value={formData.locationId}
                      onChange={handleInputChange}
                      className="input"
                    >
                      <option value="">Select a location</option>
                      {locations.map(location => (
                        <option key={location.id} value={location.id}>
                          {location.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
              
              <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                <button
                  type="button"
                  className="btn-primary sm:ml-2"
                  onClick={handleAddStaff}
                >
                  <FaUserShield className="mr-2" />
                  Add Staff
                </button>
                <button
                  type="button"
                  className="btn-outline"
                  onClick={() => setShowAddModal(false)}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Edit Staff Modal */}
      {showEditModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity" aria-hidden="true">
              <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
            </div>
            
            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-medium text-gray-900">Edit Staff</h3>
                  <button 
                    className="text-gray-400 hover:text-gray-500"
                    onClick={() => setShowEditModal(false)}
                  >
                    <FaTimesCircle />
                  </button>
                </div>
                
                <div className="mt-2 space-y-4">
                  <div className="form-group">
                    <label className="form-label" htmlFor="edit-username">
                      Username *
                    </label>
                    <input
                      type="text"
                      id="edit-username"
                      name="username"
                      value={formData.username}
                      onChange={handleInputChange}
                      className="input"
                    />
                  </div>
                  
                  <div className="form-group">
                    <label className="form-label" htmlFor="edit-password">
                      Password (leave blank to keep current)
                    </label>
                    <input
                      type="password"
                      id="edit-password"
                      name="password"
                      value={formData.password}
                      onChange={handleInputChange}
                      className="input"
                      placeholder="Leave blank to keep current password"
                    />
                  </div>
                  
                  <div className="form-group">
                    <label className="form-label" htmlFor="edit-fullName">
                      Full Name *
                    </label>
                    <input
                      type="text"
                      id="edit-fullName"
                      name="fullName"
                      value={formData.fullName}
                      onChange={handleInputChange}
                      className="input"
                    />
                  </div>
                  
                  <div className="form-group">
                    <label className="form-label" htmlFor="edit-locationId">
                      Location *
                    </label>
                    <select
                      id="edit-locationId"
                      name="locationId"
                      value={formData.locationId}
                      onChange={handleInputChange}
                      className="input"
                    >
                      <option value="">Select a location</option>
                      {locations.map(location => (
                        <option key={location.id} value={location.id}>
                          {location.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
              
              <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                <button
                  type="button"
                  className="btn-primary sm:ml-2"
                  onClick={handleUpdateStaff}
                >
                  <FaSave className="mr-2" />
                  Update Staff
                </button>
                <button
                  type="button"
                  className="btn-outline"
                  onClick={() => setShowEditModal(false)}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default StaffManagement