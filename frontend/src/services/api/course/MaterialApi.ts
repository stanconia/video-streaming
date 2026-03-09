import axios, { AxiosInstance } from 'axios';
import { ClassMaterial, PresignedUpload } from '../../../types/course/materials.types';

import { API_BASE } from '../config';

const TOKEN_KEY = 'edulive_token';

export class MaterialApi {
  private client: AxiosInstance;

  constructor(baseURL: string = API_BASE) {
    this.client = axios.create({ baseURL, headers: { 'Content-Type': 'application/json' } });
    this.client.interceptors.request.use((config) => {
      const token = localStorage.getItem(TOKEN_KEY);
      if (token) config.headers.Authorization = `Bearer ${token}`;
      return config;
    });
  }

  async getMaterials(classId: string): Promise<ClassMaterial[]> {
    const response = await this.client.get<ClassMaterial[]>(`/classes/${classId}/materials`);
    return response.data;
  }

  async getUploadUrl(classId: string, fileName: string, contentType: string, fileSize: number): Promise<PresignedUpload> {
    const response = await this.client.post<PresignedUpload>(`/classes/${classId}/materials/upload-url`, { fileName, contentType, fileSize });
    return response.data;
  }

  async uploadMaterial(classId: string, file: File): Promise<ClassMaterial> {
    const formData = new FormData();
    formData.append('file', file);
    const response = await this.client.post<ClassMaterial>(`/classes/${classId}/materials/upload`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  }

  async confirmUpload(classId: string, fileKey: string, fileName: string, contentType: string, fileSize: number): Promise<ClassMaterial> {
    const response = await this.client.post<ClassMaterial>(`/classes/${classId}/materials/confirm`, { fileKey, fileName, contentType, fileSize });
    return response.data;
  }

  async deleteMaterial(classId: string, materialId: string): Promise<void> {
    await this.client.delete(`/classes/${classId}/materials/${materialId}`);
  }
}

export const materialApi = new MaterialApi();
