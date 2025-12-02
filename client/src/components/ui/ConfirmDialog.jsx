/**
 * ConfirmDialog Component
 * Custom themed confirmation dialog matching the application UI
 */

import React from 'react';
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import {
  Dialog,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { cn } from "@/lib/utils";

const ConfirmDialog = ({ 
  open, 
  onOpenChange, 
  title, 
  description, 
  onConfirm, 
  onCancel,
  confirmText = 'OK',
  cancelText = 'Cancel',
  variant = 'default' // 'default' or 'destructive'
}) => {
  const handleConfirm = () => {
    onConfirm?.();
    onOpenChange(false);
  };

  const handleCancel = () => {
    onCancel?.();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-black/80" />
        <DialogPrimitive.Content
          className={cn(
            "fixed left-[50%] top-[50%] z-50 grid w-full max-w-md translate-x-[-50%] translate-y-[-50%] gap-4 border bg-[#3d3635] border-[#4d4443] text-white p-6 shadow-lg sm:rounded-lg"
          )}
        >
        <DialogHeader>
          <DialogTitle className="text-white text-lg font-semibold">
            {title}
          </DialogTitle>
          {description && (
            <DialogDescription className="text-gray-200 text-sm mt-2">
              {description}
            </DialogDescription>
          )}
        </DialogHeader>
        
        <DialogFooter className="mt-6 flex gap-3 sm:gap-3">
          <Button
            onClick={handleConfirm}
            className={`
              flex-1 font-medium transition-all rounded-full
              ${variant === 'destructive' 
                ? 'bg-[#BA7967] hover:bg-[#a66858] text-white' 
                : 'bg-[#BA7967] hover:bg-[#a66858] text-white'
              }
            `}
          >
            {confirmText}
          </Button>
          
          <Button
            onClick={handleCancel}
            className="flex-1 bg-[#5a5251] hover:bg-[#4a4241] text-white font-medium transition-all rounded-full"
          >
            {cancelText}
          </Button>
        </DialogFooter>
        <DialogPrimitive.Close className="absolute right-4 top-4 rounded-sm opacity-70 hover:opacity-100 focus:outline-none">
          <X className="h-4 w-4 text-gray-300" />
          <span className="sr-only">Close</span>
        </DialogPrimitive.Close>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </Dialog>
  );
};

export default ConfirmDialog;
