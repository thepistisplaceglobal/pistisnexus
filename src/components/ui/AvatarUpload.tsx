import React, { useRef, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Camera, Upload, Image as ImageIcon, X, Loader2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAppStore } from '@/store/useAppStore';

interface AvatarUploadProps {
  currentAvatarUrl: string;
  fullName: string;
  onUploadSuccess: (url: string) => void;
  onUploadError: (err: string) => void;
}

export const AvatarUpload: React.FC<AvatarUploadProps> = ({
  currentAvatarUrl,
  fullName,
  onUploadSuccess,
  onUploadError,
}) => {
  const [showOptions, setShowOptions] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const { user } = useAppStore();

  const handleUpload = async (file: File) => {
    setShowOptions(false);
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      onUploadError('Please select a valid image file.');
      return;
    }

    if (file.size > 5 * 1024 * 1024) { // 5MB limit
      onUploadError('Image size exceeds 5MB limit.');
      return;
    }

    setIsUploading(true);

    try {
      const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
      const uploadPreset = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;

      if (!cloudName || !uploadPreset) {
        throw new Error('Cloudinary configuration missing. Please check .env file.');
      }

      const formData = new FormData();
      formData.append('file', file);
      formData.append('upload_preset', uploadPreset);

      const response = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error?.message || 'Upload to Cloudinary failed.');
      }

      const uploadUrl = data.secure_url;

      // Update Supabase Database
      if (user?.id) {
        const { error: dbError } = await supabase
          .from('profiles')
          .update({ avatar_url: uploadUrl })
          .eq('id', user.id);

        if (dbError) throw dbError;
      }

      onUploadSuccess(uploadUrl);
    } catch (error: any) {
      console.error('Upload error:', error);
      onUploadError(error.message || 'An error occurred while uploading. Please try again.');
    } finally {
      setIsUploading(false);
      // Reset inputs
      if (fileInputRef.current) fileInputRef.current.value = '';
      if (cameraInputRef.current) cameraInputRef.current.value = '';
    }
  };

  const onFileSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleUpload(e.target.files[0]);
    }
  };

  const getInitials = () => {
    if (fullName) return fullName.charAt(0).toUpperCase();
    return '?';
  };

  return (
    <>
      <div className="relative group cursor-pointer" onClick={() => !isUploading && setShowOptions(true)}>
        <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-royal-purple via-lilac to-emerald-400 p-0.5 shadow-[0_0_20px_rgba(120,81,169,0.3)] shrink-0 transition-transform duration-200 group-active:scale-95">
          <div className="w-full h-full bg-[#0a0214] rounded-[14px] flex items-center justify-center font-bold text-2xl text-white overflow-hidden relative">
            {currentAvatarUrl ? (
              <img src={currentAvatarUrl} alt={fullName} className="w-full h-full object-cover" />
            ) : (
              getInitials()
            )}
            
            {/* Overlay for hovering/loading */}
            <div className={`absolute inset-0 bg-black/40 flex flex-col items-center justify-center transition-opacity ${isUploading ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
              {isUploading ? (
                <Loader2 className="w-6 h-6 text-emerald-400 animate-spin" />
              ) : (
                <Camera className="w-6 h-6 text-white" />
              )}
            </div>
          </div>
        </div>
        
        {/* Floating edit indicator */}
        {!isUploading && (
          <div className="absolute -bottom-2 -right-2 bg-royal-purple border-2 border-[#120524] text-white p-1.5 rounded-full shadow-lg">
            <Camera className="w-3.5 h-3.5" />
          </div>
        )}
      </div>

      {/* Hidden file inputs */}
      <input 
        type="file" 
        ref={fileInputRef} 
        onChange={onFileSelected} 
        accept="image/*" 
        className="hidden" 
      />
      <input 
        type="file" 
        ref={cameraInputRef} 
        onChange={onFileSelected} 
        accept="image/*" 
        capture="environment" 
        className="hidden" 
      />

      {/* Apple-like Action Sheet Bottom Modal */}
      <AnimatePresence>
        {showOptions && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="fixed inset-0 bg-black/40 backdrop-blur-md z-[100]"
              onClick={() => setShowOptions(false)}
            />
            <motion.div 
              drag="y"
              dragConstraints={{ top: 0, bottom: 0 }}
              dragElastic={{ top: 0.05, bottom: 0.95 }}
              onDragEnd={(_, info) => {
                if (info.offset.y > 50 || info.velocity.y > 400) setShowOptions(false);
              }}
              initial={{ opacity: 0, y: "100%" }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 350 }}
              className="fixed bottom-0 left-0 right-0 bg-[#0e0420]/95 backdrop-blur-2xl border-t border-white/10 rounded-t-[24px] px-4 pt-4 pb-[calc(16px+env(safe-area-inset-bottom))] shadow-2xl z-[101] max-w-md mx-auto touch-pan-y"
            >
              <div className="w-12 h-1.5 bg-white/20 rounded-full mx-auto mb-6 cursor-grab active:cursor-grabbing" />
              
              <div className="px-2 mb-2">
                <h3 className="text-white font-semibold text-center mb-1">Update Profile Picture</h3>
                <p className="text-lilac/60 text-xs text-center">Supported formats: JPG, PNG, GIF</p>
              </div>

              <div className="bg-white/5 rounded-2xl overflow-hidden mt-6 flex flex-col divide-y divide-white/5">
                <button 
                  onClick={() => cameraInputRef.current?.click()}
                  className="bg-transparent hover:bg-white/10 text-emerald-400 font-medium py-4 px-4 text-center transition-colors flex items-center justify-center gap-2"
                >
                  <Camera className="w-5 h-5" />
                  Take Photo
                </button>
                <button 
                  onClick={() => fileInputRef.current?.click()}
                  className="bg-transparent hover:bg-white/10 text-white font-medium py-4 px-4 text-center transition-colors flex items-center justify-center gap-2"
                >
                  <ImageIcon className="w-5 h-5 text-lilac" />
                  Choose from Library
                </button>
              </div>
              
              <button 
                onClick={() => setShowOptions(false)}
                className="w-full mt-3 bg-white/5 hover:bg-white/10 rounded-2xl text-white font-bold py-4 transition-colors"
              >
                Cancel
              </button>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
};
