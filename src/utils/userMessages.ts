// User-friendly message system for Smart Research Tracker

export interface UserMessage {
  id: string;
  type: 'success' | 'info' | 'warning' | 'error';
  title: string;
  message: string;
  actions?: Array<{
    label: string;
    action: string;
    primary?: boolean;
  }>;
  autoDismiss?: number; // milliseconds
  persistent?: boolean;
}

export const USER_MESSAGES = {
  // Installation & Setup
  INSTALLATION_SUCCESS: {
    id: 'installation_success',
    type: 'success' as const,
    title: 'Installation Complete! 🎉',
    message: 'Smart Research Tracker has been successfully installed and configured.',
    actions: [
      { label: 'Start Using', action: 'start_app', primary: true },
      { label: 'View Tutorial', action: 'show_tutorial' }
    ],
    autoDismiss: 8000
  },

  INSTALLATION_PARTIAL: {
    id: 'installation_partial',
    type: 'warning' as const,
    title: 'Installation Partially Complete',
    message: 'The app is installed but some optional features may not work. You can continue or fix the issues.',
    actions: [
      { label: 'Continue Anyway', action: 'continue', primary: true },
      { label: 'Fix Issues', action: 'fix_issues' }
    ],
    persistent: true
  },

  // Extension Messages
  EXTENSION_INSTALL_REQUIRED: {
    id: 'extension_install_required',
    type: 'info' as const,
    title: 'Browser Extension Required',
    message: 'To save links from web pages, you need to install the Smart Research Tracker browser extension.',
    actions: [
      { label: 'Install Extension', action: 'install_extension', primary: true },
      { label: 'Learn More', action: 'show_extension_help' }
    ],
    persistent: true
  },

  EXTENSION_LOADED: {
    id: 'extension_loaded',
    type: 'success' as const,
    title: 'Extension Connected! 🔗',
    message: 'The browser extension is now connected and ready to save links.',
    autoDismiss: 5000
  },

  EXTENSION_DISCONNECTED: {
    id: 'extension_disconnected',
    type: 'warning' as const,
    title: 'Extension Disconnected',
    message: 'The browser extension has been disconnected. Some features may not work properly.',
    actions: [
      { label: 'Reconnect', action: 'reconnect_extension' },
      { label: 'Reload Page', action: 'reload_page', primary: true }
    ]
  },

  // Link Management
  LINK_SAVED: {
    id: 'link_saved',
    type: 'success' as const,
    title: 'Link Saved! 💾',
    message: 'Your link has been successfully saved to your research collection.',
    actions: [
      { label: 'View Link', action: 'view_link' },
      { label: 'Save Another', action: 'save_another' }
    ],
    autoDismiss: 6000
  },

  LINK_SAVE_FAILED: {
    id: 'link_save_failed',
    type: 'error' as const,
    title: 'Failed to Save Link',
    message: 'There was an error saving your link. Please try again.',
    actions: [
      { label: 'Try Again', action: 'retry_save', primary: true },
      { label: 'Save Manually', action: 'save_manually' }
    ]
  },

  LINK_DELETED: {
    id: 'link_deleted',
    type: 'success' as const,
    title: 'Link Deleted',
    message: 'The link has been removed from your collection.',
    actions: [
      { label: 'Undo', action: 'undo_delete' }
    ],
    autoDismiss: 5000
  },

  // AI Features
  AI_PROCESSING: {
    id: 'ai_processing',
    type: 'info' as const,
    title: 'AI Processing... 🤖',
    message: 'The AI is analyzing your content. This may take a few moments.',
    persistent: true
  },

  AI_SUMMARY_READY: {
    id: 'ai_summary_ready',
    type: 'success' as const,
    title: 'AI Summary Ready! 📝',
    message: 'Your AI-generated summary is now available.',
    actions: [
      { label: 'View Summary', action: 'view_summary', primary: true },
      { label: 'Regenerate', action: 'regenerate_summary' }
    ],
    autoDismiss: 8000
  },

  AI_UNAVAILABLE: {
    id: 'ai_unavailable',
    type: 'warning' as const,
    title: 'AI Service Unavailable',
    message: 'The AI service is currently unavailable. You can still save links without AI features.',
    actions: [
      { label: 'Save Without AI', action: 'save_without_ai', primary: true },
      { label: 'Try Again Later', action: 'retry_ai_later' }
    ]
  },

  // Database & Storage
  STORAGE_LOW: {
    id: 'storage_low',
    type: 'warning' as const,
    title: 'Storage Space Low',
    message: 'You\'re running low on storage space. Consider cleaning up old data.',
    actions: [
      { label: 'Clean Up', action: 'cleanup_storage', primary: true },
      { label: 'Export Data', action: 'export_data' }
    ]
  },

  STORAGE_FULL: {
    id: 'storage_full',
    type: 'error' as const,
    title: 'Storage Full',
    message: 'Your storage is full. Please delete some items or export your data.',
    actions: [
      { label: 'Manage Storage', action: 'manage_storage', primary: true },
      { label: 'Export All', action: 'export_all' }
    ],
    persistent: true
  },

  // Network & Connectivity
  OFFLINE_MODE: {
    id: 'offline_mode',
    type: 'info' as const,
    title: 'Working Offline',
    message: 'You\'re currently offline. Some features may be limited, but you can still view saved links.',
    actions: [
      { label: 'Check Connection', action: 'check_connection' }
    ]
  },

  CONNECTION_RESTORED: {
    id: 'connection_restored',
    type: 'success' as const,
    title: 'Connection Restored! 🌐',
    message: 'Your internet connection has been restored. All features are now available.',
    autoDismiss: 5000
  },

  // Authentication & Permissions
  PERMISSION_REQUIRED: {
    id: 'permission_required',
    type: 'warning' as const,
    title: 'Permission Required',
    message: 'The extension needs permission to access this page. Please grant the required permissions.',
    actions: [
      { label: 'Grant Permission', action: 'grant_permission', primary: true },
      { label: 'Learn More', action: 'show_permission_help' }
    ],
    persistent: true
  },

  // Tutorial & Onboarding
  WELCOME_FIRST_TIME: {
    id: 'welcome_first_time',
    type: 'info' as const,
    title: 'Welcome to Smart Research Tracker! 👋',
    message: 'Let\'s get you started with a quick tour of the features.',
    actions: [
      { label: 'Start Tour', action: 'start_tour', primary: true },
      { label: 'Skip Tour', action: 'skip_tour' }
    ],
    persistent: true
  },

  FEATURE_DISCOVERY: {
    id: 'feature_discovery',
    type: 'info' as const,
    title: 'New Feature Available! ✨',
    message: 'We\'ve added new AI-powered features to help with your research.',
    actions: [
      { label: 'Learn More', action: 'show_feature_help', primary: true },
      { label: 'Dismiss', action: 'dismiss' }
    ],
    autoDismiss: 10000
  },

  // Export & Import
  EXPORT_SUCCESS: {
    id: 'export_success',
    type: 'success' as const,
    title: 'Export Complete! 📤',
    message: 'Your data has been successfully exported.',
    actions: [
      { label: 'Download File', action: 'download_export' },
      { label: 'Share', action: 'share_export' }
    ],
    autoDismiss: 8000
  },

  IMPORT_SUCCESS: {
    id: 'import_success',
    type: 'success' as const,
    title: 'Import Complete! 📥',
    message: 'Your data has been successfully imported.',
    actions: [
      { label: 'View Imported Data', action: 'view_imported' },
      { label: 'Continue', action: 'continue' }
    ],
    autoDismiss: 6000
  },

  // Performance & System
  PERFORMANCE_WARNING: {
    id: 'performance_warning',
    type: 'warning' as const,
    title: 'Performance Notice',
    message: 'The app is running slower than usual. This might be due to a large number of saved links.',
    actions: [
      { label: 'Optimize', action: 'optimize_performance', primary: true },
      { label: 'Ignore', action: 'ignore_warning' }
    ]
  },

  SYSTEM_UPDATE: {
    id: 'system_update',
    type: 'info' as const,
    title: 'Update Available',
    message: 'A new version of Smart Research Tracker is available with bug fixes and improvements.',
    actions: [
      { label: 'Update Now', action: 'update_now', primary: true },
      { label: 'Remind Later', action: 'remind_later' }
    ],
    autoDismiss: 15000
  },

  // Error Recovery
  ERROR_RECOVERY: {
    id: 'error_recovery',
    type: 'success' as const,
    title: 'Issue Resolved! ✅',
    message: 'The previous issue has been automatically resolved.',
    autoDismiss: 5000
  },

  // Custom Messages
  CUSTOM_SUCCESS: (title: string, message: string) => ({
    id: `custom_success_${Date.now()}`,
    type: 'success' as const,
    title,
    message,
    autoDismiss: 5000
  }),

  CUSTOM_INFO: (title: string, message: string) => ({
    id: `custom_info_${Date.now()}`,
    type: 'info' as const,
    title,
    message,
    autoDismiss: 8000
  }),

  CUSTOM_WARNING: (title: string, message: string) => ({
    id: `custom_warning_${Date.now()}`,
    type: 'warning' as const,
    title,
    message
  }),

  CUSTOM_ERROR: (title: string, message: string) => ({
    id: `custom_error_${Date.now()}`,
    type: 'error' as const,
    title,
    message
  })
};

