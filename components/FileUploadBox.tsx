'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { Upload, File, CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { formatFileSize } from '@/lib/utils/formatFileSize';

interface FileUploadBoxProps {
  onUploadSuccess?: () => void;
  currentFolderId: string | null;
}

export default function FileUploadBox({ onUploadSuccess, currentFolderId }: FileUploadBoxProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const handleFileUpload = async (file: File) => {
    setUploading(true);
    setMessage(null);
    setSelectedFile(file);
    setUploadProgress(0);

    try {
      // Create form data
      const formData = new FormData();
      formData.append('file', file);
      if (currentFolderId) {
        formData.append('folderId', currentFolderId);
      }

      // Simulate progress
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return prev;
          }
          return prev + 10;
        });
      }, 200);

      // Upload file to our API
      const response = await fetch('/api/files/upload', {
        method: 'POST',
        body: formData,
      });

      clearInterval(progressInterval);
      setUploadProgress(100);

      // SAFE RESPONSE HANDLING - Check if response is JSON
      const contentType = response.headers.get('content-type');
      
      if (!contentType || !contentType.includes('application/json')) {
        // Not JSON - likely HTML error
        const textResponse = await response.text();
        console.error('Non-JSON response:', textResponse.substring(0, 500));
        throw new Error('Server returned HTML instead of JSON. Check API route.');
      }

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Upload failed');
      }

      setMessage({ 
        type: 'success', 
        text: `✓ "${file.name}" (${formatFileSize(file.size)}) uploaded and encrypted successfully!` 
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
    }
  };

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFileUpload(files[0]);
    }
  }, [currentFolderId]);

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
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6">
      <h2 className="text-lg font-semibold text-slate-900 mb-4 flex items-center">
        <Upload className="h-5 w-5 mr-2 text-blue-600" />
        Upload to Private Cloud (AES-256 Encrypted)
        {currentFolderId && <span className="text-sm font-normal text-slate-500 ml-2">(to current folder)</span>}
      </h2>
      
      <div
        onDrop={onDrop}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        className={`border-2 border-dashed rounded-xl p-8 text-center transition-all duration-300 ${
          isDragging
            ? 'border-blue-500 bg-blue-50/50'
            : 'border-slate-200 hover:border-slate-300 bg-slate-50/50'
        }`}
      >
        <div className="flex flex-col items-center">
          <div className={`w-20 h-20 rounded-2xl flex items-center justify-center mb-4 transition-all duration-300 ${
            isDragging ? 'bg-blue-500 shadow-lg' : 'bg-gradient-to-br from-blue-100 to-indigo-100'
          }`}>
            <Upload className={`h-10 w-10 transition-all duration-300 ${
              isDragging ? 'text-white' : 'text-blue-600'
            }`} />
          </div>
          <p className="text-slate-700 font-medium mb-1">
            {isDragging ? 'Drop your file here' : 'Drag and drop your file here'}
          </p>
          <p className="text-sm text-slate-500 mb-4">or</p>
          <input
            type="file"
            onChange={onFileSelect}
            className="hidden"
            id="fileInput"
            ref={fileInputRef}
            disabled={uploading}
          />
          <label
            htmlFor="fileInput"
            className={`inline-flex items-center px-6 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-medium cursor-pointer hover:shadow-lg transition-all ${
              uploading ? 'opacity-50 cursor-not-allowed' : ''
            }`}
          >
            <File className="h-4 w-4 mr-2" />
            Browse Files
          </label>
          <p className="text-xs text-slate-400 mt-4">
            Files are AES-256 encrypted before upload
          </p>
          <p className="text-xs text-slate-400">
            Stored encrypted on private storage server
          </p>
        </div>
      </div>

      {selectedFile && !uploading && !message && (
        <div className="mt-4 p-3 bg-blue-50 rounded-xl">
          <p className="text-sm text-blue-800">
            Ready to encrypt and upload: {selectedFile.name} ({formatFileSize(selectedFile.size)})
          </p>
        </div>
      )}

      {uploading && (
        <div className="mt-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-blue-600 flex items-center">
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Encrypting and uploading...
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
  );
}