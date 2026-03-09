export interface ClassMaterial {
  id: string;
  classId: string;
  fileName: string;
  fileSize: number;
  contentType: string;
  downloadUrl: string | null;
  uploadedAt: string;
}

export interface PresignedUpload {
  uploadUrl: string;
  fileKey: string;
}
