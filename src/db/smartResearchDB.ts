import Dexie, { Table } from 'dexie';
import type { Board } from '../types/Board';
import type { Link } from '../types/Link';
import type { AISummary } from '../types/AISummary';
import type { ChatMessage } from '../types/ChatMessage';
import type { Settings } from '../types/Settings';
import type { Task } from '../types/Task';
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
      await tx
        .table('conversations')
        .toCollection()
        .modify((c: Conversation & { linkIdsKey?: string }) => {
          const key = Array.isArray(c.linkIds)
            ? [...c.linkIds].sort().join('|')
            : '';
          c.linkIdsKey = key;
        });
    });

    // Future migrations can be added like this:
    // this.version(2).upgrade(tx => { /* migration code */ });
  }

  /* -------------------------------- Utilities ------------------------------- */
  // Boards
  addBoard(board: Board) {
    return this.boards.add(board);
  }
  getBoard(id: string) {
    return this.boards.get(id);
  }
  updateBoard(id: string, changes: Partial<Board>) {
    return this.boards.update(id, changes);
  }
  deleteBoard(id: string) {
    return this.boards.delete(id);
  }

  // Links
  addLink(link: Link) {
    return this.links.add(link);
  }
  getLink(id: string) {
    return this.links.get(id);
  }
  updateLink(id: string, changes: Partial<Link>) {
    return this.links.update(id, changes);
  }
  deleteLink(id: string) {
    return this.links.delete(id);
  }

  // Summaries
  addSummary(summary: AISummary) {
    return this.summaries.add(summary);
  }
  getSummary(id: string) {
    return this.summaries.get(id);
  }

  // Chat Messages
  addChatMessage(message: ChatMessage) {
    console.log('db.addChatMessage called with:', message);
    return this.chatMessages
      .add(message)
      .then(() => {
        console.log('Message added to database successfully');
        return message;
      })
      .catch((err) => {
        console.error('Error adding message to database:', err);
        throw err;
      });
  }
  getChatMessagesByLink(linkId: string) {
    return this.chatMessages.where('linkId').equals(linkId).toArray();
  }
  getChatMessagesByConversation(conversationId: string) {
    console.log(
      'db.getChatMessagesByConversation called with conversationId:',
      conversationId
    );
    return this.chatMessages
      .where('conversationId')
      .equals(conversationId)
      .toArray()
      .then((messages) => {
        console.log('Retrieved messages from database:', messages);
        return messages;
      });
  }

  // Conversations
  addConversation(conv: Conversation) {
    console.log('db.addConversation called with:', conv);
    return this.conversations
      .add(conv)
      .then(() => {
        console.log('Conversation added to database successfully');
        return conv;
      })
      .catch((err) => {
        console.error('Error adding conversation to database:', err);
        throw err;
      });
  }
  getConversation(id: string) {
    return this.conversations.get(id);
  }
  getActiveConversationByLinks(linkIds: string[]) {
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
        console.log('Found active conversation by key:', conv);
        return conv;
      });
  }
  endConversation(id: string) {
    return this.conversations.update(id, { endedAt: new Date() });
  }
  getAllConversations() {
    console.log('db.getAllConversations called');
    return this.conversations.toArray().then((conversations) => {
      console.log('Conversations from database:', conversations);
      return conversations;
    });
  }
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
  upsertSettings(settings: Settings) {
    return this.settings.put(settings);
  }
  getSettings(id = 'user') {
    return this.settings.get(id);
  }

  // Tasks
  addTask(task: Task) {
    return this.tasks.add(task);
  }
  getTask(id: string) {
    return this.tasks.get(id);
  }
  updateTask(id: string, changes: Partial<Task>) {
    return this.tasks.update(id, changes);
  }
  deleteTask(id: string) {
    return this.tasks.delete(id);
  }
}

export const db = new SmartResearchDB();

db.on('ready', () => {
  // Make sure we have a 'user' settings object
  db.settings.get('user').then((settings) => {
    if (!settings) {
      db.settings.put({
        id: 'user',
        theme: 'system',
        sortOrder: 'desc',
        language: 'en',
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    }
  });
});
