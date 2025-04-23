import React from "react";
import { Dialog, DialogPanel, DialogTitle } from "@headlessui/react";
import Button from "../common/Button";

export type CartMergeAction = "merge" | "replace" | "keep";

interface CartMergeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAction: (action: CartMergeAction) => void;
  existingCartItemCount: number;
  guestCartItemCount: number;
  isLoading: boolean;
}

const CartMergeModal: React.FC<CartMergeModalProps> = ({
  isOpen,
  onClose,
  onAction,
  existingCartItemCount,
  guestCartItemCount,
  isLoading,
}) => {
  return (
    <Dialog
      open={isOpen}
      onClose={() => {
        // Only allow closing if not loading
        if (!isLoading) onClose();
      }}
      className="relative z-50"
    >
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/30" aria-hidden="true" />

      {/* Full-screen container to center the panel */}
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <DialogPanel className="mx-auto max-w-md rounded-lg bg-white p-6 shadow-xl w-full">
          <DialogTitle className="text-lg font-medium text-gray-900">
            Your Cart Items
          </DialogTitle>

          <div className="mt-4">
            <p className="text-sm text-gray-500">
              You have {guestCartItemCount} item(s) in your guest cart and{" "}
              {existingCartItemCount} item(s) in your existing cart. What would
              you like to do?
            </p>
          </div>

          <div className="mt-6 space-y-3">
            <Button
              type="button"
              variant="primary"
              onClick={() => onAction("merge")}
              fullWidth
              disabled={isLoading}
              loading={isLoading}
              ariaLabel="Merge guest cart items with my existing cart"
            >
              Merge items from both carts
            </Button>

            <Button
              type="button"
              variant="secondary"
              onClick={() => onAction("replace")}
              fullWidth
              disabled={isLoading}
              loading={isLoading}
              ariaLabel="Replace my existing cart with guest cart items"
            >
              Use only guest cart items
            </Button>

            <Button
              type="button"
              variant="outline"
              onClick={() => onAction("keep")}
              fullWidth
              disabled={isLoading}
              loading={isLoading}
              ariaLabel="Keep my existing cart and discard guest cart items"
            >
              Keep my existing cart items only
            </Button>
          </div>

          <div className="mt-4 text-xs text-gray-400 text-center">
            <p>You can always modify your cart items later.</p>
          </div>
        </DialogPanel>
      </div>
    </Dialog>
  );
};

export default CartMergeModal;
