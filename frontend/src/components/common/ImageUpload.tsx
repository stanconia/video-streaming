import React, { useState, useRef } from 'react';

interface ImageUploadProps {
  currentImageUrl?: string | null;
  onUpload: (file: File) => Promise<void>;
  onRemove?: () => Promise<void>;
  maxSizeMB?: number;
  label?: string;
}

const ACCEPTED_IMAGE_TYPES = 'image/jpeg,image/png,image/gif,image/webp';

export const ImageUpload: React.FC<ImageUploadProps> = ({
  currentImageUrl,
  onUpload,
  onRemove,
  maxSizeMB = 5,
  label = 'Thumbnail',
}) => {
  const [preview, setPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setError(null);

    if (!file.type.startsWith('image/')) {
      setError('Please select an image file');
      return;
    }

    if (file.size > maxSizeMB * 1024 * 1024) {
      setError(`Image must be smaller than ${maxSizeMB}MB`);
      return;
    }

    const reader = new FileReader();
    reader.onload = (ev) => setPreview(ev.target?.result as string);
    reader.readAsDataURL(file);

    try {
      setUploading(true);
      await onUpload(file);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to upload image');
      setPreview(null);
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleRemove = async () => {
    if (!onRemove) return;
    try {
      setUploading(true);
      setError(null);
      await onRemove();
      setPreview(null);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to remove image');
    } finally {
      setUploading(false);
    }
  };

  const displayUrl = preview || currentImageUrl;

  return (
    <div style={styles.container}>
      <label style={styles.label}>{label}</label>
      {displayUrl && (
        <div style={styles.previewContainer}>
          <img src={displayUrl} alt={label} style={styles.previewImage} />
          {onRemove && !uploading && (
            <button onClick={handleRemove} style={styles.removeButton}>
              Remove
            </button>
          )}
        </div>
      )}
      <input
        ref={fileInputRef}
        type="file"
        accept={ACCEPTED_IMAGE_TYPES}
        onChange={handleFileSelect}
        style={styles.fileInput}
        disabled={uploading}
      />
      {uploading && <div style={styles.uploading}>Uploading...</div>}
      {error && <div style={styles.error}>{error}</div>}
      <div style={styles.hint}>
        Max size: {maxSizeMB}MB. Accepted: JPEG, PNG, GIF, WebP
      </div>
    </div>
  );
};

const styles: { [key: string]: React.CSSProperties } = {
  container: { marginBottom: '12px' },
  label: {
    display: 'block',
    fontWeight: 'bold',
    marginBottom: '6px',
    color: '#333',
    fontSize: '13px',
  },
  previewContainer: {
    marginBottom: '8px',
    display: 'inline-block',
  },
  previewImage: {
    maxWidth: '200px',
    maxHeight: '120px',
    borderRadius: '4px',
    border: '1px solid #ddd',
    objectFit: 'cover' as const,
    display: 'block',
  },
  removeButton: {
    display: 'block',
    marginTop: '4px',
    padding: '4px 10px',
    backgroundColor: '#dc3545',
    color: 'white',
    border: 'none',
    borderRadius: '3px',
    cursor: 'pointer',
    fontSize: '11px',
  },
  fileInput: { fontSize: '14px', marginBottom: '4px' },
  uploading: { fontSize: '13px', color: '#007bff', marginTop: '4px' },
  error: { color: '#dc3545', fontSize: '13px', marginTop: '4px' },
  hint: { fontSize: '11px', color: '#999', marginTop: '4px' },
};
