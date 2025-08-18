import Dexie, { Table } from 'dexie';
import { logError } from '../utils/logger';
/**
 * SmartResearchDB
 * ----------------
 * Central IndexedDB (Dexie) database for the app.
 *
 * Tables:
 * - boards: stores user boards
 * - links: stores saved links and optional AI summaries
 * - summaries: AI-generated content related to links
 * - chatMessages: chat message history, optionally tied to conversations and links
 * - conversations: conversational threads across one or more links
 * - settings: app/user settings (singleton with id "user")
 * - tasks: task items optionally linked to boards
 *
 * Version history (indexes only):
 *  v1: initial tables
 *  v2: add tasks
 *  v3: summaries: kind/linkId; chatMessages: linkId
 *  v4: ensure chatMessages.linkId index
 *  v5: add conversations and chatMessages.conversationId
 *  v6: links.boardId index
 *  v7: links.summary index
 *  v8: backfill/normalize Date fields
 *  v9: conversations.linkIdsKey derived index
 */
import { Board } from '../types/Board';
import { Link } from '../types/Link';
import { AISummary } from '../types/AISummary';
import { ChatMessage } from '../types/ChatMessage';
import { Settings } from '../types/Settings';
import { Task } from '../types/Task';
import type { Conversation } from '../types/Conversation';

export class SmartResearchDB extends Dexie {
  boards!: Table<Board, string>;
  links!: Table<Link, string>;
  summaries!: Table<AISummary, string>;
  chatMessages!: Table<ChatMessage, string>;
  conversations!: Table<Conversation, string>;
  settings!: Table<Settings, string>;
  tasks!: Table<Task, string>;

  // (helper methods defined later in class)
  private async withErrorLog<T>(scope: string, action: () => Promise<T>): Promise<T> {
    try {
      return await action();
    } catch (error) {
      logError(scope, error);
      throw error as Error;
    }
  }

