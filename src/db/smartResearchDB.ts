import Dexie, { Table } from 'dexie';
import { Board } from '../types/Board';
import { Link } from '../types/Link';
import { AISummary } from '../types/AISummary';
import { ChatMessage } from '../types/ChatMessage';
import { Settings } from '../types/Settings';

export class SmartResearchDB extends Dexie {
  boards!: Table<Board, string>;
  links!: Table<Link, string>;
  summaries!: Table<AISummary, string>;
  chatMessages!: Table<ChatMessage, string>;
  settings!: Table<Settings, string>;

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
  getChatMessages() {
    return this.chatMessages.toArray();
  }

  // Settings
  upsertSettings(settings: Settings) {
    return this.settings.put(settings);
  }
  getSettings(id = 'user') {
    return this.settings.get(id);
  }
}

export const db = new SmartResearchDB(); 