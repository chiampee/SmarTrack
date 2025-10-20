/**
 * User Data Service
 * 
 * SECURITY-CRITICAL SERVICE
 * ========================
 * This service provides user-scoped access to all database operations.
 * 
 * SECURITY REQUIREMENTS:
 * 1. ALL queries MUST be filtered by userId
 * 2. userId MUST come from authenticated Auth0 session (via useUserId hook)
 * 3. NEVER accept userId from client input/props
 * 4. Each method verifies userId is provided before executing
 * 
 * Usage:
 * ```tsx
 * const userId = useUserId();
 * if (!userId) return <LoginRequired />;
 * 
 * const links = await userDataService.getLinks(userId);
 * ```
 */

import { db } from '../db/smartResearchDB';
import { Link } from '../types/Link';
import { Board } from '../types/Board';
import { ChatMessage } from '../types/ChatMessage';
import { Task } from '../types/Task';
import { Conversation } from '../types/Conversation';
import { AISummary } from '../types/AISummary';

/**
 * Validate userId before executing database operations
 * @throws Error if userId is invalid
 */
function validateUserId(userId: string | null | undefined): asserts userId is string {
  if (!userId || typeof userId !== 'string' || userId.trim().length === 0) {
    throw new Error('SECURITY: Invalid or missing userId. All database operations require a valid authenticated user ID.');
  }
}

