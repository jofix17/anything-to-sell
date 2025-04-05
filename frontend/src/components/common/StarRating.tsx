import React from 'react';

interface StarRatingProps {
  rating: number;
  size?: 'small' | 'medium' | 'large';
  showLabel?: boolean;
  className?: string;
}

const StarRating: React.FC<StarRatingProps> = ({
  rating,
  size = 'medium',
  showLabel = true,
  className = '',
}) => {
  // Round to nearest half star
  const roundedRating = Math.round(rating * 2) / 2;
  
  // Determine star size based on prop
  const starSize = {
    small: 'w-3 h-3',
    medium: 'w-5 h-5',
    large: 'w-6 h-6',
  }[size];
  
  // Determine label size based on star size
  const labelSize = {
    small: 'text-xs',
    medium: 'text-sm',
    large: 'text-base',
  }[size];

  // Create an array of 5 stars
  const stars = Array.from({ length: 5 }, (_, index) => {
    const starValue = index + 1;
    let starType: 'full' | 'half' | 'empty';
    
    if (roundedRating >= starValue) {
      starType = 'full';
    } else if (roundedRating + 0.5 === starValue) {
      starType = 'half';
    } else {
      starType = 'empty';
    }
    
    return { starValue, starType };
  });

  return (
    <div className={`flex items-center ${className}`}>
      <div className="flex items-center">
        {stars.map(({ starValue, starType }) => (
          <span key={starValue} className="relative inline-block">
            {/* Empty Star (Background) */}
            <svg 
              className={`${starSize} text-gray-300`} 
              fill="currentColor" 
              viewBox="0 0 24 24"
            >
              <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
            </svg>
            
            {/* Colored Star (Foreground) */}
            {starType !== 'empty' && (
              <svg 
                className={`${starSize} text-yellow-400 absolute top-0 left-0`} 
                fill="currentColor" 
                viewBox="0 0 24 24"
                style={starType === 'half' ? { clipPath: 'inset(0 50% 0 0)' } : {}}
              >
                <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
              </svg>
            )}
          </span>
        ))}
      </div>
      
      {showLabel && (
        <span className={`ml-1 font-medium ${labelSize} text-gray-700`}>
          {rating.toFixed(1)}
        </span>
      )}
    </div>
  );
};

export default StarRating;
