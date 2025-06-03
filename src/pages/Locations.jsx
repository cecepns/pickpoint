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
  FaSave
} from 'react-icons/fa'

const Locations = () => {
  const [locations, setLocations] = useState([])
  const [loading, setLoading] = useState(true)
  const [showAddModal, setShowAddModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [currentLocation, setCurrentLocation] = useState(null)
  
  // Filters
  const [searchTerm, setSearchTerm] = useState('')
  
  // Form state
  const [formData, setFormData] = useState({
    name: '',
    address: ''
  })
  
  useEffect(() => {
    const fetchLocations = async () => {
      try {
        setLoading(true)
        const token = localStorage.getItem('token')
        
        const params = {
          search: searchTerm || undefined
        }
        
        const response = await axios.get(`${API_URL}/locations`, {
          headers: { Authorization: `Bearer ${token}` },
          params
        })
        
        setLocations(response.data)
      } catch (error) {
        console.error('Error fetching locations:', error)
        toast.error('Failed to load locations')
      } finally {
        setLoading(false)
      }
    }
    
    fetchLocations()
  }, [searchTerm])
  
  const resetForm = () => {
    setFormData({
      name: '',
      address: ''
    })
  }
  
  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }
  
  const handleAddLocation = async () => {
    try {
      // Validation
      if (!formData.name) {
        toast.error('Please enter a location name')
        return
      }
      
      const token = localStorage.getItem('token')
      await axios.post(`${API_URL}/locations`, formData, {
        headers: { Authorization: `Bearer ${token}` }
      })
      
      toast.success('Location added successfully')
      setShowAddModal(false)
      resetForm()
      
      // Refresh locations list
      const response = await axios.get(`${API_URL}/locations`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      
      setLocations(response.data)
      
    } catch (error) {
      console.error('Error adding location:', error)
      if (error.response?.status === 409) {
        toast.error('Location name already exists')
      } else {
        toast.error('Failed to add location')
      }
    }
  }
  
  const handleEditClick = (location) => {
    setCurrentLocation(location)
    setFormData({
      name: location.name,
      address: location.address || ''
    })
    setShowEditModal(true)
  }
  
  const handleUpdateLocation = async () => {
    try {
      // Validation
      if (!formData.name) {
        toast.error('Please enter a location name')
        return
      }
      
      const token = localStorage.getItem('token')
      await axios.put(`${API_URL}/locations/${currentLocation.id}`, formData, {
        headers: { Authorization: `Bearer ${token}` }
      })
      
      toast.success('Location updated successfully')
      setShowEditModal(false)
      
      // Refresh locations list
      const response = await axios.get(`${API_URL}/locations`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      
      setLocations(response.data)
      
    } catch (error) {
      console.error('Error updating location:', error)
      if (error.response?.status === 409) {
        toast.error('Location name already exists')
      } else {
        toast.error('Failed to update location')
      }
    }
  }
  
  const handleDeleteLocation = async (id) => {
    if (!confirm('Are you sure you want to delete this location?')) {
      return
    }
    
    try {
      const token = localStorage.getItem('token')
      await axios.delete(`${API_URL}/locations/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      
      toast.success('Location deleted successfully')
      
      // Refresh locations list
      const response = await axios.get(`${API_URL}/locations`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      
      setLocations(response.data)
      
    } catch (error) {
      console.error('Error deleting location:', error)
      if (error.response?.status === 409) {
        toast.error('Cannot delete location with associated staff or packages')
      } else {
        toast.error('Failed to delete location')
      }
    }
  }

  
  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Locations</h1>
          <p className="text-gray-600">Manage apartment locations</p>
        </div>
        <button
          className="btn-primary mt-3 sm:mt-0"
          onClick={() => {
            resetForm()
            setShowAddModal(true)
          }}
        >
          <FaPlus className="mr-2" />
          Add New Location
        </button>
      </div>
      
      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow-sm mb-6">
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
              placeholder="Location name or address..."
              className="input pl-8"
            />
          </div>
        </div>
      </div>
      
      {/* Locations Table */}
      <div className="table-container">
        <table className="table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Address</th>
              <th>Staff Count</th>
              <th>Package Count</th>
              <th>Default Price</th>
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
            ) : locations.length === 0 ? (
              <tr>
                <td colSpan="6" className="text-center py-4 text-gray-500">
                  No locations found
                </td>
              </tr>
            ) : (
              // Using mock data for now, would be locations in production
              locations.map(location => (
                <tr key={location.id}>
                  <td>{location.name}</td>
                  <td>{location.address || '-'}</td>
                  <td>{location.staffCount}</td>
                  <td>{location.packageCount}</td>
                  <td>Rp {location.defaultPrice.toLocaleString()}</td>
                  <td>
                    <div className="flex flex-col md:flex-row gap-2">
                      <button 
                        className="p-1.5 text-gray-600 hover:text-primary-600 rounded-full hover:bg-gray-100"
                        onClick={() => handleEditClick(location)}
                        title="Edit Location"
                      >
                        <FaEdit size={14} />
                      </button>
                      
                      {location.staffCount === 0 && location.packageCount === 0 && (
                        <button
                          className="p-1.5 text-gray-600 hover:text-error-600 rounded-full hover:bg-gray-100"
                          onClick={() => handleDeleteLocation(location.id)}
                          title="Delete Location"
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
      
      {/* Add Location Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity" aria-hidden="true">
              <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
            </div>
            
            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-medium text-gray-900">Add New Location</h3>
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
                      Location Name *
                    </label>
                    <input
                      type="text"
                      id="name"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      className="input"
                      placeholder="e.g., Apartemen Melati"
                    />
                  </div>
                  
                  <div className="form-group">
                    <label className="form-label" htmlFor="address">
                      Address
                    </label>
                    <textarea
                      id="address"
                      name="address"
                      value={formData.address}
                      onChange={handleInputChange}
                      className="input"
                      rows="2"
                      placeholder="e.g., Jl. Melati No. 123, Jakarta"
                    />
                  </div>
                </div>
              </div>
              
              <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                <button
                  type="button"
                  className="btn-primary sm:ml-2"
                  onClick={handleAddLocation}
                >
                  <FaSave className="mr-2" />
                  Save Location
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
      
      {/* Edit Location Modal */}
      {showEditModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity" aria-hidden="true">
              <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
            </div>
            
            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-medium text-gray-900">Edit Location</h3>
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
                      Location Name *
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
                    <label className="form-label" htmlFor="edit-address">
                      Address
                    </label>
                    <textarea
                      id="edit-address"
                      name="address"
                      value={formData.address}
                      onChange={handleInputChange}
                      className="input"
                      rows="2"
                    />
                  </div>
                </div>
              </div>
              
              <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                <button
                  type="button"
                  className="btn-primary sm:ml-2"
                  onClick={handleUpdateLocation}
                >
                  <FaSave className="mr-2" />
                  Update Location
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

export default Locations