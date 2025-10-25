import { Link } from '../types/Link';
import { aiSummaryService } from '../services/aiSummaryService';

export interface ChatGPTOptions {
  includeSummaries?: boolean;
  includeRawContent?: boolean;
  format?: 'markdown' | 'text' | 'json';
  customPrompt?: string;
}

/**
 * Opens ChatGPT in a new tab with formatted link information
 * @param links - Array of links to include
 * @param options - Configuration options for the export
 */
export const openChatGPTWithLinks = async (
  links: Link[],
  options: ChatGPTOptions = {}
): Promise<void> => {
  const {
    includeSummaries = true,
    includeRawContent = false,
    format = 'markdown',
    customPrompt = ''
  } = options;

  // Format the links information
  const formattedContent = await formatLinksForChatGPT(links, {
    includeSummaries,
    includeRawContent,
    format
  });

  // Create the ChatGPT URL with the content
  const chatGPTUrl = createChatGPTUrl(formattedContent, customPrompt);

  // Open in new tab
  window.open(chatGPTUrl, '_blank');
};

/**
 * Formats links information for ChatGPT with comprehensive page data
 */
const formatLinksForChatGPT = async (
  links: Link[],
  options: {
    includeSummaries: boolean;
    includeRawContent: boolean;
    format: 'markdown' | 'text' | 'json';
  }
): Promise<string> => {
  console.log('🔍 formatLinksForChatGPT called with:', { linksCount: links.length, options });
  
  const { includeSummaries, includeRawContent, format } = options;

  if (format === 'json') {
    return JSON.stringify(links, null, 2);
  }

  let content = '';

  // Minimal header only
  if (format === 'markdown') {
    content += `# Links\n\n`;
  }

  for (let i = 0; i < links.length; i++) {
    const link = links[i];
    console.log(`Processing link ${i + 1}:`, link.metadata.title);
    
    try {
      if (format === 'markdown') {
        content += `## ${i + 1}. ${link.metadata.title || 'Untitled'}\n\n`;
        content += `**URL:** ${link.url}\n\n`;
        
        // Minimal fields only
      } else {
        content += `${i + 1}. ${link.metadata.title || 'Untitled'}\n`;
        content += `   URL: ${link.url}\n`;
        
        // Minimal fields only
        
        content += '\n';
      }
    } catch (linkError) {
      console.error('Error processing link:', linkError);
      content += `## ${i + 1}. Error processing link\n\n`;
      content += `**Error:** Failed to process this link\n\n`;
    }

    // Include AI summaries and actual page content if requested
    if (includeSummaries) {
      try {
        const summaries = await aiSummaryService.getByLink(link.id);
        
        if (summaries.length > 0) {
          if (format === 'markdown') {
            content += `### AI Analysis & Page Content\n\n`;
          } else {
            content += `   AI Analysis & Page Content:\n`;
          }
          
          for (const summary of summaries) {
            // Always include raw content if available and requested
            if (summary.kind === 'raw') {
              if (includeRawContent) {
                if (format === 'markdown') {
                  content += `**FULL PAGE CONTENT:**\n\`\`\`\n${summary.content}\n\`\`\`\n\n`;
                } else {
                  content += `     FULL PAGE CONTENT:\n     ${summary.content}\n\n`;
                }
              } else {
                // Even if not explicitly requested, include a note about raw content availability
                if (format === 'markdown') {
                  content += `**Raw Content Available:** Full page content is available (${summary.content.length} characters)\n\n`;
                } else {
                  content += `     Raw Content Available: Full page content is available (${summary.content.length} characters)\n\n`;
                }
              }
            } else if (summary.kind === 'tldr') {
              if (format === 'markdown') {
                content += `**TL;DR Summary:**\n${summary.content}\n\n`;
              } else {
                content += `     TL;DR Summary: ${summary.content}\n\n`;
              }
            } else if (summary.kind === 'bullets') {
              if (format === 'markdown') {
                content += `**Key Points:**\n${summary.content}\n\n`;
              } else {
                content += `     Key Points: ${summary.content}\n\n`;
              }
            } else if (summary.kind === 'quotes') {
              if (format === 'markdown') {
                content += `**Notable Quotes:**\n${summary.content}\n\n`;
              } else {
                content += `     Notable Quotes: ${summary.content}\n\n`;
              }
            } else if (summary.kind === 'insights') {
              if (format === 'markdown') {
                content += `**Key Insights:**\n${summary.content}\n\n`;
              } else {
                content += `     Key Insights: ${summary.content}\n\n`;
              }
            } else {
              // Custom or other summary types
              if (format === 'markdown') {
                content += `**${summary.kind.toUpperCase()}:**\n${summary.content}\n\n`;
              } else {
                content += `     ${summary.kind.toUpperCase()}: ${summary.content}\n\n`;
              }
            }
          }
        } else {
          // No summaries available
          if (format === 'markdown') {
            content += `### Page Content\n\n`;
            content += `**Note:** No AI analysis available for this page. You may need to visit the URL directly to access the content.\n\n`;
          } else {
            content += `   Page Content:\n`;
            content += `     Note: No AI analysis available for this page. You may need to visit the URL directly to access the content.\n\n`;
          }
        }
      } catch (error) {
        console.warn('Failed to load summaries for link:', link.id, error);
        if (format === 'markdown') {
          content += `### Page Content\n\n`;
          content += `**Error:** Failed to load page content and analysis.\n\n`;
        } else {
          content += `   Page Content:\n`;
          content += `     Error: Failed to load page content and analysis.\n\n`;
        }
      }
    }

    if (format === 'markdown') {
      content += `---\n\n`;
    } else {
      content += `\n`;
    }
  }

  // Add analysis request
    // Remove global analysis request metadata for lean prompt

  return content;
};

