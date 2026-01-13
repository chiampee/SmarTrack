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
  Settings as SettingsIcon
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
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50/30 py-4 sm:py-6 lg:py-8 px-4 sm:px-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <button
            onClick={() => navigate('/dashboard')}
            className="flex items-center gap-2 text-slate-600 hover:text-slate-900 mb-5 sm:mb-6 transition-colors group"
          >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            <span className="text-sm font-medium">Back to Dashboard</span>
          </button>
          
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-blue-100 rounded-xl flex items-center justify-center">
              <SettingsIcon className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">Settings</h1>
              <p className="text-sm sm:text-base text-slate-600 mt-0.5">Manage your account settings and preferences</p>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="bg-white rounded-lg border border-slate-200 shadow-sm mb-6 overflow-hidden">
          <div className="flex border-b border-slate-200 overflow-x-auto">
            {tabs.map((tab) => {
              const Icon = tab.icon
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex items-center gap-2 px-4 sm:px-6 py-3.5 sm:py-4 text-sm font-medium transition-all whitespace-nowrap relative ${
                    activeTab === tab.id
                      ? 'text-blue-600 bg-blue-50'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  }`}
                >
                  <Icon className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" />
                  <span>{tab.label}</span>
                  {activeTab === tab.id && (
                    <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600" />
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
                  <h3 className="text-base sm:text-lg font-semibold text-slate-900 mb-4">Profile Information</h3>
                  <div className="bg-white border border-slate-200 rounded-lg p-5 space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        Display Name
                      </label>
                      <input
                        type="text"
                        value={user?.name || user?.nickname || ''}
                        disabled
                        className="input-field w-full bg-slate-50 cursor-not-allowed"
                      />
                      <p className="text-xs text-slate-500 mt-1.5">
                        Managed by your authentication provider
                      </p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        Email Address
                      </label>
                      <input
                        type="email"
                        value={user?.email || ''}
                        disabled
                        className="input-field w-full bg-slate-50 cursor-not-allowed"
                      />
                      <p className="text-xs text-slate-500 mt-1.5">
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
                  <h3 className="text-base sm:text-lg font-semibold text-slate-900 mb-4">Account Security</h3>
                  <div className="bg-white border border-slate-200 rounded-lg p-5">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center flex-shrink-0">
                        <Lock className="w-5 h-5 text-slate-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-semibold text-slate-900 mb-1">Auth0 Authentication</h4>
                        <p className="text-sm text-slate-600 mb-3">
                          Your account is secured through Auth0. Password and security settings are managed in your Auth0 account.
                        </p>
                        <a
                          href="https://manage.auth0.com"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 text-sm text-blue-600 hover:text-blue-700 font-medium"
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
                  <h3 className="text-base sm:text-lg font-semibold text-slate-900 mb-4">Account Actions</h3>
                  <div className="bg-white border border-slate-200 rounded-lg p-5">
                    <button
                      onClick={() => logout()}
                      className="px-5 py-2.5 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-colors flex items-center gap-2 font-medium"
                    >
                      <LogOut className="w-4 h-4" />
                      Sign Out
                    </button>
                  </div>
                </div>

                {/* Danger Zone */}
                <div>
                  <h3 className="text-base sm:text-lg font-semibold text-slate-900 mb-4">Danger Zone</h3>
                  <div className="bg-white border-2 border-red-200 rounded-lg p-5">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center flex-shrink-0">
                        <AlertTriangle className="w-5 h-5 text-red-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-semibold text-slate-900 mb-1">Permanently Delete All Links</h4>
                        <p className="text-sm text-slate-600 mb-4">
                          This will permanently delete all your saved links from the database. This action cannot be undone.
                        </p>
                        
                        {!showDeleteConfirm ? (
                          <button
                            onClick={() => setShowDeleteConfirm(true)}
                            className="px-5 py-2.5 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium flex items-center gap-2"
                          >
                            <Trash2 className="w-4 h-4" />
                            Delete All Links
                          </button>
                        ) : (
                          <div className="space-y-3">
                            <p className="text-sm font-medium text-slate-900">
                              Are you absolutely sure? Type <span className="font-mono bg-slate-100 px-2 py-0.5 rounded">DELETE</span> to confirm.
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
                                className="flex-1 px-4 py-2.5 bg-white text-slate-700 border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors font-medium"
                              >
                                Cancel
                              </button>
                              <button
                                onClick={handleDeleteAll}
                                disabled={isDeleting || confirmText !== 'DELETE'}
                                className="flex-1 px-4 py-2.5 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
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
                  <h3 className="text-base sm:text-lg font-semibold text-slate-900 mb-4">Usage & Limits</h3>
                  <UsageStats />
                </div>

                <div>
                  <h3 className="text-base sm:text-lg font-semibold text-slate-900 mb-4">Plan Information</h3>
                  <div className="bg-white border border-slate-200 rounded-lg p-5 sm:p-6">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-5 gap-3">
                      <div>
                        <h4 className="text-lg sm:text-xl font-bold text-slate-900">Free Plan</h4>
                        <p className="text-sm text-slate-600 mt-1">
                          Current subscription tier
                        </p>
                      </div>
                      <div className="px-3 sm:px-4 py-1.5 bg-blue-600 text-white rounded-full text-xs sm:text-sm font-semibold">
                        Active
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
                        <div className="flex items-center gap-2 mb-2">
                          <Download className="w-5 h-5 text-blue-600" />
                          <span className="text-sm font-medium text-slate-700">Links Limit</span>
                        </div>
                        <p className="text-2xl font-bold text-slate-900">40</p>
                        <p className="text-xs text-slate-500 mt-1">links per account</p>
                      </div>
                      
                      <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
                        <div className="flex items-center gap-2 mb-2">
                          <Database className="w-5 h-5 text-blue-600" />
                          <span className="text-sm font-medium text-slate-700">Storage Limit</span>
                        </div>
                        <p className="text-2xl font-bold text-slate-900">40 KB</p>
                        <p className="text-xs text-slate-500 mt-1">total storage</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-base sm:text-lg font-semibold text-slate-900 mb-4">Export Data</h3>
                  <div className="bg-white border border-slate-200 rounded-lg p-5">
                    <p className="text-sm text-slate-600 mb-4">
                      Download all your research links as a JSON file for backup or migration.
                    </p>
                    <button
                      className="px-5 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 font-medium"
                      onClick={() => {
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
                    <h3 className="text-base sm:text-lg font-semibold text-slate-900">Display Settings</h3>
                    <span className="px-2 py-0.5 text-xs font-medium text-slate-500 bg-slate-100 rounded-full">Coming Soon</span>
                  </div>
                  <div className="bg-white border border-slate-200 rounded-lg p-5 space-y-4 opacity-60 pointer-events-none">
                    <div className="flex items-center justify-between py-3 border-b border-slate-200">
                      <div>
                        <p className="font-medium text-slate-900">Dark Mode</p>
                        <p className="text-sm text-slate-500">Switch to dark theme</p>
                      </div>
                      <div className="bg-slate-300 w-12 h-6 rounded-full relative">
                        <div className="absolute left-1 top-1 w-4 h-4 bg-white rounded-full transition"></div>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between py-3">
                      <div>
                        <p className="font-medium text-slate-900">Compact View</p>
                        <p className="text-sm text-slate-500">Reduce spacing and padding</p>
                      </div>
                      <div className="bg-blue-600 w-12 h-6 rounded-full relative">
                        <div className="absolute right-1 top-1 w-4 h-4 bg-white rounded-full transition"></div>
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-base sm:text-lg font-semibold text-slate-900 mb-4">Default Settings</h3>
                  <div className="bg-white border border-slate-200 rounded-lg p-5 space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        Default View Mode
                      </label>
                      <select className="input-field w-full">
                        <option>List View</option>
                        <option>Grid View</option>
                      </select>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
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

                <div className="flex justify-end pt-2">
                  <button className="px-5 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 font-medium">
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
