import React, { useState } from 'react'
import { Copy, Check } from 'lucide-react'
import { useToast } from './Toast'
import { useBackendApi } from '../hooks/useBackendApi'
import { PasteDestinationModal } from './PasteDestinationModal'

interface CopyLinksButtonProps {
  selectedLinkIds: string[]
  onSuccess?: () => void
  className?: string
}

export const CopyLinksButton: React.FC<CopyLinksButtonProps> = ({ 
  selectedLinkIds, 
  onSuccess,
  className = ""
}) => {
  const [copied, setCopied] = useState(false)
  const [loading, setLoading] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const [copiedCount, setCopiedCount] = useState(0)
  const toast = useToast()
  const { makeRequest } = useBackendApi()

  const handleCopy = async () => {
    if (selectedLinkIds.length === 0) {
      toast.error('Please select links to copy.')
      return
    }

    try {
      setLoading(true)

      // Fetch the full link data from the backend
      // API returns: {links: [...], total: ..., hasMore: ..., page: ..., limit: ...}
      const response = await makeRequest<any>('/api/links?limit=100', {
        method: 'GET'
      })

      // Extract the links array from the response
      const links = response.links || []

      // Filter to only selected links
      const selectedLinks = links.filter((link: any) => 
        selectedLinkIds.includes(link._id || link.id)
      )

      if (selectedLinks.length === 0) {
        toast.error('No links found to copy.')
        setLoading(false)
        return
      }

      // Format links for NotebookLM - clean format with only essential data
      let formattedText = ''
      
      selectedLinks.forEach((link: any, index: number) => {
        // Title and URL
        formattedText += `${link.title || 'Untitled'}\n`
        formattedText += `${link.url}\n`
        
        // Description/Summary
        if (link.summary || link.description) {
          formattedText += `${link.summary || link.description}\n`
        }
        
        // Add separator between links
        if (index < selectedLinks.length - 1) {
          formattedText += '\n---\n\n'
        }
      })

      // Copy to clipboard
      await navigator.clipboard.writeText(formattedText)
      
      console.log('✅ Copied to clipboard, showing modal...')
      setCopied(true)
      setCopiedCount(selectedLinks.length)
      setShowModal(true)
      console.log('Modal state set to:', true)
      
      setTimeout(() => setCopied(false), 2000)
      
      if (onSuccess) onSuccess()
    } catch (error: any) {
      console.error('Copy failed:', error)
      toast.error('Failed to copy links. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <button
        onClick={handleCopy}
        disabled={loading || selectedLinkIds.length === 0}
        className={`flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 hover:text-green-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-sm hover:shadow ${className}`}
        title="Copy selected links with descriptions"
      >
        {copied ? (
          <Check className="w-4 h-4 text-green-600" />
        ) : (
          <Copy className="w-4 h-4" />
        )}
        {copied ? 'Copied!' : 'Copy'}
      </button>

      <PasteDestinationModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        linkCount={copiedCount}
      />
    </>
  )
}

