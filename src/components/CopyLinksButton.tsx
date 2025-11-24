import React, { useState } from 'react'
import { Copy, Check } from 'lucide-react'
import { useToast } from './Toast'
import { useBackendApi } from '../hooks/useBackendApi'

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
      const response = await makeRequest<any>('/api/links', {
        method: 'GET'
      })

      // Handle both array and object responses (API might return {links: [...]} or just [...])
      const links = Array.isArray(response) ? response : (response.links || [])

      // Filter to only selected links
      const selectedLinks = links.filter((link: any) => 
        selectedLinkIds.includes(link._id || link.id)
      )

      if (selectedLinks.length === 0) {
        toast.error('No links found to copy.')
        setLoading(false)
        return
      }

      // Format links for NotebookLM
      let formattedText = '=== SmarTrack Links Export ===\n\n'
      
      selectedLinks.forEach((link: any, index: number) => {
        formattedText += `${index + 1}. ${link.title || 'Untitled'}\n`
        formattedText += `   URL: ${link.url}\n`
        
        if (link.summary || link.description) {
          formattedText += `   Description: ${link.summary || link.description}\n`
        }
        
        if (link.category) {
          formattedText += `   Category: ${link.category}\n`
        }
        
        if (link.tags && link.tags.length > 0) {
          formattedText += `   Tags: ${link.tags.join(', ')}\n`
        }
        
        formattedText += '\n'
      })

      formattedText += `\nTotal: ${selectedLinks.length} link${selectedLinks.length !== 1 ? 's' : ''}`

      // Copy to clipboard
      await navigator.clipboard.writeText(formattedText)
      
      setCopied(true)
      toast.success(`Copied ${selectedLinks.length} link${selectedLinks.length !== 1 ? 's' : ''} to clipboard!`, 3000)
      
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
      {copied ? 'Copied!' : 'Copy for NotebookLM'}
    </button>
  )
}

