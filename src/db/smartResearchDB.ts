import Dexie, { Table } from 'dexie';
import { Board } from '../types/Board';
import { Link } from '../types/Link';
import { AISummary } from '../types/AISummary';
import { ChatMessage } from '../types/ChatMessage';
import { Settings } from '../types/Settings';
import { Task } from '../types/Task';

export class SmartResearchDB extends Dexie {
  boards!: Table<Board, string>;
  links!: Table<Link, string>;
  summaries!: Table<AISummary, string>;
  chatMessages!: Table<ChatMessage, string>;
  conversations!: Table<import('../types/Conversation').Conversation, string>;
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
      await linksTable.toCollection().modify((l: any) => {
        if (l.summary === undefined) l.summary = '';
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
    return this.chatMessages.add(message);
  }
  getChatMessagesByLink(linkId: string) {
    return this.chatMessages.where('linkId').equals(linkId).toArray();
  }
  getChatMessagesByConversation(conversationId: string) {
    return this.chatMessages.where('conversationId').equals(conversationId).toArray();
  }

  // Conversations
  addConversation(conv: import('../types/Conversation').Conversation) {
    return this.conversations.add(conv);
  }
  getConversation(id: string) {
    return this.conversations.get(id);
  }
  getActiveConversationByLinks(linkIds: string[]) {
    return this.conversations
      .filter(
        (c) =>
          (c.endedAt === null || c.endedAt === undefined) &&
          c.linkIds.length === linkIds.length &&
          c.linkIds.every((id) => linkIds.includes(id))
      )
      .first();
  }
  endConversation(id: string) {
    return this.conversations.update(id, { endedAt: new Date() });
  }
  getAllConversations() {
    return this.conversations.toArray();
  }
  async deleteConversation(id: string) {
    await this.transaction('rw', this.conversations, this.chatMessages, async () => {
      await this.conversations.delete(id);
      await this.chatMessages.where('conversationId').equals(id).delete();
    });
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
