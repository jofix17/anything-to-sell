import React from "react";

interface ErrorMessageProps {
  message?: string;
  onRetry: () => void;
}

const ErrorMessage: React.FC<ErrorMessageProps> = ({ message, onRetry }) => {
  return (
    <div className="flex flex-col items-center justify-center h-64">
      <p className="text-red-600 mb-4">{message || "Error in getting your data"}</p>
      <button
        onClick={onRetry}
        className="bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700"
      >
        Try Again
      </button>
    </div>
  );
};

export default ErrorMessage;
