import React, { useState, useRef } from 'react';
import { materialApi } from '../../services/api/course/MaterialApi';

interface MaterialUploadProps {
  classId: string;
  onUploaded: () => void;
}

const ACCEPTED_TYPES = '.pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.txt,.csv,.jpg,.jpeg,.png,.gif,.svg,.mp4,.mp3,.zip,.rar';
const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB

export const MaterialUpload: React.FC<MaterialUploadProps> = ({ classId, onUploaded }) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    setError(null);
    setSuccess(false);
    if (file && file.size > MAX_FILE_SIZE) {
      setError('File size exceeds 50MB limit');
      setSelectedFile(null);
      return;
    }
    setSelectedFile(file);
  };

  const handleUpload = async () => {
    if (!selectedFile) return;
    try {
      setUploading(true);
      setError(null);
      setSuccess(false);
      await materialApi.uploadMaterial(classId, selectedFile);
      setSuccess(true);
      setSelectedFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      onUploaded();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to upload material');
    } finally {
      setUploading(false);
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const units = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    const size = (bytes / Math.pow(1024, i)).toFixed(i > 0 ? 1 : 0);
    return `${size} ${units[i]}`;
  };

  return (
    <div style={styles.container}>
      <div style={styles.uploadArea}>
        <input
          ref={fileInputRef}
          type="file"
          accept={ACCEPTED_TYPES}
          onChange={handleFileSelect}
          style={styles.fileInput}
          disabled={uploading}
        />
        {selectedFile && (
          <div style={styles.fileInfo}>
            <span style={styles.fileName}>{selectedFile.name}</span>
            <span style={styles.fileSize}>({formatFileSize(selectedFile.size)})</span>
          </div>
        )}
        <button
          onClick={handleUpload}
          disabled={!selectedFile || uploading}
          style={!selectedFile || uploading ? styles.uploadButtonDisabled : styles.uploadButton}
        >
          {uploading ? 'Uploading...' : 'Upload'}
        </button>
      </div>
      <div style={styles.hint}>Max file size: 50MB</div>
      {error && <div style={styles.error}>{error}</div>}
      {success && <div style={styles.success}>File uploaded successfully!</div>}
    </div>
  );
};

const styles: { [key: string]: React.CSSProperties } = {
  container: { marginBottom: '16px' },
  uploadArea: { display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' as const },
  fileInput: { fontSize: '14px' },
  fileInfo: { display: 'flex', alignItems: 'center', gap: '6px' },
  fileName: { fontSize: '14px', color: '#333' },
  fileSize: { fontSize: '12px', color: '#666' },
  uploadButton: { padding: '8px 20px', backgroundColor: '#28a745', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '14px', fontWeight: 'bold' },
  uploadButtonDisabled: { padding: '8px 20px', backgroundColor: '#ccc', color: '#666', border: 'none', borderRadius: '4px', cursor: 'not-allowed', fontSize: '14px', fontWeight: 'bold' },
  hint: { fontSize: '12px', color: '#999', marginTop: '6px' },
  error: { color: '#dc3545', fontSize: '13px', marginTop: '8px' },
  success: { color: '#28a745', fontSize: '13px', marginTop: '8px' },
};
