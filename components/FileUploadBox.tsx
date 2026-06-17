'use client';

import { useState, useRef } from 'react';
import { Upload, File, CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { formatFileSize } from '@/lib/utils/formatFileSize';

interface FileUploadBoxProps {
  onUploadSuccess?: () => void;
  currentFolderId: string | null;
  compact?: boolean;
}

export default function FileUploadBox({ onUploadSuccess, currentFolderId, compact = false }: FileUploadBoxProps) {
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const handleFileUpload = async (file: File) => {
    setUploading(true);
    setMessage(null);
    setUploadProgress(0);

    try {
      const formData = new FormData();
      formData.append('file', file);
      if (currentFolderId) {
        formData.append('folderId', currentFolderId);
      }

      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return prev;
          }
          return prev + 10;
        });
      }, 200);

      const response = await fetch('/api/files/upload', {
        method: 'POST',
        body: formData,
      });

      clearInterval(progressInterval);
      setUploadProgress(100);

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Upload failed');
      }

      setMessage({ 
        type: 'success', 
        text: `✓ "${file.name}" uploaded successfully` 
      });
      
      if (onUploadSuccess) onUploadSuccess();
      
      setTimeout(() => setMessage(null), 3000);
    } catch (error: any) {
      console.error('Upload error:', error);
      setMessage({ 
        type: 'error', 
        text: error.message || 'Upload failed' 
      });
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  const onFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFileUpload(files[0]);
    }
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const triggerUpload = () => {
    fileInputRef.current?.click();
  };

  if (compact) {
    return (
      <>
        <input
          type="file"
          ref={fileInputRef}
          onChange={onFileSelect}
          className="hidden"
        />
        {message && (
          <div className={`fixed bottom-4 right-4 z-50 p-3 rounded-lg shadow-lg ${
            message.type === 'success' ? 'bg-green-500 text-white' : 'bg-red-500 text-white'
          }`}>
            {message.text}
          </div>
        )}
        {uploading && (
          <div className="fixed bottom-4 right-4 z-50 p-3 bg-blue-500 text-white rounded-lg shadow-lg">
            Uploading... {uploadProgress}%
          </div>
        )}
      </>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-slate-200 p-4">
      <input
        type="file"
        ref={fileInputRef}
        onChange={onFileSelect}
        className="hidden"
      />
      
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-medium text-slate-700">Upload files</h3>
          <p className="text-xs text-slate-400 mt-0.5">Drag and drop or click to browse</p>
        </div>
        <button
          onClick={triggerUpload}
          disabled={uploading}
          className="px-3 py-1.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors disabled:opacity-50"
        >
          Select files
        </button>
      </div>

      {uploading && (
        <div className="mt-3">
          <div className="flex justify-between text-xs text-slate-500 mb-1">
            <span>Uploading...</span>
            <span>{uploadProgress}%</span>
          </div>
          <div className="w-full bg-slate-100 rounded-full h-1">
            <div className="bg-blue-600 h-1 rounded-full transition-all" style={{ width: `${uploadProgress}%` }} />
          </div>
        </div>
      )}

      {message && (
        <div className={`mt-3 text-sm ${message.type === 'success' ? 'text-green-600' : 'text-red-600'}`}>
          {message.text}
        </div>
      )}
    </div>
  );
}