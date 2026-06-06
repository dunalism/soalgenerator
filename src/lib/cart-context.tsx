"use client";

import React, { createContext, useContext, useState, useEffect } from "react";

export interface CartOption {
  id: string;
  optionText: string;
  isCorrect: boolean;
}

export interface CartItem {
  id: string;
  questionText: string;
  type: "MULTIPLE_CHOICE" | "TRUE_FALSE" | "SHORT_ANSWER";
  options: CartOption[];
  answerKey: string;
  assessmentId: string;
  assessmentTextSnippet?: string;
}

interface CartContextType {
  selectedQuestions: CartItem[];
  toggleQuestion: (question: CartItem) => void;
  clearCart: () => void;
  isSelected: (id: string) => boolean;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [selectedQuestions, setSelectedQuestions] = useState<CartItem[]>(() => {
    if (typeof window !== "undefined") {
      try {
        const stored = localStorage.getItem("remix_soal_cart");
        return stored ? JSON.parse(stored) : [];
      } catch (e) {
        console.error("Gagal memuat keranjang soal:", e);
      }
    }
    return [];
  });

  // Save to local storage
  useEffect(() => {
    try {
      localStorage.setItem(
        "remix_soal_cart",
        JSON.stringify(selectedQuestions),
      );
    } catch (e) {
      console.error("Gagal menyimpan keranjang soal:", e);
    }
  }, [selectedQuestions]);

  const toggleQuestion = (question: CartItem) => {
    setSelectedQuestions((prev) => {
      const exists = prev.some((item) => item.id === question.id);
      if (exists) {
        return prev.filter((item) => item.id !== question.id);
      } else {
        return [...prev, question];
      }
    });
  };

  const clearCart = () => {
    setSelectedQuestions([]);
  };

  const isSelected = (id: string) => {
    return selectedQuestions.some((item) => item.id === id);
  };

  return (
    <CartContext.Provider
      value={{
        selectedQuestions,
        toggleQuestion,
        clearCart,
        isSelected,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
}