  constructor() {
    super('SmartResearchDB');

    // Version 1 – initial schema
    this.version(1).stores({
      boards: 'id, title, color, createdAt',
      links: 'id, url, labels, priority, status, createdAt',
      summaries: 'id, types, createdAt',
      chatMessages: 'id, senderId, timestamp',
      settings: 'id',
    });

    // Version 2 – add tasks
    this.version(2).stores({
      boards: 'id, title, color, createdAt',
      links: 'id, url, labels, priority, status, createdAt',
      summaries: 'id, types, createdAt',
      chatMessages: 'id, senderId, timestamp',
      settings: 'id',
      tasks: 'id, status, priority, dueDate, createdAt, boardId, parentId',
    });

    // Version 3 – refine summaries schema with linkId & kind
    this.version(3).stores({
      boards: 'id, title, color, createdAt',
      links: 'id, url, labels, priority, status, createdAt',
      summaries: 'id, linkId, kind, createdAt',
      chatMessages: 'id, linkId, timestamp',
      settings: 'id',
      tasks: 'id, status, priority, dueDate, createdAt, boardId, parentId',
    });

    // Version 4 – chat messages include linkId index
    this.version(4).stores({
      boards: 'id, title, color, createdAt',
      links: 'id, url, labels, priority, status, createdAt',
      summaries: 'id, linkId, kind, createdAt',
      chatMessages: 'id, linkId, timestamp',
      settings: 'id',
      tasks: 'id, status, priority, dueDate, createdAt, boardId, parentId',
      // conversations table added in v5
    });

    // Version 5 – conversations and conversationId index on chatMessages
    this.version(5).stores({
      boards: 'id, title, color, createdAt',
      links: 'id, url, labels, priority, status, createdAt',
      summaries: 'id, linkId, kind, createdAt',
      chatMessages: 'id, linkId, conversationId, timestamp',
      conversations: 'id, startedAt, endedAt',
      settings: 'id',
      tasks: 'id, status, priority, dueDate, createdAt, boardId, parentId',
    });

    // Version 6 – add boardId index to links store
    this.version(6).stores({
      boards: 'id, title, color, createdAt',
      links: 'id, url, labels, priority, status, boardId, createdAt',
      summaries: 'id, linkId, kind, createdAt',
      chatMessages: 'id, linkId, conversationId, timestamp',
      conversations: 'id, startedAt, endedAt',
      settings: 'id',
      tasks: 'id, status, priority, dueDate, createdAt, boardId, parentId',
    });

    // Version 7 – add summary field index on links for AI context
    this.version(7).stores({
      boards: 'id, title, color, createdAt',
      links: 'id, url, summary, labels, priority, status, boardId, createdAt',
      summaries: 'id, linkId, kind, createdAt',
      chatMessages: 'id, linkId, conversationId, timestamp',
      conversations: 'id, startedAt, endedAt',
      settings: 'id',
      tasks: 'id, status, priority, dueDate, createdAt, boardId, parentId',
    });

    this.version(7).upgrade(async (tx) => {
      // ensure summary field exists on existing links
      const linksTable = tx.table('links');
      await linksTable.toCollection().modify((l: Link) => {
        if (l.summary === undefined) l.summary = '';
      });
    });

    // Version 8 – backfill createdAt/updatedAt for links and normalize to Date objects
    this.version(8).stores({
      boards: 'id, title, color, createdAt',
      links: 'id, url, summary, labels, priority, status, boardId, createdAt',
      summaries: 'id, linkId, kind, createdAt',
      chatMessages: 'id, linkId, conversationId, timestamp',
      conversations: 'id, startedAt, endedAt',
      settings: 'id',
      tasks: 'id, status, priority, dueDate, createdAt, boardId, parentId',
    });
    this.version(8).upgrade(async (tx) => {
      // Links
      await tx
        .table('links')
        .toCollection()
        .modify(
          (
            l: Link & { createdAt?: string | Date; updatedAt?: string | Date }
          ) => {
            if (!l.createdAt) {
              l.createdAt = l.updatedAt
                ? new Date(l.updatedAt as string | Date)
                : new Date();
            } else if (typeof l.createdAt === 'string') {
              const d = new Date(l.createdAt);
              l.createdAt = isNaN(d.getTime()) ? new Date() : d;
            }
            if (!l.updatedAt) {
              l.updatedAt = l.createdAt as Date;
            } else if (typeof l.updatedAt === 'string') {
              const d = new Date(l.updatedAt);
              l.updatedAt = isNaN(d.getTime()) ? (l.createdAt as Date) : d;
            }
          }
        );

      // Boards
      await tx
        .table('boards')
        .toCollection()
        .modify(
          (
            b: Board & { createdAt?: string | Date; updatedAt?: string | Date }
          ) => {
            if (!b.createdAt || typeof b.createdAt === 'string') {
              const d = new Date((b.createdAt as string) || Date.now());
              b.createdAt = isNaN(d.getTime()) ? new Date() : d;
            }
            if (!b.updatedAt || typeof b.updatedAt === 'string') {
              const d = new Date(
                (b.updatedAt as string) || (b.createdAt as Date)
              );
              b.updatedAt = isNaN(d.getTime()) ? (b.createdAt as Date) : d;
            }
          }
        );

      // Summaries
      await tx
        .table('summaries')
        .toCollection()
        .modify(
          (
            s: AISummary & {
              createdAt?: string | Date;
              updatedAt?: string | Date;
            }
          ) => {
            if (!s.createdAt || typeof s.createdAt === 'string') {
              const d = new Date((s.createdAt as string) || Date.now());
              s.createdAt = isNaN(d.getTime()) ? new Date() : d;
            }
            if (!s.updatedAt || typeof s.updatedAt === 'string') {
              const d = new Date(
                (s.updatedAt as string) || (s.createdAt as Date)
              );
              s.updatedAt = isNaN(d.getTime()) ? (s.createdAt as Date) : d;
            }
          }
        );

      // Chat messages
      await tx
        .table('chatMessages')
        .toCollection()
        .modify((m: ChatMessage & { timestamp?: string | Date }) => {
          if (!m.timestamp || typeof m.timestamp === 'string') {
            const d = new Date((m.timestamp as string) || Date.now());
            m.timestamp = isNaN(d.getTime()) ? new Date() : d;
          }
        });

      // Conversations
      await tx
        .table('conversations')
        .toCollection()
        .modify(
          (
            c: Conversation & {
              startedAt?: string | Date;
              endedAt?: string | Date | null;
            }
          ) => {
            if (!c.startedAt || typeof c.startedAt === 'string') {
              const d = new Date((c.startedAt as string) || Date.now());
              c.startedAt = isNaN(d.getTime()) ? new Date() : d;
            }
            if (c.endedAt && typeof c.endedAt === 'string') {
              const d = new Date(c.endedAt);
              c.endedAt = isNaN(d.getTime()) ? null : d;
            }
          }
        );

      // Tasks
      await tx
        .table('tasks')
        .toCollection()
        .modify(
          (
            t: Task & {
              createdAt?: string | Date;
              updatedAt?: string | Date;
              dueDate?: string | Date;
            }
          ) => {
            if (!t.createdAt || typeof t.createdAt === 'string') {
              const d = new Date((t.createdAt as string) || Date.now());
              t.createdAt = isNaN(d.getTime()) ? new Date() : d;
            }
            if (!t.updatedAt || typeof t.updatedAt === 'string') {
              const d = new Date(
                (t.updatedAt as string) || (t.createdAt as Date)
              );
              t.updatedAt = isNaN(d.getTime()) ? (t.createdAt as Date) : d;
            }
            if (t.dueDate && typeof t.dueDate === 'string') {
              const d = new Date(t.dueDate);
              t.dueDate = isNaN(d.getTime()) ? undefined : d;
            }
          }
        );
    });

    // Version 9 – add derived index linkIdsKey for conversations to speed lookup
    this.version(9).stores({
      boards: 'id, title, color, createdAt',
      links: 'id, url, summary, labels, priority, status, boardId, createdAt',
      summaries: 'id, linkId, kind, createdAt',
      chatMessages: 'id, linkId, conversationId, timestamp',
      conversations: 'id, linkIdsKey, startedAt, endedAt',
      settings: 'id',
      tasks: 'id, status, priority, dueDate, createdAt, boardId, parentId',
    });
    this.version(9).upgrade(async (tx) => {
      try {
        await tx
          .table('conversations')
          .toCollection()
          .modify((c: Conversation & { linkIdsKey?: string }) => {
            const key = Array.isArray(c.linkIds)
              ? [...c.linkIds].sort().join('|')
              : '';
            c.linkIdsKey = key;
          });
      } catch (err) {
        logError('db.migration.v9', err);
        throw err as Error;
      }
    });

    // Future migrations can be added like this:
    // this.version(2).upgrade(tx => { /* migration code */ });
    // Global Dexie event hooks for better visibility when something goes wrong
    // Note: Dexie does not expose a typed 'error' event on the instance/static emitter in this version.
    // We rely on try/catch wrappers and the 'blocked'/'versionchange' events below for visibility.
    this.on('blocked', (ev) => {
      // Most often another tab holds the database open
      console.warn('IndexedDB upgrade blocked. Close other tabs to continue.', ev);
    });
    this.on('versionchange', () => {
      console.warn('Database version change detected in another tab. Closing this connection to prevent corruption.');
      try { this.close(); } catch {}
    });
  }

