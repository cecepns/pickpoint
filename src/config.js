// API URL configuration
export const API_URL = import.meta.env.VITE_API_URL || 'http://api-pickpoint.isavralabel.com/api'
export const BASE_URL_UPLOADS = import.meta.env.VITE_API_UPLOADS_URL || 'http://api-pickpoint.isavralabel.com'

// Date format options
export const DATE_FORMAT = 'yyyy-MM-dd'
export const TIME_FORMAT = 'HH:mm'
export const DATETIME_FORMAT = 'yyyy-MM-dd HH:mm'

// Pagination defaults
export const DEFAULT_PAGE_SIZE = 10
export const PAGE_SIZE_OPTIONS = [10, 20, 50, 100]

// Package status options
export const PACKAGE_STATUS = {
  STORED: 'stored',
  PICKED_UP: 'picked_up',
  DESTROYED: 'destroyed'
}

// Payment method options
export const PAYMENT_METHODS = [
  { value: 'cash', label: 'Cash' },
  { value: 'transfer', label: 'Bank Transfer' },
  { value: 'qris', label: 'QRIS' },
]

// User roles
export const USER_ROLES = {
  ADMIN: 'admin',
  STAFF: 'staff'
}

// Dashboard filters
export const TIME_PERIOD_FILTERS = [
  { value: 'daily', label: 'Daily' },
  { value: 'weekly', label: 'Weekly' },
  { value: 'monthly', label: 'Monthly' },
]