// Message categories for organization
export const MESSAGE_CATEGORIES = {
  INSTALLATION: [
    USER_MESSAGES.INSTALLATION_SUCCESS,
    USER_MESSAGES.INSTALLATION_PARTIAL
  ],
  EXTENSION: [
    USER_MESSAGES.EXTENSION_INSTALL_REQUIRED,
    USER_MESSAGES.EXTENSION_LOADED,
    USER_MESSAGES.EXTENSION_DISCONNECTED
  ],
  LINKS: [
    USER_MESSAGES.LINK_SAVED,
    USER_MESSAGES.LINK_SAVE_FAILED,
    USER_MESSAGES.LINK_DELETED
  ],
  AI: [
    USER_MESSAGES.AI_PROCESSING,
    USER_MESSAGES.AI_SUMMARY_READY,
    USER_MESSAGES.AI_UNAVAILABLE
  ],
  STORAGE: [
    USER_MESSAGES.STORAGE_LOW,
    USER_MESSAGES.STORAGE_FULL
  ],
  NETWORK: [
    USER_MESSAGES.OFFLINE_MODE,
    USER_MESSAGES.CONNECTION_RESTORED
  ],
  AUTH: [
    USER_MESSAGES.PERMISSION_REQUIRED
  ],
  ONBOARDING: [
    USER_MESSAGES.WELCOME_FIRST_TIME,
    USER_MESSAGES.FEATURE_DISCOVERY
  ],
  DATA: [
    USER_MESSAGES.EXPORT_SUCCESS,
    USER_MESSAGES.IMPORT_SUCCESS
  ],
  SYSTEM: [
    USER_MESSAGES.PERFORMANCE_WARNING,
    USER_MESSAGES.SYSTEM_UPDATE,
    USER_MESSAGES.ERROR_RECOVERY
  ]
};

// Message utility functions
export const createMessage = (type: UserMessage['type'], title: string, message: string, options?: Partial<UserMessage>): UserMessage => {
  return {
    id: `custom_${type}_${Date.now()}`,
    type,
    title,
    message,
    ...options
  };
};

export const getMessageByCategory = (category: keyof typeof MESSAGE_CATEGORIES): UserMessage[] => {
  return MESSAGE_CATEGORIES[category] || [];
};

export const getMessageById = (id: string): UserMessage | undefined => {
  // Search through all predefined messages
  for (const category of Object.values(MESSAGE_CATEGORIES)) {
    const message = category.find(msg => msg.id === id);
    if (message) return message;
  }
  return undefined;
}; 