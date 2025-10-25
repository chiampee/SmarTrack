import React, { useState } from 'react';
import { Modal } from './Modal';
import { Button } from './Button';
import { Link } from '../types/Link';
import { openChatGPTWithLinksAndCopy, copyLinksForChatGPT, ChatGPTOptions, testChatGPTOpen } from '../utils/chatGptExport';
import { ExternalLink, Copy, Settings, FileText, Code, MessageSquare } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  links: Link[];
}

export const ChatGPTExportModal: React.FC<Props> = ({ isOpen, onClose, links }) => {
  
  const [options, setOptions] = useState<ChatGPTOptions>({
    includeSummaries: true,
    includeRawContent: false,
    format: 'markdown',
    customPrompt: ''
  });
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const isSingleLink = links.length === 1;
  const linkText = isSingleLink ? 'link' : 'links';

  const handleExport = async () => {
    setLoading(true);
    try { 
      await openChatGPTWithLinksAndCopy(links, options); 
      onClose(); 
    }
    catch (error) { 
      console.error('Export failed:', error); 
      alert('Export failed. Please try again.');
    } finally { 
      setLoading(false); 
    }
  };
  
  const handleCopyOnly = async () => {
    setLoading(true);
    try { 
      await copyLinksForChatGPT(links, options); 
      setCopied(true); 
      setTimeout(() => setCopied(false), 3000); 
    }
    catch (error) { 
      console.error('Copy failed:', error); 
      alert('Copy failed. Please try again.');
    } finally { 
      setLoading(false); 
    }
  };

  const formatOptions = [
    { value: 'markdown', label: 'Markdown', icon: FileText, description: 'Formatted with headers and structure' },
    { value: 'text', label: 'Plain Text', icon: FileText, description: 'Simple text format' },
    { value: 'json', label: 'JSON', icon: Code, description: 'Raw data structure' }
  ];

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Export to ChatGPT"
      maxWidthClass="max-w-2xl"
    >
      <div className="space-y-6">
        {/* Summary */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <MessageSquare className="w-5 h-5 text-blue-600" />
            <h3 className="font-semibold text-blue-900">Export Summary</h3>
          </div>
          <p className="text-blue-800 text-sm">
            Exporting <strong>{links.length}</strong> research {linkText} to ChatGPT for analysis.
          </p>
          <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded text-yellow-800 text-xs">
            <strong>💡 How it works:</strong> Content is copied to your clipboard, then ChatGPT opens in a new tab. The system will attempt to auto-paste the content, but you can also paste manually (Cmd/Ctrl+V) or use ChatGPT's "Continue from clipboard" feature.
          </div>
        </div>

        {/* Format Options */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">
            <FileText className="w-4 h-4 inline mr-1" />
            Export Format
          </label>
          <div className="grid grid-cols-1 gap-3">
            {formatOptions.map((format) => {
              const Icon = format.icon;
              return (
                <label
                  key={format.value}
                  className={`flex items-start gap-3 p-3 border rounded-lg cursor-pointer transition-colors ${
                    options.format === format.value
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <input
                    type="radio"
                    name="format"
                    value={format.value}
                    checked={options.format === format.value}
                    onChange={(e) => setOptions({ ...options, format: e.target.value as any })}
                    className="mt-1"
                  />
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <Icon className="w-4 h-4 text-gray-600" />
                      <span className="font-medium text-gray-900">{format.label}</span>
                    </div>
                    <p className="text-sm text-gray-600 mt-1">{format.description}</p>
                  </div>
                </label>
              );
            })}
          </div>
        </div>

        {/* Content Options */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">
            <Settings className="w-4 h-4 inline mr-1" />
            Content Options
          </label>
          <div className="space-y-3">
            <label className="flex items-center gap-3">
              <input
                type="checkbox"
                checked={options.includeSummaries}
                onChange={(e) => setOptions({ ...options, includeSummaries: e.target.checked })}
                className="rounded"
              />
              <div>
                <span className="font-medium text-gray-900">Include Page Content & AI Analysis</span>
                <p className="text-sm text-gray-600">Add TL;DR summaries, key points, quotes, insights, and actual page content</p>
              </div>
            </label>
            
            <label className="flex items-center gap-3">
              <input
                type="checkbox"
                checked={options.includeRawContent}
                onChange={(e) => setOptions({ ...options, includeRawContent: e.target.checked })}
                className="rounded"
                disabled={!options.includeSummaries}
              />
              <div>
                <span className={`font-medium ${!options.includeSummaries ? 'text-gray-400' : 'text-gray-900'}`}>
                  Include Full Page Content
                </span>
                <p className={`text-sm ${!options.includeSummaries ? 'text-gray-400' : 'text-gray-600'}`}>
                  Include the complete raw text of each page (may be very long but provides full context)
                </p>
              </div>
            </label>
          </div>
          
          {/* Content Preview */}
          {options.includeSummaries && (
            <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <span className="text-sm font-medium text-blue-900">What will be included:</span>
              </div>
              <ul className="text-xs text-blue-800 space-y-1">
                <li>• <strong>Page metadata:</strong> Title, description, labels, priority, status</li>
                <li>• <strong>TL;DR summaries:</strong> Quick overview of each page</li>
                <li>• <strong>Key points:</strong> Bullet-point summaries of main content</li>
                <li>• <strong>Notable quotes:</strong> Important quotes from the pages</li>
                <li>• <strong>Key insights:</strong> Analysis and insights from the content</li>
                {options.includeRawContent && (
                  <li>• <strong>Full page content:</strong> Complete raw text of each page</li>
                )}
                {!options.includeRawContent && (
                  <li>• <strong>Content availability:</strong> Information about available raw content</li>
                )}
              </ul>
            </div>
          )}
        </div>

        {/* Custom Prompt */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Custom Analysis Prompt (Optional)
          </label>
          <textarea
            value={options.customPrompt}
            onChange={(e) => setOptions({ ...options, customPrompt: e.target.value })}
            placeholder="e.g., 'Focus on technical implementation details' or 'Analyze from a business perspective'"
            className="w-full h-20 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
          />
        </div>

        {/* Preview */}
        {options.format === 'markdown' && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Preview {isSingleLink ? '' : '(First 2 links)'}
            </label>
            <div className="bg-gray-50 border border-gray-200 rounded-md p-3 max-h-40 overflow-y-auto">
              <pre className="text-xs text-gray-700 whitespace-pre-wrap">
                {`# Research Links Analysis

I have ${links.length} research ${linkText} that I'd like you to analyze:

## 1. ${links[0]?.metadata.title || 'Untitled'}

**URL:** ${links[0]?.url || ''}

${!isSingleLink && links[1] ? `## 2. ${links[1].metadata.title || 'Untitled'}

**URL:** ${links[1].url || ''}` : ''}

${!isSingleLink ? '...' : ''}`}
              </pre>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-3 pt-4 border-t">
          <Button
            onClick={handleCopyOnly}
            disabled={loading}
            variant="outline"
            className="flex-1"
          >
            <Copy className="w-4 h-4 mr-2" />
            {copied ? 'Copied!' : 'Copy to Clipboard'}
          </Button>
          
          <Button
            onClick={handleExport}
            disabled={loading}
            className="flex-1"
          >
            <ExternalLink className="w-4 h-4 mr-2" />
            {loading ? 'Preparing & Opening...' : 'Copy & Open ChatGPT'}
          </Button>
          
          <Button
            onClick={testChatGPTOpen}
            variant="outline"
            size="sm"
            className="px-3"
            title="Test ChatGPT tab opening"
          >
            🧪 Test Tab
          </Button>
          

          

        </div>

        {/* Instructions */}
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
          <h4 className="font-medium text-gray-900 mb-2">How it works:</h4>
          <ol className="text-sm text-gray-600 space-y-1">
            <li>1. Content is formatted and copied to your clipboard</li>
            <li>2. ChatGPT opens in a new tab</li>
            <li>3. Content should auto-paste within 5-10 seconds</li>
            <li>4. If not automatic, paste manually (Cmd/Ctrl+V)</li>
          </ol>
        </div>
      </div>
    </Modal>
  );
}; 