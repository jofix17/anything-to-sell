import React, { useState } from 'react';

interface ProductImageGalleryProps {
  images: string[];
  productName: string;
}

const ProductImageGallery: React.FC<ProductImageGalleryProps> = ({ images, productName }) => {
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);

  // If no images are provided, show a placeholder
  if (!images.length) {
    return (
      <div className="aspect-square bg-gray-200 rounded-lg flex items-center justify-center">
        <span className="text-gray-500">No image available</span>
      </div>
    );
  }

  const openLightbox = (index: number) => {
    setSelectedImageIndex(index);
    setIsLightboxOpen(true);
  };

  const closeLightbox = () => {
    setIsLightboxOpen(false);
  };

  const navigateLightbox = (direction: 'prev' | 'next') => {
    if (direction === 'prev') {
      setSelectedImageIndex((prevIndex) => (
        prevIndex === 0 ? images.length - 1 : prevIndex - 1
      ));
    } else {
      setSelectedImageIndex((prevIndex) => (
        prevIndex === images.length - 1 ? 0 : prevIndex + 1
      ));
    }
  };

  return (
    <div className="space-y-4">
      {/* Main Image */}
      <div 
        className="aspect-square overflow-hidden rounded-lg bg-gray-100 cursor-zoom-in"
        onClick={() => openLightbox(selectedImageIndex)}
      >
        <img
          src={images[selectedImageIndex]}
          alt={`${productName} - Image ${selectedImageIndex + 1}`}
          className="h-full w-full object-cover object-center"
        />
      </div>

      {/* Thumbnail Gallery */}
      {images.length > 1 && (
        <div className="grid grid-cols-4 gap-2">
          {images.map((image, index) => (
            <button
              key={index}
              type="button"
              onClick={() => setSelectedImageIndex(index)}
              className={`relative aspect-square overflow-hidden rounded-md bg-gray-100 hover:ring-2 hover:ring-blue-500 ${
                selectedImageIndex === index 
                  ? 'ring-2 ring-blue-600' 
                  : 'ring-1 ring-gray-200'
              }`}
            >
              <img
                src={image}
                alt={`${productName} - Thumbnail ${index + 1}`}
                className="h-full w-full object-cover object-center"
              />
            </button>
          ))}
        </div>
      )}

      {/* Image Lightbox */}
      {isLightboxOpen && (
        <div className="fixed inset-0 z-50 bg-black bg-opacity-95 flex items-center justify-center">
          <button
            type="button"
            onClick={closeLightbox}
            className="absolute top-4 right-4 p-2 text-white hover:text-gray-300"
            aria-label="Close lightbox"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="w-8 h-8">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
          <button
            type="button"
            onClick={() => navigateLightbox('prev')}
            className="absolute left-4 top-1/2 transform -translate-y-1/2 p-2 text-white hover:text-gray-300"
            aria-label="Previous image"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="w-8 h-8">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <div className="max-h-[90vh] max-w-[90vw]">
            <img
              src={images[selectedImageIndex]}
              alt={`${productName} - Full size ${selectedImageIndex + 1}`}
              className="max-h-full max-w-full object-contain"
            />
          </div>
          <button
            type="button"
            onClick={() => navigateLightbox('next')}
            className="absolute right-4 top-1/2 transform -translate-y-1/2 p-2 text-white hover:text-gray-300"
            aria-label="Next image"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="w-8 h-8">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
          <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2">
            <div className="flex space-x-2">
              {images.map((_, index) => (
                <button
                  key={index}
                  type="button"
                  onClick={() => setSelectedImageIndex(index)}
                  className={`w-2 h-2 rounded-full ${
                    selectedImageIndex === index 
                      ? 'bg-white' 
                      : 'bg-gray-400'
                  }`}
                  aria-label={`View image ${index + 1}`}
                />
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductImageGallery;
