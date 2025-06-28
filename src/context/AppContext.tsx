
'use client';

import type { ReactNode } from 'react';
import { createContext, useContext, useState, useCallback } from 'react';

export interface GeneratedImage {
  id: string;
  src: string;
  prompt: string;
  type: 'Cinematic Shot' | 'Scene Plan';
  params?: {
    lens: string;
    time: string;
    weather: string;
    direction: string;
    location: string;
  };
  createdAt: Date;
}

export interface AppNotification {
  id: string;
  title: string;
  description: string;
  createdAt: Date;
  read: boolean;
  variant?: 'default' | 'destructive';
}

const ESTIMATED_COSTS = {
  GEOCODING_REQUEST: 0.005,
  PLACES_DETAILS_REQUEST: 0.017,
  STREET_VIEW_SNAPSHOT: 0.007,
  GEMINI_TEXT_PROMPT: 0.001,
  GEMINI_IMAGE_GENERATION: 0.02,
};

export interface SessionCosts {
  geocodingRequests: number;
  placesDetailsRequests: number;
  streetViewSnapshots: number;
  geminiTextGenerations: number;
  geminiImageGenerations: number;
  totalEstimatedCost: number;
}

const initialSessionCosts: SessionCosts = {
  geocodingRequests: 0,
  placesDetailsRequests: 0,
  streetViewSnapshots: 0,
  geminiTextGenerations: 0,
  geminiImageGenerations: 0,
  totalEstimatedCost: 0,
};

type CostType = keyof Omit<SessionCosts, 'totalEstimatedCost'>;

interface AppContextType {
  isAuthenticated: boolean;
  login: () => void;
  logout: () => void;
  images: GeneratedImage[];
  addImage: (image: Omit<GeneratedImage, 'id' | 'createdAt'>) => void;
  deleteImage: (id: string) => void;
  sessionCosts: SessionCosts;
  updateSessionCost: (type: CostType) => void;
  resetSessionCosts: () => void;
  notifications: AppNotification[];
  addNotification: (notification: Omit<AppNotification, 'id' | 'createdAt' | 'read'>) => void;
  markAllAsRead: () => void;
  clearNotifications: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [images, setImages] = useState<GeneratedImage[]>([]);
  const [sessionCosts, setSessionCosts] = useState<SessionCosts>(initialSessionCosts);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);

  const login = useCallback(() => {
    setIsAuthenticated(true);
  }, []);

  const logout = useCallback(() => {
    setIsAuthenticated(false);
    setImages([]); // Also clear images on logout
    setSessionCosts(initialSessionCosts); // Reset costs on logout
    setNotifications([]);
  }, []);

  const addImage = useCallback((image: Omit<GeneratedImage, 'id' | 'createdAt'>) => {
    setImages(prevImages => [
      { ...image, id: new Date().toISOString() + Math.random(), createdAt: new Date() },
      ...prevImages
    ]);
  }, []);

  const deleteImage = useCallback((id: string) => {
    setImages(prevImages => prevImages.filter(image => image.id !== id));
  }, []);

  const updateSessionCost = useCallback((type: CostType) => {
    let costPerUnit = 0;
    switch (type) {
        case 'geocodingRequests': costPerUnit = ESTIMATED_COSTS.GEOCODING_REQUEST; break;
        case 'placesDetailsRequests': costPerUnit = ESTIMATED_COSTS.PLACES_DETAILS_REQUEST; break;
        case 'streetViewSnapshots': costPerUnit = ESTIMATED_COSTS.STREET_VIEW_SNAPSHOT; break;
        case 'geminiTextGenerations': costPerUnit = ESTIMATED_COSTS.GEMINI_TEXT_PROMPT; break;
        case 'geminiImageGenerations': costPerUnit = ESTIMATED_COSTS.GEMINI_IMAGE_GENERATION; break;
    }

    setSessionCosts(prev => ({
      ...prev,
      [type]: prev[type] + 1,
      totalEstimatedCost: prev.totalEstimatedCost + costPerUnit,
    }));
  }, []);

  const resetSessionCosts = useCallback(() => {
    setSessionCosts(initialSessionCosts);
  }, []);

  const addNotification = useCallback((notification: Omit<AppNotification, 'id' | 'createdAt' | 'read'>) => {
    const newNotification: AppNotification = {
      ...notification,
      id: new Date().toISOString() + Math.random(),
      createdAt: new Date(),
      read: false,
      variant: notification.variant || 'default',
    };
    setNotifications(prev => [newNotification, ...prev].slice(0, 20)); // Keep last 20
  }, []);

  const markAllAsRead = useCallback(() => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  }, []);

  const clearNotifications = useCallback(() => {
    setNotifications([]);
  }, []);

  return (
    <AppContext.Provider value={{
        images,
        addImage,
        deleteImage,
        isAuthenticated,
        login,
        logout,
        sessionCosts,
        updateSessionCost,
        resetSessionCosts,
        notifications,
        addNotification,
        markAllAsRead,
        clearNotifications
    }}>
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
