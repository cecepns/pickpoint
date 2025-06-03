import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
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
  FaSave
} from 'react-icons/fa'

const Recipients = () => {
  const { user } = useAuth()
  const [recipients, setRecipients] = useState([])
  const [locations, setLocations] = useState([])
  const [loading, setLoading] = useState(true)
  const [showAddModal, setShowAddModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [currentRecipient, setCurrentRecipient] = useState(null)
  
  // Pagination state
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(10)
  const [totalPages, setTotalPages] = useState(1)
  
  // Filters
  const [searchTerm, setSearchTerm] = useState('')
  const [locationFilter, setLocationFilter] = useState('')
  
  // Form state
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    unit: '',
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
        
        // If staff, set their location as the filter
        if (user?.role === 'staff' && user?.locationId) {
          setLocationFilter(user.locationId)
          
          // For form data
          setFormData(prev => ({
            ...prev,
            locationId: user.locationId
          }))
        }
      } catch (error) {
        console.error('Error fetching locations:', error)
        toast.error('Failed to load locations')
      }
    }
    
    if (user) {
      fetchLocations()
    }
  }, [user])
  
  useEffect(() => {
    const fetchRecipients = async () => {
      try {
        setLoading(true)
        const token = localStorage.getItem('token')
        
        const params = {
          page,
          limit,
          search: searchTerm || undefined,
          locationId: locationFilter || undefined
        }
        
        const response = await axios.get(`${API_URL}/recipients`, {
          headers: { Authorization: `Bearer ${token}` },
          params
        })
        
        setRecipients(response.data.recipients)
        setTotalPages(response.data.totalPages)
      } catch (error) {
        console.error('Error fetching recipients:', error)
        toast.error('Failed to load recipients')
      } finally {
        setLoading(false)
      }
    }
    
    if (user) {
      fetchRecipients()
    }
  }, [user, page, limit, searchTerm, locationFilter])
  
  const resetForm = () => {
    setFormData({
      name: '',
      phone: '',
      unit: '',
      locationId: user?.role === 'staff' ? user.locationId : ''
    })
  }
  
  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }
  
  const handleAddRecipient = async () => {
    try {
      // Validation
      if (!formData.name || !formData.phone || !formData.locationId) {
        toast.error('Please fill all required fields')
        return
      }
      
      const token = localStorage.getItem('token')
      await axios.post(`${API_URL}/recipients`, formData, {
        headers: { Authorization: `Bearer ${token}` }
      })
      
      toast.success('Recipient added successfully')
      setShowAddModal(false)
      resetForm()
      
      // Refresh recipients list
      const response = await axios.get(`${API_URL}/recipients`, {
        headers: { Authorization: `Bearer ${token}` },
        params: { page, limit }
      })
      
      setRecipients(response.data.recipients)
      setTotalPages(response.data.totalPages)
      
    } catch (error) {
      console.error('Error adding recipient:', error)
      toast.error(error.response?.data?.message || 'Failed to add recipient')
    }
  }
  
  const handleEditClick = (recipient) => {
    setCurrentRecipient(recipient)
    setFormData({
      name: recipient.name,
      phone: recipient.phone,
      unit: recipient.unit || '',
      locationId: recipient.location.id
    })
    setShowEditModal(true)
  }
  
  const handleUpdateRecipient = async () => {
    try {
      // Validation
      if (!formData.name || !formData.phone || !formData.locationId) {
        toast.error('Please fill all required fields')
        return
      }
      
      const token = localStorage.getItem('token')
      await axios.put(`${API_URL}/recipients/${currentRecipient.id}`, formData, {
        headers: { Authorization: `Bearer ${token}` }
      })
      
      toast.success('Recipient updated successfully')
      setShowEditModal(false)
      
      // Refresh recipients list
      const response = await axios.get(`${API_URL}/recipients`, {
        headers: { Authorization: `Bearer ${token}` },
        params: { page, limit }
      })
      
      setRecipients(response.data.recipients)
      
    } catch (error) {
      console.error('Error updating recipient:', error)
      toast.error(error.response?.data?.message || 'Failed to update recipient')
    }
  }
  
  const handleDeleteRecipient = async (id) => {
    if (!confirm('Are you sure you want to delete this recipient?')) {
      return
    }
    
    try {
      const token = localStorage.getItem('token')
      await axios.delete(`${API_URL}/recipients/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      
      toast.success('Recipient deleted successfully')
      
      // Refresh recipients list
      const response = await axios.get(`${API_URL}/recipients`, {
        headers: { Authorization: `Bearer ${token}` },
        params: { page, limit }
      })
      
      setRecipients(response.data.recipients)
      setTotalPages(response.data.totalPages)
      
    } catch (error) {
      console.error('Error deleting recipient:', error)
      if (error.response?.status === 409) {
        toast.error('Cannot delete recipient with associated packages')
      } else {
        toast.error('Failed to delete recipient')
      }
    }
  }

  
  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Recipients</h1>
          <p className="text-gray-600">Manage recipient information</p>
        </div>
        <button
          className="btn-primary mt-3 sm:mt-0"
          onClick={() => {
            resetForm()
            setShowAddModal(true)
          }}
        >
          <FaPlus className="mr-2" />
          Add New Recipient
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
                placeholder="Name, Phone, Unit..."
                className="input pl-8"
              />
            </div>
          </div>
          
          {/* Location filter (admin only) */}
          {user?.role === 'admin' && (
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
          )}
        </div>
      </div>
      
      {/* Recipients Table */}
      <div className="table-container">
        <table className="table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Phone</th>
              <th>Apartment Unit</th>
              <th>Location</th>
              <th>Packages</th>
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
            ) : recipients.length === 0 ? (
              <tr>
                <td colSpan="6" className="text-center py-4 text-gray-500">
                  No recipients found
                </td>
              </tr>
            ) : (
              // Using mock data for now, would be recipients in production
              recipients?.map(recipient => (
                <tr key={recipient.id}>
                  <td>{recipient.name}</td>
                  <td>{recipient.phone}</td>
                  <td>{recipient.unit || '-'}</td>
                  <td>{recipient.location.name}</td>
                  <td>{recipient.packageCount}</td>
                  <td>
                    <div className="flex flex-col md:flex-row gap-2">
                      <button 
                        className="p-1.5 text-gray-600 hover:text-primary-600 rounded-full hover:bg-gray-100"
                        onClick={() => handleEditClick(recipient)}
                        title="Edit Recipient"
                      >
                        <FaEdit size={14} />
                      </button>
                      
                      {(user?.role === 'admin' || recipient.packageCount === 0) && (
                        <button
                          className="p-1.5 text-gray-600 hover:text-error-600 rounded-full hover:bg-gray-100"
                          onClick={() => handleDeleteRecipient(recipient.id)}
                          title="Delete Recipient"
                        >
                          <FaTrash size={14} />
                        </button>
                      )}
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
        
        <div className="flex flex-col md:flex-row gap-2">
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
      
      {/* Add Recipient Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity" aria-hidden="true">
              <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
            </div>
            
            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-medium text-gray-900">Add New Recipient</h3>
                  <button 
                    className="text-gray-400 hover:text-gray-500"
                    onClick={() => setShowAddModal(false)}
                  >
                    <FaTimesCircle />
                  </button>
                </div>
                
                <div className="mt-2 space-y-4">
                  <div className="form-group">
                    <label className="form-label" htmlFor="name">
                      Name *
                    </label>
                    <input
                      type="text"
                      id="name"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      className="input"
                    />
                  </div>
                  
                  <div className="form-group">
                    <label className="form-label" htmlFor="phone">
                      Phone Number *
                    </label>
                    <input
                      type="text"
                      id="phone"
                      name="phone"
                      value={formData.phone}
                      onChange={handleInputChange}
                      className="input"
                      placeholder="e.g., 081234567890"
                    />
                  </div>
                  
                  <div className="form-group">
                    <label className="form-label" htmlFor="unit">
                      Apartment Unit
                    </label>
                    <input
                      type="text"
                      id="unit"
                      name="unit"
                      value={formData.unit}
                      onChange={handleInputChange}
                      className="input"
                      placeholder="e.g., A-123"
                    />
                  </div>
                  
                  {/* Location (for admin) */}
                  {user?.role === 'admin' && (
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
                  )}
                </div>
              </div>
              
              <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                <button
                  type="button"
                  className="btn-primary sm:ml-2"
                  onClick={handleAddRecipient}
                >
                  <FaSave className="mr-2" />
                  Save Recipient
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
      
      {/* Edit Recipient Modal */}
      {showEditModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity" aria-hidden="true">
              <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
            </div>
            
            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-medium text-gray-900">Edit Recipient</h3>
                  <button 
                    className="text-gray-400 hover:text-gray-500"
                    onClick={() => setShowEditModal(false)}
                  >
                    <FaTimesCircle />
                  </button>
                </div>
                
                <div className="mt-2 space-y-4">
                  <div className="form-group">
                    <label className="form-label" htmlFor="edit-name">
                      Name *
                    </label>
                    <input
                      type="text"
                      id="edit-name"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      className="input"
                    />
                  </div>
                  
                  <div className="form-group">
                    <label className="form-label" htmlFor="edit-phone">
                      Phone Number *
                    </label>
                    <input
                      type="text"
                      id="edit-phone"
                      name="phone"
                      value={formData.phone}
                      onChange={handleInputChange}
                      className="input"
                    />
                  </div>
                  
                  <div className="form-group">
                    <label className="form-label" htmlFor="edit-unit">
                      Apartment Unit
                    </label>
                    <input
                      type="text"
                      id="edit-unit"
                      name="unit"
                      value={formData.unit}
                      onChange={handleInputChange}
                      className="input"
                    />
                  </div>
                  
                  {/* Location (for admin) */}
                  {user?.role === 'admin' && (
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
                  )}
                </div>
              </div>
              
              <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                <button
                  type="button"
                  className="btn-primary sm:ml-2"
                  onClick={handleUpdateRecipient}
                >
                  <FaSave className="mr-2" />
                  Update Recipient
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

export default Recipients