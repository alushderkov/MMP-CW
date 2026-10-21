"use client";

import { createContext, useContext } from "react";

export type CabinetUser = {
  id: string;
  name: string;
  email: string;
  nativeLanguage: string;
  targetLanguage: string;
};

type Value = {
  user: CabinetUser | null;
  setUser: (user: CabinetUser) => void;
};

export const CabinetContext = createContext<Value>({ user: null, setUser: () => undefined });

export function useCabinet() {
  return useContext(CabinetContext);
}
