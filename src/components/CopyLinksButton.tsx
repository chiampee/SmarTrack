import React, { useState, useEffect, useRef } from 'react'
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
  const modalDataRef = useRef<{ show: boolean; count: number }>({ show: false, count: 0 })
  const toast = useToast()
  const { makeRequest } = useBackendApi()

  // Debug: Log whenever showModal or copiedCount changes
  useEffect(() => {
    console.log('🔄 State changed - showModal:', showModal, 'copiedCount:', copiedCount)
  }, [showModal, copiedCount])

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

      // Format: Copy only URLs (one per line)
      const formattedText = selectedLinks
        .map((link: any) => link.url)
        .join('\n')

      // Copy to clipboard
      try {
        await navigator.clipboard.writeText(formattedText)
        console.log('✅ Clipboard write successful')
      } catch (clipboardError) {
        console.error('Clipboard API failed, using fallback:', clipboardError)
        // Fallback: create temporary textarea
        const textarea = document.createElement('textarea')
        textarea.value = formattedText
        textarea.style.position = 'fixed'
        textarea.style.opacity = '0'
        document.body.appendChild(textarea)
        textarea.select()
        document.execCommand('copy')
        document.body.removeChild(textarea)
        console.log('✅ Fallback copy successful')
      }
      
      console.log('Setting modal state: true, count:', selectedLinks.length)
      
      // Batch state updates using React.startTransition or direct batching
      const count = selectedLinks.length
      modalDataRef.current = { show: true, count }
      
      // Set states in batched update
      setCopied(true)
      setCopiedCount(count)
      
      // Use setTimeout to ensure state update completes before showing modal
      setTimeout(() => {
        console.log('🚀 Triggering modal display')
        setShowModal(true)
      }, 0)
      
      toast.success(`Copied ${count} link${count > 1 ? 's' : ''} to clipboard!`)
      
      setTimeout(() => setCopied(false), 2000)
      
      // Don't call onSuccess immediately - let the modal display first
      // onSuccess will be called when the modal is closed
    } catch (error: any) {
      console.error('Copy operation failed:', error)
      toast.error('Failed to copy links. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleModalClose = () => {
    setShowModal(false)
    // Call onSuccess after modal is closed (clears selection)
    if (onSuccess) {
      onSuccess()
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
        onClose={handleModalClose}
        linkCount={copiedCount}
      />
    </>
  )
}

