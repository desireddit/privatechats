
"use client";

import { useEffect, useState, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { doc, onSnapshot, collection, updateDoc, getDoc, getDocs, query, orderBy, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Ban, CheckCircle, Loader2, Send } from 'lucide-react';
import { updateUserStatus } from '@/ai/flows/update-user-status';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { sendMessage } from '@/ai/flows/send-message';
import { useAuth } from '@/hooks/use-auth';

interface UserProfile {
    uid: string;
    displayName: string;
    email: string;
    status: 'pending' | 'verified' | 'blocked';
    uniqueId: string | null;
    photoURL?: string;
}

interface ContentItem {
  id: string;
  title: string;
  description: string;
}

interface Message {
    id: string;
    senderId: string;
    senderRole: 'user' | 'admin';
    body: string;
    createdAt: any;
}

export default function ManageUserPage() {
    const params = useParams();
    const router = useRouter();
    const { toast } = useToast();
    const { user: adminUser } = useAuth();
    const userId = params.id as string;

    const [user, setUser] = useState<UserProfile | null>(null);
    const [allContent, setAllContent] = useState<ContentItem[]>([]);
    const [userContentAccess, setUserContentAccess] = useState<Record<string, boolean>>({});
    const [messages, setMessages] = useState<Message[]>([]);
    const [newMessage, setNewMessage] = useState("");
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [sending, setSending] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement | null>(null);

    useEffect(() => {
        if (!userId) return;

        const userDocRef = doc(db, 'users', userId);
        const unsubscribeUser = onSnapshot(userDocRef, (doc) => {
            if (doc.exists()) {
                const userData = { uid: doc.id, ...doc.data() } as UserProfile;
                setUser(userData);
            } else {
                toast({ variant: 'destructive', title: 'Error', description: 'User not found.' });
                router.push('/admin/users');
            }
        });

        const fetchContentAndAccess = async () => {
             // Fetch all content
            const contentSnapshot = await getDocs(collection(db, "content"));
            const contentData = contentSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ContentItem));
            setAllContent(contentData);

            // Fetch user's access rights
            const accessData: Record<string, boolean> = {};
            await Promise.all(contentData.map(async (contentItem) => {
                const contentDoc = await getDoc(doc(db, 'content', contentItem.id));
                const allowedUsers = contentDoc.data()?.allowedUsers || {};
                accessData[contentItem.id] = !!allowedUsers[userId];
            }));
            setUserContentAccess(accessData);
        };
        
        const chatId = userId;
        const q = query(collection(db, "messages", chatId, "messages"), orderBy("createdAt", "asc"));
        const unsubscribeMessages = onSnapshot(q, (snapshot) => {
            const msgs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Message));
            setMessages(msgs);
        });

        const fetchAllData = async () => {
            setLoading(true);
            await fetchContentAndAccess();
            setLoading(false);
        }

        fetchAllData();

        return () => {
            unsubscribeUser();
            unsubscribeMessages();
        };
    }, [userId, router, toast]);
    
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);


    const handleUpdateStatus = async (newStatus: 'verified' | 'blocked') => {
        try {
            await updateUserStatus({ userId, status: newStatus });
            toast({ title: "Success", description: `User status updated to ${newStatus}.` });
        } catch (error: any) {
            toast({ variant: 'destructive', title: 'Error', description: `Failed to update status: ${error.message}` });
        }
    };
    
    const handleAccessChange = (contentId: string, checked: boolean) => {
        setUserContentAccess(prev => ({ ...prev, [contentId]: checked }));
    };

    const handleSaveChanges = async () => {
        setSaving(true);
        try {
            await Promise.all(Object.entries(userContentAccess).map(([contentId, hasAccess]) => {
                const contentRef = doc(db, 'content', contentId);
                return updateDoc(contentRef, {
                    [`allowedUsers.${userId}`]: hasAccess
                });
            }));
            toast({ title: "Success", description: "User access permissions have been updated." });
        } catch (error: any) {
            toast({ variant: 'destructive', title: 'Error', description: `Failed to save changes: ${error.message}` });
        } finally {
            setSaving(false);
        }
    };
    
     const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!adminUser || !newMessage.trim()) return;
        setSending(true);
        try {
          await sendMessage({
            chatId: userId, // Chat ID is the user's ID
            senderId: adminUser.uid,
            senderRole: 'admin',
            body: newMessage,
          });
          setNewMessage("");
        } catch (error: any) {
          toast({
            variant: "destructive",
            title: "Error",
            description: `Failed to send message: ${error.message}`,
          });
        } finally {
          setSending(false);
        }
    }


    const getStatusBadgeVariant = (status?: 'pending' | 'verified' | 'blocked') => {
        switch (status) {
            case 'verified': return 'default';
            case 'pending': return 'secondary';
            case 'blocked': return 'destructive';
            default: return 'outline';
        }
    };

    if (loading) {
        return <div className="flex items-center justify-center h-screen"><Loader2 className="animate-spin h-8 w-8" /></div>;
    }

    if (!user) {
        return <div className="text-center py-12">User not found.</div>;
    }

    return (
        <div className="mx-auto grid w-full max-w-6xl gap-6 lg:grid-cols-[1fr_350px]">
            <div className="flex flex-col gap-6">
                 <div className="flex items-center gap-4">
                    <Button variant="outline" size="icon" onClick={() => router.push('/admin/users')}>
                        <ArrowLeft className="h-4 w-4" />
                    </Button>
                    <h1 className="text-3xl font-bold tracking-tight">Manage User: {user.displayName}</h1>
                </div>

                <Card className="flex-1 flex flex-col">
                    <CardHeader>
                        <CardTitle>Chat with {user.displayName}</CardTitle>
                    </CardHeader>
                    <CardContent className="flex-1 flex flex-col p-0">
                        <ScrollArea className="flex-1 p-6">
                            <div className="space-y-6">
                                {messages.map((message) => {
                                    const isSenderAdmin = message.senderRole === 'admin';
                                    const justifyClass = isSenderAdmin ? 'justify-end' : 'justify-start';
                                    const avatarSrc = isSenderAdmin ? "https://picsum.photos/101" : user.photoURL || "https://picsum.photos/100";
                                    const avatarFallback = isSenderAdmin ? 'A' : user.displayName?.[0] || 'U';
                                    const name = isSenderAdmin ? 'You (Admin)' : user.displayName;
                                    const messageBg = isSenderAdmin ? 'bg-primary text-primary-foreground' : 'bg-muted';
                                    
                                    return (
                                        <div key={message.id} className={`flex items-start gap-4 ${justifyClass}`}>
                                             {!isSenderAdmin && (
                                                <Avatar className="h-9 w-9">
                                                    <AvatarImage src={avatarSrc} alt="Avatar" data-ai-hint="avatar"/>
                                                    <AvatarFallback>{avatarFallback}</AvatarFallback>
                                                </Avatar>
                                            )}
                                            <div className={`grid gap-1 ${isSenderAdmin ? 'text-right' : 'text-left'}`}>
                                                <p className="font-semibold text-sm">{name}</p>
                                                <div className={`rounded-lg p-3 max-w-sm ${messageBg}`}>
                                                    <p className="text-sm">{message.body}</p>
                                                </div>
                                            </div>
                                            {isSenderAdmin && (
                                                <Avatar className="h-9 w-9">
                                                    <AvatarImage src={avatarSrc} alt="Avatar" data-ai-hint="avatar" />
                                                    <AvatarFallback>{avatarFallback}</AvatarFallback>
                                                </Avatar>
                                            )}
                                        </div>
                                    )
                                })}
                            </div>
                            <div ref={messagesEndRef} />
                        </ScrollArea>
                        <div className="border-t p-4">
                            <form onSubmit={handleSendMessage} className="flex items-center gap-4">
                              <Input 
                                value={newMessage}
                                onChange={(e) => setNewMessage(e.target.value)}
                                placeholder="Type your message..."
                                disabled={sending} 
                                className="flex-1" />
                              <Button type="submit" disabled={sending} size="icon">
                                {sending ? <Loader2 className="h-4 w-4 animate-spin"/> : <Send className="h-4 w-4" />}
                                <span className="sr-only">Send</span>
                              </Button>
                            </form>
                        </div>
                    </CardContent>
                </Card>
            </div>
            
            <div className="flex flex-col gap-6">
                <Card>
                    <CardHeader>
                        <CardTitle>{user.displayName}</CardTitle>
                        <CardDescription>{user.email}</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex items-center gap-4">
                            <span className="font-medium">Status:</span>
                            <Badge variant={getStatusBadgeVariant(user.status)}>{user.status}</Badge>
                        </div>
                        <div className="flex items-center gap-4">
                            <span className="font-medium">Unique ID:</span>
                            <span className="font-mono text-sm">{user.uniqueId || 'N/A'}</span>
                        </div>
                    </CardContent>
                    <CardFooter className="flex gap-2 border-t px-6 py-4">
                        {user.status !== 'verified' && (
                            <Button onClick={() => handleUpdateStatus('verified')}>
                                <CheckCircle className="mr-2 h-4 w-4" /> Approve
                            </Button>
                        )}
                        {user.status !== 'blocked' && (
                            <Button variant="destructive" onClick={() => handleUpdateStatus('blocked')}>
                                <Ban className="mr-2 h-4 w-4" /> Block
                            </Button>
                        )}
                    </CardFooter>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Content Access</CardTitle>
                        <CardDescription>Grant or revoke access to private content for this user.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {allContent.length === 0 ? (
                            <p className="text-muted-foreground">No private content is available.</p>
                        ) : (
                            allContent.map(contentItem => (
                                <div key={contentItem.id} className="flex items-center justify-between p-2 rounded-md border">
                                    <div>
                                        <Label htmlFor={`access-${contentItem.id}`} className="font-medium">{contentItem.title}</Label>
                                        <p className="text-sm text-muted-foreground line-clamp-1">{contentItem.description}</p>
                                    </div>
                                    <Checkbox
                                        id={`access-${contentItem.id}`}
                                        checked={userContentAccess[contentItem.id] || false}
                                        onCheckedChange={(checked) => handleAccessChange(contentItem.id, !!checked)}
                                    />
                                </div>
                            ))
                        )}
                    </CardContent>
                     <CardFooter className="border-t px-6 py-4">
                        <Button onClick={handleSaveChanges} disabled={saving}>
                            {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Save Changes
                        </Button>
                    </CardFooter>
                </Card>
            </div>
        </div>
    );
}
