import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MagnifyingGlassIcon as SearchIcon, XMarkIcon as XIcon } from "@heroicons/react/24/outline";

interface SearchBarProps {
  onClose: () => void;
}

const SearchBar: React.FC<SearchBarProps> = ({ onClose }) => {
  const [searchQuery, setSearchQuery] = useState<string>('');
  const navigate = useNavigate();

  // Handle search submission
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/products?query=${encodeURIComponent(searchQuery)}`);
      onClose();
      setSearchQuery('');
    }
  };

  return (
    <div className="absolute right-0 top-full mt-2 w-64 sm:w-80 bg-white rounded-md shadow-lg p-2 z-50">
      <form onSubmit={handleSearch}>
        <div className="relative">
          <input
            type="text"
            placeholder="Search for products..."
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            autoFocus
          />
          <div className="absolute inset-y-0 left-0 flex items-center pl-3">
            <SearchIcon className="w-5 h-5 text-gray-400" />
          </div>
          <button
            type="button"
            onClick={onClose}
            className="absolute inset-y-0 right-0 flex items-center pr-3"
            aria-label="Close search"
          >
            <XIcon className="w-5 h-5 text-gray-400 hover:text-gray-600" />
          </button>
        </div>
      </form>
    </div>
  );
};

export default SearchBar;