import React, { useState, useEffect } from 'react';
import { UserMessage } from '../utils/userMessages';
import { X, CheckCircle, Info, AlertTriangle, AlertCircle } from 'lucide-react';

interface MessageDisplayProps {
  message: UserMessage;
  onDismiss: (id: string) => void;
  onAction: (action: string) => void;
}

const MessageDisplay: React.FC<MessageDisplayProps> = ({ message, onDismiss, onAction }) => {
  const [isVisible, setIsVisible] = useState(true);
  const [isRemoving, setIsRemoving] = useState(false);

  // Auto-dismiss functionality
  useEffect(() => {
    if (message.autoDismiss && !message.persistent) {
      const timer = setTimeout(() => {
        handleDismiss();
      }, message.autoDismiss);

      return () => clearTimeout(timer);
    }
  }, [message.autoDismiss, message.persistent]);

  const handleDismiss = () => {
    setIsRemoving(true);
    setTimeout(() => {
      setIsVisible(false);
      onDismiss(message.id);
    }, 300);
  };

  const handleAction = (action: string) => {
    onAction(action);
    if (action !== 'dismiss') {
      handleDismiss();
    }
  };

  const getIcon = () => {
    switch (message.type) {
      case 'success':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'info':
        return <Info className="w-5 h-5 text-blue-500" />;
      case 'warning':
        return <AlertTriangle className="w-5 h-5 text-yellow-500" />;
      case 'error':
        return <AlertCircle className="w-5 h-5 text-red-500" />;
      default:
        return <Info className="w-5 h-5 text-gray-500" />;
    }
  };

  const getBorderColor = () => {
    switch (message.type) {
      case 'success':
        return 'border-green-200 bg-green-50';
      case 'info':
        return 'border-blue-200 bg-blue-50';
      case 'warning':
        return 'border-yellow-200 bg-yellow-50';
      case 'error':
        return 'border-red-200 bg-red-50';
      default:
        return 'border-gray-200 bg-gray-50';
    }
  };

  if (!isVisible) return null;

  return (
    <div
      className={`message-display border-l-4 ${getBorderColor()} p-4 rounded-r-lg shadow-lg mb-4 transition-all duration-300 ${
        isRemoving ? 'opacity-0 transform translate-x-full' : 'opacity-100 transform translate-x-0'
      }`}
    >
      <div className="flex items-start justify-between">
        <div className="flex items-start space-x-3 flex-1">
          <div className="flex-shrink-0 mt-0.5">
            {getIcon()}
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="text-sm font-semibold text-gray-900 mb-1">
              {message.title}
            </h4>
            <p className="text-sm text-gray-700 mb-3">
              {message.message}
            </p>
            
            {message.actions && message.actions.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {message.actions.map((action, index) => (
                  <button
                    key={index}
                    onClick={() => handleAction(action.action)}
                    className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                      action.primary
                        ? 'bg-blue-600 text-white hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200 focus:ring-2 focus:ring-gray-500 focus:ring-offset-2'
                    }`}
                  >
                    {action.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
        
        {!message.persistent && (
          <button
            onClick={handleDismiss}
            className="flex-shrink-0 ml-3 p-1 text-gray-400 hover:text-gray-600 transition-colors"
            aria-label="Dismiss message"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
};

// Message container component
interface MessageContainerProps {
  messages: UserMessage[];
  onDismiss: (id: string) => void;
  onAction: (action: string) => void;
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left' | 'top-center' | 'bottom-center';
}

export const MessageContainer: React.FC<MessageContainerProps> = ({
  messages,
  onDismiss,
  onAction,
  position = 'top-right'
}) => {
  const getPositionClasses = () => {
    switch (position) {
      case 'top-right':
        return 'top-4 right-4';
      case 'top-left':
        return 'top-4 left-4';
      case 'bottom-right':
        return 'bottom-4 right-4';
      case 'bottom-left':
        return 'bottom-4 left-4';
      case 'top-center':
        return 'top-4 left-1/2 transform -translate-x-1/2';
      case 'bottom-center':
        return 'bottom-4 left-1/2 transform -translate-x-1/2';
      default:
        return 'top-4 right-4';
    }
  };

  if (messages.length === 0) return null;

  return (
    <div className={`fixed z-50 ${getPositionClasses()} max-w-sm w-full space-y-2`}>
      {messages.map((message) => (
        <MessageDisplay
          key={message.id}
          message={message}
          onDismiss={onDismiss}
          onAction={onAction}
        />
      ))}
    </div>
  );
};

// Hook for managing messages
export const useMessages = () => {
  const [messages, setMessages] = useState<UserMessage[]>([]);

  const addMessage = (message: UserMessage) => {
    setMessages(prev => [...prev, message]);
  };

  const removeMessage = (id: string) => {
    setMessages(prev => prev.filter(msg => msg.id !== id));
  };

  const clearMessages = () => {
    setMessages([]);
  };

  const showSuccess = (title: string, message: string, options?: Partial<UserMessage>) => {
    const newMessage = {
      id: `success_${Date.now()}`,
      type: 'success' as const,
      title,
      message,
      autoDismiss: 5000,
      ...options
    };
    addMessage(newMessage);
  };

  const showInfo = (title: string, message: string, options?: Partial<UserMessage>) => {
    const newMessage = {
      id: `info_${Date.now()}`,
      type: 'info' as const,
      title,
      message,
      autoDismiss: 8000,
      ...options
    };
    addMessage(newMessage);
  };

  const showWarning = (title: string, message: string, options?: Partial<UserMessage>) => {
    const newMessage = {
      id: `warning_${Date.now()}`,
      type: 'warning' as const,
      title,
      message,
      ...options
    };
    addMessage(newMessage);
  };

  const showError = (title: string, message: string, options?: Partial<UserMessage>) => {
    const newMessage = {
      id: `error_${Date.now()}`,
      type: 'error' as const,
      title,
      message,
      ...options
    };
    addMessage(newMessage);
  };

  return {
    messages,
    addMessage,
    removeMessage,
    clearMessages,
    showSuccess,
    showInfo,
    showWarning,
    showError
  };
};

export default MessageDisplay; 