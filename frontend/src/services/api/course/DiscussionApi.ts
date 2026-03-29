import axios, { AxiosInstance } from 'axios';
import { DiscussionThread, DiscussionReply } from '../../../types/course/discussion.types';

import { API_BASE } from '../config';

const TOKEN_KEY = 'edulive_token';

export class DiscussionApi {
  private client: AxiosInstance;

  constructor(baseURL: string = API_BASE) {
    this.client = axios.create({
      baseURL,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    this.client.interceptors.request.use((config) => {
      const token = localStorage.getItem(TOKEN_KEY);
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    });

    this.client.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401 || error.response?.status === 403) {
          localStorage.removeItem(TOKEN_KEY);
          localStorage.removeItem('edulive_user');
          window.location.href = '/login';
          return new Promise(() => {});
        }
        return Promise.reject(error);
      }
    );
  }

  async createThread(courseId: string, data: { title: string; content: string }): Promise<DiscussionThread> {
    const response = await this.client.post<DiscussionThread>(`/courses/${courseId}/discussions`, data);
    return response.data;
  }

  async getThreads(courseId: string): Promise<DiscussionThread[]> {
    const response = await this.client.get<DiscussionThread[]>(`/courses/${courseId}/discussions`);
    return response.data;
  }

  async getThread(courseId: string, threadId: string): Promise<DiscussionThread> {
    const response = await this.client.get<DiscussionThread>(`/courses/${courseId}/discussions/${threadId}`);
    return response.data;
  }

  async addReply(courseId: string, threadId: string, data: { content: string }): Promise<DiscussionReply> {
    const response = await this.client.post<DiscussionReply>(`/courses/${courseId}/discussions/${threadId}/replies`, data);
    return response.data;
  }

  async getReplies(courseId: string, threadId: string): Promise<DiscussionReply[]> {
    const response = await this.client.get<DiscussionReply[]>(`/courses/${courseId}/discussions/${threadId}/replies`);
    return response.data;
  }

  async deleteThread(courseId: string, threadId: string): Promise<void> {
    await this.client.delete(`/courses/${courseId}/discussions/${threadId}`);
  }

  async deleteReply(courseId: string, replyId: string): Promise<void> {
    await this.client.delete(`/courses/${courseId}/replies/${replyId}`);
  }
}

export const discussionApi = new DiscussionApi();
