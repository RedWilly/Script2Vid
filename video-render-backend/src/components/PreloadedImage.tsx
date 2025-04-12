import React, { useEffect, useState } from 'react';
import { continueRender, delayRender, Img } from 'remotion';

interface PreloadedImageProps {
  src: string;
  style?: React.CSSProperties;
}

/**
 * PreloadedImage Component
 * Ensures images are fully loaded before rendering to prevent flickering
 */
export const PreloadedImage: React.FC<PreloadedImageProps> = ({
  src,
  style = {}
}) => {
  const [handle] = useState(() => delayRender('Loading image'));
  const [imageLoaded, setImageLoaded] = useState(false);
  
  // Preload the image
  useEffect(() => {
    const img = new Image();
    img.onload = () => {
      setImageLoaded(true);
      continueRender(handle);
    };
    img.onerror = () => {
      console.error(`Failed to load image: ${src}`);
      continueRender(handle);
    };
    img.src = src;
    
    // If the image is already cached, it might have loaded before we set the onload handler
    if (img.complete) {
      setImageLoaded(true);
      continueRender(handle);
    }
    
    return () => {
      img.onload = null;
      img.onerror = null;
    };
  }, [src, handle]);
  
  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        position: 'absolute',
        top: 0,
        left: 0,
        backgroundColor: 'black', // Add background color to avoid transparency issues
        ...style
      }}
    >
      {imageLoaded && (
        <Img
          src={src}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
          }}
        />
      )}
    </div>
  );
};
