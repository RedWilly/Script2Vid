"use client";

import React, { useState, useEffect } from 'react';
import { useDropzone } from 'react-dropzone';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';

interface VoiceOverFile {
  name: string;
  url: string;
  size: number;
  lastModified?: Date;
}

const MyUploads = () => {
  const [files, setFiles] = useState<VoiceOverFile[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<VoiceOverFile | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = React.useRef<HTMLAudioElement | null>(null);

  // Fetch existing voice-over files
  const fetchFiles = async () => {
    try {
      const response = await fetch('/api/voiceover/list');
      const data = await response.json();
      
      if (data.success) {
        setFiles(data.files || []);
      } else {
        console.error('Error fetching files:', data.error);
        toast.error(`Failed to fetch voice-overs: ${data.error}`);
      }
    } catch (error) {
      console.error('Error fetching files:', error);
      toast.error('Failed to connect to voice-over service');
    }
  };

  useEffect(() => {
    fetchFiles().catch(err => {
      console.error('Failed to fetch voice-over files:', err);
    });
  }, []);

  // Handle file upload via drag and drop
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: {
      'audio/*': ['.mp3', '.wav', '.m4a', '.aac', '.ogg']
    },
    maxFiles: 1,
    onDrop: async (acceptedFiles) => {
      if (acceptedFiles.length === 0) return;
      
      const file = acceptedFiles[0];
      setIsUploading(true);
      
      try {
        const formData = new FormData();
        formData.append('file', file);
        
        const response = await fetch('/api/voiceover/upload', {
          method: 'POST',
          body: formData,
        });
        
        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(errorText || `Server error: ${response.status}`);
        }
        
        const data = await response.json();
        
        if (data.success) {
          toast.success('Voice-over uploaded successfully');
          fetchFiles(); // Refresh file list
        } else {
          toast.error(`Upload failed: ${data.error}`);
        }
      } catch (error) {
        console.error('Error uploading file:', error);
        toast.error('Failed to upload voice-over');
      } finally {
        setIsUploading(false);
      }
    }
  });

  // Handle playing audio
  const handlePlayPause = (file: VoiceOverFile) => {
    if (!audioRef.current) return;
    
    if (selectedFile?.url === file.url && isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      setSelectedFile(file);
      // We need to wait for the audio element to update its src
      setTimeout(() => {
        if (audioRef.current) {
          audioRef.current.play()
            .then(() => setIsPlaying(true))
            .catch(err => {
              console.error('Error playing audio:', err);
              toast.error('Failed to play audio');
            });
        }
      }, 50);
    }
  };

  // Format file size
  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="flex flex-col h-full">
      {/* Upload Area */}
      <div 
        {...getRootProps()} 
        className={`border-2 border-dashed rounded-lg p-4 mb-4 text-center cursor-pointer transition-colors ${
          isDragActive ? 'border-blue-500 bg-blue-50/10' : 'border-gray-300/30 hover:border-gray-300/50'
        }`}
      >
        <input {...getInputProps()} />
        {isUploading ? (
          <div className="flex flex-col items-center justify-center py-2">
            <div className="w-8 h-8 border-2 border-t-blue-500 border-blue-200/30 rounded-full animate-spin mb-2"></div>
            <p className="text-sm text-gray-400">Uploading...</p>
          </div>
        ) : (
          <div className="py-2">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 mx-auto mb-2 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
            <p className="text-sm text-gray-400">
              {isDragActive ? 'Drop the audio file here' : 'Drag & drop an audio file, or click to select'}
            </p>
            <p className="text-xs text-gray-500 mt-1">Supports MP3, WAV, M4A, AAC, OGG</p>
          </div>
        )}
      </div>
      
      {/* Hidden audio element for playback */}
      <audio 
        ref={audioRef} 
        src={selectedFile?.url} 
        className="hidden" 
        onEnded={() => setIsPlaying(false)}
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
      />
      
      {/* File List */}
      <div className="flex-1 overflow-y-auto">
        <h3 className="text-sm font-medium mb-2">Your Voice-Overs</h3>
        {files.length === 0 ? (
          <p className="text-sm text-gray-400 italic">No voice-over files found</p>
        ) : (
          <ul className="space-y-2">
            {files.map((file, index) => (
              <li 
                key={index}
                className={`p-2 rounded-md cursor-pointer transition-colors ${
                  selectedFile?.url === file.url 
                    ? 'bg-blue-500/20 border border-blue-500/30' 
                    : 'hover:bg-gray-700/30 border border-transparent'
                }`}
                onClick={() => handlePlayPause(file)}
              >
                <div className="flex items-center">
                  <div className="mr-3 text-blue-400 cursor-pointer">
                    {selectedFile?.url === file.url && isPlaying ? (
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM7 8a1 1 0 012 0v4a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                    ) : (
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                      </svg>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm truncate">{file.name}</p>
                    <p className="text-xs text-gray-400">
                      {file.size ? formatFileSize(file.size) : 'Unknown size'}
                    </p>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

export default MyUploads;
