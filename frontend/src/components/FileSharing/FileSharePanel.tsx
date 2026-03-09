import React, { useRef } from 'react';

interface SharedFile {
  fileId: string;
  fileName: string;
  fileSize: number;
  fileType: string;
  downloadUrl: string;
  sharedBy: string;
  timestamp: Date;
}

interface Props {
  files: SharedFile[];
  onUpload: (file: File) => void;
  isUploading: boolean;
  canUpload: boolean;
}

const formatFileSize = (bytes: number): string => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

export const FileSharePanel: React.FC<Props> = ({ files, onUpload, isUploading, canUpload }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onUpload(file);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>Shared Files</div>
      <div style={styles.fileList}>
        {files.length === 0 ? (
          <div style={styles.empty}>No files shared yet</div>
        ) : (
          files.map(file => (
            <div key={file.fileId} style={styles.fileItem}>
              <div style={styles.fileInfo}>
                <a
                  href={file.downloadUrl}
                  style={styles.fileName}
                  target="_blank"
                  rel="noopener noreferrer"
                  download
                >
                  {file.fileName}
                </a>
                <span style={styles.fileMeta}>
                  {formatFileSize(file.fileSize)} - shared by {file.sharedBy}
                </span>
              </div>
            </div>
          ))
        )}
      </div>
      {canUpload && (
        <div style={styles.uploadArea}>
          <input
            ref={fileInputRef}
            type="file"
            onChange={handleFileSelect}
            style={styles.hiddenInput}
          />
          <button
            style={{
              ...styles.uploadButton,
              opacity: isUploading ? 0.6 : 1,
              cursor: isUploading ? 'not-allowed' : 'pointer',
            }}
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
          >
            {isUploading ? 'Uploading...' : 'Upload File'}
          </button>
          {isUploading && <div style={styles.progressBar}><div style={styles.progressFill} /></div>}
        </div>
      )}
    </div>
  );
};

const styles: { [key: string]: React.CSSProperties } = {
  container: {
    backgroundColor: '#1a1a2e',
    borderRadius: '8px',
    padding: '12px',
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
  },
  header: {
    color: '#e0e0e0',
    fontSize: '14px',
    fontWeight: 'bold',
    paddingBottom: '8px',
    borderBottom: '1px solid #333',
  },
  fileList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
    maxHeight: '250px',
    overflowY: 'auto',
  },
  empty: {
    color: '#888',
    fontSize: '13px',
    textAlign: 'center',
    padding: '20px 0',
  },
  fileItem: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '8px',
    backgroundColor: '#16213e',
    borderRadius: '6px',
  },
  fileInfo: {
    display: 'flex',
    flexDirection: 'column',
    gap: '2px',
    overflow: 'hidden',
  },
  fileName: {
    color: '#3a7bd5',
    fontSize: '13px',
    textDecoration: 'none',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
  fileMeta: {
    color: '#888',
    fontSize: '11px',
  },
  uploadArea: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
    paddingTop: '6px',
    borderTop: '1px solid #333',
  },
  hiddenInput: {
    display: 'none',
  },
  uploadButton: {
    padding: '10px',
    backgroundColor: '#4caf50',
    color: '#fff',
    border: 'none',
    borderRadius: '6px',
    fontSize: '14px',
    fontWeight: 'bold',
  },
  progressBar: {
    width: '100%',
    height: '4px',
    backgroundColor: '#0d1117',
    borderRadius: '2px',
    overflow: 'hidden',
  },
  progressFill: {
    width: '60%',
    height: '100%',
    backgroundColor: '#4caf50',
    borderRadius: '2px',
    animation: 'none',
  },
};
