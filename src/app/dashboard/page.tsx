// src/app/dashboard/content/page.tsx

'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/hooks/use-auth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { PlusCircle, MoreHorizontal, FileText, AlertTriangle } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Skeleton } from '@/components/ui/skeleton';

interface ContentItem {
  id: string;
  title: string;
  description: string;
  mediaUrl?: string;
  mediaType?: string;
}

type WrapperProps = {
  children: React.ReactNode;
  [key: string]: any;
} & (
  | {
      isAction: true;
      onClick: () => void;
      href?: never;
    }
  | {
      isAction?: false;
      href: string;
      onClick?: never;
    }
);

const CardItemWrapper = ({ isAction, href, children, ...props }: WrapperProps) => {
  if (isAction || !href) {
    return <div {...props}>{children}</div>;
  }
  return (
    <Link href={href} {...props}>
      {children}
    </Link>
  );
};

export default function ContentListPage() {
  const { user } = useAuth();
  const [content, setContent] = useState<ContentItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchContent = async () => {
      if (!user) return;
      try {
        const contentCollection = collection(db, 'content');
        const contentSnapshot = await getDocs(contentCollection);
        const contentList = contentSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as ContentItem[];
        setContent(contentList);
      } catch (error) {
        console.error('Error fetching content:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchContent();
  }, [user]);

  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Your Content</h1>
        <Button asChild>
          <Link href="/dashboard/content/new">
            <PlusCircle className="mr-2 h-4 w-4" /> Create New
          </Link>
        </Button>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 3 }).map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-6 w-3/4" />
                <Skeleton className="h-4 w-full mt-2" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-32 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {content.map((item) => {
            const wrapperProps = item.mediaUrl
              ? { href: `/dashboard/content/${item.id}` }
              : { isAction: true as const, onClick: () => alert('No media available'), className: 'cursor-not-allowed opacity-50' };
            
            return (
              <CardItemWrapper key={item.id} {...wrapperProps}>
                <Card className="flex flex-col h-full hover:shadow-lg transition-shadow">
                  <CardHeader className="flex-row items-start justify-between">
                    <div>
                      <CardTitle className="text-lg">{item.title}</CardTitle>
                      <CardDescription className="line-clamp-2">{item.description}</CardDescription>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent>
                        <DropdownMenuItem>Edit</DropdownMenuItem>
                        <DropdownMenuItem className="text-red-500">Delete</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </CardHeader>
                  <CardContent className="flex-grow flex items-center justify-center bg-muted/30">
                    {item.mediaUrl ? (
                      <FileText className="h-16 w-16 text-muted-foreground" />
                    ) : (
                      <div className="text-center text-muted-foreground">
                        <AlertTriangle className="h-12 w-12 mx-auto mb-2" />
                        <p className="text-sm">No Media</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </CardItemWrapper>
            );
          })}
        </div>
      )}
    </div>
  );
}