import React, { useState, useEffect } from 'react';
import { ClassMaterial } from '../../types/course/materials.types';
import { materialApi } from '../../services/api/course/MaterialApi';

interface MaterialsListProps {
  classId: string;
  isTeacher: boolean;
}

const getContentTypeIcon = (contentType: string): string => {
  if (contentType.includes('pdf')) return '\u{1F4C4}';
  if (contentType.includes('image')) return '\u{1F5BC}';
  if (contentType.includes('video')) return '\u{1F3AC}';
  if (contentType.includes('audio')) return '\u{1F3B5}';
  if (contentType.includes('zip') || contentType.includes('compressed')) return '\u{1F4E6}';
  if (contentType.includes('word') || contentType.includes('document')) return '\u{1F4DD}';
  if (contentType.includes('spreadsheet') || contentType.includes('excel')) return '\u{1F4CA}';
  if (contentType.includes('presentation') || contentType.includes('powerpoint')) return '\u{1F4CA}';
  return '\u{1F4CE}';
};

const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  const size = (bytes / Math.pow(1024, i)).toFixed(i > 0 ? 1 : 0);
  return `${size} ${units[i]}`;
};

export const MaterialsList: React.FC<MaterialsListProps> = ({ classId, isTeacher }) => {
  const [materials, setMaterials] = useState<ClassMaterial[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadMaterials();
  }, [classId]);

  const loadMaterials = async () => {
    try {
      setLoading(true);
      const data = await materialApi.getMaterials(classId);
      setMaterials(data);
      setError(null);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to load materials');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (materialId: string) => {
    try {
      setError(null);
      await materialApi.deleteMaterial(classId, materialId);
      setMaterials(materials.filter((m) => m.id !== materialId));
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to delete material');
    }
  };

  const formatDate = (dateStr: string) => new Date(dateStr).toLocaleDateString();

  if (loading) return <div style={styles.loading}>Loading materials...</div>;

  return (
    <div style={styles.container}>
      {error && <div style={styles.error}>{error}</div>}

      {materials.length === 0 ? (
        <div style={styles.empty}>No materials yet</div>
      ) : (
        <div style={styles.list}>
          {materials.map((material) => (
            <div key={material.id} style={styles.listItem}>
              <div style={styles.iconCol}>
                <span style={styles.icon}>{getContentTypeIcon(material.contentType)}</span>
              </div>
              <div style={styles.infoCol}>
                <div style={styles.fileName}>{material.fileName}</div>
                <div style={styles.meta}>
                  <span>{formatFileSize(material.fileSize)}</span>
                  <span>{formatDate(material.uploadedAt)}</span>
                </div>
              </div>
              <div style={styles.actionsCol}>
                {material.downloadUrl && (
                  <a
                    href={material.downloadUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={styles.downloadButton}
                  >
                    Download
                  </a>
                )}
                {isTeacher && (
                  <button
                    onClick={() => handleDelete(material.id)}
                    style={styles.deleteButton}
                  >
                    Delete
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

const styles: { [key: string]: React.CSSProperties } = {
  container: {},
  loading: { textAlign: 'center', padding: '20px', color: '#666' },
  error: { color: '#721c24', padding: '12px', marginBottom: '12px', backgroundColor: '#f8d7da', borderRadius: '4px' },
  empty: { textAlign: 'center', padding: '20px', color: '#666', fontSize: '14px' },
  list: { display: 'flex', flexDirection: 'column', gap: '8px' },
  listItem: { display: 'flex', alignItems: 'center', gap: '12px', padding: '12px', border: '1px solid #eee', borderRadius: '6px' },
  iconCol: { flexShrink: 0 },
  icon: { fontSize: '28px' },
  infoCol: { flex: 1, minWidth: 0 },
  fileName: { fontSize: '14px', fontWeight: 'bold', color: '#333', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' as const },
  meta: { display: 'flex', gap: '16px', fontSize: '12px', color: '#666', marginTop: '4px' },
  actionsCol: { display: 'flex', gap: '8px', flexShrink: 0 },
  downloadButton: { padding: '6px 14px', backgroundColor: '#007bff', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '13px', textDecoration: 'none', display: 'inline-block' },
  deleteButton: { padding: '6px 14px', backgroundColor: '#dc3545', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '13px' },
};
