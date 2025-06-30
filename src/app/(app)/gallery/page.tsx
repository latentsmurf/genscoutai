
'use client';

import { useAppContext, type Project } from '@/context/AppContext';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import Image from 'next/image';
import { ImageIcon, Calendar, PlusCircle, Trash2, Share2, Clipboard, ClipboardCheck, Folder, Loader2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
  DialogFooter
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Button } from '@/components/ui/button';
import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';

function CreateProjectDialog() {
  const { createProject } = useAppContext();
  const [name, setName] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim()) {
      setIsLoading(true);
      await createProject(name.trim());
      setName('');
      setIsLoading(false);
      setIsOpen(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button>
          <PlusCircle className="mr-2 h-4 w-4" />
          Create New Project
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create a New Project</DialogTitle>
          <DialogDescription>
            Give your new project a name to organize your media.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="project-name" className="text-right">
                Name
              </Label>
              <Input
                id="project-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="col-span-3"
                placeholder="e.g., Downtown Commercial Shoot"
                required
                disabled={isLoading}
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="submit" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Create Project
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function ShareProjectDialog({ project }: { project: Project }) {
  const [copied, setCopied] = useState(false);
  const shareLink = `${window.location.origin}/share/project/${project.id}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(shareLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" className="h-8 w-8">
            <Share2 className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Share "{project.name}"</DialogTitle>
          <DialogDescription>
            Anyone with this link can view the project (conceptual).
          </DialogDescription>
        </DialogHeader>
        <div className="flex items-center space-x-2">
            <Input id="share-link" value={shareLink} readOnly />
            <Button onClick={handleCopy} size="icon" className="shrink-0">
                {copied ? <ClipboardCheck className="h-4 w-4" /> : <Clipboard className="h-4 w-4" />}
            </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

function DeleteProjectDialog({ project }: { project: Project }) {
    const { deleteProject } = useAppContext();
    const [isDeleting, setIsDeleting] = useState(false);

    const handleDelete = async () => {
        setIsDeleting(true);
        await deleteProject(project.id);
        // The dialog will close automatically if the component unmounts.
    }

    return (
        <AlertDialog>
            <AlertDialogTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10">
                    <Trash2 className="h-4 w-4" />
                </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
                <AlertDialogHeader>
                <AlertDialogTitle>Delete "{project.name}"?</AlertDialogTitle>
                <AlertDialogDescription>
                    This will permanently delete the project and all of its {project.images.length} media items from the database. This action cannot be undone.
                </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleDelete} disabled={isDeleting} className="bg-destructive hover:bg-destructive/90 text-destructive-foreground">
                    {isDeleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Delete Project
                </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    )
}

export default function GalleryPage() {
  const { projects, isProjectsLoading } = useAppContext();

  return (
    <div className="flex flex-col h-full">
       <header className="p-4 md:p-6 border-b">
        <div className="flex items-center justify-between">
            <div>
                <h1 className="text-2xl font-bold">Project Gallery</h1>
                <p className="text-muted-foreground">
                Organize your generated media into distinct projects.
                </p>
            </div>
            <CreateProjectDialog />
        </div>
      </header>
      <main className="flex-1 p-4 md:p-6 overflow-auto">
        {isProjectsLoading ? (
            <div className="flex items-center justify-center h-full">
                <Loader2 className="w-16 h-16 text-primary animate-spin" />
            </div>
        ) : projects.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground rounded-lg border-2 border-dashed">
            <Folder className="w-16 h-16 mb-4" />
            <h2 className="text-xl font-semibold">No projects yet.</h2>
            <p>Click "Create New Project" to get started.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {projects.map(project => (
              <Card key={project.id} className="overflow-hidden flex flex-col">
                <Link href={`/gallery/${project.id}`} className="block hover:bg-muted/50 transition-colors">
                    <div className="relative aspect-video bg-muted flex items-center justify-center">
                        {project.images.length > 0 ? (
                            <Image 
                                src={project.images[0].src}
                                alt={`Preview for ${project.name}`}
                                layout="fill"
                                objectFit="cover"
                            />
                        ) : (
                            <ImageIcon className="w-12 h-12 text-muted-foreground" />
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
                         <Badge variant="secondary" className="absolute top-2 left-2 z-10">{project.images.length} item{project.images.length !== 1 ? 's' : ''}</Badge>
                    </div>
                </Link>
                <CardHeader className="p-4 pb-2">
                  <CardTitle className="text-lg line-clamp-1">
                     <Link href={`/gallery/${project.id}`} className="hover:underline">{project.name}</Link>
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4 pt-0 text-xs text-muted-foreground flex-grow">
                    <div className="flex items-center gap-2">
                        <Calendar className="w-3 h-3"/>
                        <span>Created: {new Date(project.createdAt).toLocaleDateString()}</span>
                    </div>
                </CardContent>
                <Separator />
                <CardFooter className="p-2 flex items-center justify-end gap-1 mt-auto">
                    <ShareProjectDialog project={project} />
                    <DeleteProjectDialog project={project} />
                </CardFooter>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
