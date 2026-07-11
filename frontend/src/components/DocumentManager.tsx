import { useEffect, useState } from 'react';
import { FileText, Upload, Download, Trash2 } from 'lucide-react';
import {
  documentsService,
  DOCUMENT_TYPE_LABELS,
  type DocumentType,
  type UserDocument,
} from '../services/documentsService';

const DOCUMENT_TYPES = Object.keys(DOCUMENT_TYPE_LABELS) as DocumentType[];

function formatFileSize(bytes: number) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

export function DocumentManager() {
  const [documents, setDocuments] = useState<UserDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedType, setSelectedType] = useState<DocumentType>('resume');
  const [isUploading, setIsUploading] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    loadDocuments();
  }, []);

  const loadDocuments = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await documentsService.list();
      setDocuments(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load documents');
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSelectedFile(event.target.files?.[0] ?? null);
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      setError('Please choose a file to upload');
      return;
    }

    setIsUploading(true);
    setError(null);
    try {
      const newDocument = await documentsService.upload(selectedFile, selectedType);
      setDocuments((prev) => [newDocument, ...prev]);
      setSelectedFile(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to upload document');
    } finally {
      setIsUploading(false);
    }
  };

  const handleDelete = async (document: UserDocument) => {
    setDeletingId(document.id);
    setError(null);
    try {
      await documentsService.remove(document);
      setDocuments((prev) => prev.filter((doc) => doc.id !== document.id));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete document');
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-xl font-semibold text-gray-900 mb-2">Documents</h2>
      <p className="text-sm text-gray-600 mb-6">
        Keep cover letters, transcripts, certifications, and other supporting materials alongside your resume.
      </p>

      <div className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
        <div className="flex flex-col sm:flex-row gap-3 sm:items-center">
          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value as DocumentType)}
            disabled={isUploading}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-[#861F41] focus:border-[#861F41] text-sm"
          >
            {DOCUMENT_TYPES.map((type) => (
              <option key={type} value={type}>
                {DOCUMENT_TYPE_LABELS[type]}
              </option>
            ))}
          </select>
          <input
            type="file"
            onChange={handleFileChange}
            disabled={isUploading}
            className="text-sm text-gray-600 flex-1"
          />
          <button
            onClick={handleUpload}
            disabled={isUploading || !selectedFile}
            className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-[#861F41] text-white rounded-md hover:bg-[#621531] disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm font-medium"
          >
            <Upload className="h-4 w-4" />
            {isUploading ? 'Uploading...' : 'Upload'}
          </button>
        </div>
        <p className="mt-2 text-xs text-gray-500">PDF, Word, image, or text files, max 10MB.</p>
      </div>

      {error && (
        <p className="mb-4 text-sm text-red-600 flex items-center">
          <span className="mr-1">⚠️</span> {error}
        </p>
      )}

      {loading ? (
        <div className="flex justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-[#861F41]"></div>
        </div>
      ) : documents.length === 0 ? (
        <div className="bg-gray-50 rounded-lg p-8 border border-dashed border-gray-300 text-center">
          <FileText className="h-10 w-10 text-gray-400 mx-auto mb-3" />
          <p className="text-gray-600">No documents uploaded yet</p>
        </div>
      ) : (
        <ul className="space-y-3">
          {documents.map((document) => (
            <li
              key={document.id}
              className="flex items-center justify-between gap-3 p-3 bg-gray-50 rounded-lg border border-gray-200"
            >
              <div className="flex items-center gap-3 min-w-0">
                <FileText className="h-5 w-5 text-gray-400 flex-shrink-0" />
                <div className="min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{document.name}</p>
                  <p className="text-xs text-gray-500">
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-[#861F41]/10 text-[#861F41] font-medium mr-2">
                      {DOCUMENT_TYPE_LABELS[document.type]}
                    </span>
                    {formatFileSize(document.file_size)} · {new Date(document.created_at).toLocaleDateString()}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1 flex-shrink-0">
                <a
                  href={document.file_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 text-gray-500 hover:text-[#861F41] rounded-md hover:bg-gray-100 transition-colors"
                  title="Download"
                >
                  <Download className="h-4 w-4" />
                </a>
                <button
                  onClick={() => handleDelete(document)}
                  disabled={deletingId === document.id}
                  className="p-2 text-gray-500 hover:text-red-600 rounded-md hover:bg-gray-100 disabled:opacity-50 transition-colors"
                  title="Delete"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
