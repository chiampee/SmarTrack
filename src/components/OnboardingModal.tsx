import React, { useState } from 'react';
import { Modal, Button } from './index';
import { BookOpen, Link, MessageSquare, Settings, Download, CheckCircle } from 'lucide-react';

interface OnboardingStep {
  title: string;
  description: string;
  icon: React.ReactNode;
  content: React.ReactNode;
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export const OnboardingModal: React.FC<Props> = ({ isOpen, onClose }) => {
  const [currentStep, setCurrentStep] = useState(0);

  const steps: OnboardingStep[] = [
    {
      title: "Welcome to Smart Research Tracker",
      description: "Your AI-powered research companion",
      icon: <BookOpen className="w-8 h-8 text-blue-600" />,
      content: (
        <div className="space-y-4">
          <p className="text-gray-600">
            Transform how you research by automatically extracting key insights from web pages 
            and enabling intelligent conversations with your saved content.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <Link className="w-6 h-6 text-blue-600 mx-auto mb-2" />
              <h4 className="font-medium text-sm">Save Pages</h4>
              <p className="text-xs text-gray-600">Capture web content instantly</p>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <MessageSquare className="w-6 h-6 text-green-600 mx-auto mb-2" />
              <h4 className="font-medium text-sm">AI Chat</h4>
              <p className="text-xs text-gray-600">Ask questions about your research</p>
            </div>
            <div className="text-center p-4 bg-purple-50 rounded-lg">
              <Settings className="w-6 h-6 text-purple-600 mx-auto mb-2" />
              <h4 className="font-medium text-sm">Organize</h4>
              <p className="text-xs text-gray-600">Smart categorization & filtering</p>
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
        <div className="space-y-4">
          <p className="text-gray-600">
            The browser extension lets you save any webpage directly from your browser 
            with full text extraction and AI-powered summaries.
          </p>
          <div className="bg-gray-50 p-4 rounded-lg">
            <h4 className="font-medium mb-2">Installation Steps:</h4>
            <ol className="text-sm text-gray-600 space-y-2">
              <li className="flex items-start gap-2">
                <span className="bg-blue-600 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs flex-shrink-0 mt-0.5">1</span>
                <span>Build the extension: <code className="bg-gray-200 px-1 rounded">pnpm run build:extension</code></span>
              </li>
              <li className="flex items-start gap-2">
                <span className="bg-blue-600 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs flex-shrink-0 mt-0.5">2</span>
                <span>Open Chrome and go to <code className="bg-gray-200 px-1 rounded">chrome://extensions/</code></span>
              </li>
              <li className="flex items-start gap-2">
                <span className="bg-blue-600 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs flex-shrink-0 mt-0.5">3</span>
                <span>Enable "Developer mode" in the top right</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="bg-blue-600 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs flex-shrink-0 mt-0.5">4</span>
                <span>Click "Load unpacked" and select the <code className="bg-gray-200 px-1 rounded">dist-extension/</code> folder</span>
              </li>
            </ol>
          </div>
          <div className="bg-blue-50 p-3 rounded-lg">
            <p className="text-sm text-blue-800">
              💡 <strong>Tip:</strong> Once installed, you'll see the extension icon in your browser toolbar. 
              Click it on any webpage to save it to your research collection.
            </p>
          </div>
        </div>
      )
    },
    {
      title: "Set Up AI Features",
      description: "Enable intelligent summaries and chat",
      icon: <MessageSquare className="w-8 h-8 text-blue-600" />,
      content: (
        <div className="space-y-4">
          <p className="text-gray-600">
            AI features are optional but highly recommended. They provide instant summaries 
            and enable intelligent conversations with your research.
          </p>
          <div className="bg-gray-50 p-4 rounded-lg">
            <h4 className="font-medium mb-2">Required Setup:</h4>
            <ol className="text-sm text-gray-600 space-y-2">
              <li className="flex items-start gap-2">
                <span className="bg-blue-600 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs flex-shrink-0 mt-0.5">1</span>
                <span>Get an <a href="https://platform.openai.com/api-keys" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">OpenAI API key</a></span>
              </li>
              <li className="flex items-start gap-2">
                <span className="bg-blue-600 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs flex-shrink-0 mt-0.5">2</span>
                <span>Create a <code className="bg-gray-200 px-1 rounded">.env.local</code> file in the project root</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="bg-blue-600 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs flex-shrink-0 mt-0.5">3</span>
                <span>Add: <code className="bg-gray-200 px-1 rounded">VITE_OPENAI_API_KEY=sk-your-key-here</code></span>
              </li>
              <li className="flex items-start gap-2">
                <span className="bg-blue-600 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs flex-shrink-0 mt-0.5">4</span>
                <span>Restart the development server</span>
              </li>
            </ol>
          </div>
          <div className="bg-green-50 p-3 rounded-lg">
            <p className="text-sm text-green-800">
              ✅ <strong>Privacy First:</strong> All your data stays on your device. AI services are only used when you explicitly request summaries or chat.
            </p>
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
    }
  ];

  const nextStep = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      onClose();
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const currentStepData = steps[currentStep];

  return (
    <Modal 
      isOpen={isOpen} 
      onClose={onClose} 
      title=""
      maxWidthClass="max-w-2xl"
    >
      <div className="space-y-6">
        {/* Header */}
        <div className="text-center">
          <div className="flex justify-center mb-4">
            {currentStepData.icon}
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            {currentStepData.title}
          </h2>
          <p className="text-gray-600">
            {currentStepData.description}
          </p>
        </div>

        {/* Progress bar */}
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div 
            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
            style={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
          />
        </div>

        {/* Step indicators */}
        <div className="flex justify-center space-x-2">
          {steps.map((_, index) => (
            <div
              key={index}
              className={`w-2 h-2 rounded-full transition-colors ${
                index <= currentStep ? 'bg-blue-600' : 'bg-gray-300'
              }`}
            />
          ))}
        </div>

        {/* Content */}
        <div className="min-h-[300px]">
          {currentStepData.content}
        </div>

        {/* Navigation */}
        <div className="flex justify-between pt-4 border-t">
          <Button
            variant="secondary"
            onClick={prevStep}
            disabled={currentStep === 0}
          >
            Previous
          </Button>
          <Button
            onClick={nextStep}
          >
            {currentStep === steps.length - 1 ? 'Get Started' : 'Next'}
          </Button>
        </div>
      </div>
    </Modal>
  );
}; 