export const userDataService = {
  // ==================== LINKS ====================
  
  /**
   * Get all links for the authenticated user
   * @param userId - Auth0 user ID from useUserId() hook
   */
  async getLinks(userId: string): Promise<Link[]> {
    validateUserId(userId);
    try {
      return await db.links.where('userId').equals(userId).toArray();
    } catch (err) {
      console.warn('[UserDataService] Failed to get links:', err);
      return [];
    }
  },

  /**
   * Get a specific link by ID (only if it belongs to the user)
   * @param userId - Auth0 user ID from useUserId() hook
   * @param linkId - Link ID
   */
  async getLink(userId: string, linkId: string): Promise<Link | undefined> {
    validateUserId(userId);
    const link = await db.links.get(linkId);
    // SECURITY: Verify the link belongs to this user
    if (link && link.userId === userId) {
      return link;
    }
    return undefined;
  },

  /**
   * Create a new link for the authenticated user
   * @param userId - Auth0 user ID from useUserId() hook
   * @param link - Link data (userId will be set automatically)
   */
  async createLink(userId: string, link: Omit<Link, 'userId'>): Promise<string> {
    validateUserId(userId);
    const linkWithUser: Link = {
      ...link,
      userId, // SECURITY: Always set userId from authenticated session
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    return await db.addLink(linkWithUser);
  },

  /**
   * Update a link (only if it belongs to the user)
   * @param userId - Auth0 user ID from useUserId() hook
   * @param linkId - Link ID
   * @param changes - Partial link data to update
   */
  async updateLink(userId: string, linkId: string, changes: Partial<Omit<Link, 'id' | 'userId'>>): Promise<number> {
    validateUserId(userId);
    // SECURITY: First verify the link belongs to this user
    const existing = await db.links.get(linkId);
    if (!existing || existing.userId !== userId) {
      throw new Error('SECURITY: Cannot update link that does not belong to you');
    }
    return await db.updateLink(linkId, { ...changes, updatedAt: new Date() });
  },

  /**
   * Delete a link (only if it belongs to the user)
   * @param userId - Auth0 user ID from useUserId() hook
   * @param linkId - Link ID
   */
  async deleteLink(userId: string, linkId: string): Promise<void> {
    validateUserId(userId);
    // SECURITY: First verify the link belongs to this user
    const existing = await db.links.get(linkId);
    if (!existing || existing.userId !== userId) {
      throw new Error('SECURITY: Cannot delete link that does not belong to you');
    }
    await db.deleteLink(linkId);
    // Also delete associated summaries
    await db.summaries.where('linkId').equals(linkId).and(s => s.userId === userId).delete();
  },

  // ==================== BOARDS ====================
  
  async getBoards(userId: string): Promise<Board[]> {
    validateUserId(userId);
    return await db.boards.where('userId').equals(userId).toArray();
  },

  async getBoard(userId: string, boardId: string): Promise<Board | undefined> {
    validateUserId(userId);
    const board = await db.boards.get(boardId);
    if (board && board.userId === userId) return board;
    return undefined;
  },

  async createBoard(userId: string, board: Omit<Board, 'userId'>): Promise<string> {
    validateUserId(userId);
    const boardWithUser: Board = {
      ...board,
      userId,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    return await db.addBoard(boardWithUser);
  },

  async updateBoard(userId: string, boardId: string, changes: Partial<Omit<Board, 'id' | 'userId'>>): Promise<number> {
    validateUserId(userId);
    const existing = await db.boards.get(boardId);
    if (!existing || existing.userId !== userId) {
      throw new Error('SECURITY: Cannot update board that does not belong to you');
    }
    return await db.updateBoard(boardId, { ...changes, updatedAt: new Date() });
  },

  async deleteBoard(userId: string, boardId: string): Promise<void> {
    validateUserId(userId);
    const existing = await db.boards.get(boardId);
    if (!existing || existing.userId !== userId) {
      throw new Error('SECURITY: Cannot delete board that does not belong to you');
    }
    await db.deleteBoard(boardId);
  },

  // ==================== CHAT MESSAGES ====================
  
  async getChatMessages(userId: string, linkId?: string): Promise<ChatMessage[]> {
    validateUserId(userId);
    if (linkId) {
      return await db.chatMessages
        .where('userId').equals(userId)
        .and(m => m.linkId === linkId)
        .toArray();
    }
    return await db.chatMessages.where('userId').equals(userId).toArray();
  },

  async createChatMessage(userId: string, message: Omit<ChatMessage, 'userId'>): Promise<string> {
    validateUserId(userId);
    const messageWithUser: ChatMessage = { ...message, userId };
    await db.addChatMessage(messageWithUser);
    return messageWithUser.id;
  },

  async deleteChatMessage(userId: string, messageId: string): Promise<void> {
    validateUserId(userId);
    const existing = await db.chatMessages.get(messageId);
    if (!existing || existing.userId !== userId) {
      throw new Error('SECURITY: Cannot delete message that does not belong to you');
    }
    await db.chatMessages.delete(messageId);
  },

  // ==================== CONVERSATIONS ====================
  
  async getConversations(userId: string): Promise<Conversation[]> {
    validateUserId(userId);
    return await db.conversations.where('userId').equals(userId).toArray();
  },

  async createConversation(userId: string, conversation: Omit<Conversation, 'userId'>): Promise<string> {
    validateUserId(userId);
    const convWithUser: Conversation = { ...conversation, userId };
    await db.addConversation(convWithUser);
    return convWithUser.id;
  },

  // ==================== TASKS ====================
  
  async getTasks(userId: string, boardId?: string): Promise<Task[]> {
    validateUserId(userId);
    if (boardId) {
      return await db.tasks
        .where('userId').equals(userId)
        .and(t => t.boardId === boardId)
        .toArray();
    }
    return await db.tasks.where('userId').equals(userId).toArray();
  },

  async createTask(userId: string, task: Omit<Task, 'userId'>): Promise<string> {
    validateUserId(userId);
    const taskWithUser: Task = {
      ...task,
      userId,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    return await db.addTask(taskWithUser);
  },

  async updateTask(userId: string, taskId: string, changes: Partial<Omit<Task, 'id' | 'userId'>>): Promise<number> {
    validateUserId(userId);
    const existing = await db.tasks.get(taskId);
    if (!existing || existing.userId !== userId) {
      throw new Error('SECURITY: Cannot update task that does not belong to you');
    }
    return await db.updateTask(taskId, { ...changes, updatedAt: new Date() });
  },

  async deleteTask(userId: string, taskId: string): Promise<void> {
    validateUserId(userId);
    const existing = await db.tasks.get(taskId);
    if (!existing || existing.userId !== userId) {
      throw new Error('SECURITY: Cannot delete task that does not belong to you');
    }
    await db.deleteTask(taskId);
  },

  // ==================== SUMMARIES ====================
  
  async getSummaries(userId: string, linkId: string): Promise<AISummary[]> {
    validateUserId(userId);
    return await db.summaries
      .where('userId').equals(userId)
      .and(s => s.linkId === linkId)
      .toArray();
  },

  async createSummary(userId: string, summary: Omit<AISummary, 'userId'>): Promise<string> {
    validateUserId(userId);
    const summaryWithUser: AISummary = {
      ...summary,
      userId,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    return await db.addSummary(summaryWithUser);
  },
};

