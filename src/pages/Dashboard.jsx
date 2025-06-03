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
  <div className="dashboard-card p-3 rounded-lg border bg-white flex items-center space-x-3">
    <div className={`p-2 rounded-full ${color} text-white text-base flex items-center justify-center`} style={{ minWidth: 36, minHeight: 36 }}>
      {icon}
    </div>
    <div>
      <p className="text-xs text-gray-400 font-medium mb-0.5">{title}</p>
      <p className="text-lg font-semibold leading-tight">{value}</p>
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
      <div className="mb-3">
        <h1 className="text-3xl font-bold text-gray-800 mb-0.5">Dashboard</h1>
        <p className="text-gray-500 text-sm">Welcome back, {user?.fullName}</p>
      </div>
      {/* Filters */}
      <div className="bg-white p-2 rounded-lg border flex flex-col md:flex-row md:items-center gap-2 md:gap-3 mb-4">
        <div className="flex-1 flex gap-2">
          <DatePicker
            selected={startDate}
            onChange={date => setStartDate(date)}
            selectsStart
            startDate={startDate}
            endDate={endDate}
            className="py-1 px-2 w-full text-sm border rounded focus:ring-0"
            placeholderText="Start date"
          />
          <span className="text-gray-400 text-xs flex items-center">to</span>
          <DatePicker
            selected={endDate}
            onChange={date => setEndDate(date)}
            selectsEnd
            startDate={startDate}
            endDate={endDate}
            minDate={startDate}
            className="py-1 px-2 w-full text-sm border rounded focus:ring-0"
            placeholderText="End date"
          />
        </div>
        <select
          value={timePeriod}
          onChange={e => setTimePeriod(e.target.value)}
          className="py-1 px-2 border rounded text-sm focus:ring-0 min-w-[110px]"
        >
          {TIME_PERIOD_FILTERS.map(option => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        {user?.role === 'admin' && (
          <select
            value={locationFilter}
            onChange={e => setLocationFilter(e.target.value)}
            className="py-1 px-2 border rounded text-sm focus:ring-0 min-w-[120px]"
          >
            <option value="all">All Locations</option>
            {locations.map(location => (
              <option key={location.id} value={location.id}>
                {location.name}
              </option>
            ))}
          </select>
        )}
      </div>
      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-2 mb-4">
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
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 mb-4">
        <div className="card bg-white border rounded-lg p-3">
          <h2 className="text-base font-semibold mb-2">Package Activity</h2>
          <div className="h-64">
            <Line 
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { position: 'top' } },
                scales: { y: { beginAtZero: true, ticks: { precision: 0 } } }
              }}
              data={chartData.packagesData} 
            />
          </div>
        </div>
        <div className="card bg-white border rounded-lg p-3">
          <h2 className="text-base font-semibold mb-2">Revenue</h2>
          <div className="h-64">
            <Bar 
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { position: 'top' } },
                scales: { y: { beginAtZero: true, ticks: { callback: value => 'Rp ' + value.toLocaleString() } } }
              }}
              data={chartData.revenueData} 
            />
          </div>
        </div>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
        <div className="card bg-white border rounded-lg p-3 lg:col-span-1">
          <h2 className="text-base font-semibold mb-2">Package Status Distribution</h2>
          <div className="h-48">
            <Doughnut 
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { position: 'bottom' } }
              }}
              data={chartData.statusData} 
            />
          </div>
        </div>
      </div>
    </div>
  )
}

export default Dashboard