'use client';

import React, { useState, ChangeEvent, useRef } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Paperclip, X } from 'lucide-react';
import Image from 'next/image';

interface MediaUploadProps {
  onFileSelect: (file: File | null) => void;
  allowedTypes?: string[];
  maxSizeMB?: number;
}

const MediaUpload: React.FC<MediaUploadProps> = ({
  onFileSelect,
  allowedTypes = ['image/*', 'application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
  maxSizeMB = 16, // Default to 16MB
}) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setError(null);
      // Validate file type
      if (!allowedTypes.some(type => file.type.startsWith(type.replace('*', '')))) {
        setError(`Unsupported file type. Allowed types: ${allowedTypes.join(', ')}`);
        setSelectedFile(null);
        onFileSelect(null);
        setPreview(null);
        return;
      }

      // Validate file size
      if (file.size > maxSizeMB * 1024 * 1024) {
        setError(`File size exceeds ${maxSizeMB}MB.`);
        setSelectedFile(null);
        onFileSelect(null);
        setPreview(null);
        return;
      }

      setSelectedFile(file);
      onFileSelect(file);

      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (e) => {
          setPreview(e.target?.result as string);
        };
        reader.readAsDataURL(file);
      } else {
        setPreview(null);
      }
    } else {
      setSelectedFile(null);
      onFileSelect(null);
      setPreview(null);
    }
  };

  const handleRemoveFile = () => {
    setSelectedFile(null);
    setError(null);
    onFileSelect(null);
    setPreview(null);
  };

  return (
    <div className="flex flex-col space-y-2">
      <div className="flex items-center space-x-2">
        <Input
          ref={inputRef}
          id="media-upload"
          type="file"
          className="hidden"
          onChange={handleFileChange}
          accept={allowedTypes.join(',')}
        />
        <Button type="button" variant="outline" size="icon" onClick={() => inputRef.current?.click()}>
          <Paperclip className="h-4 w-4" />
        </Button>
        {selectedFile && (
          <div className="flex items-center space-x-2">
            <span className="text-sm text-muted-foreground">
              {selectedFile.name} ({(selectedFile.size / (1024 * 1024)).toFixed(2)} MB)
            </span>
            <Button type="button" variant="ghost" size="icon" onClick={handleRemoveFile}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>
      {error && <p className="text-sm text-red-500">{error}</p>}
      {preview && <Image src={preview} alt="media preview" width={200} height={200} className="rounded-md" />}
    </div>
  );
};

export default MediaUpload;
