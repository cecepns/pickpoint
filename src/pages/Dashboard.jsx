import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import axios from 'axios'
import { API_URL, TIME_PERIOD_FILTERS } from '../config'
import { format, subDays } from 'date-fns'
import { 
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
} from 'chart.js'
import { Line, Bar, Doughnut } from 'react-chartjs-2'
import DatePicker from 'react-datepicker'
import "react-datepicker/dist/react-datepicker.css"
import { 
  FaBoxOpen, 
  FaHandHoldingUsd, 
  FaWarehouse, 
  FaMoneyBillWave,
  FaCalendarAlt,
  FaFilter,
  FaSearch
} from 'react-icons/fa'

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
)

const DashboardCard = ({ title, value, icon, color }) => (
  <div className="dashboard-card">
    <div className="flex items-center">
      <div className={`p-3 rounded-full ${color} text-white mr-4`}>
        {icon}
      </div>
      <div>
        <p className="text-sm text-gray-500">{title}</p>
        <p className="text-2xl font-semibold">{value}</p>
      </div>
    </div>
  </div>
)

const Dashboard = () => {
  const { user } = useAuth()
  const [startDate, setStartDate] = useState(subDays(new Date(), 7))
  const [endDate, setEndDate] = useState(new Date())
  const [timePeriod, setTimePeriod] = useState('daily')
  const [locationFilter, setLocationFilter] = useState('')
  const [locations, setLocations] = useState([])
  const [stats, setStats] = useState({
    receivedToday: 0,
    pickedUpToday: 0,
    pendingPickup: 0,
    revenueToday: 0
  })
  const [chartData, setChartData] = useState({
    packagesData: { labels: [], datasets: [] },
    revenueData: { labels: [], datasets: [] },
    statusData: { labels: [], datasets: [] }
  })
  const [loading, setLoading] = useState(true)
  
  // Fetch locations (admin only)
  useEffect(() => {
    if (user?.role === 'admin') {
      const fetchLocations = async () => {
        try {
          const token = localStorage.getItem('token')
          const response = await axios.get(`${API_URL}/locations`, {
            headers: { Authorization: `Bearer ${token}` }
          })
          setLocations(response.data)
          // Set default location filter if none selected
          if (response.data.length > 0 && !locationFilter) {
            setLocationFilter('all')
          }
        } catch (error) {
          console.error('Error fetching locations:', error)
        }
      }
      
      fetchLocations()
    }
  }, [user, locationFilter])
  
  // Fetch dashboard data
  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true)
        const token = localStorage.getItem('token')
        
        const params = {
          startDate: format(startDate, 'yyyy-MM-dd'),
          endDate: format(endDate, 'yyyy-MM-dd'),
          period: timePeriod
        }
        
        if (user?.role === 'admin' && locationFilter && locationFilter !== 'all') {
          params.locationId = locationFilter
        }
        
        const response = await axios.get(`${API_URL}/dashboard/stats`, {
          headers: { Authorization: `Bearer ${token}` },
          params
        })

        console.log(response.data);
        
        setStats(response.data.stats)
        setChartData({
          packagesData: response.data.packagesData,
          revenueData: response.data.revenueData,
          statusData: response.data.statusData
        })
      } catch (error) {
        console.error('Error fetching dashboard data:', error)
      } finally {
        setLoading(false)
      }
    }
    
    if (user) {
      fetchDashboardData()
    }
  }, [user, startDate, endDate, timePeriod, locationFilter])
  
  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Dashboard</h1>
        <p className="text-gray-600">Welcome back, {user?.fullName}</p>
      </div>
      
      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow-sm mb-6">
        <div className="flex flex-col md:flex-row md:items-center space-y-4 md:space-y-0 md:space-x-4">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">Date Range</label>
            <div className="flex items-center border rounded-md">
              <div className="px-3 py-2 bg-gray-50 border-r">
                <FaCalendarAlt className="text-gray-400" />
              </div>
              <DatePicker
                selected={startDate}
                onChange={date => setStartDate(date)}
                selectsStart
                startDate={startDate}
                endDate={endDate}
                className="py-2 px-3 w-full border-0 focus:ring-0"
              />
              <span className="px-2 text-gray-500">to</span>
              <DatePicker
                selected={endDate}
                onChange={date => setEndDate(date)}
                selectsEnd
                startDate={startDate}
                endDate={endDate}
                minDate={startDate}
                className="py-2 px-3 w-full border-0 focus:ring-0"
              />
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Time Period</label>
            <div className="flex items-center border rounded-md">
              <div className="px-3 py-2 bg-gray-50 border-r">
                <FaFilter className="text-gray-400" />
              </div>
              <select
                value={timePeriod}
                onChange={e => setTimePeriod(e.target.value)}
                className="py-2 px-3 border-0 focus:ring-0 w-full"
              >
                {TIME_PERIOD_FILTERS.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
          
          {user?.role === 'admin' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
              <div className="flex items-center border rounded-md">
                <div className="px-3 py-2 bg-gray-50 border-r">
                  <FaSearch className="text-gray-400" />
                </div>
                <select
                  value={locationFilter}
                  onChange={e => setLocationFilter(e.target.value)}
                  className="py-2 px-3 border-0 focus:ring-0 w-full"
                >
                  <option value="all">All Locations</option>
                  {locations.map(location => (
                    <option key={location.id} value={location.id}>
                      {location.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}
        </div>
      </div>
      
      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <DashboardCard
          title="Packages Received Today"
          value={loading ? '...' : stats.receivedToday}
          icon={<FaBoxOpen />}
          color="bg-primary-600"
        />
        <DashboardCard
          title="Packages Picked Up Today"
          value={loading ? '...' : stats.pickedUpToday}
          icon={<FaHandHoldingUsd />}
          color="bg-secondary-600"
        />
        <DashboardCard
          title="Packages Pending Pickup"
          value={loading ? '...' : stats.pendingPickup}
          icon={<FaWarehouse />}
          color="bg-accent-500"
        />
        <DashboardCard
          title="Revenue Today"
          value={loading ? '...' : `Rp ${stats.revenueToday.toLocaleString()}`}
          icon={<FaMoneyBillWave />}
          color="bg-success-500"
        />
      </div>
      
      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <div className="card">
          <h2 className="text-lg font-semibold mb-4">Package Activity</h2>
          <div className="h-80">
            <Line 
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: {
                    position: 'top',
                  },
                },
                scales: {
                  y: {
                    beginAtZero: true,
                    ticks: {
                      precision: 0
                    }
                  }
                }
              }}
              data={chartData.packagesData} 
            />
          </div>
        </div>
        
        <div className="card">
          <h2 className="text-lg font-semibold mb-4">Revenue</h2>
          <div className="h-80">
            <Bar 
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: {
                    position: 'top',
                  },
                },
                scales: {
                  y: {
                    beginAtZero: true,
                    ticks: {
                      callback: function(value) {
                        return 'Rp ' + value.toLocaleString();
                      }
                    }
                  }
                }
              }}
              data={chartData.revenueData} 
            />
          </div>
        </div>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="card lg:col-span-1">
          <h2 className="text-lg font-semibold mb-4">Package Status Distribution</h2>
          <div className="h-64">
            <Doughnut 
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: {
                    position: 'bottom',
                  }
                }
              }}
              data={chartData.statusData} 
            />
          </div>
        </div>
        
        {/* <div className="card lg:col-span-2">
          <h2 className="text-lg font-semibold mb-4">Summary</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <h3 className="font-medium text-gray-700 mb-2">Package Metrics</h3>
              <ul className="space-y-2">
                <li className="flex justify-between">
                  <span className="text-gray-600">Stored Rate:</span>
                  <span className="font-medium">{loading ? '...' : `${Math.round((stats.pendingPickup / (stats.receivedToday || 1)) * 100)}%`}</span>
                </li>
                <li className="flex justify-between">
                  <span className="text-gray-600">Average Storage Time:</span>
                  <span className="font-medium">{loading ? '...' : '2.3 days'}</span>
                </li>
                <li className="flex justify-between">
                  <span className="text-gray-600">Busiest Day:</span>
                  <span className="font-medium">{loading ? '...' : 'Monday'}</span>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="font-medium text-gray-700 mb-2">Financial Metrics</h3>
              <ul className="space-y-2">
                <li className="flex justify-between">
                  <span className="text-gray-600">Average Revenue/Package:</span>
                  <span className="font-medium">{loading ? '...' : `Rp ${Math.round(stats.revenueToday / (stats.pickedUpToday || 1)).toLocaleString()}`}</span>
                </li>
                <li className="flex justify-between">
                  <span className="text-gray-600">Most Common Payment:</span>
                  <span className="font-medium">{loading ? '...' : 'Cash'}</span>
                </li>
                <li className="flex justify-between">
                  <span className="text-gray-600">Revenue Growth:</span>
                  <span className="font-medium text-success-500">{loading ? '...' : '+12%'}</span>
                </li>
              </ul>
            </div>
          </div>
        </div> */}
      </div>
    </div>
  )
}

export default Dashboard