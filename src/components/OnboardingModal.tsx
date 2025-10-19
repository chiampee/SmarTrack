import React, { useState, useEffect } from 'react';
import { Modal } from './Modal';
import { Button } from './Button';
import { Input } from './Input';
import { 
  BookOpen, 
  Download, 
  MessageSquare, 
  CheckCircle, 
  Key, 
  Download as DownloadIcon, 
  ChevronDown, 
  ChevronRight, 
  Settings,
  XCircle,
  Sparkles,
  Zap,
  ArrowRight,
  ArrowLeft,
  Play,
  Copy,
  ExternalLink,
  Star,
  Target,
  Lightbulb
} from 'lucide-react';
import { apiKeySetupService } from '../services/apiKeySetupService';

interface OnboardingStep {
  title: string;
  description: string;
  icon: React.ReactNode;
  content: React.ReactNode;
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onDontShowAgain?: (dontShow: boolean) => void;
}

export const OnboardingModal: React.FC<Props> = ({ isOpen, onClose, onDontShowAgain }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [apiKey, setApiKey] = useState('');
  const [apiKeyStatus, setApiKeyStatus] = useState<{
    loading: boolean;
    success: boolean;
    message: string;
    envContent?: string;
  }>({ loading: false, success: false, message: '' });
  const [showManualSetup, setShowManualSetup] = useState(false);
  const [testStatus, setTestStatus] = useState<{
    loading: boolean;
    success: boolean;
    message: string;
    errorType?: string;
  }>({ loading: false, success: false, message: '' });
  const [showErrorInfo, setShowErrorInfo] = useState(false);
  const [dontShowAgain, setDontShowAgain] = useState(false);
  const [animateStep, setAnimateStep] = useState(false);
  const [showProgress, setShowProgress] = useState(false);

  // Animation effects
  useEffect(() => {
    if (isOpen) {
      setAnimateStep(true);
      setTimeout(() => setShowProgress(true), 300);
    } else {
      setAnimateStep(false);
      setShowProgress(false);
    }
  }, [isOpen]);

  useEffect(() => {
    setAnimateStep(false);
    setTimeout(() => setAnimateStep(true), 100);
  }, [currentStep]);

  // Auto-detect extension when reaching extension step
  useEffect(() => {
    if (currentStep === 1 && isOpen) {
      // Auto-check for extension after a short delay
      setTimeout(() => {
        autoDetectExtension();
      }, 1000);
    }
  }, [currentStep, isOpen]);

  const errorInfoList = [
    {
      title: "Invalid API Key Format",
      description: "Your API key should start with 'sk-' followed by a long string of characters.",
      solution: "Check that you copied the complete key from your OpenAI account.",
      icon: "🔑",
      details: "OpenAI API keys are 51 characters long and always start with 'sk-'. Make sure you haven't accidentally added extra spaces or characters."
    },
    {
      title: "API Key Not Found",
      description: "The API key you provided doesn't exist in our system.",
      solution: "Verify you're using the correct key from your OpenAI dashboard.",
      icon: "❌",
      details: "This usually means the key was deleted, never existed, or you're using a key from a different account. Check your OpenAI dashboard for the correct key."
    },
    {
      title: "Insufficient Credits",
      description: "Your OpenAI account doesn't have enough credits for API calls.",
      solution: "Add credits to your OpenAI account or check your usage limits.",
      icon: "💰",
      details: "OpenAI charges per token used. Check your billing dashboard to see current usage and add more credits if needed."
    },
    {
      title: "Rate Limit Exceeded",
      description: "You've made too many API requests in a short time period.",
      solution: "Wait a few minutes before trying again or upgrade your plan.",
      icon: "⏱️",
      details: "Free tier users have lower rate limits. Consider upgrading to a paid plan for higher limits and better performance."
    },
    {
      title: "Network Connection Issue",
      description: "Unable to connect to OpenAI's servers.",
      solution: "Check your internet connection and try again.",
      icon: "🌐",
      details: "This could be due to firewall settings, VPN interference, or temporary OpenAI server issues. Try disabling VPN if you're using one."
    },
    {
      title: "Account Suspended",
      description: "Your OpenAI account has been temporarily suspended.",
      solution: "Contact OpenAI support to resolve account issues.",
      icon: "🚫",
      details: "Accounts can be suspended for policy violations, payment issues, or suspicious activity. Check your email for suspension notices."
    },
    {
      title: "API Key Expired",
      description: "Your API key has reached its expiration date.",
      solution: "Generate a new API key from your OpenAI dashboard.",
      icon: "⏰",
      details: "Some API keys have expiration dates for security. Create a new key and update your configuration."
    },
    {
      title: "Organization Access Issue",
      description: "Your API key doesn't have access to the required organization.",
      solution: "Check your organization settings or use a different API key.",
      icon: "🏢",
      details: "If you're part of multiple OpenAI organizations, ensure you're using the correct API key for the right organization."
    },
    {
      title: "Model Access Restricted",
      description: "Your account doesn't have access to the required AI model.",
      solution: "Upgrade your plan or request access to the specific model.",
      icon: "🤖",
      details: "Some models require special access or higher-tier plans. Check which models are available in your current plan."
    },
    {
      title: "Geographic Restrictions",
      description: "OpenAI services are not available in your region.",
      solution: "Use a VPN or contact OpenAI support for regional access.",
      icon: "🌍",
      details: "OpenAI has geographic restrictions. Consider using a VPN service that routes through supported regions."
    },
    {
      title: "Browser Security Block",
      description: "Your browser is blocking the API request for security reasons.",
      solution: "Check browser security settings or try a different browser.",
      icon: "🔒",
      details: "Some browsers block API requests due to CORS policies or security extensions. Try disabling extensions temporarily."
    },
    {
      title: "Proxy/Firewall Block",
      description: "Your network is blocking connections to OpenAI servers.",
      solution: "Contact your network administrator or try a different network.",
      icon: "🛡️",
      details: "Corporate networks often block external API calls. You may need to request access from your IT department."
    },
    {
      title: "API Version Mismatch",
      description: "The API version being used is not supported.",
      solution: "Update your application or check API version compatibility.",
      icon: "📋",
      details: "OpenAI regularly updates their API. Ensure you're using a compatible version of the API."
    },
    {
      title: "Quota Exceeded",
      description: "You've reached your monthly usage quota.",
      solution: "Upgrade your plan or wait until next billing cycle.",
      icon: "📊",
      details: "Free tier users have monthly limits. Paid plans offer higher quotas and better usage tracking."
    },
    {
      title: "Authentication Token Invalid",
      description: "The authentication token format is incorrect or corrupted.",
      solution: "Regenerate your API key and update your configuration.",
      icon: "🔐",
      details: "This usually happens when the key is partially copied or corrupted during transfer. Generate a fresh key."
    }
  ];

  const handleApiKeySetup = async () => {
    if (!apiKey.trim()) {
      setApiKeyStatus({
        loading: false,
        success: false,
        message: 'Please enter your API key'
      });
      return;
    }

    setApiKeyStatus({ loading: true, success: false, message: '' });
    try {
      const result = await apiKeySetupService.setupApiKey(apiKey);
      setApiKeyStatus({ ...result, loading: false });
      
      // Auto-advance to next step if successful
      if (result.success) {
        setTimeout(() => {
          if (currentStep < steps.length - 1) {
            nextStep();
          }
        }, 1500);
      }
    } catch (error) {
      setApiKeyStatus({
        loading: false,
        success: false,
        message: 'Failed to setup API key. Please try again.'
      });
    }
  };

  const handleTestApiKey = async () => {
    if (!apiKey.trim()) {
      setTestStatus({
        loading: false,
        success: false,
        message: 'Please enter your API key first',
        errorType: 'No API Key'
      });
      return;
    }

    setTestStatus({ loading: true, success: false, message: '', errorType: undefined });
    try {
      const result = await apiKeySetupService.testApiKey(apiKey);
      setTestStatus({
        loading: false,
        success: result.success,
        message: result.message,
        errorType: result.errorType
      });
      
      // Auto-save if test is successful
      if (result.success) {
        handleApiKeySetup();
      }
    } catch (error) {
      setTestStatus({
        loading: false,
        success: false,
        message: 'Failed to test API key. Please try again.',
        errorType: 'Network Connection Issue'
      });
    }
  };

  const skipApiKeySetup = () => {
    setApiKeyStatus({
      loading: false,
      success: true,
      message: 'Skipped - You can configure API key later in settings'
    });
    if (currentStep < steps.length - 1) {
      nextStep();
    }
  };

  const checkExtensionStatus = async () => {
    try {
      // Check if extension is installed
      if (typeof window.chrome !== 'undefined' && window.chrome.runtime) {
        const response = await new Promise<boolean>((resolve) => {
          const timeout = setTimeout(() => resolve(false), 1000);
          window.chrome!.runtime!.sendMessage('smart-research-tracker', { action: 'ping' }, (response: any) => {
            clearTimeout(timeout);
            resolve(!!response);
          });
        });
        return response;
      }
    } catch (error) {
      console.log('Extension check failed:', error);
    }
    return false;
  };

  const autoDetectExtension = async () => {
    const isInstalled = await checkExtensionStatus();
    if (isInstalled) {
      // Auto-advance if extension is detected
      setTimeout(() => {
        if (currentStep < steps.length - 1) {
          nextStep();
        }
      }, 1000);
    }
  };

  const getSpecificErrorInfo = (errorType: string) => {
    return errorInfoList.find(error => error.title === errorType);
  };

  const isApiKeyConfigured = apiKeySetupService.isApiKeyConfigured();

  const steps: OnboardingStep[] = [
    {
      title: "Welcome to Smart Research Tracker",
      description: "Your AI-powered research companion",
      icon: <BookOpen className="w-8 h-8 text-blue-600" />,
      content: (
        <div className={`space-y-6 transition-all duration-700 ${animateStep ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
          {/* Hero Section */}
          <div className="text-center space-y-4">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500 via-purple-600 to-indigo-600 rounded-2xl blur-lg opacity-20 animate-pulse"></div>
              <div className="relative bg-gradient-to-br from-blue-500 via-purple-600 to-indigo-600 rounded-xl p-6 text-white">
                <div className="flex items-center justify-center mb-3">
                  <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
                    <Sparkles className="w-6 h-6 text-white" />
                  </div>
                </div>
                <h3 className="text-xl font-bold mb-2">Transform Your Research</h3>
                <p className="text-blue-100">
                  Automatically extract insights from web pages and chat with your data using AI
                </p>
              </div>
            </div>
          </div>

          {/* Features Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className={`group bg-gradient-to-br from-blue-50 to-blue-100 p-4 rounded-xl border border-blue-200 hover:shadow-lg transition-all duration-300 hover:scale-105 ${animateStep ? 'animate-fade-in-up' : ''}`} style={{ animationDelay: '200ms' }}>
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                  <Download className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h4 className="font-bold text-blue-900">Save Pages</h4>
                  <p className="text-blue-700 text-sm">One-click capture</p>
                </div>
              </div>
              <p className="text-blue-800 text-sm leading-relaxed">
                Save any webpage with full text extraction and automatic categorization
              </p>
              <div className="mt-3 flex items-center gap-2 text-blue-600 text-xs">
                <Target className="w-3 h-3" />
                <span>Instant capture</span>
              </div>
            </div>

            <div className={`group bg-gradient-to-br from-green-50 to-green-100 p-4 rounded-xl border border-green-200 hover:shadow-lg transition-all duration-300 hover:scale-105 ${animateStep ? 'animate-fade-in-up' : ''}`} style={{ animationDelay: '400ms' }}>
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-green-600 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                  <MessageSquare className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h4 className="font-bold text-green-900">AI Chat</h4>
                  <p className="text-green-700 text-sm">Intelligent conversations</p>
                </div>
              </div>
              <p className="text-green-800 text-sm leading-relaxed">
                Ask questions about your research and get instant AI-powered insights
              </p>
              <div className="mt-3 flex items-center gap-2 text-green-600 text-xs">
                <Zap className="w-3 h-3" />
                <span>Smart responses</span>
              </div>
            </div>

            <div className={`group bg-gradient-to-br from-purple-50 to-purple-100 p-4 rounded-xl border border-purple-200 hover:shadow-lg transition-all duration-300 hover:scale-105 ${animateStep ? 'animate-fade-in-up' : ''}`} style={{ animationDelay: '600ms' }}>
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                  <Settings className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h4 className="font-bold text-purple-900">Organize</h4>
                  <p className="text-purple-700 text-sm">Smart management</p>
                </div>
              </div>
              <p className="text-purple-800 text-sm leading-relaxed">
                Automatically categorize and filter your research with intelligent tagging
              </p>
              <div className="mt-3 flex items-center gap-2 text-purple-600 text-xs">
                <Star className="w-3 h-3" />
                <span>Auto-categorization</span>
              </div>
            </div>
          </div>

          {/* Quick Start Callout */}
          <div className={`bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-xl p-4 ${animateStep ? 'animate-fade-in-up' : ''}`} style={{ animationDelay: '800ms' }}>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                <Lightbulb className="w-5 h-5 text-white" />
              </div>
              <div className="flex-1">
                <h4 className="font-bold text-gray-900 mb-1">Ready to Get Started?</h4>
                <p className="text-gray-700 text-sm">
                  This quick setup will guide you through installing the browser extension and configuring AI features.
                </p>
              </div>
              <div className="flex items-center gap-2 text-blue-600">
                <span className="text-xs font-medium">3 steps</span>
                <ArrowRight className="w-4 h-4" />
              </div>
            </div>
          </div>
        </div>
      )
    },
    {
      title: "Install Browser Extension",
      description: "Save pages with one click",
      icon: <Download className="w-8 h-8 text-blue-600" />,
      content: (
        <div className={`space-y-6 transition-all duration-700 ${animateStep ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
          {/* Hero Section */}
          <div className="text-center space-y-4">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500 to-blue-600 rounded-3xl blur-xl opacity-20 animate-pulse"></div>
              <div className="relative bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl p-6 text-white">
                <div className="flex items-center justify-center mb-4">
                  <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
                    <DownloadIcon className="w-6 h-6 text-white" />
                  </div>
                </div>
                <h3 className="text-xl font-bold mb-2">Browser Extension</h3>
                <p className="text-blue-100">
                  Save any webpage with one click and get AI-powered summaries
                </p>
              </div>
            </div>
          </div>

          {/* Installation Steps */}
          <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <Play className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <h4 className="font-bold text-gray-900">Installation Steps</h4>
                <p className="text-gray-600 text-sm">Follow these steps to install the extension</p>
              </div>
            </div>

            <div className="space-y-3">
              {[
                {
      step: 1,
      title: "Download Extension",
      description: "SmartResearchTracker-extension-v1.0.1.zip (29KB)",
      icon: "⬇️",
      color: "blue",
      downloadUrl: "https://github.com/chiampee/SmarTrack/releases/download/V1.0.1/SmartResearchTracker-extension-v1.0.1.zip"
    },
                {
                  step: 2,
                  title: "Unzip the File",
                  description: "Double-click the downloaded ZIP file",
                  icon: "📦",
                  color: "teal"
                },
                {
                  step: 3,
                  title: "Open Extensions Page",
                  description: "Paste chrome://extensions/ in address bar",
                  icon: "🌐",
                  color: "green"
                },
                {
                  step: 4,
                  title: "Enable Developer Mode",
                  description: "Toggle in top right corner",
                  icon: "⚙️",
                  color: "purple"
                },
                {
                  step: 5,
                  title: "Load Unpacked",
                  description: "Select the unzipped folder",
                  icon: "📁",
                  color: "orange"
                }
              ].map((item, index) => (
                <div key={index} className={`flex items-start gap-3 p-3 rounded-lg border-2 transition-all duration-300 hover:shadow-md ${animateStep ? 'animate-fade-in-up' : ''}`} 
                     style={{ 
                       animationDelay: `${(index + 1) * 200}ms`,
                       borderColor: item.color === 'blue' ? '#dbeafe' : 
                                   item.color === 'teal' ? '#ccfbf1' :
                                   item.color === 'green' ? '#dcfce7' : 
                                   item.color === 'purple' ? '#f3e8ff' : '#fed7aa'
                     }}>
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center text-white font-bold text-xs ${
                    item.color === 'blue' ? 'bg-blue-500' : 
                    item.color === 'teal' ? 'bg-teal-500' :
                    item.color === 'green' ? 'bg-green-500' : 
                    item.color === 'purple' ? 'bg-purple-500' : 'bg-orange-500'
                  }`}>
                    {item.step}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-base">{item.icon}</span>
                      <h5 className="font-semibold text-gray-900 text-sm">{item.title}</h5>
                    </div>
                    <p className="text-gray-600 text-xs">{item.description}</p>
                  </div>
                  {index === 0 && item.downloadUrl && (
                    <Button
                      onClick={() => window.open(item.downloadUrl, '_blank')}
                      variant="outline"
                      size="sm"
                      className="border-blue-300 text-blue-700 hover:bg-blue-50"
                    >
                      <DownloadIcon className="w-4 h-4 mr-1" />
                      Download
                    </Button>
                  )}
                  {index === 2 && (
                    <Button
                      onClick={() => {
                        // Copy to clipboard
                        navigator.clipboard.writeText('chrome://extensions/').then(() => {
                          // Show toast notification
                          const toast = document.createElement('div');
                          toast.className = 'fixed top-4 right-4 bg-green-500 text-white px-4 py-3 rounded-lg shadow-lg z-[9999] flex items-center gap-2 animate-fade-in-up';
                          toast.innerHTML = `
                            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
                            </svg>
                            <div>
                              <div class="font-semibold">Copied to clipboard!</div>
                              <div class="text-xs opacity-90">Paste in browser address bar: chrome://extensions/</div>
                            </div>
                          `;
                          document.body.appendChild(toast);
                          setTimeout(() => {
                            toast.style.opacity = '0';
                            toast.style.transition = 'opacity 300ms';
                            setTimeout(() => toast.remove(), 300);
                          }, 4000);
                        }).catch(() => {
                          // Fallback: show alert
                          alert('Please open a new tab and paste this URL:\n\nchrome://extensions/');
                        });
                      }}
                      variant="outline"
                      size="sm"
                      className="border-green-300 text-green-700 hover:bg-green-50"
                    >
                      <ExternalLink className="w-4 h-4 mr-1" />
                      Copy URL
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Extension Detection */}
          <div className={`bg-gradient-to-br from-purple-50 to-purple-100 p-4 rounded-lg border border-purple-200 ${animateStep ? 'animate-fade-in-up' : ''}`} style={{ animationDelay: '1000ms' }}>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-purple-500 rounded-lg flex items-center justify-center">
                  <span className="text-white text-sm">🔍</span>
                </div>
                <div>
                  <h5 className="font-semibold text-purple-900">Auto-Detect Extension</h5>
                  <p className="text-purple-700 text-xs">Check if the extension is already installed</p>
                </div>
              </div>
              <Button
                onClick={autoDetectExtension}
                variant="outline"
                size="sm"
                className="border-purple-300 text-purple-700 hover:bg-purple-50"
              >
                <span className="text-sm mr-1">🔍</span>
                Check
              </Button>
            </div>
            <p className="text-purple-800 text-xs">
              If you've already installed the extension, click "Check" to automatically detect it and proceed to the next step.
            </p>
          </div>

          {/* Tips and Features */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className={`bg-gradient-to-br from-blue-50 to-blue-100 p-3 rounded-lg border border-blue-200 ${animateStep ? 'animate-fade-in-up' : ''}`} style={{ animationDelay: '1200ms' }}>
              <div className="flex items-start gap-2">
                <div className="w-6 h-6 bg-blue-500 rounded-lg flex items-center justify-center mt-0.5">
                  <span className="text-white text-xs">💡</span>
                </div>
                <div>
                  <h5 className="font-semibold text-blue-900 text-sm mb-1">Pro Tip</h5>
                  <p className="text-blue-800 text-xs leading-relaxed">
                    Once installed, you'll see the extension icon in your browser toolbar. 
                    Click it on any webpage to save it to your research collection.
                  </p>
                </div>
              </div>
            </div>

            <div className={`bg-gradient-to-br from-green-50 to-green-100 p-3 rounded-lg border border-green-200 ${animateStep ? 'animate-fade-in-up' : ''}`} style={{ animationDelay: '1400ms' }}>
              <div className="flex items-start gap-2">
                <div className="w-6 h-6 bg-green-500 rounded-lg flex items-center justify-center mt-0.5">
                  <span className="text-white text-xs">✨</span>
                </div>
                <div>
                  <h5 className="font-semibold text-green-900 text-sm mb-1">Features</h5>
                  <ul className="text-green-800 text-xs space-y-0.5">
                    <li>• One-click page saving</li>
                    <li>• Full text extraction</li>
                    <li>• AI-powered summaries</li>
                    <li>• Automatic categorization</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      )
    },
    {
      title: "Set Up AI Features",
      description: "Enable intelligent summaries and chat",
      icon: <MessageSquare className="w-8 h-8 text-blue-600" />,
      content: (
        <div className="space-y-6">
          {/* Hero Section */}
          <div className="text-center space-y-4">
            <div className="space-y-3">
              <p className="text-sm text-gray-600 leading-relaxed">
                Get instant summaries of your research and chat with your data using AI. 
                This step is optional but highly recommended for the best experience.
              </p>
            </div>
          </div>
          
          {/* Quick Setup Section */}
          <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center w-10 h-10 bg-blue-100 rounded-lg">
                  <Key className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900">Quick Setup</h4>
                  <p className="text-sm text-gray-500">Recommended for most users</p>
                </div>
              </div>
              <Button
                onClick={skipApiKeySetup}
                variant="outline"
                size="sm"
                className="border-gray-300 text-gray-600 hover:bg-gray-50"
              >
                Skip for now
              </Button>
            </div>
              
            {isApiKeyConfigured ? (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  <div className="flex-1">
                    <h4 className="font-medium text-green-800">API key configured!</h4>
                    <p className="text-sm text-green-600">AI features are ready to use</p>
                  </div>
                  <Button
                    onClick={handleTestApiKey}
                    disabled={testStatus.loading}
                    variant="outline"
                    size="sm"
                    className="border-green-300 text-green-700 hover:bg-green-100"
                  >
                    {testStatus.loading ? (
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 border-2 border-green-600 border-t-transparent rounded-full animate-spin"></div>
                        Testing
                      </div>
                    ) : (
                      'Test Key'
                    )}
                  </Button>
                </div>
                
                {testStatus.message && (
                  <div className={`mt-3 p-3 rounded-lg text-sm flex items-center gap-2 ${
                    testStatus.success 
                      ? 'bg-blue-50 text-blue-700 border border-blue-200' 
                      : 'bg-red-50 text-red-700 border border-red-200'
                  }`}>
                    {testStatus.success ? (
                      <CheckCircle className="w-4 h-4" />
                    ) : (
                      <XCircle className="w-4 h-4" />
                    )}
                    {testStatus.message}
                  </div>
                )}

                {/* Show specific error details when test fails for configured key */}
                {!testStatus.success && testStatus.errorType && testStatus.message && (
                  <div className="mt-3 bg-red-50 border border-red-200 rounded-lg p-3">
                    {(() => {
                      const specificError = getSpecificErrorInfo(testStatus.errorType);
                      if (!specificError) return null;
                      
                      return (
                        <div className="flex items-start gap-3">
                          <span className="text-lg">{specificError.icon}</span>
                          <div className="flex-1 space-y-2">
                            <h6 className="text-sm font-medium text-red-800">{specificError.title}</h6>
                            <p className="text-xs text-red-700">{specificError.description}</p>
                            <p className="text-xs text-blue-600 font-medium">💡 {specificError.solution}</p>
                            {specificError.details && (
                              <details className="mt-2">
                                <summary className="text-xs text-red-600 cursor-pointer hover:text-red-700">
                                  📖 More details
                                </summary>
                                <p className="text-xs text-red-600 mt-1 pl-2 border-l-2 border-red-300">
                                  {specificError.details}
                                </p>
                              </details>
                            )}
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                )}

                {/* Error Information Toggle for Configured Key */}
                <div className="mt-4">
                  <button
                    onClick={() => setShowErrorInfo(!showErrorInfo)}
                    className="flex items-center gap-2 text-xs text-green-600 hover:text-green-700 transition-colors"
                  >
                    <span>{showErrorInfo ? 'Hide' : 'Show'} Common API Key Issues</span>
                    {showErrorInfo ? (
                      <ChevronDown className="w-3 h-3" />
                    ) : (
                      <ChevronRight className="w-3 h-3" />
                    )}
                  </button>
                </div>

                {/* Error Information List for Configured Key */}
                {showErrorInfo && (
                  <div className="mt-3 space-y-3">
                    <h5 className="text-sm font-medium text-gray-700">Common Issues & Solutions:</h5>
                    <div className="space-y-2">
                      {errorInfoList.map((error, index) => (
                        <div key={index} className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                          <div className="flex items-start gap-3">
                            <span className="text-lg">{error.icon}</span>
                            <div className="flex-1 space-y-1">
                              <h6 className="text-sm font-medium text-gray-900">{error.title}</h6>
                              <p className="text-xs text-gray-600">{error.description}</p>
                              <p className="text-xs text-blue-600 font-medium">💡 {error.solution}</p>
                              {error.details && (
                                <details className="mt-2">
                                  <summary className="text-xs text-gray-500 cursor-pointer hover:text-gray-700">
                                    📖 More details
                                  </summary>
                                  <p className="text-xs text-gray-500 mt-1 pl-2 border-l-2 border-gray-300">
                                    {error.details}
                                  </p>
                                </details>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    OpenAI API Key
                  </label>
                  <div className="flex gap-3">
                    <div className="flex-1 relative">
                      <Input
                        type="password"
                        placeholder="sk-your-api-key-here"
                        value={apiKey}
                        onChange={(e) => setApiKey(e.target.value)}
                        className="pr-10"
                        onKeyPress={(e) => {
                          if (e.key === 'Enter' && apiKey.trim()) {
                            handleApiKeySetup();
                          }
                        }}
                      />
                      <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                        {apiKey.trim() && (
                          <div className={`w-2 h-2 rounded-full ${
                            apiKey.startsWith('sk-') && apiKey.length > 20 ? 'bg-green-400' : 'bg-yellow-400'
                          }`}></div>
                        )}
                      </div>
                    </div>
                    <Button
                      onClick={handleApiKeySetup}
                      disabled={!apiKey.trim() || apiKeyStatus.loading}
                      className="px-6"
                    >
                      {apiKeyStatus.loading ? (
                        <div className="flex items-center gap-2">
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                          Validating
                        </div>
                      ) : (
                        'Setup'
                      )}
                    </Button>
                    <Button
                      onClick={handleTestApiKey}
                      disabled={!apiKey.trim() || testStatus.loading}
                      variant="outline"
                      className="px-6"
                    >
                      {testStatus.loading ? (
                        <div className="flex items-center gap-2">
                          <div className="w-4 h-4 border-2 border-gray-600 border-t-transparent rounded-full animate-spin"></div>
                          Testing
                        </div>
                      ) : (
                        'Test'
                      )}
                    </Button>
                  </div>
                  <div className="flex items-center justify-between mt-2">
                    <p className="text-xs text-gray-500">
                      Press Enter to save, or click Test to validate first
                    </p>
                    <a 
                      href="https://platform.openai.com/api-keys" 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="text-xs text-blue-600 hover:text-blue-700 font-medium transition-colors flex items-center gap-1"
                    >
                      Get API Key
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                </div>

                {/* Status Messages */}
                {apiKeyStatus.message && (
                  <div className={`rounded-xl p-4 border ${
                    apiKeyStatus.success 
                      ? 'bg-green-50 border-green-200 text-green-800' 
                      : 'bg-red-50 border-red-200 text-red-800'
                  }`}>
                    <div className="flex items-start gap-3">
                      <div className={`flex items-center justify-center w-6 h-6 rounded-full flex-shrink-0 mt-0.5 ${
                        apiKeyStatus.success ? 'bg-green-100' : 'bg-red-100'
                      }`}>
                        {apiKeyStatus.success ? (
                          <CheckCircle className="w-4 h-4 text-green-600" />
                        ) : (
                          <span className="text-red-600 text-sm font-bold">!</span>
                        )}
                      </div>
                      <p className="text-sm">{apiKeyStatus.message}</p>
                    </div>
                  </div>
                )}

                {testStatus.message && (
                  <div className={`mt-3 p-3 rounded-lg text-sm flex items-center gap-2 ${
                    testStatus.success 
                      ? 'bg-blue-50 text-blue-700 border border-blue-200' 
                      : 'bg-red-50 text-red-700 border border-red-200'
                  }`}>
                    {testStatus.success ? (
                      <CheckCircle className="w-4 h-4" />
                    ) : (
                      <XCircle className="w-4 h-4" />
                    )}
                    {testStatus.message}
                  </div>
                )}

                {/* Download .env.local file */}
                {apiKeyStatus.success && apiKeyStatus.envContent && (
                  <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                    <div className="flex items-start gap-3 mb-3">
                      <div className="flex items-center justify-center w-10 h-10 bg-blue-100 rounded-lg">
                        <DownloadIcon className="w-5 h-5 text-blue-600" />
                      </div>
                      <div>
                        <p className="font-medium text-blue-900">Configuration ready!</p>
                        <p className="text-xs text-blue-700">Download your .env.local file</p>
                      </div>
                    </div>
                    <Button
                      onClick={() => apiKeySetupService.downloadEnvFile(apiKeyStatus.envContent!)}
                      variant="secondary"
                      className="w-full bg-white hover:bg-gray-50 border border-blue-200 text-blue-700"
                    >
                      <DownloadIcon className="w-4 h-4 mr-2" />
                      Download .env.local
                    </Button>
                    <p className="text-xs text-blue-600 mt-2 text-center">
                      Place this file in your project root, then restart the development server
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Manual Setup Section */}
          <div className="bg-gray-50 rounded-xl overflow-hidden">
            <button
              onClick={() => setShowManualSetup(!showManualSetup)}
              className="w-full px-4 py-3 flex items-center justify-between text-left hover:bg-gray-100 transition-colors group"
            >
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center w-10 h-10 bg-gray-200 rounded-lg group-hover:bg-gray-300 transition-colors">
                  <Settings className="w-5 h-5 text-gray-600" />
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900">Manual Setup</h4>
                  <p className="text-xs text-gray-500">Alternative configuration method</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-400 font-medium">
                  {showManualSetup ? 'Hide' : 'Show'}
                </span>
                <div className={`transition-transform duration-200 ${
                  showManualSetup ? 'rotate-180' : ''
                }`}>
                  <ChevronDown className="w-4 h-4 text-gray-500" />
                </div>
              </div>
            </button>
            
            {showManualSetup && (
              <div className="px-4 pb-4 space-y-4 border-t border-gray-200">
                <p className="text-sm text-gray-600 pt-4">
                  Follow these steps if you prefer to set up the configuration manually:
                </p>
                
                <div className="space-y-4">
                  {[
                    {
                      step: 1,
                      title: "Get an OpenAI API key",
                      description: "Visit the OpenAI Platform to create or access your API keys",
                      link: "https://platform.openai.com/api-keys",
                      linkText: "OpenAI Platform"
                    },
                    {
                      step: 2,
                      title: "Create a .env.local file",
                      description: "This file should be in the same directory as your package.json",
                      code: ".env.local"
                    },
                    {
                      step: 3,
                      title: "Add your API key",
                      description: "Replace 'sk-your-key-here' with your actual API key",
                      code: "VITE_OPENAI_API_KEY=sk-your-key-here"
                    },
                    {
                      step: 4,
                      title: "Restart the development server",
                      description: "Stop the current server (Ctrl+C) and run pnpm dev again",
                      code: "pnpm dev"
                    }
                  ].map((item) => (
                    <div key={item.step} className="flex gap-3">
                      <div className="flex items-center justify-center w-8 h-8 bg-blue-100 rounded-full flex-shrink-0">
                        <span className="text-sm font-semibold text-blue-600">{item.step}</span>
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h5 className="font-medium text-gray-900">{item.title}</h5>
                          {item.link && (
                            <a 
                              href={item.link} 
                              target="_blank" 
                              rel="noopener noreferrer" 
                              className="text-blue-600 hover:text-blue-700 font-medium text-sm transition-colors"
                            >
                              {item.linkText}
                            </a>
                          )}
                        </div>
                        <p className="text-sm text-gray-500 mb-2">{item.description}</p>
                        {item.code && (
                          <div className="bg-gray-900 text-green-400 p-3 rounded-lg font-mono text-sm">
                            {item.code}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
                
                <div className="bg-blue-50 rounded-xl p-4 border border-blue-200">
                  <h5 className="text-sm font-semibold text-blue-900 mb-3">Complete .env.local Example</h5>
                  <pre className="text-xs text-blue-800 bg-blue-100 p-3 rounded-lg overflow-x-auto font-mono">
{`# Smart Research Tracker Configuration
VITE_OPENAI_API_KEY=sk-your-actual-api-key-here
VITE_OPENAI_MODEL=gpt-4o-mini
VITE_OPENAI_EMBED_MODEL=text-embedding-3-small
VITE_MAX_SUMMARY_LENGTH=500
VITE_ENABLE_ANALYTICS=false`}
                  </pre>
                </div>
              </div>
            )}
          </div>
        </div>
      )
    },
    {
      title: "Start Researching",
      description: "You're all set!",
      icon: <CheckCircle className="w-8 h-8 text-green-600" />,
      content: (
        <div className="space-y-4">
          <p className="text-gray-600">
            You're ready to start building your research collection! Here's how to get started:
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-blue-50 p-4 rounded-lg">
              <h4 className="font-medium mb-2 text-blue-900">Quick Start:</h4>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• Use the browser extension to save pages</li>
                <li>• Add labels to organize your research</li>
                <li>• Click the chat icon to ask questions</li>
                <li>• Use filters to find specific content</li>
              </ul>
            </div>
            <div className="bg-purple-50 p-4 rounded-lg">
              <h4 className="font-medium mb-2 text-purple-900">Pro Tips:</h4>
              <ul className="text-sm text-purple-800 space-y-1">
                <li>• Press <kbd className="bg-white px-1 rounded text-xs">/</kbd> to search</li>
                <li>• Press <kbd className="bg-white px-1 rounded text-xs">⌘K</kbd> to add links</li>
                <li>• Drag & drop to reorder categories</li>
                <li>• Select multiple links for group chat</li>
              </ul>
            </div>
          </div>
          <div className="bg-gray-50 p-3 rounded-lg">
            <p className="text-sm text-gray-700">
              🎯 <strong>Next:</strong> Try saving your first webpage using the browser extension, 
              or manually add a link using the "Add Link" button.
            </p>
          </div>
        </div>
      )
    },
    {
      title: "Setup Complete!",
      description: "You're ready to start researching",
      icon: <CheckCircle className="w-8 h-8 text-green-600" />,
      content: (
        <div className={`space-y-4 transition-all duration-700 ${animateStep ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
          {/* Success Hero */}
          <div className="text-center space-y-3">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl blur-lg opacity-20 animate-pulse"></div>
              <div className="relative bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl p-6 text-white">
                <div className="flex items-center justify-center mb-3">
                  <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
                    <Sparkles className="w-6 h-6 text-white" />
                  </div>
                </div>
                <h3 className="text-xl font-bold mb-2">🎉 Setup Complete!</h3>
                <p className="text-green-100">
                  You're all set to transform your research workflow
                </p>
              </div>
            </div>
          </div>

          {/* Setup Summary */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className={`bg-blue-50 p-3 rounded-lg border border-blue-200 ${animateStep ? 'animate-fade-in-up' : ''}`} style={{ animationDelay: '200ms' }}>
              <div className="flex items-center gap-2 mb-2">
                <div className="w-6 h-6 bg-blue-500 rounded-lg flex items-center justify-center">
                  <CheckCircle className="w-3 h-3 text-white" />
                </div>
                <h4 className="font-semibold text-blue-900 text-sm">Extension</h4>
              </div>
              <p className="text-blue-700 text-xs">
                {isApiKeyConfigured ? 'Ready to save pages' : 'Install when ready'}
              </p>
            </div>

            <div className={`bg-green-50 p-3 rounded-lg border border-green-200 ${animateStep ? 'animate-fade-in-up' : ''}`} style={{ animationDelay: '400ms' }}>
              <div className="flex items-center gap-2 mb-2">
                <div className="w-6 h-6 bg-green-500 rounded-lg flex items-center justify-center">
                  <CheckCircle className="w-3 h-3 text-white" />
                </div>
                <h4 className="font-semibold text-green-900 text-sm">AI Features</h4>
              </div>
              <p className="text-green-700 text-xs">
                {isApiKeyConfigured ? 'Configured and ready' : 'Configure in settings'}
              </p>
            </div>

            <div className={`bg-purple-50 p-3 rounded-lg border border-purple-200 ${animateStep ? 'animate-fade-in-up' : ''}`} style={{ animationDelay: '600ms' }}>
              <div className="flex items-center gap-2 mb-2">
                <div className="w-6 h-6 bg-purple-500 rounded-lg flex items-center justify-center">
                  <CheckCircle className="w-3 h-3 text-white" />
                </div>
                <h4 className="font-semibold text-purple-900 text-sm">Account</h4>
              </div>
              <p className="text-purple-700 text-xs">
                Ready to start organizing research
              </p>
            </div>
          </div>

          {/* Quick Actions */}
          <div className={`bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-2xl p-6 ${animateStep ? 'animate-fade-in-up' : ''}`} style={{ animationDelay: '800ms' }}>
            <h4 className="font-bold text-gray-900 text-lg mb-4">🚀 Quick Start Actions</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <h5 className="font-semibold text-gray-800">Get Started:</h5>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• Click "Add Link" to manually add a webpage</li>
                  <li>• Install the browser extension for one-click saving</li>
                  <li>• Use the search bar to find saved content</li>
                  <li>• Try the AI chat feature to ask questions</li>
                </ul>
              </div>
              <div className="space-y-2">
                <h5 className="font-semibold text-gray-800">Keyboard Shortcuts:</h5>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• <kbd className="bg-white px-1 rounded text-xs">/</kbd> Quick search</li>
                  <li>• <kbd className="bg-white px-1 rounded text-xs">⌘K</kbd> Add new link</li>
                  <li>• <kbd className="bg-white px-1 rounded text-xs">⌘J</kbd> Open chat</li>
                  <li>• <kbd className="bg-white px-1 rounded text-xs">⌘S</kbd> Save current page</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Final Call to Action */}
          <div className={`text-center space-y-4 ${animateStep ? 'animate-fade-in-up' : ''}`} style={{ animationDelay: '1000ms' }}>
            <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
              <h4 className="font-bold text-gray-900 text-lg mb-2">Ready to Transform Your Research?</h4>
              <p className="text-gray-600 mb-4">
                Start saving web pages, organizing your research, and chatting with your data using AI.
              </p>
              <div className="flex items-center justify-center gap-2 text-sm text-gray-500">
                <span>💡 Tip:</span>
                <span>You can always access settings, help, and database tests from the sidebar</span>
              </div>
            </div>
          </div>
        </div>
      )
    }
  ];

  const nextStep = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      // Call the callback with the "don't show again" preference
      if (onDontShowAgain) {
        onDontShowAgain(dontShowAgain);
      }
      onClose();
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleClose = () => {
    // Save the "don't show again" preference when closing
    if (onDontShowAgain) {
      onDontShowAgain(dontShowAgain);
    }
    onClose();
  };

  const currentStepData = steps[currentStep];

  return (
    <Modal 
      isOpen={isOpen} 
      onClose={handleClose} 
      title=""
      maxWidthClass="max-w-4xl w-full mx-2 sm:mx-4"
    >
      <div className="space-y-6 max-h-[80vh] overflow-y-auto">
        {/* Enhanced Progress Indicator */}
        {showProgress && (
          <div className={`space-y-3 transition-all duration-700 ${showProgress ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium text-gray-700">Setup Progress</h3>
              <span className="text-sm text-gray-500">{currentStep + 1} of {steps.length}</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-gradient-to-r from-blue-500 to-purple-600 h-2 rounded-full transition-all duration-700 ease-out shadow-sm"
                style={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
              ></div>
            </div>
            <div className="flex justify-between text-xs text-gray-500">
              <span className="flex items-center gap-1">
                <BookOpen className="w-3 h-3" />
                Welcome
              </span>
              <span className="flex items-center gap-1">
                <Download className="w-3 h-3" />
                Extension
              </span>
              <span className="flex items-center gap-1">
                <MessageSquare className="w-3 h-3" />
                AI Setup
              </span>
              <span className="flex items-center gap-1">
                <CheckCircle className="w-3 h-3" />
                Complete
              </span>
            </div>
          </div>
        )}

        {/* Enhanced Header */}
        <div className={`text-center space-y-4 transition-all duration-700 ${animateStep ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
          <div className="flex items-center justify-center gap-4">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500 via-purple-600 to-indigo-600 rounded-2xl blur-lg opacity-30 animate-pulse"></div>
              <div className="relative w-16 h-16 bg-gradient-to-br from-blue-500 via-purple-600 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
                <div className="text-white">
                  {React.cloneElement(currentStepData.icon as React.ReactElement<any>, { 
                    className: 'w-8 h-8' 
                  })}
                </div>
              </div>
            </div>
            <div className="text-left">
              <h2 className="text-2xl font-bold text-gray-900 mb-1">{currentStepData.title}</h2>
              <p className="text-gray-600">{currentStepData.description}</p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="min-h-[400px] max-h-[50vh] overflow-y-auto">
          <div className="max-w-3xl mx-auto">
            {currentStepData.content}
          </div>
        </div>

        {/* Enhanced Navigation */}
        <div className={`flex justify-between items-center pt-6 border-t border-gray-200 sticky bottom-0 bg-white transition-all duration-500 ${animateStep ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
          <div className="flex items-center gap-3">
            <Button
              onClick={prevStep}
              disabled={currentStep === 0}
              variant="secondary"
              size="sm"
              className="flex items-center gap-2 px-4 py-2 rounded-lg hover:shadow-md transition-all duration-200"
            >
              <ArrowLeft className="w-3 h-3" />
              Previous
            </Button>
            
            <label className="flex items-center gap-2 text-xs text-gray-600 bg-gray-50 px-3 py-1.5 rounded-lg border border-gray-200">
              <input
                type="checkbox"
                checked={dontShowAgain}
                onChange={(e) => setDontShowAgain(e.target.checked)}
                className="rounded border-gray-300"
              />
              Don't show this again
            </label>
          </div>

          <div className="flex items-center gap-2">
            {currentStep < steps.length - 1 ? (
              <>
                {currentStep === 0 && (
                  <Button
                    onClick={handleClose}
                    variant="secondary"
                    size="sm"
                    className="flex items-center gap-2 px-4 py-2 rounded-lg hover:shadow-md transition-all duration-200"
                  >
                    Skip Setup
                  </Button>
                )}
                <Button
                  onClick={nextStep}
                  size="sm"
                  className="flex items-center gap-2 px-6 py-2 rounded-lg bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-lg hover:shadow-xl transition-all duration-200"
                >
                  Next Step
                  <ArrowRight className="w-3 h-3" />
                </Button>
              </>
            ) : (
              <Button
                onClick={handleClose}
                size="sm"
                className="flex items-center gap-2 px-6 py-2 rounded-lg bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 shadow-lg hover:shadow-xl transition-all duration-200"
              >
                <Sparkles className="w-3 h-3" />
                Get Started
              </Button>
            )}
          </div>
        </div>
      </div>
    </Modal>
  );
}; 