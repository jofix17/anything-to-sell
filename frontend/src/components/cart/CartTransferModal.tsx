import React, { useState } from "react";
import {
  Dialog,
  DialogPanel,
  DialogTitle,
  Transition,
  TransitionChild,
} from "@headlessui/react";
import { XMarkIcon } from "@heroicons/react/24/outline";
import { CartTransferAction } from "../../types/cart";

interface CartTransferModalProps {
  isOpen: boolean;
  onClose: () => void;
  onTransfer: (action: CartTransferAction) => Promise<boolean>;
  guestItemCount: number;
  userItemCount: number;
}

export const CartTransferModal: React.FC<CartTransferModalProps> = ({
  isOpen,
  onClose,
  onTransfer,
  guestItemCount,
  userItemCount,
}) => {
  const [transferAction, setTransferAction] =
    useState<CartTransferAction>("merge");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleTransfer = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const success = await onTransfer(transferAction);

      if (!success) {
        setError("Transfer failed. Please try again.");
      }
    } catch (err) {
      console.error("Error during cart transfer:", err);
      setError("An unexpected error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  // Helper function to explain transfer action in user-friendly terms
  const getActionDescription = (action: CartTransferAction): string => {
    switch (action) {
      case "merge":
        return "Add guest cart items to your existing cart (keeps duplicates)";
      case "replace":
        return "Replace your current cart with the guest cart items";
      case "copy":
        return "Add guest cart items and keep both carts active";
      default:
        return "";
    }
  };

  return (
    <Transition appear show={isOpen} as={React.Fragment}>
      <Dialog
        as="div"
        className="relative z-50"
        onClose={isLoading ? () => {} : onClose}
      >
        <TransitionChild
          as={React.Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/25" />
        </TransitionChild>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4 text-center">
            <TransitionChild
              as={React.Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <DialogPanel className="w-full max-w-md transform overflow-hidden rounded-lg bg-white p-6 text-left align-middle shadow-xl transition-all">
                <div className="flex items-center justify-between mb-4">
                  <DialogTitle
                    as="h3"
                    className="text-lg font-semibold text-gray-900"
                  >
                    Cart Transfer Options
                  </DialogTitle>

                  <button
                    type="button"
                    className="text-gray-400 hover:text-gray-500"
                    onClick={isLoading ? undefined : onClose}
                    disabled={isLoading}
                  >
                    <span className="sr-only">Close</span>
                    <XMarkIcon className="h-6 w-6" aria-hidden="true" />
                  </button>
                </div>

                <p className="text-sm text-gray-500 mb-4">
                  We found items in two different shopping carts. How would you
                  like to handle them?
                </p>

                <div className="mb-4 p-3 bg-gray-50 rounded-md">
                  <p className="text-sm font-medium text-gray-700 mb-1">
                    Cart Details:
                  </p>
                  <div className="flex justify-between">
                    <p className="text-sm text-gray-600">
                      Guest Cart: {guestItemCount} items
                    </p>
                    <p className="text-sm text-gray-600">
                      Your Cart: {userItemCount} items
                    </p>
                  </div>
                </div>

                <div className="border-t border-gray-200 my-4"></div>

                <div className="space-y-3">
                  <p className="text-sm font-medium text-gray-700 mb-1">
                    Choose an option:
                  </p>

                  <div className="space-y-3">
                    <div className="flex items-start">
                      <div className="flex h-5 items-center">
                        <input
                          id="merge"
                          name="transferAction"
                          type="radio"
                          value="merge"
                          className="h-4 w-4 border-gray-300 text-indigo-600 focus:ring-indigo-500"
                          checked={transferAction === "merge"}
                          onChange={() => setTransferAction("merge")}
                          disabled={isLoading}
                        />
                      </div>
                      <div className="ml-3 text-sm">
                        <label
                          htmlFor="merge"
                          className="font-medium text-gray-700"
                        >
                          Merge Carts
                        </label>
                        <p className="text-gray-500">
                          {getActionDescription("merge")}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start">
                      <div className="flex h-5 items-center">
                        <input
                          id="replace"
                          name="transferAction"
                          type="radio"
                          value="replace"
                          className="h-4 w-4 border-gray-300 text-indigo-600 focus:ring-indigo-500"
                          checked={transferAction === "replace"}
                          onChange={() => setTransferAction("replace")}
                          disabled={isLoading}
                        />
                      </div>
                      <div className="ml-3 text-sm">
                        <label
                          htmlFor="replace"
                          className="font-medium text-gray-700"
                        >
                          Replace Your Cart
                        </label>
                        <p className="text-gray-500">
                          {getActionDescription("replace")}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start">
                      <div className="flex h-5 items-center">
                        <input
                          id="copy"
                          name="transferAction"
                          type="radio"
                          value="copy"
                          className="h-4 w-4 border-gray-300 text-indigo-600 focus:ring-indigo-500"
                          checked={transferAction === "copy"}
                          onChange={() => setTransferAction("copy")}
                          disabled={isLoading}
                        />
                      </div>
                      <div className="ml-3 text-sm">
                        <label
                          htmlFor="copy"
                          className="font-medium text-gray-700"
                        >
                          Keep Both Carts
                        </label>
                        <p className="text-gray-500">
                          {getActionDescription("copy")}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {error && (
                  <div className="mt-4 p-3 bg-red-50 text-red-700 rounded-md text-sm">
                    {error}
                  </div>
                )}

                <div className="mt-6 flex justify-end gap-3">
                  <button
                    type="button"
                    className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                    onClick={onClose}
                    disabled={isLoading}
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    className="inline-flex justify-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                    onClick={handleTransfer}
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <>
                        <svg
                          className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                          xmlns="http://www.w3.org/2000/svg"
                          fill="none"
                          viewBox="0 0 24 24"
                        >
                          <circle
                            className="opacity-25"
                            cx="12"
                            cy="12"
                            r="10"
                            stroke="currentColor"
                            strokeWidth="4"
                          ></circle>
                          <path
                            className="opacity-75"
                            fill="currentColor"
                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                          ></path>
                        </svg>
                        Processing..
                      </>
                    ) : (
                      "Apply"
                    )}
                  </button>
                </div>
              </DialogPanel>
            </TransitionChild>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
};