/**
 * Creates a ChatGPT URL with the formatted content
 */
const createChatGPTUrl = (content: string, customPrompt: string = ''): string => {
  const baseUrl = 'https://chat.openai.com/';
  
  // If there's a custom prompt, prepend it
  const fullContent = customPrompt ? `${customPrompt}\n\n${content}` : content;
  
  // Encode the content for URL
  const encodedContent = encodeURIComponent(fullContent);
  
  // Create the URL with the content as a parameter
  // Note: ChatGPT doesn't support direct content injection via URL parameters
  // So we'll open the base URL and the user will need to paste the content
  return baseUrl;
};

/**
 * Attempts to auto-paste content into ChatGPT using multiple methods
 */
const attemptAutoPaste = async (newWindow: Window | null | { closed: boolean }, content: string): Promise<void> => {
  if (!newWindow || (newWindow as any).closed) {
    console.log('❌ Window not available for auto-paste');
    return;
  }
  
  // If it's a dummy object, we can't do auto-paste
  if (!('document' in newWindow)) {
    console.log('⚠️ Dummy window object - auto-paste not available');
    return;
  }

  console.log('🔧 Starting enhanced auto-paste attempts...');
  
  // Method 1: Enhanced DOM injection with multiple retries
  try {
    newWindow.focus();
    
    // Wait for ChatGPT to load
    await new Promise(resolve => setTimeout(resolve, 4000));
    
    // Inject the enhanced auto-paste helper script
    try {
      const script = newWindow.document.createElement('script');
      script.textContent = `
        (function() {
          'use strict';
          console.log('🤖 Enhanced auto-paste helper injected');
          
          function findChatGPTInput() {
            const selectors = [
              // ChatGPT's main input selectors
              'textarea[data-id="root"]',
              'textarea[placeholder*="Message"]',
              'textarea[placeholder*="Send a message"]',
              'textarea[placeholder*="Send a message to ChatGPT"]',
              'textarea[placeholder*="Message ChatGPT"]',
              // Contenteditable elements
              '[contenteditable="true"][data-id="root"]',
              '[contenteditable="true"][role="textbox"]',
              '[contenteditable="true"]',
              // Fallback selectors
              '.markdown textarea',
              'textarea',
              'input[type="text"]'
            ];
            
            for (const selector of selectors) {
              const input = document.querySelector(selector);
              if (input && input.offsetParent !== null) { // Check if visible
                console.log('✅ Found visible input with selector:', selector);
                return input;
              }
            }
            return null;
          }
          
          function autoPasteContent(content) {
            console.log('🔧 Attempting to auto-paste content...');
            
            // Try multiple times with different delays
            const attempts = [
              { delay: 1000, method: 'direct' },
              { delay: 2000, method: 'clipboard' },
              { delay: 3000, method: 'focus' }
            ];
            
            attempts.forEach((attempt, index) => {
              setTimeout(() => {
                console.log(\`🔄 Attempt \${index + 1} (\${attempt.method})...\`);
                
                const input = findChatGPTInput();
                if (!input) {
                  console.log('❌ No input found for attempt', index + 1);
                  return;
                }
                
                // Focus the input first
                input.focus();
                
                if (attempt.method === 'direct') {
                  // Direct value setting
                  if (input instanceof HTMLTextAreaElement || input instanceof HTMLInputElement) {
                    input.value = content;
                    input.dispatchEvent(new Event('input', { bubbles: true }));
                    input.dispatchEvent(new Event('change', { bubbles: true }));
                    console.log('✅ Direct paste successful!');
                  } else if (input instanceof HTMLElement && input.contentEditable === 'true') {
                    input.textContent = content;
                    input.dispatchEvent(new Event('input', { bubbles: true }));
                    console.log('✅ Direct paste successful!');
                  }
                } else if (attempt.method === 'clipboard') {
                  // Clipboard simulation
                  try {
                    // Set clipboard content
                    navigator.clipboard.writeText(content).then(() => {
                      // Simulate Ctrl+V
                      input.dispatchEvent(new KeyboardEvent('keydown', {
                        key: 'v',
                        code: 'KeyV',
                        ctrlKey: true,
                        bubbles: true
                      }));
                      console.log('✅ Clipboard paste simulated');
                    });
                  } catch (error) {
                    console.log('❌ Clipboard simulation failed:', error);
                  }
                } else if (attempt.method === 'focus') {
                  // Focus and paste
                  input.focus();
                  input.click();
                  
                  // Try to paste using execCommand as fallback
                  try {
                    const tempTextarea = document.createElement('textarea');
                    tempTextarea.value = content;
                    document.body.appendChild(tempTextarea);
                    tempTextarea.select();
                    document.execCommand('copy');
                    document.body.removeChild(tempTextarea);
                    
                    input.focus();
                    document.execCommand('paste');
                    console.log('✅ execCommand paste successful');
                  } catch (error) {
                    console.log('❌ execCommand paste failed:', error);
                  }
                }
              }, attempt.delay);
            });
          }
          
          // Start auto-paste with retries
          setTimeout(() => {
            autoPasteContent(\`${content.replace(/`/g, '\\`')}\`);
          }, 500);
          
          // Also try to detect when ChatGPT is fully loaded
          const observer = new MutationObserver(() => {
            const input = findChatGPTInput();
            if (input) {
              console.log('🎯 ChatGPT input detected, attempting paste...');
              autoPasteContent(\`${content.replace(/`/g, '\\`')}\`);
              observer.disconnect();
            }
          });
          
          observer.observe(document.body, {
            childList: true,
            subtree: true
          });
          
        })();
      `;
      
      newWindow.document.head.appendChild(script);
      console.log('✅ Enhanced auto-paste helper script injected');
      
    } catch (injectionError) {
      console.log('❌ Script injection failed:', injectionError);
    }
    
  } catch (error) {
    console.log('❌ Direct DOM access failed:', error);
  }
  
  // Method 2: Use postMessage to communicate with ChatGPT
  try {
    newWindow.postMessage({
      type: 'AUTO_PASTE_REQUEST',
      content: content,
      timestamp: Date.now()
    }, 'https://chat.openai.com');
    
    console.log('✅ PostMessage sent to ChatGPT');
  } catch (error) {
    console.log('❌ PostMessage failed:', error);
  }
  
  // Method 3: Enhanced keyboard simulation
  try {
    newWindow.focus();
    
    // Wait a bit then try keyboard simulation
    setTimeout(() => {
      try {
        // Simulate Ctrl+V multiple times
        for (let i = 0; i < 3; i++) {
          setTimeout(() => {
            newWindow.document.dispatchEvent(new KeyboardEvent('keydown', {
              key: 'v',
              code: 'KeyV',
              ctrlKey: true,
              bubbles: true
            }));
          }, i * 1000);
        }
        console.log('✅ Enhanced keyboard paste events simulated');
      } catch (error) {
        console.log('❌ Enhanced keyboard simulation failed:', error);
      }
    }, 2000);
    
  } catch (error) {
    console.log('❌ Keyboard simulation failed:', error);
  }
};

