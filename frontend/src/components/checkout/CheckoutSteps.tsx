const CheckoutSteps: React.FC<{ currentStep: number }> = ({ currentStep }) => {
  return (
    <div className="mb-8">
      <div className="flex items-center">
        <div
          className={`h-10 w-10 rounded-full flex items-center justify-center ${
            currentStep === 1
              ? "bg-indigo-600 text-white"
              : "bg-gray-200 text-gray-700"
          }`}
        >
          1
        </div>
        <div className="flex-1 h-1 mx-4 bg-gray-200">
          <div
            className={`h-full ${
              currentStep >= 2 ? "bg-indigo-600" : "bg-gray-200"
            }`}
            style={{ width: currentStep >= 2 ? "100%" : "0%" }}
          ></div>
        </div>
        <div
          className={`h-10 w-10 rounded-full flex items-center justify-center ${
            currentStep === 2
              ? "bg-indigo-600 text-white"
              : "bg-gray-200 text-gray-700"
          }`}
        >
          2
        </div>
      </div>
      <div className="flex justify-between mt-2">
        <span className="text-sm font-medium">Shipping & Billing</span>
        <span className="text-sm font-medium">Payment</span>
      </div>
    </div>
  );
};

export default CheckoutSteps;
