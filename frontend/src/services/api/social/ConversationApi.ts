import axios, { AxiosInstance } from 'axios';
import { Conversation, Message, MessagePage, SendMessageRequest } from '../../../types/social/messaging.types';

import { API_BASE } from '../config';

const TOKEN_KEY = 'edulive_token';

export class ConversationApi {
  private client: AxiosInstance;

  constructor(baseURL: string = API_BASE) {
    this.client = axios.create({ baseURL, headers: { 'Content-Type': 'application/json' } });
    this.client.interceptors.request.use((config) => {
      const token = localStorage.getItem(TOKEN_KEY);
      if (token) config.headers.Authorization = `Bearer ${token}`;
      return config;
    });
  }

  async getConversations(): Promise<Conversation[]> {
    const response = await this.client.get<Conversation[]>('/conversations');
    return response.data;
  }

  async getMessages(conversationId: string, page = 0, size = 20): Promise<MessagePage> {
    const response = await this.client.get<MessagePage>(`/conversations/${conversationId}/messages`, { params: { page, size } });
    return response.data;
  }

  async sendMessage(request: SendMessageRequest): Promise<Message> {
    const response = await this.client.post<Message>('/conversations/messages', request);
    return response.data;
  }

  async markAsRead(conversationId: string): Promise<void> {
    await this.client.put(`/conversations/${conversationId}/read`);
  }

  async getUnreadCount(): Promise<number> {
    const response = await this.client.get<{ count: number }>('/conversations/unread-count');
    return response.data.count ?? response.data;
  }
}

export const conversationApi = new ConversationApi();