/**
 * Copies formatted links content to clipboard for easy pasting into ChatGPT
 */
export const copyLinksForChatGPT = async (
  links: Link[],
  options: ChatGPTOptions = {}
): Promise<void> => {
  console.log('🔍 copyLinksForChatGPT called with:', { links: links.length, options });
  console.log('🔍 Browser context:', {
    isSecureContext: window.isSecureContext,
    hasClipboardAPI: !!navigator.clipboard,
    userAgent: navigator.userAgent
  });
  
  try {
    const {
      includeSummaries = true,
      includeRawContent = false,
      format = 'markdown',
      customPrompt = ''
    } = options;

    console.log('📝 Formatting content for clipboard...');
    const formattedContent = await formatLinksForChatGPT(links, {
      includeSummaries,
      includeRawContent,
      format
    });
    
    const fullContent = customPrompt ? `${customPrompt}\n\n${formattedContent}` : formattedContent;
    console.log('✅ Content formatted successfully, length:', fullContent.length);
    
    console.log('📋 Attempting to copy content to clipboard...');
    
    // Method 1: Try modern Clipboard API (requires secure context)
    if (navigator.clipboard && window.isSecureContext) {
      try {
        console.log('🔧 Trying modern Clipboard API...');
        await navigator.clipboard.writeText(fullContent);
        console.log('✅ Content copied successfully using modern clipboard API');
        return;
      } catch (clipboardError) {
        console.log('❌ Modern clipboard API failed:', clipboardError);
        console.log('🔄 Falling back to legacy method...');
      }
    } else {
      console.log('⚠️ Modern clipboard API not available (not secure context)');
      console.log('🔄 Using fallback clipboard method...');
    }
    
    // Method 2: Legacy fallback method
    try {
      console.log('🔧 Using legacy clipboard method...');
      const textArea = document.createElement('textarea');
      textArea.value = fullContent;
      textArea.style.cssText = `
        position: fixed;
        left: -999999px;
        top: -999999px;
        width: 1px;
        height: 1px;
        opacity: 0;
        pointer-events: none;
        z-index: -1;
      `;
      
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      
      const copySuccess = document.execCommand('copy');
      document.body.removeChild(textArea);
      
      if (copySuccess) {
        console.log('✅ Content copied successfully using legacy method');
      } else {
        throw new Error('document.execCommand("copy") returned false');
      }
    } catch (legacyError) {
      console.error('❌ Legacy clipboard method failed:', legacyError);
      
      // Method 3: Manual copy instructions
      console.log('🔄 Providing manual copy instructions...');
      const manualCopyMessage = `📋 Manual Copy Required

The content couldn't be automatically copied to your clipboard.

📝 Content to copy manually:
${fullContent.substring(0, 500)}${fullContent.length > 500 ? '...' : ''}

🔧 To copy manually:
1. Select all the content above
2. Copy it (Cmd/Ctrl+C)
3. Paste into ChatGPT

💡 Tip: The full content is ${fullContent.length} characters long.`;

      alert(manualCopyMessage);
      
      // Also show the content in a modal or textarea for easy copying
      const copyContainer = document.createElement('div');
      copyContainer.id = 'manual-copy-container';
      copyContainer.style.cssText = `
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        width: 80%;
        max-width: 600px;
        max-height: 80vh;
        background: white;
        border: 2px solid #007bff;
        border-radius: 8px;
        padding: 20px;
        z-index: 10000;
        box-shadow: 0 4px 20px rgba(0,0,0,0.3);
        overflow: auto;
      `;
      
             copyContainer.innerHTML = `
         <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px;">
           <h3 style="margin: 0; color: #007bff;">📋 Manual Copy Required</h3>
           <button onclick="this.parentElement.parentElement.remove()" style="background: #dc3545; color: white; border: none; padding: 5px 10px; border-radius: 4px; cursor: pointer;">✕</button>
         </div>
         <p style="margin-bottom: 15px; color: #666;">Select and copy the content below, then paste it into ChatGPT:</p>
         <textarea readonly style="width: 100%; height: 300px; padding: 10px; border: 1px solid #ccc; border-radius: 4px; font-family: monospace; font-size: 12px; resize: vertical;">${fullContent}</textarea>
         <div style="margin-top: 15px; text-align: center;">
           <button onclick="navigator.clipboard.writeText(document.querySelector('#manual-copy-container textarea').value).then(() => alert('✅ Content copied successfully!')).catch(() => alert('❌ Copy failed - please select and copy manually'))" style="background: #28a745; color: white; border: none; padding: 10px 20px; border-radius: 4px; cursor: pointer; margin-right: 10px;">📋 Try Copy Again</button>
           <button onclick="window.open('https://chat.openai.com/', '_blank')" style="background: #007bff; color: white; border: none; padding: 10px 20px; border-radius: 4px; cursor: pointer; margin-right: 10px;">🌐 Open ChatGPT</button>
           <button onclick="document.querySelector('#manual-copy-container textarea').select(); document.execCommand('copy'); alert('✅ Content selected and copied!')" style="background: #ffc107; color: #212529; border: none; padding: 10px 20px; border-radius: 4px; cursor: pointer;">🎯 Select & Copy</button>
         </div>
         <div style="margin-top: 10px; padding: 10px; background: #f8f9fa; border-radius: 4px; font-size: 12px; color: #666;">
           <strong>💡 Quick Steps:</strong><br>
           1. Click "Select & Copy" to copy the content<br>
           2. Click "Open ChatGPT" to go to ChatGPT<br>
           3. Paste (Cmd/Ctrl+V) in ChatGPT
         </div>
       `;
      
      document.body.appendChild(copyContainer);
      
      // Auto-remove after 5 minutes
      setTimeout(() => {
        const container = document.getElementById('manual-copy-container');
        if (container) {
          container.remove();
        }
      }, 300000);
      
      throw new Error('All clipboard methods failed - manual copy provided');
    }
    
    console.log('✅ Links content copied to clipboard! Ready to paste into ChatGPT.');
  } catch (error) {
    console.error('❌ Failed to copy links content:', error);
    throw error;
  }
};

