/**
 * User Data Context
 * 
 * Provides user-scoped database operations throughout the application.
 * Automatically injects the authenticated user's ID into all database operations.
 * 
 * SECURITY: This context ensures data isolation by always filtering queries by userId
 */

import React, { createContext, useContext, ReactNode } from 'react';
import { useUserId } from '../hooks/useCurrentUser';
import { userDataService } from '../services/userDataService';
import { Link } from '../types/Link';
import { Board } from '../types/Board';
import { ChatMessage } from '../types/ChatMessage';
import { Task } from '../types/Task';
import { Conversation } from '../types/Conversation';
import { AISummary } from '../types/AISummary';

interface UserDataContextType {
  userId: string | null;
  isLoading: boolean;
  
  // Links
  getLinks: () => Promise<Link[]>;
  getLink: (linkId: string) => Promise<Link | undefined>;
  createLink: (link: Omit<Link, 'userId'>) => Promise<string>;
  updateLink: (linkId: string, changes: Partial<Omit<Link, 'id' | 'userId'>>) => Promise<number>;
  deleteLink: (linkId: string) => Promise<void>;
  
  // Boards
  getBoards: () => Promise<Board[]>;
  getBoard: (boardId: string) => Promise<Board | undefined>;
  createBoard: (board: Omit<Board, 'userId'>) => Promise<string>;
  updateBoard: (boardId: string, changes: Partial<Omit<Board, 'id' | 'userId'>>) => Promise<number>;
  deleteBoard: (boardId: string) => Promise<void>;
  
  // Chat Messages
  getChatMessages: (linkId?: string) => Promise<ChatMessage[]>;
  createChatMessage: (message: Omit<ChatMessage, 'userId'>) => Promise<string>;
  deleteChatMessage: (messageId: string) => Promise<void>;
  
  // Conversations
  getConversations: () => Promise<Conversation[]>;
  createConversation: (conversation: Omit<Conversation, 'userId'>) => Promise<string>;
  
  // Tasks
  getTasks: (boardId?: string) => Promise<Task[]>;
  createTask: (task: Omit<Task, 'userId'>) => Promise<string>;
  updateTask: (taskId: string, changes: Partial<Omit<Task, 'id' | 'userId'>>) => Promise<number>;
  deleteTask: (taskId: string) => Promise<void>;
  
  // Summaries
  getSummaries: (linkId: string) => Promise<AISummary[]>;
  createSummary: (summary: Omit<AISummary, 'userId'>) => Promise<string>;
}

const UserDataContext = createContext<UserDataContextType | undefined>(undefined);

export const UserDataProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const userId = useUserId();
  const isLoading = userId === null;

  // Create bound methods that automatically inject userId
  const createBoundMethod = <T extends any[], R>(
    method: (userId: string, ...args: T) => Promise<R>
  ) => {
    return (...args: T): Promise<R> => {
      if (!userId) {
        throw new Error('SECURITY: Cannot perform database operation - user not authenticated');
      }
      return method(userId, ...args);
    };
  };

  const value: UserDataContextType = {
    userId,
    isLoading,
    
    // Links
    getLinks: createBoundMethod(userDataService.getLinks),
    getLink: createBoundMethod(userDataService.getLink),
    createLink: createBoundMethod(userDataService.createLink),
    updateLink: createBoundMethod(userDataService.updateLink),
    deleteLink: createBoundMethod(userDataService.deleteLink),
    
    // Boards
    getBoards: createBoundMethod(userDataService.getBoards),
    getBoard: createBoundMethod(userDataService.getBoard),
    createBoard: createBoundMethod(userDataService.createBoard),
    updateBoard: createBoundMethod(userDataService.updateBoard),
    deleteBoard: createBoundMethod(userDataService.deleteBoard),
    
    // Chat Messages
    getChatMessages: createBoundMethod(userDataService.getChatMessages),
    createChatMessage: createBoundMethod(userDataService.createChatMessage),
    deleteChatMessage: createBoundMethod(userDataService.deleteChatMessage),
    
    // Conversations
    getConversations: createBoundMethod(userDataService.getConversations),
    createConversation: createBoundMethod(userDataService.createConversation),
    
    // Tasks
    getTasks: createBoundMethod(userDataService.getTasks),
    createTask: createBoundMethod(userDataService.createTask),
    updateTask: createBoundMethod(userDataService.updateTask),
    deleteTask: createBoundMethod(userDataService.deleteTask),
    
    // Summaries
    getSummaries: createBoundMethod(userDataService.getSummaries),
    createSummary: createBoundMethod(userDataService.createSummary),
  };

  return <UserDataContext.Provider value={value}>{children}</UserDataContext.Provider>;
};

/**
 * Hook to access user-scoped database operations
 * @throws Error if used outside UserDataProvider
 */
export const useUserData = (): UserDataContextType => {
  const context = useContext(UserDataContext);
  if (!context) {
    throw new Error('useUserData must be used within UserDataProvider');
  }
  return context;
};

