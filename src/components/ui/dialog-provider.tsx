"use client";

import React, { createContext, useContext, useState, ReactNode } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface DialogContextType {
  showAlert: (title: string, description: string) => void;
  showConfirm: (
    title: string,
    description: string,
    onConfirm: () => void,
  ) => void;
}

const DialogContext = createContext<DialogContextType | undefined>(undefined);

export function AlertDialogProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [isConfirm, setIsConfirm] = useState(false);
  const [onConfirmCallback, setOnConfirmCallback] = useState<() => void>(
    () => {},
  );

  const showAlert = (alertTitle: string, alertDescription: string) => {
    setTitle(alertTitle);
    setDescription(alertDescription);
    setIsConfirm(false);
    setIsOpen(true);
  };

  const showConfirm = (
    confirmTitle: string,
    confirmDescription: string,
    onConfirm: () => void,
  ) => {
    setTitle(confirmTitle);
    setDescription(confirmDescription);
    setIsConfirm(true);
    setOnConfirmCallback(() => onConfirm);
    setIsOpen(true);
  };

  const handleAction = () => {
    setIsOpen(false);
    if (isConfirm && onConfirmCallback) {
      onConfirmCallback();
    }
  };

  return (
    <DialogContext.Provider value={{ showAlert, showConfirm }}>
      {children}
      <AlertDialog open={isOpen} onOpenChange={setIsOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{title}</AlertDialogTitle>
            <AlertDialogDescription>{description}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            {isConfirm && (
              <AlertDialogCancel onClick={() => setIsOpen(false)}>
                Batal
              </AlertDialogCancel>
            )}
            <AlertDialogAction onClick={handleAction}>
              {isConfirm ? "Ya, Lanjutkan" : "OK"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DialogContext.Provider>
  );
}

export function useDialog() {
  const context = useContext(DialogContext);
  if (!context) {
    throw new Error("useDialog must be used within an AlertDialogProvider");
  }
  return context;
}
