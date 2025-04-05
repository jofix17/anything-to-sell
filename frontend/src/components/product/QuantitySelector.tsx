import React from 'react';

interface QuantitySelectorProps {
  quantity: number;
  onChange: (quantity: number) => void;
  min?: number;
  max?: number;
  className?: string;
}

const QuantitySelector: React.FC<QuantitySelectorProps> = ({
  quantity,
  onChange,
  min = 1,
  max = 99,
  className = '',
}) => {
  const handleDecrease = () => {
    if (quantity > min) {
      onChange(quantity - 1);
    }
  };

  const handleIncrease = () => {
    if (quantity < max) {
      onChange(quantity + 1);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = parseInt(e.target.value, 10);
    
    if (isNaN(newValue)) {
      onChange(min);
    } else {
      onChange(Math.max(min, Math.min(max, newValue)));
    }
  };

  return (
    <div className={`flex items-center h-10 ${className}`}>
      <button
        type="button"
        onClick={handleDecrease}
        disabled={quantity <= min}
        className="w-10 h-full flex items-center justify-center rounded-l-md border border-r-0 border-gray-300 bg-gray-50 text-gray-500 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
        aria-label="Decrease quantity"
      >
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="w-4 h-4">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
        </svg>
      </button>
      
      <input
        type="number"
        min={min}
        max={max}
        value={quantity}
        onChange={handleInputChange}
        className="w-12 h-full border-y border-gray-300 text-center focus:ring-blue-500 focus:border-blue-500 [-moz-appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
        aria-label="Quantity"
      />
      
      <button
        type="button"
        onClick={handleIncrease}
        disabled={quantity >= max}
        className="w-10 h-full flex items-center justify-center rounded-r-md border border-l-0 border-gray-300 bg-gray-50 text-gray-500 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
        aria-label="Increase quantity"
      >
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="w-4 h-4">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
        </svg>
      </button>
    </div>
  );
};

export default QuantitySelector;
