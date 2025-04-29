import React, { InputHTMLAttributes } from "react";

export interface TextInputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  id?: string;
  fullWidth?: boolean;
  name: string;
}

/**
 * TextInput component for form inputs with label, error state, and helper text
 * Compatible with both direct use and Formik
 */
const TextInput: React.FC<TextInputProps> = ({
  label,
  error,
  helperText,
  id,
  type = "text",
  className = "",
  fullWidth = true,
  disabled = false,
  name,
  ...props
}) => {
  // Generate a unique ID if not provided
  const inputId = id || `input-${name}`;
  
  // Determine input classes based on state
  const inputClasses = `
    block w-full px-4 py-2 
    rounded-md border 
    focus:outline-none focus:ring-2 focus:ring-indigo-500 
    transition duration-150 ease-in-out
    ${error ? "border-red-500 focus:border-red-500" : "border-gray-300 focus:border-indigo-500"}
    ${disabled ? "bg-gray-100 text-gray-500 cursor-not-allowed" : "bg-white"}
    ${className}
  `;

  return (
    <div className={`mb-4 ${fullWidth ? "w-full" : ""}`}>
      {label && (
        <label
          htmlFor={inputId}
          className="block text-sm font-medium text-gray-700 mb-1"
        >
          {label}
        </label>
      )}
      
      <div className="relative">
        <input
          id={inputId}
          name={name}
          type={type}
          className={inputClasses}
          disabled={disabled}
          {...props}
        />
      </div>
      
      {error && (
        <p className="mt-1 text-sm text-red-600">{error}</p>
      )}
      
      {helperText && !error && (
        <p className="mt-1 text-sm text-gray-500">{helperText}</p>
      )}
    </div>
  );
};

export default TextInput;