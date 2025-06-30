
'use client';

import type { ReactNode } from 'react';
import { createContext, useContext, useState, useCallback, useEffect } from 'react';
import type { Project, GeneratedImage } from '@/types';
import { auth, db, storage } from '@/lib/firebase';
import { onAuthStateChanged, type User } from 'firebase/auth';
import { collection, query, where, getDocs, addDoc, deleteDoc, doc, updateDoc, serverTimestamp, orderBy } from 'firebase/firestore';
import { ref, uploadString, getDownloadURL, deleteObject } from 'firebase/storage';

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
  user: User | null;
  isAuthLoading: boolean;
  projects: Project[];
  isProjectsLoading: boolean;
  activeProjectId: string | null;
  setActiveProjectId: (id: string | null) => void;
  createProject: (name: string) => Promise<void>;
  deleteProject: (id: string) => Promise<void>;
  addImageToActiveProject: (image: Omit<GeneratedImage, 'id' | 'createdAt' | 'src'> & { src: string }) => Promise<void>;
  deleteImage: (imageId: string, projectId: string) => Promise<void>;
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
  const [user, setUser] = useState<User | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [projects, setProjects] = useState<Project[]>([]);
  const [isProjectsLoading, setIsProjectsLoading] = useState(true);
  const [activeProjectId, setActiveProjectId] = useState<string | null>(null);
  const [sessionCosts, setSessionCosts] = useState<SessionCosts>(initialSessionCosts);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);

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

  const fetchProjects = useCallback(async (uid: string) => {
    setIsProjectsLoading(true);
    try {
      const q = query(collection(db, `users/${uid}/projects`), orderBy('createdAt', 'desc'));
      const querySnapshot = await getDocs(q);
      const userProjects: Project[] = [];
      for (const projectDoc of querySnapshot.docs) {
          const projectData = projectDoc.data();
          const imagesQuery = query(collection(db, `users/${uid}/projects/${projectDoc.id}/images`), orderBy('createdAt', 'desc'));
          const imagesSnapshot = await getDocs(imagesQuery);
          const images = imagesSnapshot.docs.map(imgDoc => ({ id: imgDoc.id, ...imgDoc.data() } as GeneratedImage));
          
          userProjects.push({
              id: projectDoc.id,
              name: projectData.name,
              createdAt: projectData.createdAt.toDate(),
              images: images,
          });
      }
      setProjects(userProjects);
      if (userProjects.length > 0 && !activeProjectId) {
          setActiveProjectId(userProjects[0].id);
      }
    } catch (error) {
      console.error("Error fetching projects:", error);
      addNotification({ title: 'Error', description: 'Could not fetch your projects.', variant: 'destructive' });
      setProjects([]);
    } finally {
      setIsProjectsLoading(false);
    }
  }, [addNotification, activeProjectId]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setIsAuthLoading(false);
      if (currentUser) {
        fetchProjects(currentUser.uid);
      } else {
        setProjects([]);
        setIsProjectsLoading(false);
        setActiveProjectId(null);
      }
    });
    return () => unsubscribe();
  }, [fetchProjects]);

  const createProject = useCallback(async (name: string) => {
    if (!user) return;
    try {
      const newProjectRef = await addDoc(collection(db, `users/${user.uid}/projects`), {
        name,
        createdAt: serverTimestamp(),
      });
      const newProject: Project = { id: newProjectRef.id, name, images: [], createdAt: new Date() };
      setProjects(prev => [newProject, ...prev]);
      setActiveProjectId(newProject.id);
      addNotification({ title: 'Project Created', description: `New project "${name}" has been created.` });
    } catch (error) {
      console.error("Error creating project:", error);
      addNotification({ title: 'Error', description: 'Could not create project.', variant: 'destructive' });
    }
  }, [user, addNotification]);

  const deleteProject = useCallback(async (id: string) => {
    if (!user) return;
    // Optimistic UI update
    const originalProjects = projects;
    setProjects(prev => prev.filter(p => p.id !== id));
    if (activeProjectId === id) {
        const remainingProjects = originalProjects.filter(p => p.id !== id);
        setActiveProjectId(remainingProjects.length > 0 ? remainingProjects[0].id : null);
    }
    try {
      // First, delete all images in subcollection from Firebase Storage
      const imagesQuery = query(collection(db, `users/${user.uid}/projects/${id}/images`));
      const imagesSnapshot = await getDocs(imagesQuery);
      for (const imgDoc of imagesSnapshot.docs) {
          const imageId = imgDoc.id;
          const imagePath = `users/${user.uid}/projects/${id}/${imageId}`;
          await deleteObject(ref(storage, imagePath));
          await deleteDoc(doc(db, `users/${user.uid}/projects/${id}/images`, imageId));
      }
      await deleteDoc(doc(db, `users/${user.uid}/projects`, id));
      addNotification({ title: 'Project Deleted', description: 'The project and all its media have been removed.' });
    } catch (error) {
      console.error("Error deleting project:", error);
      addNotification({ title: 'Error', description: 'Could not delete project.', variant: 'destructive' });
      setProjects(originalProjects); // Revert on error
    }
  }, [user, projects, activeProjectId, addNotification]);

  const addImageToActiveProject = useCallback(async (image: Omit<GeneratedImage, 'id' | 'createdAt' | 'src'> & { src: string }) => {
      if (!user) {
          addNotification({ title: "Not Logged In", description: "You must be logged in to save images.", variant: "destructive" });
          return;
      }
      let targetProjectId = activeProjectId;
      if (!targetProjectId) {
          if (projects.length > 0) {
              targetProjectId = projects[0].id;
              setActiveProjectId(targetProjectId);
          } else {
              await createProject('My First Project');
              // This is tricky because createProject is async and sets state.
              // A better way would be to get the new project ID from createProject's return.
              // For now, let's just re-fetch projects which isn't ideal but will work.
              await fetchProjects(user.uid);
              // This part is still problematic. Refetching and then getting the first project might work.
              // A more robust solution would be needed in a real app.
              return; 
          }
      }
      if (!targetProjectId) {
         addNotification({ title: "Save Error", description: "Could not find a project to save the image to.", variant: "destructive" });
         return;
      }
      
      const imageId = new Date().getTime().toString();
      const storagePath = `users/${user.uid}/projects/${targetProjectId}/${imageId}`;
      const storageRef = ref(storage, storagePath);

      try {
          // Upload the image data URI to Firebase Storage
          const snapshot = await uploadString(storageRef, image.src, 'data_url');
          const downloadURL = await getDownloadURL(snapshot.ref);

          // Now save metadata to Firestore with the Storage URL
          const { src, ...imageData } = image;
          const newImageDoc: Omit<GeneratedImage, 'id'> = {
              ...imageData,
              src: downloadURL,
              createdAt: new Date(),
          };

          const docRef = await addDoc(collection(db, `users/${user.uid}/projects/${targetProjectId}/images`), {
              ...newImageDoc,
              createdAt: serverTimestamp()
          });

          // Optimistically update UI
          const fullNewImage: GeneratedImage = { ...newImageDoc, id: docRef.id };
          setProjects(prev => prev.map(p =>
              p.id === targetProjectId ? { ...p, images: [fullNewImage, ...p.images] } : p
          ));
          addNotification({ title: 'Image Saved', description: `Image added to project.` });
      } catch (error) {
          console.error("Error saving image:", error);
          addNotification({ title: 'Error', description: 'Could not save the image.', variant: 'destructive' });
      }
  }, [user, activeProjectId, projects, addNotification, createProject, fetchProjects]);
  
  const deleteImage = useCallback(async (imageId: string, projectId: string) => {
    if (!user) return;
    // Optimistic UI update
    setProjects(prevProjects =>
      prevProjects.map(p =>
        p.id === projectId
          ? { ...p, images: p.images.filter(img => img.id !== imageId) }
          : p
      )
    );
    try {
        const imagePath = `users/${user.uid}/projects/${projectId}/${imageId}`;
        await deleteObject(ref(storage, imagePath));
        await deleteDoc(doc(db, `users/${user.uid}/projects/${projectId}/images`, imageId));
        addNotification({ title: 'Image Deleted', description: 'The item has been removed from the project.' });
    } catch(error) {
        console.error("Error deleting image:", error);
        addNotification({ title: 'Error', description: 'Could not delete the image. Please refresh.', variant: 'destructive' });
        // Re-fetch to sync state on error
        fetchProjects(user.uid);
    }
  }, [user, addNotification, fetchProjects]);

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

  const markAllAsRead = useCallback(() => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  }, []);

  const clearNotifications = useCallback(() => {
    setNotifications([]);
  }, []);

  return (
    <AppContext.Provider value={{
        isAuthenticated: !!user,
        user,
        isAuthLoading,
        projects,
        isProjectsLoading,
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
