'use client';

import type { ReactNode } from 'react';
import { createContext, useContext, useState, useCallback } from 'react';

export interface GeneratedImage {
  id: string;
  src: string;
  prompt: string;
  params: {
    lens: string;
    time: string;
    weather: string;
    direction: string;
    location: string;
  };
  createdAt: Date;
}

interface AppContextType {
  isAuthenticated: boolean;
  login: () => void;
  logout: () => void;
  images: GeneratedImage[];
  addImage: (image: Omit<GeneratedImage, 'id' | 'createdAt'>) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [images, setImages] = useState<GeneratedImage[]>([]);

  const login = useCallback(() => {
    setIsAuthenticated(true);
  }, []);

  const logout = useCallback(() => {
    setIsAuthenticated(false);
    setImages([]); // Also clear images on logout
  }, []);

  const addImage = useCallback((image: Omit<GeneratedImage, 'id' | 'createdAt'>) => {
    setImages(prevImages => [
      { ...image, id: new Date().toISOString() + Math.random(), createdAt: new Date() },
      ...prevImages
    ]);
  }, []);

  return (
    <AppContext.Provider value={{ images, addImage, isAuthenticated, login, logout }}>
      {children}
    </AppContext.Provider>
  );
}

export function useAppContext() {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
}
