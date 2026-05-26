"use client";

import React, { useState } from "react";

interface OptimizedImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src: string;
  width?: number;
  quality?: number;
  alt: string;
  aspectRatio?: string; // CSS aspect-ratio e.g. "16/9", "1/1", "4/5"
  imgClassName?: string; // Custom className for the inner img element (default: 'object-cover')
  transparent?: boolean; // If true, disables the loading placeholder background color (for transparent logos/icons)
}

export default function OptimizedImage({
  src,
  width,
  quality = 80,
  alt,
  className = "",
  aspectRatio,
  imgClassName = "object-cover",
  style,
  transparent = false,
  ...props
}: OptimizedImageProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  const imgRef = React.useRef<HTMLImageElement>(null);

  // Check if the browser already finished loading the image from cache before React hydration finished
  React.useEffect(() => {
    if (imgRef.current && imgRef.current.complete) {
      setIsLoaded(true);
    }
  }, []);

  // SVGs or data URLs are already optimized/vector and don't need resizing/compression
  const isSvgOrData = src.startsWith("data:") || src.endsWith(".svg") || src.startsWith("http");

  // Endpoint URLs
  const optimizedSrc = isSvgOrData
    ? src
    : `/api/image?url=${encodeURIComponent(src)}${width ? `&w=${width}` : ""}&q=${quality}`;

  const placeholderSrc = isSvgOrData
    ? src
    : `/api/image?url=${encodeURIComponent(src)}&w=32&q=10`;

  const containerStyle: React.CSSProperties = {
    position: "relative",
    overflow: "hidden",
    aspectRatio: aspectRatio,
    backgroundColor: transparent ? "transparent" : "rgba(46, 77, 37, 0.05)", // Very subtle green tint matching brand brand-primary-green
    ...style,
  };

  return (
    <div className={`optimized-image-container ${className}`} style={containerStyle}>
      {/* Low-Quality Image Placeholder (LQIP) */}
      {!isSvgOrData && (
        <img
          src={placeholderSrc}
          alt=""
          aria-hidden="true"
          className={`absolute inset-0 w-full h-full blur-md scale-105 transition-opacity duration-300 pointer-events-none ${imgClassName}`}
          style={{
            opacity: isLoaded ? 0 : 1,
            zIndex: 1,
          }}
        />
      )}

      {/* Main Optimized Image */}
      <img
        ref={imgRef}
        src={optimizedSrc}
        alt={alt}
        onLoad={() => setIsLoaded(true)}
        loading="lazy"
        className={`w-full h-full transition-opacity duration-500 ${imgClassName}`}
        style={{
          opacity: isLoaded ? 1 : 0,
          position: "relative",
          zIndex: isLoaded ? 2 : 0, // Ensure it is clickable/interactive only when loaded
        }}
        {...props}
      />
    </div>
  );
}