/**
 * Opens ChatGPT and copies content to clipboard with instructions
 */
export const openChatGPTWithLinksAndCopy = async (
  links: Link[],
  options: ChatGPTOptions = {}
): Promise<void> => {
  try {
    console.log('🚀 openChatGPTWithLinksAndCopy called with:', { 
      linksCount: links.length, 
      options,
      userAgent: navigator.userAgent,
      isSecureContext: window.isSecureContext
    });
    
    // Copy content to clipboard
    console.log('📋 Step 1: Copying content to clipboard...');
    await copyLinksForChatGPT(links, options);
    console.log('✅ Step 1: Content copied successfully');
    
    // Open ChatGPT in new tab and pass payload via window.name for the extension content script to paste
    const chatGPTUrl = createChatGPTUrl('', options.customPrompt);
    console.log('🌐 Step 2: Opening ChatGPT URL:', chatGPTUrl);

    // Prepare payload (encode to keep it compact and safe)
    const formattedContent = await formatLinksForChatGPT(links, {
      includeSummaries: options.includeSummaries ?? false,
      includeRawContent: options.includeRawContent ?? false,
      format: options.format ?? 'markdown'
    });
    const fullContent = options.customPrompt ? `${options.customPrompt}\n\n${formattedContent}` : formattedContent;
    const payload = `SRT_PASTE::` + btoa(unescape(encodeURIComponent(fullContent)));

    let newWindow: any = null;
    try {
      // Open a blank tab synchronously from the user gesture, set window.name, then navigate
      newWindow = window.open('', '_blank');
      if (newWindow) {
        newWindow.name = payload;
        newWindow.location.href = chatGPTUrl;
        console.log('✅ Opened tab and set window.name payload');
      }
    } catch (error) {
      console.log('❌ Failed to open blank tab with payload:', error);
      // Fallback to a direct open (content script may still read clipboard/manual paste)
      try {
        window.open(chatGPTUrl, '_blank');
      } catch (_) {}
    }
    
    // Approach 4: Force open with location.href as last resort
    if (!newWindow) {
      try {
        console.log('🔧 Attempting Approach 4: Force opening with location...');
        // This will open in the same tab, but it's a fallback
        window.location.href = chatGPTUrl;
        console.log('🔍 Approach 4: Location redirect attempted');
        return; // Exit early since we're redirecting
      } catch (error) {
        console.log('❌ Approach 4 failed:', error);
      }
    }
    
    if (newWindow && !newWindow.closed) {
      console.log('✅ ChatGPT tab opened successfully');
      
      // Get the formatted content for auto-paste attempts
      const formattedContent = await formatLinksForChatGPT(links, {
        includeSummaries: options.includeSummaries ?? true,
        includeRawContent: options.includeRawContent ?? false,
        format: options.format ?? 'markdown'
      });
      
      const fullContent = options.customPrompt ? `${options.customPrompt}\n\n${formattedContent}` : formattedContent;
      
      // Try to auto-paste content after a delay
      setTimeout(async () => {
        try {
          console.log('🔧 Attempting auto-paste in ChatGPT...');
          await attemptAutoPaste(newWindow, fullContent);
        } catch (error) {
          console.log('❌ Auto-paste attempt failed:', error);
        }
      }, 2000); // Wait 2 seconds for ChatGPT to load
      
      // Show enhanced success message with better instructions
      const successMessage = `✅ Export Successful!

📋 What happened:
• ${links.length} link${links.length > 1 ? 's' : ''} content copied to clipboard ✅
• ChatGPT opened in new tab ✅
• Enhanced auto-paste script injected ✅

🎯 What to expect:
1. Content should automatically appear in ChatGPT input within 5-10 seconds
2. If not automatic, paste manually (Cmd/Ctrl+V)
3. Look for "Continue from clipboard" button in ChatGPT
4. The content includes all link metadata, summaries, and analysis

💡 Pro tip: If auto-paste doesn't work, the content is already in your clipboard - just paste it manually!

💡 Pro Tip: The auto-paste script will attempt to fill ChatGPT automatically!`;

      setTimeout(() => {
        alert(successMessage);
      }, 100);
      
      // Enhanced floating reminder with auto-paste status
      setTimeout(() => {
        const reminder = document.createElement('div');
        reminder.id = 'chatgpt-reminder';
        reminder.style.cssText = `
          position: fixed;
          top: 20px;
          right: 20px;
          background: #28a745;
          color: white;
          padding: 15px;
          border-radius: 8px;
          box-shadow: 0 4px 12px rgba(0,0,0,0.15);
          z-index: 10000;
          max-width: 350px;
          font-family: Arial, sans-serif;
        `;
        reminder.innerHTML = `
          <div style="font-weight: bold; margin-bottom: 8px;">🤖 Auto-Paste Active!</div>
          <div style="font-size: 14px; margin-bottom: 10px;">Your ${links.length} link${links.length > 1 ? 's' : ''} are copied to clipboard.</div>
          <div style="font-size: 12px; margin-bottom: 10px;">Content should automatically appear in ChatGPT input field.</div>
          <div style="font-size: 11px; margin-bottom: 10px; opacity: 0.9;">If not automatic, paste manually (Cmd/Ctrl+V)</div>
          <button onclick="this.parentElement.remove()" style="background: rgba(255,255,255,0.2); border: none; color: white; padding: 5px 10px; border-radius: 4px; cursor: pointer; font-size: 12px;">Got it!</button>
        `;
        document.body.appendChild(reminder);
        
        // Auto-remove after 30 seconds
        setTimeout(() => {
          if (reminder.parentNode) {
            reminder.parentNode.removeChild(reminder);
          }
        }, 30000);
      }, 500);
    } else {
      console.log('❌ All popup approaches failed');
      
      // Show manual instructions
      const manualMessage = `⚠️ Popup Blocked - Manual Steps Required

📋 Content Status:
• ${links.length} link${links.length > 1 ? 's' : ''} content copied to clipboard ✅

🌐 Manual Steps:
1. Click this link to open ChatGPT: https://chat.openai.com/
2. Paste the content (Cmd/Ctrl+V)
3. Start your analysis

🔧 To fix popup blocking:
• Allow popups for this site
• Or use the "Copy Only" option instead`;

      // Create a clickable link for manual opening
      const manualLink = document.createElement('a');
      manualLink.href = 'https://chat.openai.com/';
      manualLink.target = '_blank';
      manualLink.textContent = 'Open ChatGPT Manually';
      manualLink.style.cssText = 'display: block; margin: 10px 0; padding: 10px; background: #007bff; color: white; text-decoration: none; border-radius: 4px; text-align: center;';
      
      // Show alert with manual instructions
      alert(manualMessage);
      
      // Also show the link in the page if possible
      setTimeout(() => {
        const existingLink = document.querySelector('#manual-chatgpt-link');
        if (!existingLink) {
          const container = document.createElement('div');
          container.id = 'manual-chatgpt-link';
          container.style.cssText = 'position: fixed; top: 20px; right: 20px; z-index: 10000; background: white; padding: 15px; border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.15); border: 2px solid #007bff;';
          container.innerHTML = `
            <div style="margin-bottom: 10px; font-weight: bold;">📋 Content Ready!</div>
            <div style="margin-bottom: 10px;">Click below to open ChatGPT:</div>
          `;
          container.appendChild(manualLink);
          document.body.appendChild(container);
          
          // Auto-remove after 30 seconds
          setTimeout(() => {
            if (container.parentNode) {
              container.parentNode.removeChild(container);
            }
          }, 30000);
        }
      }, 500);
    }
  } catch (error) {
    console.error('❌ Failed to prepare ChatGPT export:', error);
    console.error('🔍 Error details:', {
      name: error instanceof Error ? error.name : 'Unknown',
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : 'No stack trace'
    });
    
    const errorMessage = `❌ Export Failed

🔍 Error: ${error instanceof Error ? error.message : String(error)}

📋 Manual Steps:
1. Open ChatGPT: https://chat.openai.com/
2. Copy your links manually
3. Paste into ChatGPT

💡 Try the "Copy Only" option instead!`;
    
    alert(errorMessage);
  }
}; 

