import React, { useState } from 'react'
import { useGoogleLogin } from '@react-oauth/google'
import { FileText, Loader2 } from 'lucide-react'
import { useToast } from './Toast'
import { useBackendApi } from '../hooks/useBackendApi'

interface NotebookLMExportProps {
  selectedLinkIds: string[]
  onSuccess?: () => void
  className?: string
}

export const NotebookLMExport: React.FC<NotebookLMExportProps> = ({ 
  selectedLinkIds, 
  onSuccess,
  className = ""
}) => {
  const [loading, setLoading] = useState(false)
  const toast = useToast()
  const { makeRequest } = useBackendApi()
  const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID

  const exportToDrive = async (accessToken?: string) => {
    try {
      setLoading(true)
      toast.info('Starting export to Google Drive...')

      const response = await makeRequest<{ status: string, fileId: string, webViewLink: string }>('/api/notebooklm/export', {
        method: 'POST',
        body: JSON.stringify({
          link_ids: selectedLinkIds,
          google_access_token: accessToken || null
        })
      })

      if (response.status === 'success') {
        toast.success(
          <div>
            Export successful!{' '}
            <a 
              href={response.webViewLink} 
              target="_blank" 
              rel="noopener noreferrer"
              className="underline font-bold"
            >
              Open in Drive
            </a>
          </div>,
          6000
        )
        if (onSuccess) onSuccess()
      }
    } catch (error: any) {
      console.error('Export failed:', error)
      
      // Check if the error indicates missing permissions (401)
      // The error object from makeRequest might be structured differently depending on implementation
      // Assuming makeRequest throws an error with status or response property
      
      const isAuthError = error.status === 401 || 
                          error.message?.includes('401') || 
                          error.message?.includes('Access Token is missing') ||
                          error.message?.includes('expired or invalid')

      if (isAuthError && !accessToken) {
         toast.error('Google Drive permission needed. Please sign in with Google again to grant access.')
         // Trigger the explicit login flow
         login() 
      } else {
         toast.error('Failed to export links to Google Drive.')
      }
    } finally {
      setLoading(false)
    }
  }

  const login = useGoogleLogin({
    onSuccess: (tokenResponse) => {
      exportToDrive(tokenResponse.access_token)
    },
    onError: (errorResponse) => {
      console.error('Google Login Failed:', errorResponse)
      toast.error('Google authentication failed.')
    },
    scope: 'https://www.googleapis.com/auth/drive.file',
  })

  const handleClick = () => {
    if (selectedLinkIds.length === 0) {
      toast.error('Please select links to export.')
      return
    }
    // Try to export without explicit token first (hoping backend can fetch it from Auth0)
    exportToDrive()
  }

  return (
    <button
      onClick={handleClick}
      disabled={loading || selectedLinkIds.length === 0}
      className={`flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 hover:text-blue-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-sm hover:shadow ${className}`}
      title="Export selected links to Google Drive for NotebookLM"
    >
      {loading ? (
        <Loader2 className="w-4 h-4 animate-spin" />
      ) : (
        <FileText className="w-4 h-4" />
      )}
      Export to NotebookLM
    </button>
  )
}
