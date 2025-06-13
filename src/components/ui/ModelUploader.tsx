import { useState, useRef, useCallback } from 'react';
import { useMutation } from 'convex/react';
import { api } from '../../../convex/_generated/api';

interface ModelUploaderProps {
  onUploadComplete: (modelData: {
    modelUrl: string;
    name: string;
    description: string;
  }) => void;
  onUploadError: (error: string) => void;
  className?: string;
  children?: React.ReactNode;
}

export function ModelUploader({
  onUploadComplete,
  onUploadError,
  className = '',
  children
}: ModelUploaderProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // In a real implementation, you would use a file storage service like AWS S3, Cloudinary, etc.
  // For now, we'll simulate the upload process
  const simulateUpload = useCallback(async (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      // Simulate upload progress
      let progress = 0;
      const interval = setInterval(() => {
        progress += 10;
        setUploadProgress(progress);
        
        if (progress >= 100) {
          clearInterval(interval);
          // In a real implementation, this would be the actual URL from your storage service
          resolve(`/uploads/custom-models/${file.name}`);
        }
      }, 200);
      
      // Simulate potential upload failure (5% chance)
      if (Math.random() < 0.05) {
        clearInterval(interval);
        reject(new Error('Upload failed. Please try again.'));
      }
    });
  }, []);
  
  const validateFile = (file: File): string | null => {
    // Check file size (max 50MB)
    const maxSize = 50 * 1024 * 1024; // 50MB
    if (file.size > maxSize) {
      return 'File size must be less than 50MB';
    }
    
    // Check file type
    const validExtensions = ['.glb', '.gltf'];
    const validMimeTypes = ['model/gltf-binary', 'model/gltf+json', 'application/octet-stream'];
    
    const hasValidExtension = validExtensions.some(ext => 
      file.name.toLowerCase().endsWith(ext)
    );
    
    const hasValidMimeType = validMimeTypes.includes(file.type);
    
    if (!hasValidExtension && !hasValidMimeType) {
      return 'Please upload a valid GLB or GLTF file';
    }
    
    return null;
  };
  
  const handleFileSelect = async (file: File) => {
    const validationError = validateFile(file);
    if (validationError) {
      onUploadError(validationError);
      return;
    }
    
    setIsUploading(true);
    setUploadProgress(0);
    
    try {
      const modelUrl = await simulateUpload(file);
      
      const modelData = {
        modelUrl,
        name: file.name.replace(/\.[^/.]+$/, ''), // Remove extension
        description: `Custom 3D model: ${file.name}`
      };
      
      onUploadComplete(modelData);
    } catch (error: any) {
      onUploadError(error.message || 'Upload failed. Please try again.');
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };
  
  const handleFileInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
    // Reset input value to allow selecting the same file again
    event.target.value = '';
  };
  
  const handleDrop = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    const file = event.dataTransfer.files[0];
    if (file) {
      handleFileSelect(file);
    }
  }, []);
  
  const handleDragOver = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
  }, []);
  
  const triggerFileSelect = () => {
    fileInputRef.current?.click();
  };
  
  return (
    <div className={className}>
      <input
        ref={fileInputRef}
        type="file"
        accept=".glb,.gltf"
        style={{ display: 'none' }}
        onChange={handleFileInputChange}
        disabled={isUploading}
      />
      
      <div
        onClick={triggerFileSelect}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        style={{
          border: '2px dashed #ccc',
          borderRadius: '8px',
          padding: '20px',
          textAlign: 'center',
          cursor: isUploading ? 'not-allowed' : 'pointer',
          backgroundColor: isUploading ? '#f5f5f5' : 'transparent',
          transition: 'all 0.3s ease'
        }}
      >
        {isUploading ? (
          <div>
            <div style={{ marginBottom: '10px' }}>Uploading... {uploadProgress}%</div>
            <div style={{
              width: '100%',
              height: '4px',
              backgroundColor: '#e0e0e0',
              borderRadius: '2px',
              overflow: 'hidden'
            }}>
              <div style={{
                width: `${uploadProgress}%`,
                height: '100%',
                backgroundColor: '#4CAF50',
                transition: 'width 0.3s ease'
              }} />
            </div>
          </div>
        ) : (
          children || (
            <div>
              <div style={{ fontSize: '18px', marginBottom: '10px' }}>📁</div>
              <div>Click to upload or drag & drop</div>
              <div style={{ fontSize: '12px', color: '#666', marginTop: '5px' }}>
                GLB or GLTF files only (max 50MB)
              </div>
            </div>
          )
        )}
      </div>
    </div>
  );
}

export default ModelUploader;