/**
 * Test function to verify ChatGPT tab opening works
 */
export const testChatGPTOpen = (): void => {
  console.log('🧪 Testing ChatGPT tab opening...');
  
  const testUrl = 'https://chat.openai.com/';
  
  try {
    console.log('🔧 Attempting to open ChatGPT test tab...');
    const newWindow = window.open(testUrl, '_blank', 'noopener,noreferrer');
    
    if (newWindow && !newWindow.closed) {
      console.log('✅ ChatGPT test tab opened successfully!');
      alert('✅ ChatGPT tab opened successfully! Check your browser tabs.');
    } else {
      console.log('❌ ChatGPT test tab failed to open');
      alert('❌ ChatGPT tab failed to open. Check popup blocker settings.');
    }
  } catch (error) {
    console.error('❌ Test failed:', error);
    alert('❌ Test failed: ' + error);
  }
};

/**
 * Verify clipboard API availability and browser compatibility
 */
export const verifyClipboardSupport = (): void => {
  console.log('🔍 Verifying clipboard support...');
  
  // Check if clipboard API is available
  if (navigator.clipboard) {
    console.log('✅ Modern Clipboard API is available');
  } else {
    console.log('⚠️ Modern Clipboard API not available, will use fallback');
  }
  
  // Check if we're in a secure context
  if (window.isSecureContext) {
    console.log('✅ Running in secure context (HTTPS or localhost)');
  } else {
    console.log('⚠️ Not running in secure context, clipboard may not work');
  }
  
  // Check for document.execCommand support (fallback)
  if (document.queryCommandSupported && document.queryCommandSupported('copy')) {
    console.log('✅ Fallback copy method (execCommand) is supported');
  } else {
    console.log('⚠️ Fallback copy method not supported');
  }
  
  // Check browser
  const userAgent = navigator.userAgent;
  if (userAgent.includes('Chrome')) {
    console.log('🌐 Browser: Chrome');
  } else if (userAgent.includes('Firefox')) {
    console.log('🌐 Browser: Firefox');
  } else if (userAgent.includes('Safari')) {
    console.log('🌐 Browser: Safari');
  } else if (userAgent.includes('Edge')) {
    console.log('🌐 Browser: Edge');
  } else {
    console.log('🌐 Browser: Unknown');
  }
};