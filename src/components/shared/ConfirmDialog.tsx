"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  description: string;
  onConfirm: () => void;
  onCancel: () => void;
  loading?: boolean;
  variant?: "danger" | "default";
}

export function ConfirmDialog({
  open,
  title,
  description,
  onConfirm,
  onCancel,
  loading,
  variant = "default",
}: ConfirmDialogProps) {
  return (
    <Dialog open={open} onOpenChange={(o) => !o && onCancel()}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <div className="flex gap-3 pt-2">
          <Button variant="secondary" className="flex-1" onClick={onCancel}>
            Cancelar
          </Button>
          <Button
            variant={variant === "danger" ? "danger" : "default"}
            className={`flex-1 ${variant === "danger" ? "!bg-red-500 !text-white hover:!bg-red-600" : ""}`}
            onClick={onConfirm}
            loading={loading}
          >
            Confirmar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
