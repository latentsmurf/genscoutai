
'use client';

import type { ReactNode } from 'react';
import { createContext, useContext, useState, useCallback, useEffect } from 'react';
import type { Project, GeneratedImage } from '@/types';
import { auth, db, storage, firebaseError } from '@/lib/firebase';
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
  isGuestMode: boolean;
  setIsGuestMode: (isGuest: boolean) => void;
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
  const [isGuestMode, setIsGuestMode] = useState(false);
  const [projects, setProjects] = useState<Project[]>([]);
  const [isProjectsLoading, setIsProjectsLoading] = useState(true);
  const [activeProjectId, setActiveProjectId] = useState<string | null>(null);
  const [sessionCosts, setSessionCosts] = useState<SessionCosts>(initialSessionCosts);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);

  if (firebaseError) {
    return (
        <div style={{ padding: '2rem', textAlign: 'center', backgroundColor: '#fffbe6', color: '#78350f', border: '1px solid #fde68a', borderRadius: '8px', margin: '2rem auto', maxWidth: '800px', fontFamily: 'sans-serif', lineHeight: '1.6' }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>Firebase Initialization Error</h1>
        <p style={{ marginTop: '1rem' }}>An error occurred while connecting to Firebase.</p>
        <pre style={{ marginTop: '1rem', textAlign: 'left', backgroundColor: '#f3f4f6', padding: '1rem', borderRadius: '4px', overflowX: 'auto', border: '1px solid #e5e7eb' }}>
            <code>{firebaseError}</code>
        </pre>
        <p style={{ marginTop: '1.5rem', fontSize: '0.9rem' }}>
            Please check your Firebase project configuration and security rules (e.g., for Firestore and Storage). Ensure the provided keys in the code are correct and the services are enabled.
        </p>
        </div>
    );
  }

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
    if (!db || isGuestMode) return;
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
  }, [addNotification, activeProjectId, isGuestMode]);

  useEffect(() => {
    if (!auth) {
      setIsAuthLoading(false);
      return;
    }
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setIsAuthLoading(false);
      if (currentUser) {
        setIsGuestMode(false);
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
    if (!user || !db || isGuestMode) return;
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
  }, [user, isGuestMode, addNotification]);

  const deleteProject = useCallback(async (id: string) => {
    if (!user || !db || !storage || isGuestMode) return;
    const originalProjects = projects;
    setProjects(prev => prev.filter(p => p.id !== id));
    if (activeProjectId === id) {
        const remainingProjects = originalProjects.filter(p => p.id !== id);
        setActiveProjectId(remainingProjects.length > 0 ? remainingProjects[0].id : null);
    }
    try {
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
      setProjects(originalProjects);
    }
  }, [user, isGuestMode, projects, activeProjectId, addNotification]);

  const addImageToActiveProject = useCallback(async (image: Omit<GeneratedImage, 'id' | 'createdAt' | 'src'> & { src: string }) => {
      if (isGuestMode) {
          addNotification({ title: "Guest Mode", description: "Image saving is disabled for guests. Please create an account." });
          return;
      }
      if (!user || !db || !storage) {
          addNotification({ title: "Save Error", description: "Firebase is not available.", variant: "destructive" });
          return;
      }
      if (!activeProjectId) {
           addNotification({ title: "No Active Project", description: "Please create or select a project before saving images.", variant: "destructive" });
         return;
      }
      
      const targetProjectId = activeProjectId;
      const imageId = new Date().getTime().toString();
      const storagePath = `users/${user.uid}/projects/${targetProjectId}/${imageId}`;
      const storageRef = ref(storage, storagePath);

      try {
          const snapshot = await uploadString(storageRef, image.src, 'data_url');
          const downloadURL = await getDownloadURL(snapshot.ref);
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

          const fullNewImage: GeneratedImage = { ...newImageDoc, id: docRef.id };
          setProjects(prev => prev.map(p =>
              p.id === targetProjectId ? { ...p, images: [fullNewImage, ...p.images] } : p
          ));
          addNotification({ title: 'Image Saved', description: `Image added to project.` });
      } catch (error) {
          console.error("Error saving image:", error);
          addNotification({ title: 'Error', description: 'Could not save the image.', variant: 'destructive' });
      }
  }, [user, activeProjectId, addNotification, isGuestMode]);
  
  const deleteImage = useCallback(async (imageId: string, projectId: string) => {
    if (!user || !db || !storage || isGuestMode) return;
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
        fetchProjects(user.uid);
    }
  }, [user, addNotification, fetchProjects, isGuestMode]);

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
        isGuestMode,
        setIsGuestMode,
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