  /* -------------------------------- Utilities ------------------------------- */
  // Boards
  /** Add a board */
  addBoard(board: Board) {
    return this.withErrorLog('db.addBoard', () => this.boards.add(board));
  }
  /** Fetch a board by id */
  getBoard(id: string) {
    return this.boards.get(id);
  }
  /** Partially update a board */
  updateBoard(id: string, changes: Partial<Board>) {
    return this.withErrorLog('db.updateBoard', () => this.boards.update(id, changes));
  }
  /** Delete a board */
  deleteBoard(id: string) {
    return this.withErrorLog('db.deleteBoard', () => this.boards.delete(id));
  }

  // Links
  /** Add a link */
  addLink(link: Link) {
    return this.withErrorLog('db.addLink', () => this.links.add(link));
  }
  /** Fetch a link by id */
  getLink(id: string) {
    return this.links.get(id);
  }
  /** Partially update a link */
  updateLink(id: string, changes: Partial<Link>) {
    return this.withErrorLog('db.updateLink', () => this.links.update(id, changes));
  }
  /** Delete a link */
  deleteLink(id: string) {
    return this.withErrorLog('db.deleteLink', () => this.links.delete(id));
  }

  // Summaries
  /** Add an AI summary */
  addSummary(summary: AISummary) {
    return this.withErrorLog('db.addSummary', () => this.summaries.add(summary));
  }
  /** Fetch an AI summary by id */
  getSummary(id: string) {
    return this.summaries.get(id);
  }

