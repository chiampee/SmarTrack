import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { 
  User, 
  Shield, 
  Palette, 
  Download,
  Trash2,
  Save,
  AlertTriangle,
  LogOut,
  ExternalLink,
  ArrowLeft,
  Lock,
  Database,
  FileJson
} from 'lucide-react'
import { useAuth0 } from '@auth0/auth0-react'
import { motion } from 'framer-motion'
import { UsageStats } from '../components/UsageStats'
import { useBackendApi } from '../hooks/useBackendApi'
import { useToast } from '../components/Toast'

export const Settings: React.FC = () => {
  const { user, logout } = useAuth0()
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState<'general' | 'account' | 'usage' | 'preferences'>('general')
  const { makeRequest } = useBackendApi()
  const toast = useToast()
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [confirmText, setConfirmText] = useState('')

  const handleDeleteAll = async () => {
    if (confirmText !== 'DELETE') {
      toast.error('Please type DELETE to confirm')
      return
    }

    try {
      setIsDeleting(true)
      const response = await makeRequest<{ message: string; deletedCount: number }>('/api/links', {
        method: 'DELETE',
        headers: {
          'X-Confirm-Delete-All': 'yes'
        }
      })
      toast.success(`${response.deletedCount} links deleted successfully`)
      setShowDeleteConfirm(false)
      setConfirmText('')
      // Reload the page to clear the data
      window.location.reload()
    } catch (error) {
      console.error('Failed to delete all links:', error)
      toast.error('Failed to delete all links. Please try again.')
    } finally {
      setIsDeleting(false)
    }
  }

  const tabs = [
    { id: 'general', label: 'General', icon: User },
    { id: 'account', label: 'Account', icon: Shield },
    { id: 'usage', label: 'Usage & Limits', icon: Download },
    { id: 'preferences', label: 'Preferences', icon: Palette },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50/30 py-6 sm:py-8 px-4">
      <div className="max-w-5xl mx-auto">
        {/* Header with Back Button */}
        <div className="mb-6 sm:mb-8">
          <button
            onClick={() => navigate('/dashboard')}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4 transition-colors group"
          >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            <span className="text-sm font-medium">Back to Dashboard</span>
          </button>
          
          <div className="flex items-center gap-3 mb-2">
            <img 
              src="/logo.svg" 
              alt="SmarTrack" 
              className="h-10 sm:h-12 w-auto"
            />
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Settings</h1>
              <p className="text-sm sm:text-base text-gray-600 mt-0.5">Manage your account settings and preferences</p>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 mb-6 overflow-hidden">
          <div className="flex border-b border-gray-200 overflow-x-auto">
            {tabs.map((tab) => {
              const Icon = tab.icon
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex items-center gap-2 px-4 sm:px-6 py-3 sm:py-4 text-sm font-medium transition-all whitespace-nowrap relative ${
                    activeTab === tab.id
                      ? 'text-indigo-600 bg-indigo-50'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                  }`}
                >
                  <Icon className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" />
                  <span>{tab.label}</span>
                  {activeTab === tab.id && (
                    <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-600" />
                  )}
                </button>
              )
            })}
          </div>

          {/* Tab Content */}
          <div className="p-5 sm:p-6 lg:p-8">
            {activeTab === 'general' && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className="space-y-6"
              >
                <div>
                  <div className="flex items-center gap-2 mb-4">
                    <User className="w-5 h-5 text-gray-600" />
                    <h3 className="text-lg font-semibold text-gray-900">Profile Information</h3>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-4 sm:p-5 space-y-4 border border-gray-200">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Display Name
                      </label>
                      <input
                        type="text"
                        value={user?.name || user?.nickname || ''}
                        disabled
                        className="input-field w-full bg-white cursor-not-allowed"
                      />
                      <p className="text-xs text-gray-500 mt-1.5 flex items-center gap-1">
                        <Lock className="w-3 h-3" />
                        Managed by your authentication provider
                      </p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Email Address
                      </label>
                      <input
                        type="email"
                        value={user?.email || ''}
                        disabled
                        className="input-field w-full bg-white cursor-not-allowed"
                      />
                      <p className="text-xs text-gray-500 mt-1.5 flex items-center gap-1">
                        <Lock className="w-3 h-3" />
                        Managed by your authentication provider
                      </p>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === 'account' && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className="space-y-6"
              >
                {/* Account Security */}
                <div>
                  <div className="flex items-center gap-2 mb-4">
                    <Shield className="w-5 h-5 text-indigo-600" />
                    <h3 className="text-lg font-semibold text-gray-900">Account Security</h3>
                  </div>
                  <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-4 sm:p-5">
                    <div className="flex items-start gap-3">
                      <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                        <Lock className="w-5 h-5 text-blue-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-semibold text-gray-900 mb-1">Auth0 Authentication</h4>
                        <p className="text-sm text-gray-700 mb-3">
                          Your account is secured through Auth0. Password and security settings are managed in your Auth0 account.
                        </p>
                        <a
                          href="https://manage.auth0.com"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 text-sm text-indigo-600 hover:text-indigo-700 font-medium"
                        >
                          Manage Auth0 Settings
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Account Actions */}
                <div>
                  <div className="flex items-center gap-2 mb-4">
                    <LogOut className="w-5 h-5 text-gray-600" />
                    <h3 className="text-lg font-semibold text-gray-900">Account Actions</h3>
                  </div>
                  <div className="bg-white border border-gray-200 rounded-lg p-4 sm:p-5">
                    <button
                      onClick={() => logout()}
                      className="w-full sm:w-auto px-5 py-2.5 bg-red-600 text-white rounded-lg hover:bg-red-700 active:bg-red-800 transition-colors flex items-center justify-center gap-2 font-medium shadow-sm hover:shadow-md"
                    >
                      <LogOut className="w-4 h-4" />
                      Sign Out
                    </button>
                  </div>
                </div>

                {/* Danger Zone */}
                <div>
                  <div className="flex items-center gap-2 mb-4">
                    <AlertTriangle className="w-5 h-5 text-red-600" />
                    <h3 className="text-lg font-semibold text-red-900">Danger Zone</h3>
                  </div>
                  <div className="bg-red-50 border-2 border-red-200 rounded-lg p-4 sm:p-5">
                    <div className="flex items-start gap-3 mb-4">
                      <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-red-100 flex items-center justify-center">
                        <Trash2 className="w-5 h-5 text-red-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-semibold text-red-900 mb-1">Permanently Delete All Links</h4>
                        <p className="text-sm text-red-700 mb-4">
                          This will permanently delete all your saved links from the database. This action cannot be undone.
                        </p>
                        
                        {!showDeleteConfirm ? (
                          <button
                            onClick={() => setShowDeleteConfirm(true)}
                            className="px-5 py-2.5 bg-red-600 text-white rounded-lg hover:bg-red-700 active:bg-red-800 transition-colors font-medium shadow-sm hover:shadow-md flex items-center gap-2"
                          >
                            <Trash2 className="w-4 h-4" />
                            Delete All Links
                          </button>
                        ) : (
                          <div className="space-y-3">
                            <p className="text-sm font-semibold text-red-900">
                              Are you absolutely sure? Type <span className="font-mono bg-red-100 px-2 py-0.5 rounded">DELETE</span> to confirm.
                            </p>
                            <input
                              type="text"
                              value={confirmText}
                              onChange={(e) => setConfirmText(e.target.value)}
                              placeholder="Type DELETE"
                              className="input-field w-full border-red-300 focus:border-red-500 focus:ring-red-500"
                              autoFocus
                            />
                            <div className="flex flex-col sm:flex-row gap-2.5">
                              <button
                                onClick={() => {
                                  setShowDeleteConfirm(false)
                                  setConfirmText('')
                                }}
                                className="flex-1 px-4 py-2.5 bg-white text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                              >
                                Cancel
                              </button>
                              <button
                                onClick={handleDeleteAll}
                                disabled={isDeleting || confirmText !== 'DELETE'}
                                className="flex-1 px-4 py-2.5 bg-red-600 text-white rounded-lg hover:bg-red-700 active:bg-red-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium shadow-sm"
                              >
                                {isDeleting ? 'Deleting...' : 'Confirm Delete'}
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === 'usage' && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className="space-y-6"
              >
                <div>
                  <div className="flex items-center gap-2 mb-4">
                    <Download className="w-5 h-5 text-indigo-600" />
                    <h3 className="text-lg font-semibold text-gray-900">Usage & Limits</h3>
                  </div>
                  <UsageStats />
                </div>

                <div>
                  <div className="flex items-center gap-2 mb-4">
                    <Database className="w-5 h-5 text-indigo-600" />
                    <h3 className="text-lg font-semibold text-gray-900">Plan Information</h3>
                  </div>
                  <div className="bg-gradient-to-br from-indigo-50 to-blue-50 border border-indigo-200 rounded-lg p-5 sm:p-6">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-5 gap-3">
                      <div>
                        <h4 className="text-xl font-bold text-gray-900">Free Plan</h4>
                        <p className="text-sm text-gray-600 mt-1">
                          Current subscription tier
                        </p>
                      </div>
                      <div className="px-4 py-1.5 bg-indigo-600 text-white rounded-full text-sm font-semibold">
                        Active
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="bg-white rounded-lg p-4 border border-gray-200 shadow-sm">
                        <div className="flex items-center gap-2 mb-2">
                          <Download className="w-5 h-5 text-indigo-600" />
                          <span className="text-sm font-medium text-gray-700">Links Limit</span>
                        </div>
                        <p className="text-2xl font-bold text-gray-900">40</p>
                        <p className="text-xs text-gray-500 mt-1">links per account</p>
                      </div>
                      
                      <div className="bg-white rounded-lg p-4 border border-gray-200 shadow-sm">
                        <div className="flex items-center gap-2 mb-2">
                          <Database className="w-5 h-5 text-purple-600" />
                          <span className="text-sm font-medium text-gray-700">Storage Limit</span>
                        </div>
                        <p className="text-2xl font-bold text-gray-900">40 KB</p>
                        <p className="text-xs text-gray-500 mt-1">total storage</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <div className="flex items-center gap-2 mb-4">
                    <FileJson className="w-5 h-5 text-indigo-600" />
                    <h3 className="text-lg font-semibold text-gray-900">Export Data</h3>
                  </div>
                  <div className="bg-white border border-gray-200 rounded-lg p-4 sm:p-5">
                    <p className="text-sm text-gray-700 mb-4">
                      Download all your research links as a JSON file for backup or migration.
                    </p>
                    <button
                      className="px-5 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 active:bg-indigo-800 transition-colors flex items-center gap-2 font-medium shadow-sm hover:shadow-md"
                      onClick={() => {
                        // Export functionality would go here
                        toast.info('Export functionality coming soon!')
                      }}
                    >
                      <Download className="w-4 h-4" />
                      Export All Links
                    </button>
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === 'preferences' && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className="space-y-6"
              >
                <div>
                  <div className="flex items-center gap-2 mb-4">
                    <Palette className="w-5 h-5 text-indigo-600" />
                    <h3 className="text-lg font-semibold text-gray-900">Display Settings</h3>
                    <span className="px-2 py-0.5 text-xs font-medium text-gray-500 bg-gray-100 rounded-full">Coming Soon</span>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-4 sm:p-5 space-y-4 border border-gray-200 opacity-60">
                    <div className="flex items-center justify-between py-3 border-b border-gray-200">
                      <div>
                        <p className="font-medium text-gray-900">Dark Mode</p>
                        <p className="text-sm text-gray-500">Switch to dark theme</p>
                      </div>
                      <div className="bg-gray-300 w-12 h-6 rounded-full relative cursor-not-allowed">
                        <div className="absolute left-1 top-1 w-4 h-4 bg-white rounded-full transition"></div>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between py-3">
                      <div>
                        <p className="font-medium text-gray-900">Compact View</p>
                        <p className="text-sm text-gray-500">Reduce spacing and padding</p>
                      </div>
                      <div className="bg-indigo-600 w-12 h-6 rounded-full relative cursor-not-allowed">
                        <div className="absolute right-1 top-1 w-4 h-4 bg-white rounded-full transition"></div>
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <div className="flex items-center gap-2 mb-4">
                    <Download className="w-5 h-5 text-indigo-600" />
                    <h3 className="text-lg font-semibold text-gray-900">Default Settings</h3>
                  </div>
                  <div className="bg-white border border-gray-200 rounded-lg p-4 sm:p-5 space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Default View Mode
                      </label>
                      <select className="input-field w-full">
                        <option>List View</option>
                        <option>Grid View</option>
                      </select>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Items Per Page
                      </label>
                      <select className="input-field w-full">
                        <option>10</option>
                        <option>25</option>
                        <option>50</option>
                        <option>100</option>
                      </select>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end">
                  <button className="px-5 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 active:bg-indigo-800 transition-colors flex items-center gap-2 font-medium shadow-sm hover:shadow-md">
                    <Save className="w-4 h-4" />
                    Save Preferences
                  </button>
                </div>
              </motion.div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
