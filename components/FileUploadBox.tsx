'use client';

import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, File, CheckCircle, XCircle, Loader2, Cloud } from 'lucide-react';
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

      setMessage({ 
        type: 'success', 
        text: `✓ "${file.name}" (${formatFileSize(file.size)}) uploaded successfully!` 
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
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6"
    >
      <h2 className="text-lg font-semibold text-slate-900 mb-4 flex items-center">
        <Cloud className="h-5 w-5 mr-2 text-blue-600" />
        Upload to Cloud
        {currentFolderId && <span className="text-sm font-normal text-slate-500 ml-2">(to current folder)</span>}
      </h2>
      
      <div
        onDrop={onDrop}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        className={`relative border-2 border-dashed rounded-2xl p-12 text-center transition-all duration-300 ${
          isDragging
            ? 'border-blue-500 bg-blue-50/50'
            : 'border-slate-200 hover:border-slate-300 bg-slate-50/50'
        }`}
      >
        <motion.div
          animate={{ scale: isDragging ? 1.05 : 1 }}
          className="flex flex-col items-center"
        >
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
            disabled={uploading}
          />
          <label
            htmlFor="fileInput"
            className={`inline-flex items-center px-6 py-2.5 gradient-primary text-white rounded-xl font-medium cursor-pointer hover:shadow-lg transition-all ${
              uploading ? 'opacity-50 cursor-not-allowed' : ''
            }`}
          >
            <File className="h-4 w-4 mr-2" />
            Browse Files
          </label>
          <p className="text-xs text-slate-400 mt-4">
            Supports: PDF, DOCX, Images, Videos, ZIP (Max 100MB)
          </p>
        </motion.div>
      </div>

      <AnimatePresence>
        {selectedFile && !uploading && !message && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="mt-4 p-3 bg-blue-50 rounded-xl"
          >
            <p className="text-sm text-blue-800">
              Ready to upload: {selectedFile.name} ({formatFileSize(selectedFile.size)})
            </p>
          </motion.div>
        )}

        {uploading && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="mt-4"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-blue-600 flex items-center">
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Uploading to cloud storage...
              </span>
              <span className="text-sm font-medium text-blue-600">{uploadProgress}%</span>
            </div>
            <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
              <motion.div 
                className="h-2 gradient-primary rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${uploadProgress}%` }}
                transition={{ duration: 0.3 }}
              />
            </div>
          </motion.div>
        )}

        {message && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
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
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}