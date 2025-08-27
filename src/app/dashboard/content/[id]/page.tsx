"use client";

"use client";

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/hooks/use-auth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { generateDynamicWatermark } from '@/ai/flows/dynamic-watermarking';
import { generateSignedContentUrl } from '@/ai/flows/generate-signed-content-url';
import { HttpError } from '@/lib/errors'; // ✅ Import from our new shared file
import { Loader2, ArrowLeft, ShieldAlert } from 'lucide-react';

// ... (the rest of your page.tsx file remains the same)
// The only change is the import statement for HttpError
interface ContentItem {
  id: string;
  title: string;
  description: string;
  mediaUrl: string;
  mediaType: string;
}

// Helper function to fetch a resource and convert it to a data URI
async function toDataURI(url: string): Promise<string> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error('Network response was not ok.');
  }
  const blob = await response.blob();
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

export default function ContentViewPage() {
  const { user } = useAuth();
  const router = useRouter();
  const params = useParams();
  const { toast } = useToast();
  const contentId = params.id as string;

  const [content, setContent] = useState<ContentItem | null>(null);
  const [watermarkedMedia, setWatermarkedMedia] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!contentId || !user) return;

    const fetchContentAndWatermark = async () => {
      setLoading(true);
      setError(null);
      try {
        // 1. Generate a secure, signed URL for the media.
        // This server action now handles all authorization and existence checks.
        // If it fails, it will throw an HttpError which we catch below.
        const { signedUrl } = await generateSignedContentUrl({ contentId });

        // 2. Fetch content metadata from Firestore (since auth succeeded)
        const docRef = doc(db, 'content', contentId);
        const docSnap = await getDoc(docRef);

        // This check is good to have as a fallback, but the server action
        // should have already caught non-existent content.
        if (!docSnap.exists()) {
          throw new Error('Content not found.'); // Generic error is fine here
        }

        const contentData = { id: docSnap.id, ...docSnap.data() } as ContentItem;
        setContent(contentData);

        // 3. Convert media from signed URL to data URI for watermarking
        const mediaDataUri = await toDataURI(signedUrl);

        // 4. Generate watermark
        const watermarkInput = {
          mediaDataUri: mediaDataUri,
          username: user.displayName || user.email || 'anonymous',
          timestamp: new Date().toISOString(),
        };
        const watermarkOutput = await generateDynamicWatermark(watermarkInput);
        setWatermarkedMedia(watermarkOutput.watermarkedMediaDataUri);

      } catch (err: any) {
        console.error("Error processing content:", err);
        
        // ✅ CORRECTED: Changed HttpsError to HttpError
        const isHttpError = err instanceof HttpError;
        const errorMessage = isHttpError ? err.message : (err.message || 'An unexpected error occurred.');
        const errorCode = isHttpError ? (err as HttpError).code : 'unknown';

        setError(errorMessage);

        // Only show toast for non-permission/not-found errors
        if (errorCode !== 'permission-denied' && errorCode !== 'not-found') {
             toast({
              variant: 'destructive',
              title: 'Error Loading Content',
              description: errorMessage,
            });
        }
      } finally {
        setLoading(false);
      }
    };

    fetchContentAndWatermark();
  }, [contentId, user, toast]);

  const renderMedia = () => {
    if (!content) return null;
    const mediaSrc = watermarkedMedia;

    if (!mediaSrc) {
      return <p>Could not load media.</p>;
    }

    if (content.mediaType.startsWith('image/')) {
      return <img src={mediaSrc} alt={content.title} className="rounded-lg w-full" />;
    }
    if (content.mediaType.startsWith('video/')) {
      return (
        <video controls src={mediaSrc} className="rounded-lg w-full">
          Your browser does not support the video tag.
        </video>
      );
    }
    return <p>Unsupported media type: {content.mediaType}</p>;
  };
  
  const renderError = () => {
    if (!error) return null;
    const isPermissionError = error.toLowerCase().includes('permission') || error.toLowerCase().includes('not found');

    return (
      <div className="flex flex-col items-center justify-center p-12 text-center text-destructive">
        {isPermissionError ? (
          <>
            <ShieldAlert className="h-12 w-12 mb-4" />
            <h2 className="text-2xl font-bold">Access Denied</h2>
            <p className="text-muted-foreground mt-2">
              You do not have permission to view this content, or it does not exist.
            </p>
            <Button onClick={() => router.push('/dashboard/content')} className="mt-6">Back to Content</Button>
          </>
        ) : (
          <>
            <p>Error: {error}</p>
            <Button onClick={() => window.location.reload()} className="mt-4">Try Again</Button>
          </>
        )}
      </div>
    );
  };

  return (
    <div className="mx-auto grid w-full max-w-4xl gap-6">
      <div className="flex items-center gap-4">
        <Button variant="outline" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h1 className="text-3xl font-bold tracking-tight">{content?.title || (loading ? 'Loading content...' : 'Content')}</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{content?.title}</CardTitle>
          <CardDescription>{content?.description}</CardDescription>
        </CardHeader>
        <CardContent>
          {loading && (
            <div className="flex flex-col items-center justify-center p-12 text-center">
              <Loader2 className="animate-spin h-12 w-12 text-primary mb-4" />
              <p className="text-muted-foreground">Applying security measures, please wait...</p>
            </div>
          )}
          {error && renderError()}
          {!loading && !error && renderMedia()}
        </CardContent>
      </Card>
    </div>
  );
}