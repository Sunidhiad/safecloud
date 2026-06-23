'use client';

import { useState, useRef, useEffect, forwardRef, useImperativeHandle } from 'react';
import { Upload, File, CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { formatFileSize } from '@/lib/utils/formatFileSize';

export interface FileUploadBoxRef {
  triggerUpload: () => void;
}

interface FileUploadBoxProps {
  onUploadSuccess?: () => void;
  currentFolderId: string | null;
}

const FileUploadBox = forwardRef<FileUploadBoxRef, FileUploadBoxProps>(
  ({ onUploadSuccess, currentFolderId }, ref) => {
    const [isDragging, setIsDragging] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Expose triggerUpload method to parent components
    useImperativeHandle(ref, () => ({
      triggerUpload: () => {
        fileInputRef.current?.click();
      }
    }));

    const handleFileUpload = async (file: File) => {
      setUploading(true);
      setMessage(null);
      setSelectedFile(file);
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

        const folderText = currentFolderId ? `to folder` : 'to root';
        setMessage({ 
          type: 'success', 
          text: `✓ "${file.name}" (${formatFileSize(file.size)}) uploaded successfully ${folderText}!` 
        });
        
        setSelectedFile(null);
        
        if (onUploadSuccess) onUploadSuccess();
        
        setTimeout(() => setMessage(null), 5000);
      } catch (error: any) {
        console.error('Upload error:', error);
        setMessage({ 
          type: 'error', 
          text: error.message || 'Failed to upload file. Please try again.' 
        });
      } finally {
        setUploading(false);
        setUploadProgress(0);
        if (fileInputRef.current) fileInputRef.current.value = '';
      }
    };

    const onDrop = (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      
      const files = Array.from(e.dataTransfer.files);
      if (files.length > 0) {
        handleFileUpload(files[0]);
      }
    };

    const onDragOver = (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(true);
    };

    const onDragLeave = (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
    };

    const onFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files;
      if (files && files.length > 0) {
        handleFileUpload(files[0]);
      }
      if (fileInputRef.current) fileInputRef.current.value = '';
    };

    return (
      <>
        <input
          type="file"
          ref={fileInputRef}
          onChange={onFileSelect}
          className="hidden"
          id="fileInput"
          disabled={uploading}
        />
        
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl border border-blue-100 p-8 mb-8">
          <div 
            onDrop={onDrop}
            onDragOver={onDragOver}
            onDragLeave={onDragLeave}
            className={`border-2 border-dashed rounded-xl p-8 transition-all ${
              isDragging
                ? 'border-blue-500 bg-blue-50/50'
                : 'border-blue-200 hover:border-blue-300'
            }`}
          >
            <div className="flex flex-col items-center justify-center">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
                <Upload className="h-8 w-8 text-blue-600" />
              </div>
              <h3 className="text-xl font-semibold text-slate-800 mb-2">
                {isDragging ? 'Drop your file here' : 'Upload files to your cloud'}
              </h3>
              <p className="text-sm text-slate-500 mb-4">
                {currentFolderId ? `Uploading to current folder` : 'Uploading to root'}
              </p>
              <label
                htmlFor="fileInput"
                className={`inline-flex items-center px-6 py-2.5 bg-blue-600 text-white rounded-lg font-medium cursor-pointer hover:bg-blue-700 transition-colors ${
                  uploading ? 'opacity-50 cursor-not-allowed' : ''
                }`}
              >
                <File className="h-4 w-4 mr-2" />
                {uploading ? 'Uploading...' : 'Select files to upload'}
              </label>
              <p className="text-xs text-slate-400 mt-4">
                Files are encrypted with AES-256 before upload
              </p>
            </div>
          </div>

          {selectedFile && !uploading && !message && (
            <div className="mt-4 p-3 bg-blue-50 rounded-lg">
              <p className="text-sm text-blue-800">
                Ready to upload: {selectedFile.name} ({formatFileSize(selectedFile.size)})
              </p>
            </div>
          )}

          {uploading && (
            <div className="mt-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-blue-600 flex items-center">
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Uploading...
                </span>
                <span className="text-sm font-medium text-blue-600">{uploadProgress}%</span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                <div 
                  className="h-2 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-full transition-all duration-300"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
            </div>
          )}

          {message && (
            <div
              className={`mt-4 p-3 rounded-xl flex items-start space-x-2 ${
                message.type === 'success'
                  ? 'bg-green-50 text-green-800 border border-green-200'
                  : 'bg-red-50 text-red-800 border border-red-200'
              }`}
            >
              {message.type === 'success' ? (
                <CheckCircle className="h-5 w-5 flex-shrink-0" />
              ) : (
                <XCircle className="h-5 w-5 flex-shrink-0" />
              )}
              <span className="text-sm">{message.text}</span>
            </div>
          )}
        </div>
      </>
    );
  }
);

FileUploadBox.displayName = 'FileUploadBox';

export default FileUploadBox;