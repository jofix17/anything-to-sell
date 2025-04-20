import { useEffect, RefObject } from 'react';

/**
 * Custom hook to detect clicks outside of a referenced element
 * 
 * @param ref - Reference to the DOM element to monitor for outside clicks
 * @param callback - Function to call when a click outside is detected
 */
const useOutsideClick = <T extends HTMLElement = HTMLElement>(
  ref: RefObject<T | null>,
  callback: () => void
): void => {
  useEffect(() => {
    // Define the handler that will check if the click is outside the referenced element
    const handleClickOutside = (event: MouseEvent): void => {
      // If the click is outside the referenced element, call the callback function
      if (ref.current && !ref.current.contains(event.target as Node)) {
        callback();
      }
    };

    // Add the event listener to the document
    document.addEventListener('mousedown', handleClickOutside);
    
    // Cleanup function to remove the event listener when the component unmounts
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [ref, callback]); // Only re-run if ref or callback changes
};

export default useOutsideClick;