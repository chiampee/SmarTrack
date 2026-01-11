import React, { useState } from 'react'
import { 
  User, 
  Bell, 
  Shield, 
  Palette, 
  Download,
  Trash2,
  Save,
  AlertTriangle
} from 'lucide-react'
import { useAuth0 } from '@auth0/auth0-react'
import { UsageStats } from '../components/UsageStats'
import { useBackendApi } from '../hooks/useBackendApi'
import { useToast } from '../components/Toast'

export const Settings: React.FC = () => {
  const { user, logout } = useAuth0()
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
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <img 
            src="/logo.svg" 
            alt="SmarTrack" 
            className="h-12 w-auto mb-4"
          />
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Settings</h1>
          <p className="text-gray-600">Manage your account settings and preferences</p>
        </div>

        {/* Tab Navigation */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6">
          <div className="flex border-b border-gray-200 overflow-x-auto">
            {tabs.map((tab) => {
              const Icon = tab.icon
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex items-center gap-2 px-6 py-4 text-sm font-medium transition-all whitespace-nowrap ${
                    activeTab === tab.id
                      ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  {tab.label}
                </button>
              )
            })}
          </div>

          {/* Tab Content */}
          <div className="p-6">
            {activeTab === 'general' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Profile Information</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Display Name
                      </label>
                      <input
                        type="text"
                        value={user?.name || user?.nickname || ''}
                        disabled
                        className="input-field w-full bg-gray-50 cursor-not-allowed"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Name managed by your authentication provider
                      </p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Email
                      </label>
                      <input
                        type="email"
                        value={user?.email || ''}
                        disabled
                        className="input-field w-full bg-gray-50 cursor-not-allowed"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Email managed by your authentication provider
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'account' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Account Security</h3>
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                    <p className="text-sm text-blue-800">
                      Your account is secured through Auth0 authentication. Password and security settings are managed in your Auth0 account.
                    </p>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Account Actions</h3>
                  <div className="space-y-3">
                    <button
                      onClick={() => logout()}
                      className="w-full sm:w-auto px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                    >
                      Sign Out
                    </button>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-red-900 mb-4">Factory Reset</h3>
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <div className="flex items-start gap-3">
                      <AlertTriangle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
                      <div className="flex-1">
                        <h4 className="font-semibold text-red-900 mb-2">Delete All Links</h4>
                        <p className="text-sm text-red-700 mb-4">
                          This will permanently delete all your saved links from the database. This action cannot be undone.
                        </p>
                        
                        {!showDeleteConfirm ? (
                          <button
                            onClick={() => setShowDeleteConfirm(true)}
                            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                          >
                            Delete All Links
                          </button>
                        ) : (
                          <div className="space-y-3">
                            <p className="text-sm font-semibold text-red-900">
                              Are you absolutely sure? Type "DELETE" to confirm.
                            </p>
                            <input
                              type="text"
                              value={confirmText}
                              onChange={(e) => setConfirmText(e.target.value)}
                              placeholder="Type DELETE"
                              className="input-field w-full border-red-300"
                            />
                            <div className="flex gap-2">
                              <button
                                onClick={() => {
                                  setShowDeleteConfirm(false)
                                  setConfirmText('')
                                }}
                                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                              >
                                Cancel
                              </button>
                              <button
                                onClick={handleDeleteAll}
                                disabled={isDeleting || confirmText !== 'DELETE'}
                                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                              >
                                {isDeleting ? 'Deleting...' : 'Yes, Delete All'}
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'usage' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Usage & Limits</h3>
                  <UsageStats />
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Plan Information</h3>
                  <div className="bg-gradient-to-br from-blue-50 to-purple-50 border border-blue-200 rounded-lg p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h4 className="text-xl font-bold text-gray-900">Free Plan</h4>
                        <p className="text-sm text-gray-600 mt-1">
                          Current subscription tier
                        </p>
                      </div>
                      <div className="px-4 py-2 bg-blue-600 text-white rounded-full text-sm font-semibold">
                        Active
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                      <div className="bg-white rounded-lg p-4 border border-gray-200">
                        <div className="flex items-center gap-2 mb-2">
                          <Download className="w-5 h-5 text-blue-600" />
                          <span className="text-sm font-medium text-gray-700">Links Limit</span>
                        </div>
                        <p className="text-2xl font-bold text-gray-900">40</p>
                        <p className="text-xs text-gray-500 mt-1">links per account</p>
                      </div>
                      
                      <div className="bg-white rounded-lg p-4 border border-gray-200">
                        <div className="flex items-center gap-2 mb-2">
                          <Download className="w-5 h-5 text-purple-600" />
                          <span className="text-sm font-medium text-gray-700">Storage Limit</span>
                        </div>
                        <p className="text-2xl font-bold text-gray-900">40 KB</p>
                        <p className="text-xs text-gray-500 mt-1">total storage</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Export Data</h3>
                  <div className="bg-white border border-gray-200 rounded-lg p-4">
                    <p className="text-sm text-gray-700 mb-4">
                      Download all your research links as a JSON file for backup or migration.
                    </p>
                    <button
                      className="btn btn-primary flex items-center gap-2"
                      onClick={() => {
                        // Export functionality would go here
                        alert('Export functionality coming soon!')
                      }}
                    >
                      <Download className="w-4 h-4" />
                      Export All Links
                    </button>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'preferences' && (
              <div className="space-y-6">
                <div>
                  <div className="flex items-center gap-2 mb-4">
                    <h3 className="text-lg font-semibold text-gray-900">Display Settings</h3>
                    <span className="px-2 py-0.5 text-xs font-medium text-gray-500 bg-gray-100 rounded-full">Coming Soon</span>
                  </div>
                  <div className="space-y-4 opacity-50 pointer-events-none">
                    <div className="flex items-center justify-between py-3 border-b border-gray-200">
                      <div>
                        <p className="font-medium text-gray-900">Dark Mode</p>
                        <p className="text-sm text-gray-500">Switch to dark theme</p>
                      </div>
                      <div className="bg-gray-300 w-12 h-6 rounded-full relative cursor-pointer">
                        <div className="absolute left-1 top-1 w-4 h-4 bg-white rounded-full transition"></div>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between py-3 border-b border-gray-200">
                      <div>
                        <p className="font-medium text-gray-900">Compact View</p>
                        <p className="text-sm text-gray-500">Reduce spacing and padding</p>
                      </div>
                      <div className="bg-blue-600 w-12 h-6 rounded-full relative cursor-pointer">
                        <div className="absolute right-1 top-1 w-4 h-4 bg-white rounded-full transition"></div>
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Notifications</h3>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between py-3 border-b border-gray-200">
                      <div>
                        <p className="font-medium text-gray-900">Email Notifications</p>
                        <p className="text-sm text-gray-500">Receive email updates</p>
                      </div>
                      <div className="bg-gray-300 w-12 h-6 rounded-full relative cursor-pointer">
                        <div className="absolute left-1 top-1 w-4 h-4 bg-white rounded-full transition"></div>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between py-3 border-b border-gray-200">
                      <div>
                        <p className="font-medium text-gray-900">Weekly Summary</p>
                        <p className="text-sm text-gray-500">Get weekly activity reports</p>
                      </div>
                      <div className="bg-gray-300 w-12 h-6 rounded-full relative cursor-pointer">
                        <div className="absolute left-1 top-1 w-4 h-4 bg-white rounded-full transition"></div>
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Default Settings</h3>
                  <div className="space-y-4">
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

                <button className="btn btn-primary flex items-center gap-2">
                  <Save className="w-4 h-4" />
                  Save Preferences
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
