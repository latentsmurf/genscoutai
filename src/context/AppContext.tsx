
'use client';

import type { ReactNode } from 'react';
import { createContext, useContext, useState, useCallback } from 'react';
import type { Project, GeneratedImage } from '@/types';


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
  projects: Project[];
  activeProjectId: string | null;
  setActiveProjectId: (id: string | null) => void;
  createProject: (name: string) => void;
  deleteProject: (id: string) => void;
  addImageToActiveProject: (image: Omit<GeneratedImage, 'id' | 'createdAt'>) => void;
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
  const [projects, setProjects] = useState<Project[]>([]);
  const [activeProjectId, setActiveProjectId] = useState<string | null>(null);
  const [sessionCosts, setSessionCosts] = useState<SessionCosts>(initialSessionCosts);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);

  const login = useCallback(() => {
    setIsAuthenticated(true);
  }, []);

  const logout = useCallback(() => {
    setIsAuthenticated(false);
    setProjects([]); 
    setActiveProjectId(null);
    setSessionCosts(initialSessionCosts); 
    setNotifications([]);
  }, []);

  const createProject = useCallback((name: string) => {
    const newProject: Project = {
      id: new Date().toISOString() + Math.random(),
      name,
      images: [],
      createdAt: new Date(),
    };
    setProjects(prev => [newProject, ...prev]);
    setActiveProjectId(newProject.id);
    addNotification({ title: 'Project Created', description: `New project "${name}" has been created.` });
  }, []);

  const deleteProject = useCallback((id: string) => {
    setProjects(prev => prev.filter(p => p.id !== id));
    if (activeProjectId === id) {
        setActiveProjectId(null);
    }
    addNotification({ title: 'Project Deleted', description: 'The project and all its media have been removed.' });
  }, [activeProjectId]);

  const addImageToActiveProject = useCallback((image: Omit<GeneratedImage, 'id' | 'createdAt'>) => {
    setProjects(prevProjects => {
      const newImage: GeneratedImage = { ...image, id: new Date().toISOString() + Math.random(), createdAt: new Date() };

      let targetProjectId = activeProjectId;

      // If no active project, but some projects exist, use the first one.
      if (!targetProjectId && prevProjects.length > 0) {
        targetProjectId = prevProjects[0].id;
        setActiveProjectId(targetProjectId);
        addNotification({ title: 'Image Saved', description: `No active project. Saved to "${prevProjects[0].name}".`});
      }
      
      // If a project is targeted (either active or fallback)
      if(targetProjectId) {
        return prevProjects.map(p =>
          p.id === targetProjectId
            ? { ...p, images: [newImage, ...p.images] }
            : p
        );
      }

      // If no projects exist at all, create a new one.
      const newProject: Project = {
        id: new Date().toISOString(),
        name: 'My First Project',
        images: [newImage],
        createdAt: new Date(),
      };
      setActiveProjectId(newProject.id);
      addNotification({ title: 'Project Created', description: 'Your first project was created and the image was saved.' });
      return [newProject];
    });
  }, [activeProjectId]);

  const deleteImage = useCallback((imageId: string) => {
    setProjects(prevProjects =>
      prevProjects.map(p => ({
        ...p,
        images: p.images.filter(img => img.id !== imageId),
      }))
    );
     addNotification({ title: 'Image Deleted', description: 'The item has been removed from the project.' });
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
        isAuthenticated,
        login,
        logout,
        projects,
        activeProjectId,
        setActiveProjectId,
        createProject,
        deleteProject,
        addImageToActiveProject,
        deleteImage,
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
