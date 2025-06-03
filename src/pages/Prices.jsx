import { useState, useEffect } from 'react'
import axios from 'axios'
import { API_URL } from '../config'
import { toast } from 'react-hot-toast'
import { 
  FaSave, 
  FaSpinner
} from 'react-icons/fa'

const Prices = () => {
  const [locations, setLocations] = useState([])
  const [loading, setLoading] = useState(true)
  const [savingLocation, setSavingLocation] = useState(null)
  
  // Pricing models
  const [pricingModel, setPricingModel] = useState('simple') // or 'advanced'
  
  // Form state for simple pricing
  const [simplePrices, setSimplePrices] = useState({})
  
  // Form state for advanced pricing
  const [advancedPrices, setAdvancedPrices] = useState({})
  
  // Package sizes for advanced pricing
  const packageSizes = [
    { id: 'small', name: 'Small' },
    { id: 'medium', name: 'Medium' },
    { id: 'large', name: 'Large' }
  ]
  
  useEffect(() => {
    const fetchLocationsWithPrices = async () => {
      try {
        setLoading(true)
        const token = localStorage.getItem('token')
        
        const response = await axios.get(`${API_URL}/locations/prices`, {
          headers: { Authorization: `Bearer ${token}` }
        })
        
        setLocations(response.data)
        
        // Initialize simple price state
        const simpleObj = {}
        const advancedObj = {}
        
        response.data.forEach(location => {
          simpleObj[location.id] = location.defaultPrice || 0
          
          // Initialize advanced prices
          const sizePrices = {}
          packageSizes.forEach(size => {
            const priceItem = location.prices?.find(p => p.sizeId === size.id)
            sizePrices[size.id] = priceItem ? priceItem.price : 0
          })
          
          advancedObj[location.id] = sizePrices
        })
        
        setSimplePrices(simpleObj)
        setAdvancedPrices(advancedObj)
      } catch (error) {
        console.error('Error fetching locations with prices:', error)
        toast.error('Failed to load pricing data')
      } finally {
        setLoading(false)
      }
    }
    
    fetchLocationsWithPrices()
  }, [])
  
  const handleSimplePriceChange = (locationId, value) => {
    setSimplePrices(prev => ({
      ...prev,
      [locationId]: value
    }))
  }
  
  const handleAdvancedPriceChange = (locationId, sizeId, value) => {
    setAdvancedPrices(prev => ({
      ...prev,
      [locationId]: {
        ...prev[locationId],
        [sizeId]: value
      }
    }))
  }
  
  const handleSavePrice = async (locationId) => {
    try {
      setSavingLocation(locationId)
      const token = localStorage.getItem('token')
      
      const data = {
        pricingModel,
        defaultPrice: simplePrices[locationId],
        prices: pricingModel === 'advanced' ? 
          Object.entries(advancedPrices[locationId]).map(([sizeId, price]) => ({
            sizeId,
            price: Number(price)
          })) : null
      }
      
      await axios.put(`${API_URL}/locations/${locationId}/prices`, data, {
        headers: { Authorization: `Bearer ${token}` }
      })
      
      toast.success('Prices updated successfully')
      
    } catch (error) {
      console.error('Error updating prices:', error)
      toast.error('Failed to update prices')
    } finally {
      setSavingLocation(null)
    }
  }

  
  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Pricing Management</h1>
        <p className="text-gray-600">Set package storage pricing for each location</p>
      </div>
      
      {/* Pricing Model Toggle */}
      <div className="bg-white p-4 rounded-lg shadow-sm mb-6">
        <div>
          <label className="form-label">Pricing Model</label>
          <div className="flex space-x-4">
            <label className="inline-flex items-center">
              <input
                type="radio"
                value="simple"
                checked={pricingModel === 'simple'}
                onChange={() => setPricingModel('simple')}
                className="mr-2"
              />
              Simple (Single price per location)
            </label>
            <label className="inline-flex items-center">
              <input
                type="radio"
                value="advanced"
                checked={pricingModel === 'advanced'}
                onChange={() => setPricingModel('advanced')}
                className="mr-2"
              />
              Advanced (Different prices based on package size)
            </label>
          </div>
        </div>
      </div>
      
      {/* Locations Pricing Table */}
      <div className="table-container">
        <table className="table">
          <thead>
            <tr>
              <th>Location</th>
              {pricingModel === 'simple' ? (
                <th>Price (Rp)</th>
              ) : (
                packageSizes.map(size => (
                  <th key={size.id}>{size.name} (Rp)</th>
                ))
              )}
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={pricingModel === 'simple' ? 3 : packageSizes.length + 2} className="text-center py-4">
                  <FaSpinner className="animate-spin mx-auto text-primary-500 text-xl" />
                </td>
              </tr>
            ) : locations.length === 0 ? (
              <tr>
                <td colSpan={pricingModel === 'simple' ? 3 : packageSizes.length + 2} className="text-center py-4 text-gray-500">
                  No locations found
                </td>
              </tr>
            ) : (
              // Using mock data for now, would be locations in production
              locations.map(location => (
                <tr key={location.id}>
                  <td>{location.name}</td>
                  
                  {pricingModel === 'simple' ? (
                    <td>
                      <input
                        type="number"
                        min="0"
                        value={simplePrices[location.id] || 0}
                        onChange={(e) => handleSimplePriceChange(location.id, e.target.value)}
                        className="input w-24 text-right"
                      />
                    </td>
                  ) : (
                    packageSizes.map(size => (
                      <td key={size.id}>
                        <input
                          type="number"
                          min="0"
                          value={
                            (advancedPrices[location.id] && advancedPrices[location.id][size.id]) || 0
                          }
                          onChange={(e) => handleAdvancedPriceChange(location.id, size.id, e.target.value)}
                          className="input w-24 text-right"
                        />
                      </td>
                    ))
                  )}
                  
                  <td>
                    <button
                      className="btn-primary py-1 px-3 text-sm"
                      onClick={() => handleSavePrice(location.id)}
                      disabled={savingLocation === location.id}
                    >
                      {savingLocation === location.id ? (
                        <FaSpinner className="animate-spin mr-1 inline" />
                      ) : (
                        <FaSave className="mr-1 inline" />
                      )}
                      Save
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      
      <div className="mt-6 bg-white p-4 rounded-lg shadow-sm">
        <h3 className="text-lg font-medium mb-3">About Package Pricing</h3>
        <p className="text-gray-600 mb-2">
          The pricing model determines how packages are charged at each location:
        </p>
        <ul className="list-disc pl-5 text-gray-600 space-y-1">
          <li>
            <strong>Simple Pricing:</strong> A single flat rate is charged for all packages at a location, regardless of size.
          </li>
          <li>
            <strong>Advanced Pricing:</strong> Different rates are charged based on package size (small, medium, large).
          </li>
        </ul>
        <p className="text-gray-600 mt-3">
          Note: Changes to pricing will only affect new packages, not existing ones.
        </p>
      </div>
    </div>
  )
}

export default Prices