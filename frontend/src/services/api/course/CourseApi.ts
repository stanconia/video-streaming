import axios, { AxiosInstance } from 'axios';
import {
  Course,
  CreateCourseRequest,
  CourseModule,
  CreateModuleRequest,
  Lesson,
  CreateLessonRequest,
  CourseSearchParams,
  CourseSearchResponse,
} from '../../../types/course/course.types';

import { API_BASE } from '../config';

const TOKEN_KEY = 'edulive_token';

export class CourseApi {
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

  async getCourses(): Promise<Course[]> {
    const response = await this.client.get<Course[]>('/courses');
    return response.data;
  }

  async getTeacherCourses(): Promise<Course[]> {
    const response = await this.client.get<Course[]>('/courses/my');
    return response.data;
  }

  async getCourse(id: string): Promise<Course> {
    const response = await this.client.get<Course>(`/courses/${id}`);
    return response.data;
  }

  async createCourse(data: CreateCourseRequest): Promise<Course> {
    const response = await this.client.post<Course>('/courses', data);
    return response.data;
  }

  async updateCourse(id: string, data: Partial<CreateCourseRequest>): Promise<Course> {
    const response = await this.client.put<Course>(`/courses/${id}`, data);
    return response.data;
  }

  async publishCourse(id: string): Promise<Course> {
    const response = await this.client.post<Course>(`/courses/${id}/publish`);
    return response.data;
  }

  async deleteCourse(id: string): Promise<void> {
    await this.client.delete(`/courses/${id}`);
  }

  async getModules(courseId: string): Promise<CourseModule[]> {
    const response = await this.client.get<CourseModule[]>(`/courses/${courseId}/modules`);
    return response.data;
  }

  async addModule(courseId: string, data: CreateModuleRequest): Promise<CourseModule> {
    const response = await this.client.post<CourseModule>(`/courses/${courseId}/modules`, data);
    return response.data;
  }

  async updateModule(courseId: string, moduleId: string, data: Partial<CreateModuleRequest>): Promise<CourseModule> {
    const response = await this.client.put<CourseModule>(`/courses/${courseId}/modules/${moduleId}`, data);
    return response.data;
  }

  async deleteModule(courseId: string, moduleId: string): Promise<void> {
    await this.client.delete(`/courses/${courseId}/modules/${moduleId}`);
  }

  async getLessonsForModule(courseId: string, moduleId: string): Promise<Lesson[]> {
    const response = await this.client.get<Lesson[]>(`/courses/${courseId}/modules/${moduleId}/lessons`);
    return response.data;
  }

  async getLesson(courseId: string, lessonId: string): Promise<Lesson> {
    const response = await this.client.get<Lesson>(`/courses/${courseId}/lessons/${lessonId}`);
    return response.data;
  }

  async addLesson(courseId: string, moduleId: string, data: CreateLessonRequest): Promise<Lesson> {
    const response = await this.client.post<Lesson>(`/courses/${courseId}/modules/${moduleId}/lessons`, data);
    return response.data;
  }

  async updateLesson(courseId: string, lessonId: string, data: Partial<CreateLessonRequest>): Promise<Lesson> {
    const response = await this.client.put<Lesson>(`/courses/${courseId}/lessons/${lessonId}`, data);
    return response.data;
  }

  async deleteLesson(courseId: string, lessonId: string): Promise<void> {
    await this.client.delete(`/courses/${courseId}/lessons/${lessonId}`);
  }

  async uploadCourseThumbnail(courseId: string, file: File): Promise<Course> {
    const formData = new FormData();
    formData.append('file', file);
    const response = await this.client.post<Course>(
      `/courses/${courseId}/thumbnail`,
      formData,
      { headers: { 'Content-Type': undefined as any } }
    );
    return response.data;
  }

  async deleteCourseThumbnail(courseId: string): Promise<Course> {
    const response = await this.client.delete<Course>(
      `/courses/${courseId}/thumbnail`
    );
    return response.data;
  }

  async uploadModuleThumbnail(courseId: string, moduleId: string, file: File): Promise<CourseModule> {
    const formData = new FormData();
    formData.append('file', file);
    const response = await this.client.post<CourseModule>(
      `/courses/${courseId}/modules/${moduleId}/thumbnail`,
      formData,
      { headers: { 'Content-Type': undefined as any } }
    );
    return response.data;
  }

  async deleteModuleThumbnail(courseId: string, moduleId: string): Promise<CourseModule> {
    const response = await this.client.delete<CourseModule>(
      `/courses/${courseId}/modules/${moduleId}/thumbnail`
    );
    return response.data;
  }

  async searchCourses(params: CourseSearchParams): Promise<CourseSearchResponse> {
    const searchParams = new URLSearchParams();
    if (params.q) searchParams.set('q', params.q);
    if (params.subject) searchParams.set('subject', params.subject);
    if (params.difficulty) searchParams.set('difficulty', params.difficulty);
    if (params.minPrice != null) searchParams.set('minPrice', String(params.minPrice));
    if (params.maxPrice != null) searchParams.set('maxPrice', String(params.maxPrice));
    if (params.sortBy) searchParams.set('sortBy', params.sortBy);
    if (params.page != null) searchParams.set('page', String(params.page));
    if (params.size != null) searchParams.set('size', String(params.size));
    const response = await this.client.get<CourseSearchResponse>(`/courses/search?${searchParams.toString()}`);
    return response.data;
  }

  async getSubjects(): Promise<string[]> {
    const response = await this.client.get<string[]>('/courses/subjects');
    return response.data;
  }
}

export const courseApi = new CourseApi();
