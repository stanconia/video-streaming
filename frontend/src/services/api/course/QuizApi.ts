import axios, { AxiosInstance } from 'axios';
import {
  Quiz,
  CreateQuizRequest,
  QuizQuestion,
  QuizQuestionRequest,
  QuizAttempt,
} from '../../../types/course/quiz.types';

import { API_BASE } from '../config';

const TOKEN_KEY = 'edulive_token';

export class QuizApi {
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
        }
        return Promise.reject(error);
      }
    );
  }

  async createQuiz(courseId: string, moduleId: string, data: CreateQuizRequest): Promise<Quiz> {
    const response = await this.client.post<Quiz>(`/courses/${courseId}/modules/${moduleId}/quizzes`, data);
    return response.data;
  }

  async updateQuiz(courseId: string, quizId: string, data: Partial<CreateQuizRequest>): Promise<Quiz> {
    const response = await this.client.put<Quiz>(`/courses/${courseId}/quizzes/${quizId}`, data);
    return response.data;
  }

  async deleteQuiz(courseId: string, quizId: string): Promise<void> {
    await this.client.delete(`/courses/${courseId}/quizzes/${quizId}`);
  }

  async getQuizzes(courseId: string, moduleId: string): Promise<Quiz[]> {
    const response = await this.client.get<Quiz[]>(`/courses/${courseId}/modules/${moduleId}/quizzes`);
    return response.data;
  }

  async addQuestion(courseId: string, quizId: string, data: QuizQuestionRequest): Promise<QuizQuestion> {
    const response = await this.client.post<QuizQuestion>(`/courses/${courseId}/quizzes/${quizId}/questions`, data);
    return response.data;
  }

  async updateQuestion(courseId: string, quizId: string, questionId: string, data: Partial<QuizQuestionRequest>): Promise<QuizQuestion> {
    const response = await this.client.put<QuizQuestion>(`/courses/${courseId}/quizzes/${quizId}/questions/${questionId}`, data);
    return response.data;
  }

  async deleteQuestion(courseId: string, quizId: string, questionId: string): Promise<void> {
    await this.client.delete(`/courses/${courseId}/quizzes/${quizId}/questions/${questionId}`);
  }

  async getQuestions(courseId: string, quizId: string): Promise<QuizQuestion[]> {
    const response = await this.client.get<QuizQuestion[]>(`/courses/${courseId}/quizzes/${quizId}/questions`);
    return response.data;
  }

  async submitAttempt(courseId: string, quizId: string, answers: number[]): Promise<QuizAttempt> {
    const response = await this.client.post<QuizAttempt>(`/courses/${courseId}/quizzes/${quizId}/attempts`, { answers });
    return response.data;
  }

  async getMyAttempts(courseId: string, quizId: string): Promise<QuizAttempt[]> {
    const response = await this.client.get<QuizAttempt[]>(`/courses/${courseId}/quizzes/${quizId}/attempts/me`);
    return response.data;
  }
}

export const quizApi = new QuizApi();
