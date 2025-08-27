
"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import Image from "next/image";
import { Lock, PlusCircle, Unlock } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { collection, onSnapshot, doc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";

interface ContentItem {
  id: string;
  title: string;
  description: string;
  mediaUrl: string;
  mediaType: string;
  allowedUsers?: Record<string, boolean>;
}

export default function ContentPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [content, setContent] = useState<ContentItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    const unsubscribe = onSnapshot(collection(db, "content"), (snapshot) => {
      const contentData: ContentItem[] = snapshot.docs.map(doc => ({
        id: doc.id,
        ...(doc.data() as Omit<ContentItem, 'id'>)
      }));
      setContent(contentData);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  const handleRequestAccess = () => {
    toast({
      title: "Access Request",
      description: "Please contact the admin directly to request access to this content.",
    });
  };
  
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Private Content</h1>
        <Button asChild>
          <Link href="/dashboard/content/new">
            <PlusCircle className="mr-2 h-4 w-4" />
            Create New
          </Link>
        </Button>
      </div>
       {loading ? (
        <p>Loading content...</p>
      ) : content.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground">No content has been uploaded yet.</p>
          <Button asChild className="mt-4">
             <Link href="/dashboard/content/new">Upload Your First Piece of Content</Link>
          </Button>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {content.map((item) => {
            const hasAccess = !!(user && item.allowedUsers && item.allowedUsers[user.uid]);
            const Wrapper = hasAccess ? Link : 'div';
            const wrapperProps = hasAccess ? { href: `/dashboard/content/${item.id}` } : { onClick: handleRequestAccess, className: "cursor-pointer" };

            return (
              <Wrapper {...wrapperProps} key={item.id}>
                <Card className={`overflow-hidden group h-full flex flex-col ${!hasAccess ? 'border-dashed' : ''}`}>
                  <CardHeader className="p-0 relative">
                    <Image
                      src={item.mediaUrl || "https://picsum.photos/600/400"}
                      alt={item.title}
                      width={600}
                      height={400}
                      data-ai-hint="placeholder"
                      className={`aspect-video w-full object-cover transition-all duration-300 group-hover:scale-105 ${!hasAccess ? 'filter blur-sm' : ''}`}
                    />
                    <div className={`absolute top-2 right-2 bg-black/50 p-2 rounded-full ${hasAccess ? 'bg-green-600/70' : ''}`}>
                      {hasAccess ? <Unlock className="text-white/90 h-5 w-5" /> : <Lock className="text-white/90 h-5 w-5" />}
                    </div>
                  </CardHeader>
                  <CardContent className="p-4 flex-1">
                    <CardTitle className="text-lg truncate">{item.title}</CardTitle>
                    <p className="text-sm text-muted-foreground truncate">{item.description}</p>
                  </CardContent>
                  <CardFooter className="p-4 pt-0">
                    <Button className="w-full" variant={hasAccess ? "secondary" : "outline"} >
                      {hasAccess ? 'View Content' : 'Request Access'}
                    </Button>
                  </CardFooter>
                </Card>
              </Wrapper>
            )
          })}
        </div>
      )}
    </div>
  );
}
