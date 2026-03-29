import axios, { AxiosInstance } from 'axios';
import {
  Assignment,
  CreateAssignmentRequest,
  AssignmentSubmission,
} from '../../../types/course/assignment.types';

import { API_BASE } from '../config';

const TOKEN_KEY = 'edulive_token';

export class AssignmentApi {
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

  async createAssignment(courseId: string, moduleId: string, data: CreateAssignmentRequest): Promise<Assignment> {
    const response = await this.client.post<Assignment>(`/courses/${courseId}/modules/${moduleId}/assignments`, data);
    return response.data;
  }

  async updateAssignment(courseId: string, assignmentId: string, data: Partial<CreateAssignmentRequest>): Promise<Assignment> {
    const response = await this.client.put<Assignment>(`/courses/${courseId}/assignments/${assignmentId}`, data);
    return response.data;
  }

  async deleteAssignment(courseId: string, assignmentId: string): Promise<void> {
    await this.client.delete(`/courses/${courseId}/assignments/${assignmentId}`);
  }

  async getAssignments(courseId: string, moduleId: string): Promise<Assignment[]> {
    const response = await this.client.get<Assignment[]>(`/courses/${courseId}/modules/${moduleId}/assignments`);
    return response.data;
  }

  async submitAssignment(courseId: string, assignmentId: string, data: { content: string; fileUrl?: string; fileName?: string }): Promise<AssignmentSubmission> {
    const response = await this.client.post<AssignmentSubmission>(`/courses/${courseId}/assignments/${assignmentId}/submissions`, data);
    return response.data;
  }

  async gradeSubmission(courseId: string, submissionId: string, data: { score: number; feedback?: string }): Promise<AssignmentSubmission> {
    const response = await this.client.put<AssignmentSubmission>(`/courses/${courseId}/submissions/${submissionId}/grade`, data);
    return response.data;
  }

  async getSubmissions(courseId: string, assignmentId: string): Promise<AssignmentSubmission[]> {
    const response = await this.client.get<AssignmentSubmission[]>(`/courses/${courseId}/assignments/${assignmentId}/submissions`);
    return response.data;
  }

  async getMySubmission(courseId: string, assignmentId: string): Promise<AssignmentSubmission> {
    const response = await this.client.get<AssignmentSubmission>(`/courses/${courseId}/assignments/${assignmentId}/submissions/me`);
    return response.data;
  }
}

export const assignmentApi = new AssignmentApi();
