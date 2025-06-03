import { useState, useEffect } from 'react'
import axios from 'axios'
import { API_URL } from '../config'
import { toast } from 'react-hot-toast'
import { 
  FaBell, 
  FaSave, 
  FaSpinner,
  FaPaperPlane,
  FaWhatsapp,
  FaInfoCircle
} from 'react-icons/fa'

const NotificationSettings = () => {
  const [templates, setTemplates] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [testSending, setTestSending] = useState(false)
  const [testPhone, setTestPhone] = useState('')
  
  // Current template being edited
  const [currentTemplate, setCurrentTemplate] = useState({
    id: null,
    templateName: '',
    templateContent: ''
  })
  
  // Available placeholders for templates
  const placeholders = [
    { key: '[NamaPenerima]', description: 'Nama penerima paket' },
    { key: '[NoResi]', description: 'Nomor resi paket' },
    { key: '[NamaLokasi]', description: 'Nama lokasi apartemen' },
    { key: '[TanggalTerima]', description: 'Tanggal paket diterima' },
    { key: '[JamTerima]', description: 'Waktu paket diterima' },
    { key: '[KodePengambilan]', description: 'Kode pengambilan paket' },
    { key: '[HargaPaket]', description: 'Biaya penyimpanan paket' }
  ]
  
  useEffect(() => {
    const fetchTemplates = async () => {
      try {
        setLoading(true)
        const token = localStorage.getItem('token')
        
        const response = await axios.get(`${API_URL}/notification-templates`, {
          headers: { Authorization: `Bearer ${token}` }
        })
        
        setTemplates(response.data)
        
        // Set first template as current if available
        if (response.data.length > 0) {
          setCurrentTemplate({
            id: response.data[0].id,
            templateName: response.data[0].templateName,
            templateContent: response.data[0].templateContent
          })
        }
      } catch (error) {
        console.error('Error fetching notification templates:', error)
        toast.error('Failed to load notification templates')
      } finally {
        setLoading(false)
      }
    }
    
    fetchTemplates()
  }, [])
  
  const handleTemplateChange = (e) => {
    const templateId = e.target.value
    const selected = templates.find(t => t.id === parseInt(templateId))
    
    if (selected) {
      setCurrentTemplate({
        id: selected.id,
        templateName: selected.templateName,
        templateContent: selected.templateContent
      })
    }
  }
  
  const handleInputChange = (e) => {
    const { name, value } = e.target
    setCurrentTemplate(prev => ({
      ...prev,
      [name]: value
    }))
  }
  
  const handleSaveTemplate = async () => {
    try {
      // Validation
      if (!currentTemplate.templateName || !currentTemplate.templateContent) {
        toast.error('Please provide both template name and content')
        return
      }
      
      setSaving(true)
      const token = localStorage.getItem('token')
      
      // Update existing template
      if (currentTemplate.id) {
        await axios.put(`${API_URL}/notification-templates/${currentTemplate.id}`, {
          templateName: currentTemplate.templateName,
          templateContent: currentTemplate.templateContent
        }, {
          headers: { Authorization: `Bearer ${token}` }
        })
        
        toast.success('Template updated successfully')
        
        // Update templates list
        const updatedTemplates = templates.map(t => 
          t.id === currentTemplate.id 
            ? { ...t, templateName: currentTemplate.templateName, templateContent: currentTemplate.templateContent } 
            : t
        )
        setTemplates(updatedTemplates)
      } 
      // Create new template
      else {
        const response = await axios.post(`${API_URL}/notification-templates`, {
          templateName: currentTemplate.templateName,
          templateContent: currentTemplate.templateContent
        }, {
          headers: { Authorization: `Bearer ${token}` }
        })
        
        toast.success('Template created successfully')
        
        // Add new template to list and set as current
        const newTemplate = response.data
        setTemplates([...templates, newTemplate])
        setCurrentTemplate({
          id: newTemplate.id,
          templateName: newTemplate.templateName,
          templateContent: newTemplate.templateContent
        })
      }
    } catch (error) {
      console.error('Error saving template:', error)
      toast.error('Failed to save template')
    } finally {
      setSaving(false)
    }
  }
  
  const handleCreateNewTemplate = () => {
    setCurrentTemplate({
      id: null,
      templateName: '',
      templateContent: ''
    })
  }
  
  const insertPlaceholder = (placeholder) => {
    setCurrentTemplate(prev => ({
      ...prev,
      templateContent: prev.templateContent + placeholder
    }))
  }
  
  const handleSendTestMessage = async () => {
    try {
      // Validation
      if (!testPhone) {
        toast.error('Please enter a phone number for testing')
        return
      }
      
      if (!currentTemplate.templateContent) {
        toast.error('Template content cannot be empty')
        return
      }
      
      setTestSending(true)
      const token = localStorage.getItem('token')
      
      await axios.post(`${API_URL}/notification-templates/test`, {
        templateId: currentTemplate.id,
        phoneNumber: testPhone
      }, {
        headers: { Authorization: `Bearer ${token}` }
      })
      
      toast.success('Test message sent successfully')
      setTestPhone('')
    } catch (error) {
      console.error('Error sending test message:', error)
      toast.error('Failed to send test message')
    } finally {
      setTestSending(false)
    }
  }
  
  // Mock data for development
  const mockTemplates = [
    {
      id: 1,
      templateName: 'paket_tiba',
      templateContent: 'Yth. [NamaPenerima], paket dengan no. resi [NoResi] telah diterima di [NamaLokasi] pada [TanggalTerima] [JamTerima]. Silakan ambil dengan kode [KodePengambilan]. Biaya: Rp [HargaPaket]. Terima kasih.'
    },
    {
      id: 2,
      templateName: 'paket_diambil',
      templateContent: 'Yth. [NamaPenerima], paket dengan no. resi [NoResi] telah berhasil diambil pada [TanggalTerima] [JamTerima]. Terima kasih telah menggunakan layanan PickPoint.'
    }
  ]
  
  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Notification Settings</h1>
        <p className="text-gray-600">Configure WhatsApp notification templates</p>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Template Selection and Editor */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white p-4 rounded-lg shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4">
              <div>
                <h2 className="text-lg font-semibold">Template Editor</h2>
                <p className="text-sm text-gray-500">Create or edit notification templates</p>
              </div>
              <button
                className="btn-outline mt-2 sm:mt-0"
                onClick={handleCreateNewTemplate}
              >
                Create New Template
              </button>
            </div>
            
            {/* Template Selection */}
            <div className="mb-4">
              <label className="form-label">Select Template</label>
              <select
                value={currentTemplate.id || ''}
                onChange={handleTemplateChange}
                className="input"
                disabled={!currentTemplate.id && (currentTemplate.templateName || currentTemplate.templateContent)}
              >
                <option value="" disabled>
                  {templates.length > 0 ? 'Select a template' : 'No templates available'}
                </option>
                {/* Using mock data for now, would be templates in production */}
                {mockTemplates.map(template => (
                  <option key={template.id} value={template.id}>
                    {template.templateName}
                  </option>
                ))}
              </select>
            </div>
            
            {/* Template Name */}
            {/* <div className="mb-4">
              <label className="form-label" htmlFor="templateName">
                Template Name *
              </label>
              <input
                type="text"
                id="templateName"
                name="templateName"
                value={currentTemplate.templateName}
                onChange={handleInputChange}
                className="input"
                placeholder="e.g., paket_tiba, paket_diambil"
              />
            </div> */}
            
            {/* Template Content */}
            <div className="mb-4">
              <label className="form-label" htmlFor="templateContent">
                Message Template *
              </label>
              <textarea
                id="templateContent"
                name="templateContent"
                value={currentTemplate.templateContent}
                onChange={handleInputChange}
                className="input h-32"
                placeholder="Enter your message template with placeholders..."
              />
            </div>
            
            {/* Save Button */}
            <div className="flex justify-end">
              <button
                className="btn-primary"
                onClick={handleSaveTemplate}
                disabled={saving}
              >
                {saving ? (
                  <>
                    <FaSpinner className="animate-spin mr-2" />
                    Saving...
                  </>
                ) : (
                  <>
                    <FaSave className="mr-2" />
                    Save Template
                  </>
                )}
              </button>
            </div>
          </div>
          
          {/* Test Notification */}
          <div className="bg-white p-4 rounded-lg shadow-sm">
            <h2 className="text-lg font-semibold mb-4">Send Test Notification</h2>
            
            <div className="mb-4">
              <label className="form-label" htmlFor="testPhone">
                Phone Number (with country code)
              </label>
              <div className="flex">
                <input
                  type="text"
                  id="testPhone"
                  value={testPhone}
                  onChange={(e) => setTestPhone(e.target.value)}
                  className="input flex-1"
                  placeholder="e.g., 628123456789"
                />
                <button
                  className="btn-primary ml-2"
                  onClick={handleSendTestMessage}
                  disabled={testSending || !currentTemplate.id}
                >
                  {testSending ? (
                    <>
                      <FaSpinner className="animate-spin mr-2" />
                      Sending...
                    </>
                  ) : (
                    <>
                      <FaPaperPlane className="mr-2" />
                      Send Test
                    </>
                  )}
                </button>
              </div>
              <p className="text-sm text-gray-500 mt-1">
                Test message will use dummy data for placeholders.
              </p>
            </div>
          </div>
        </div>
        
        {/* Help and Information */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white p-4 rounded-lg shadow-sm">
            <h2 className="text-lg font-semibold mb-4 flex items-center">
              <FaInfoCircle className="mr-2 text-primary-600" />
              Available Placeholders
            </h2>
            
            <p className="text-sm text-gray-600 mb-3">
              Use these placeholders in your templates. They will be replaced with actual data when messages are sent.
            </p>
            
            <div className="space-y-2">
              {placeholders.map((placeholder, index) => (
                <div key={index} className="p-2 bg-gray-50 rounded-md">
                  <div className="flex justify-between items-center">
                    <code className="text-sm font-mono bg-gray-100 px-1 py-0.5 rounded">
                      {placeholder.key}
                    </code>
                    <button
                      className="text-xs px-2 py-1 bg-primary-50 text-primary-600 rounded hover:bg-primary-100"
                      onClick={() => insertPlaceholder(placeholder.key)}
                    >
                      Insert
                    </button>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">{placeholder.description}</p>
                </div>
              ))}
            </div>
          </div>
          
          {/* <div className="bg-white p-4 rounded-lg shadow-sm">
            <h2 className="text-lg font-semibold mb-4 flex items-center">
              <FaWhatsapp className="mr-2 text-green-500" />
              WhatsApp Gateway
            </h2>
            
            <div className="p-3 bg-success-50 text-success-700 rounded-md mb-4">
              <p className="text-sm">
                <strong>Status:</strong> Connected
              </p>
            </div>
            
            <p className="text-sm text-gray-600 mb-2">
              Current Gateway Provider: <strong>WA Business API</strong>
            </p>
            
            <p className="text-sm text-gray-600">
              Messages are automatically sent when:
            </p>
            <ul className="list-disc list-inside text-sm text-gray-600 mt-1 mb-4">
              <li>A new package is received</li>
              <li>A package is picked up</li>
              <li>When staff manually resends a notification</li>
            </ul>
            
            <div className="flex justify-end">
              <button className="btn-outline text-sm">
                Gateway Settings
              </button>
            </div>
          </div> */}
        </div>
      </div>
    </div>
  )
}

export default NotificationSettings