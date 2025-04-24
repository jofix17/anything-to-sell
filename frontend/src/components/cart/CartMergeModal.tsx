import React from "react";
import {
  Dialog,
  DialogPanel,
  DialogTitle,
  Transition,
  TransitionChild,
} from "@headlessui/react";
import { XMarkIcon, ShoppingCartIcon } from "@heroicons/react/24/outline";
import Button from "../common/Button";

// Define the action types for cart merging
export type CartMergeAction = "merge" | "replace" | "keep";

interface CartMergeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAction: (action: CartMergeAction) => Promise<void>;
  existingCartItemCount: number;
  guestCartItemCount: number;
  isLoading: boolean;
}

/**
 * Modal component that appears when a user logs in with both a guest cart
 * and an existing user cart, allowing them to choose how to handle the merge.
 */
const CartMergeModal: React.FC<CartMergeModalProps> = ({
  isOpen,
  onClose,
  onAction,
  existingCartItemCount,
  guestCartItemCount,
  isLoading,
}) => {
  return (
    <Transition show={isOpen} as={React.Fragment}>
      <Dialog
        as="div"
        className="relative z-50"
        onClose={() => !isLoading && onClose()}
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
          <div className="fixed inset-0 bg-black/30" />
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
                    className="text-lg font-medium leading-6 text-gray-900"
                  >
                    We found your shopping carts
                  </DialogTitle>
                  <button
                    type="button"
                    className="text-gray-400 hover:text-gray-500"
                    onClick={() => !isLoading && onClose()}
                    disabled={isLoading}
                  >
                    <span className="sr-only">Close</span>
                    <XMarkIcon className="h-6 w-6" aria-hidden="true" />
                  </button>
                </div>

                <div className="mt-2">
                  <div className="text-sm text-gray-600">
                    <p className="mb-4">
                      We found items in your guest cart and in your existing
                      account cart. What would you like to do?
                    </p>

                    <div className="flex items-center justify-between mb-2 p-3 bg-indigo-50 rounded-md">
                      <div className="flex items-center">
                        <ShoppingCartIcon className="h-5 w-5 text-indigo-600 mr-2" />
                        <span>Your account cart</span>
                      </div>
                      <span className="font-medium">
                        {existingCartItemCount} items
                      </span>
                    </div>

                    <div className="flex items-center justify-between p-3 bg-green-50 rounded-md">
                      <div className="flex items-center">
                        <ShoppingCartIcon className="h-5 w-5 text-green-600 mr-2" />
                        <span>Your guest cart</span>
                      </div>
                      <span className="font-medium">
                        {guestCartItemCount} items
                      </span>
                    </div>
                  </div>
                </div>

                <div className="mt-6 space-y-3">
                  <Button
                    variant="primary"
                    fullWidth
                    onClick={() => onAction("merge")}
                    disabled={isLoading}
                    loading={isLoading}
                  >
                    Merge both carts
                    <span className="block text-xs opacity-80 font-normal mt-1">
                      Combine items from both carts
                    </span>
                  </Button>

                  <Button
                    variant="secondary"
                    fullWidth
                    onClick={() => onAction("replace")}
                    disabled={isLoading}
                  >
                    Use guest cart only
                    <span className="block text-xs opacity-80 font-normal mt-1">
                      Replace your account cart with guest cart items
                    </span>
                  </Button>

                  <Button
                    variant="outline"
                    fullWidth
                    onClick={() => onAction("keep")}
                    disabled={isLoading}
                  >
                    Keep account cart
                    <span className="block text-xs opacity-80 font-normal mt-1">
                      Discard guest cart items
                    </span>
                  </Button>
                </div>
              </DialogPanel>
            </TransitionChild>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
};

export default CartMergeModal;
