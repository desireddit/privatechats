
"use client";

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { db, storage } from '@/lib/firebase';
import { addDoc, collection } from 'firebase/firestore';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { useAuth } from '@/hooks/use-auth';
import { Progress } from '@/components/ui/progress';
import { ArrowLeft, Loader2, Sparkles } from 'lucide-react';
import { generateContentTitle } from '@/ai/flows/content-title-from-description';

// Debounce helper
const debounce = <F extends (...args: any[]) => any>(func: F, waitFor: number) => {
  let timeout: NodeJS.Timeout | null = null;

  return (...args: Parameters<F>): Promise<ReturnType<F>> =>
    new Promise(resolve => {
      if (timeout) {
        clearTimeout(timeout);
      }

      timeout = setTimeout(() => resolve(func(...args)), waitFor);
    });
};


export default function NewContentPage() {
  const { user } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isGeneratingTitle, setIsGeneratingTitle] = useState(false);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const debouncedTitleGeneration = useCallback(
    debounce(async (desc: string) => {
      if (desc.trim().length < 20) { // Only generate if description is somewhat substantial
        setTitle('');
        return;
      };
      setIsGeneratingTitle(true);
      try {
        const { title: generatedTitle } = await generateContentTitle({ description: desc });
        setTitle(generatedTitle);
      } catch (error) {
        console.error("Failed to generate title:", error);
        // Don't bother the user with a toast, they can type manually
      } finally {
        setIsGeneratingTitle(false);
      }
    }, 1000),
    []
  );

  useEffect(() => {
    if (description) {
      debouncedTitleGeneration(description);
    }
  }, [description, debouncedTitleGeneration]);


  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      toast({ variant: 'destructive', title: 'Not authenticated', description: 'You must be logged in to upload content.' });
      return;
    }
    if (!file || !title) {
      toast({ variant: 'destructive', title: 'Missing fields', description: 'Please provide a title and a file.' });
      return;
    }

    setUploading(true);
    setUploadProgress(0);

    try {
      const storageRef = ref(storage, `content/${user.uid}/${Date.now()}_${file.name}`);
      const uploadTask = uploadBytesResumable(storageRef, file);

      uploadTask.on('state_changed',
        (snapshot) => {
          const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          setUploadProgress(progress);
        },
        (error) => {
          console.error("Upload failed:", error);
          toast({ variant: 'destructive', title: 'Upload failed', description: error.message });
          setUploading(false);
          setUploadProgress(0);
        },
        async () => {
          const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
          await addDoc(collection(db, 'content'), {
            title,
            description,
            mediaUrl: downloadURL,
            mediaType: file.type,
            uploaderId: user.uid,
            createdAt: new Date(),
            allowedUsers: {}, // Initialize with empty map for granular access
            createdBy: user.uid,
          });

          toast({ title: 'Success', description: 'Content uploaded successfully!' });
          router.push('/dashboard/content');
        }
      );
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Upload failed', description: error.message });
      setUploading(false);
      setUploadProgress(0);
    }
  };

  return (
    <div className="mx-auto grid w-full max-w-4xl gap-6">
       <div className="flex items-center gap-4">
        <Button variant="outline" size="icon" onClick={() => router.back()}>
           <ArrowLeft className="h-4 w-4" />
        </Button>
        <h1 className="text-3xl font-bold tracking-tight">Upload New Content</h1>
      </div>
      <Card>
        <form onSubmit={handleSubmit}>
          <CardHeader>
            <CardTitle>Content Details</CardTitle>
            <CardDescription>
              Fill out the form below to add new private content. The title will be generated automatically from the description.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="A short description of the content. A good description will generate a better title."
                disabled={uploading}
                rows={4}
              />
            </div>
             <div className="space-y-2">
              <Label htmlFor="title">Title</Label>
               <div className="relative">
                <Input
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g., Exclusive Behind the Scenes"
                  required
                  disabled={uploading || isGeneratingTitle}
                />
                <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                  {isGeneratingTitle ? (
                      <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                  ) : (
                     <Sparkles className="h-5 w-5 text-muted-foreground" />
                  )}
                </div>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="file">Media File</Label>
              <Input id="file" type="file" onChange={handleFileChange} required disabled={uploading} />
            </div>
            {uploading && (
              <div className="space-y-2 pt-2">
                <Label>Upload Progress</Label>
                <Progress value={uploadProgress} />
                <p className="text-sm text-muted-foreground text-center">{Math.round(uploadProgress)}%</p>
              </div>
            )}
          </CardContent>
          <CardFooter className="border-t px-6 py-4">
            <Button type="submit" disabled={uploading || isGeneratingTitle}>
              {uploading ? <><Loader2 className="animate-spin" /> Uploading...</> : 'Upload Content'}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
