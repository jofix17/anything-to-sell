import { ExclamationCircleIcon } from "@heroicons/react/24/outline";

interface ErrorCardProps {
  message: string;
}

const ErrorCard = ({ message }: ErrorCardProps) => {
  return (
    <div className="text-center py-8">
    <div className="bg-red-50 border border-red-200 rounded-md p-4 max-w-md mx-auto">
      <div className="flex items-start">
        <ExclamationCircleIcon className="h-5 w-5 text-red-400 mt-0.5" />
        <div className="flex-1 text-center">
          <h3 className="text-sm font-medium text-red-800">Error</h3>
          <p className="text-sm text-red-700 mt-2">{message}</p>
          <button
            onClick={() => window.location.reload()}
            className="text-sm font-medium text-indigo-600 hover:text-indigo-500 mt-4"
          >
            Try Again
          </button>
        </div>
        <div className="w-5"></div>
      </div>
    </div>
  </div>
  );
};

export default ErrorCard;