  // Chat Messages
  /** Add a chat message */
  addChatMessage(message: ChatMessage) {
    if (import.meta.env.MODE !== 'test') console.log('db.addChatMessage called with:', message);
    return this.chatMessages
      .add(message)
      .then(() => {
        if (import.meta.env.MODE !== 'test') console.log('Message added to database successfully');
        return message;
      })
      .catch((err) => {
        logError('db.addChatMessage', err);
        throw err;
      });
  }
  /** Get chat messages for a specific link */
  getChatMessagesByLink(linkId: string) {
    return this.chatMessages.where('linkId').equals(linkId).toArray();
  }
  /** Get chat messages by conversation id */
  getChatMessagesByConversation(conversationId: string) {
    if (import.meta.env.MODE !== 'test')
      console.log(
        'db.getChatMessagesByConversation called with conversationId:',
        conversationId
      );
    return this.chatMessages
      .where('conversationId')
      .equals(conversationId)
      .toArray()
      .then((messages) => {
        if (import.meta.env.MODE !== 'test') console.log('Retrieved messages from database:', messages);
        return messages;
      });
  }

  // Conversations
  /** Add a conversation */
  addConversation(conv: Conversation) {
    if (import.meta.env.MODE !== 'test') console.log('db.addConversation called with:', conv);
    return this.conversations
      .add(conv)
      .then(() => {
        if (import.meta.env.MODE !== 'test') console.log('Conversation added to database successfully');
        return conv;
      })
      .catch((err) => {
        logError('db.addConversation', err);
        throw err;
      });
  }
  /** Fetch a conversation by id */
  getConversation(id: string) {
    return this.conversations.get(id);
  }
  /**
   * Find an active conversation that exactly matches the given set of linkIds.
   * Uses the derived index conversations.linkIdsKey.
   */
  getActiveConversationByLinks(linkIds: string[]) {
    if (import.meta.env.MODE !== 'test')
      console.log(
        'db.getActiveConversationByLinks called with linkIds:',
        linkIds
      );
    const key = [...linkIds].sort().join('|');
    // Dexie typings do not know about our dynamic index; cast the table type narrowly
    const conversationsByKey = this.conversations as unknown as Table<
      Conversation,
      string
    >;
    return conversationsByKey
      .where('linkIdsKey')
      .equals(key)
      .and((c) => c.endedAt === null || c.endedAt === undefined)
      .first()
      .then((conv) => {
        if (import.meta.env.MODE !== 'test') console.log('Found active conversation by key:', conv);
        return conv;
      });
  }
  /** End a conversation (sets endedAt to now) */
  endConversation(id: string) {
    return this.conversations.update(id, { endedAt: new Date() });
  }
  /** Get all conversations */
  getAllConversations() {
    if (import.meta.env.MODE !== 'test') console.log('db.getAllConversations called');
    return this.conversations.toArray().then((conversations) => {
      if (import.meta.env.MODE !== 'test') console.log('Conversations from database:', conversations);
      return conversations;
    });
  }
  /** Delete a conversation and all of its chat messages in a single transaction */
  async deleteConversation(id: string) {
    await this.transaction(
      'rw',
      this.conversations,
      this.chatMessages,
      async () => {
        await this.conversations.delete(id);
        await this.chatMessages.where('conversationId').equals(id).delete();
      }
    );
  }

