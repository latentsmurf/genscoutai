
'use client';

import { useAppContext, type GeneratedImage } from '@/context/AppContext';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import Image from 'next/image';
import { ImageIcon, Calendar, Camera, Film, MapPin, Sun, Wind, Download, Info, Trash2, PencilRuler, ArrowLeft, FileText, Share2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
  DialogClose
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
import { Badge } from '@/components/ui/badge';
import { useParams, useRouter } from 'next/navigation';
import { Skeleton } from '@/components/ui/skeleton';
import Link from 'next/link';
import { Separator } from '@/components/ui/separator';

function DeleteImageDialog({ imageId, onDeleted }: { imageId: string, onDeleted: () => void }) {
  const { deleteImage } = useAppContext();

  const handleDelete = () => {
    deleteImage(imageId);
    onDeleted();
  };

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant="destructive">
          <Trash2 className="mr-2 h-4 w-4" />
          Delete
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Are you sure?</AlertDialogTitle>
          <AlertDialogDescription>
            This action cannot be undone. This will permanently delete the item from this project.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={handleDelete}>Continue</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}


function GalleryImageDialog({ image }: { image: GeneratedImage }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <div className="relative aspect-video group cursor-pointer">
          <Image
            src={image.src}
            alt={image.prompt}
            fill
            style={{objectFit: "cover"}}
            className="rounded-t-lg transition-transform duration-300 group-hover:scale-105"
            unoptimized={image.src.startsWith('http')}
          />
          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
              <Info className="text-white w-8 h-8" />
          </div>
        </div>
      </DialogTrigger>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>{image.type === 'Scene Plan' ? 'Scene Plan Details' : 'Image Details'}</DialogTitle>
          <DialogDescription>
            Generated on {new Date(image.createdAt).toLocaleString()}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
            <div className="relative aspect-video w-full rounded-lg overflow-hidden bg-muted">
                 <Image
                    src={image.src}
                    alt={image.prompt}
                    fill
                    style={{objectFit: "contain"}}
                    unoptimized={image.src.startsWith('http')}
                 />
            </div>
            {image.type === 'Cinematic Shot' && image.params && (
              <div>
                  <h3 className="font-semibold">Parameters</h3>
                  <div className="mt-2 text-sm text-muted-foreground space-y-1.5 p-3 bg-muted rounded-md">
                      <div className="flex items-center gap-2"><MapPin className="w-4 h-4 text-primary" /><strong>Location:</strong><span>{image.params.location}</span></div>
                      <div className="flex items-center gap-2"><Camera className="w-4 h-4 text-primary" /><strong>Lens:</strong><span>{image.params.lens}</span></div>
                      <div className="flex items-center gap-2"><Film className="w-4 h-4 text-primary" /><strong>Direction:</strong><span>{image.params.direction}</span></div>
                      <div className="flex items-center gap-2"><Sun className="w-4 h-4 text-primary" /><strong>Time:</strong><span>{image.params.time}</span></div>
                      <div className="flex items-center gap-2"><Wind className="w-4 h-4 text-primary" /><strong>Weather:</strong><span>{image.params.weather}</span></div>
                  </div>
              </div>
            )}
        </div>
        <div className="flex justify-between items-center pt-4">
            <div>
                <DeleteImageDialog imageId={image.id} onDeleted={() => setIsOpen(false)} />
            </div>
            <div className="flex gap-2">
                <Button variant="outline" onClick={() => window.open(image.src, '_blank')}>
                    <Download className="mr-2 h-4 w-4" />
                    Download
                </Button>
                <DialogClose asChild>
                     <Button variant="secondary">Close</Button>
                </DialogClose>
            </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}


export default function ProjectGalleryPage() {
  const params = useParams();
  const projectId = params.projectId as string;
  const { projects, addNotification } = useAppContext();
  
  const project = projects.find(p => p.id === projectId);

  const handleConceptualExport = () => {
    addNotification({
        title: "PDF Export (Conceptual)",
        description: "In a full version, this would generate a professional PDF lookbook. This feature is planned for a future update."
    });
  }

  if (!project) {
    return (
        <div className="flex flex-col h-full">
            <header className="p-4 md:p-6 border-b">
                <Skeleton className="h-8 w-1/2" />
                <Skeleton className="h-4 w-1/3 mt-2" />
            </header>
            <main className="flex-1 p-4 md:p-6 overflow-auto">
                <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground">
                    <p>Project not found or still loading...</p>
                </div>
            </main>
        </div>
    )
  }

  const { images } = project;

  return (
    <div className="flex flex-col h-full">
       <header className="p-4 md:p-6 border-b">
        <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-4">
                <Button asChild variant="outline" size="icon" className="h-8 w-8">
                    <Link href="/gallery"><ArrowLeft className="h-4 w-4" /></Link>
                </Button>
                <div>
                    <h1 className="text-2xl font-bold">{project.name}</h1>
                    <p className="text-muted-foreground">
                    A collection of all shots and plans for this project.
                    </p>
                </div>
            </div>
            <div className="flex items-center gap-2">
                <Button variant="outline" onClick={handleConceptualExport}>
                    <FileText className="mr-2 h-4 w-4" />
                    Export as PDF (Conceptual)
                </Button>
            </div>
        </div>
      </header>
      <main className="flex-1 p-4 md:p-6 overflow-auto">
        {images.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground rounded-lg border-2 border-dashed">
            <ImageIcon className="w-16 h-16 mb-4" />
            <h2 className="text-xl font-semibold">This project is empty.</h2>
            <p>Go to the Scout page to start generating images and creating plans.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {images.map(image => (
              <Card key={image.id} className="overflow-hidden flex flex-col">
                 <div className='relative'>
                   <GalleryImageDialog image={image} />
                   {image.type === 'Scene Plan' && (
                      <Badge variant="secondary" className="absolute top-2 right-2 z-10">
                        <PencilRuler className='w-3 h-3 mr-1.5' />
                        Scene Plan
                      </Badge>
                   )}
                 </div>
                <CardContent className="p-4 flex-grow">
                  <CardTitle className="text-sm mb-2 line-clamp-2 font-normal">
                    <strong className="font-semibold">Location:</strong> {image.params?.location || image.prompt}
                  </CardTitle>
                  {image.type === 'Cinematic Shot' && image.params && (
                    <div className="text-xs text-muted-foreground space-y-1">
                        <div className="flex items-center gap-2"><Camera className="w-3 h-3" /><span>{image.params.lens}</span></div>
                        <div className="flex items-center gap-2"><Film className="w-3 h-3" /><span>{image.params.direction}</span></div>
                    </div>
                  )}
                </CardContent>
                <CardFooter className="p-4 pt-0 text-xs text-muted-foreground flex items-center gap-2 mt-auto">
                    <Calendar className="w-3 h-3"/>
                    <span>{new Date(image.createdAt).toLocaleDateString()}</span>
                </CardFooter>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