  // Settings
  /** Insert or update the singleton settings record */
  upsertSettings(settings: Settings) {
    return this.withErrorLog('db.upsertSettings', () => this.settings.put(settings));
  }
  /** Fetch settings (defaults to id 'user') */
  getSettings(id = 'user') {
    return this.settings.get(id);
  }

  // Tasks
  /** Add a task */
  addTask(task: Task) {
    return this.withErrorLog('db.addTask', () => this.tasks.add(task));
  }
  /** Fetch a task by id */
  getTask(id: string) {
    return this.tasks.get(id);
  }
  /** Partially update a task */
  updateTask(id: string, changes: Partial<Task>) {
    return this.withErrorLog('db.updateTask', () => this.tasks.update(id, changes));
  }
  /** Delete a task */
  deleteTask(id: string) {
    return this.withErrorLog('db.deleteTask', () => this.tasks.delete(id));
  }

  // Clear all data
  /**
   * Clear all application data across tables in safe, separate transactions.
   * Intended for diagnostics or full resets.
   */
  async clearAll() {
    if (import.meta.env.MODE !== 'test') console.log('🗑️ Clearing all data from database...');
    
    // Clear all tables in separate transactions to avoid limits
    try {
      await this.transaction('rw', this.links, this.summaries, async () => {
        if (import.meta.env.MODE !== 'test') console.log('🗑️ Clearing links...');
        await this.links.clear();
        
        if (import.meta.env.MODE !== 'test') console.log('🗑️ Clearing summaries...');
        await this.summaries.clear();
      });
      
      await this.transaction('rw', this.chatMessages, this.conversations, async () => {
        if (import.meta.env.MODE !== 'test') console.log('🗑️ Clearing chat messages...');
        await this.chatMessages.clear();
        
        if (import.meta.env.MODE !== 'test') console.log('🗑️ Clearing conversations...');
        await this.conversations.clear();
      });
      
      await this.transaction('rw', this.tasks, async () => {
        if (import.meta.env.MODE !== 'test') console.log('🗑️ Clearing tasks...');
        await this.tasks.clear();
      });
    } catch (err) {
      logError('db.clearAll', err);
      throw err as Error;
    }
    
    if (import.meta.env.MODE !== 'test') console.log('✅ All data cleared successfully');
  }
}

// Initialize the database instance only when needed
let dbInstance: SmartResearchDB | null = null;

export function getDB(): SmartResearchDB {
  if (!dbInstance) {
    try {
      dbInstance = new SmartResearchDB();
      
      // Wire up readiness handler
      try {
        dbInstance.on('ready', () => {
          // Make sure we have a 'user' settings object
          dbInstance!.settings.get('user').then((settings) => {
            if (!settings) {
              dbInstance!.settings.put({
                id: 'user',
                theme: 'system',
                sortOrder: 'desc',
                language: 'en',
                createdAt: new Date(),
                updatedAt: new Date(),
              }).catch(() => {/* ignore when DB unavailable */});
            }
          }).catch(() => {/* ignore when DB unavailable */});
        });
      } catch {
        // Ignore readiness wiring if IndexedDB is unavailable
      }
    } catch (error) {
      console.warn('[SmartResearchDB] Failed to initialize database:', error);
      throw error;
    }
  }
  return dbInstance;
}

// For backward compatibility, export a getter that initializes on demand
export const db = new Proxy({} as SmartResearchDB, {
  get(target, prop) {
    try {
      const db = getDB();
      return (db as any)[prop];
    } catch (error) {
      console.warn('[SmartResearchDB] Database not available, returning undefined for:', prop);
      return undefined;
    }
  }
});
