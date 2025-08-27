
"use client";

import { useState, useEffect, useRef } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Send, KeyRound, Copy, Loader2 } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/hooks/use-auth";
import { doc, onSnapshot, collection, query, orderBy } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { generateUniqueId } from "@/ai/flows/generate-unique-id";
import { sendMessage } from "@/ai/flows/send-message";
import { useToast } from "@/hooks/use-toast";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useAdmin } from "@/hooks/use-admin";

interface UserProfile {
  status: 'pending' | 'verified' | 'blocked';
  uniqueId: string | null;
  displayName: string;
  photoURL?: string;
}

interface Message {
    id: string;
    senderId: string;
    senderRole: 'user' | 'admin';
    body: string;
    createdAt: any;
}

export default function ChatPage() {
  const { user } = useAuth();
  const { isAdmin } = useAdmin();
  const { toast } = useToast();
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [generatingId, setGeneratingId] = useState(false);
  const [showIdDialog, setShowIdDialog] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);


  useEffect(() => {
    if (user) {
      const unsubProfile = onSnapshot(doc(db, "users", user.uid), (doc) => {
        if (doc.exists()) {
          setUserProfile(doc.data() as UserProfile);
        }
        setLoadingProfile(false);
      });

      const chatId = user.uid; // Chat is with the admin
      const q = query(collection(db, "messages", chatId, "messages"), orderBy("createdAt", "asc"));
      const unsubMessages = onSnapshot(q, (snapshot) => {
        const msgs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Message));
        setMessages(msgs);
      });

      return () => {
        unsubProfile();
        unsubMessages();
      };
    }
  }, [user]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);


  const handleGenerateId = async () => {
    if (!user) return;
    setGeneratingId(true);
    try {
      const result = await generateUniqueId({ userId: user.uid });
      if (result.uniqueId) {
        setUserProfile(prev => prev ? { ...prev, uniqueId: result.uniqueId } : null);
        setShowIdDialog(true);
      }
    } catch (error) {
      console.error("Error generating ID:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Could not generate a unique ID. Please try again."
      });
    } finally {
      setGeneratingId(false);
    }
  };

  const copyToClipboard = () => {
    if (userProfile?.uniqueId) {
      navigator.clipboard.writeText(userProfile.uniqueId);
      toast({
        title: "Copied!",
        description: "Your unique ID has been copied to the clipboard.",
      });
    }
  };
  
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !newMessage.trim()) return;
    setSending(true);
    try {
      await sendMessage({
        chatId: user.uid,
        senderId: user.uid,
        senderRole: isAdmin ? 'admin' : 'user',
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

  const isVerified = userProfile?.status === 'verified';
  const isChatDisabled = !isVerified || userProfile?.status === 'blocked';

  return (
    <>
      <div className="grid h-[calc(100vh_-_8rem)] w-full grid-cols-1 md:grid-cols-[300px_1fr] rounded-lg border">
        <div className="hidden border-r bg-card md:block">
          <div className="flex h-full max-h-screen flex-col gap-2">
            <div className="flex h-[60px] items-center border-b px-6">
              <h2 className="font-semibold text-lg">Chats</h2>
            </div>
            <div className="flex-1 overflow-auto py-2">
              <nav className="grid items-start px-4 text-sm font-medium">
                <div className="flex cursor-pointer items-center gap-3 rounded-lg bg-muted px-3 py-2 text-primary transition-all hover:text-primary">
                  <Avatar className="h-9 w-9">
                    <AvatarImage src="https://picsum.photos/101" alt="Admin" data-ai-hint="avatar" />
                    <AvatarFallback>A</AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <p className="font-semibold">desireddit4us</p>
                    <p className="text-xs text-muted-foreground">Admin</p>
                  </div>
                </div>
              </nav>
            </div>
          </div>
        </div>
        <div className="flex flex-col">
          <header className="flex h-[60px] items-center gap-4 border-b bg-card px-6">
            <div className="flex items-center gap-3">
              <Avatar className="h-9 w-9">
                <AvatarImage src="https://picsum.photos/101" alt="Admin" data-ai-hint="avatar" />
                <AvatarFallback>A</AvatarFallback>
              </Avatar>
              <h3 className="font-semibold">desireddit4us</h3>
            </div>
          </header>
          <main className="flex-1 flex flex-col p-6 gap-4">
            {!isVerified && userProfile?.status !== 'blocked' && (
              <Card className="text-center shadow-lg bg-secondary">
                <CardHeader>
                  <CardTitle>
                    {userProfile?.uniqueId ? "Verification Pending" : "Verify Your Account"}
                  </CardTitle>
                  <CardDescription>
                    {userProfile?.uniqueId
                      ? "Share your Unique ID with the admin to get verified."
                      : "To get full access, you need to verify your account."
                    }
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                   {userProfile?.uniqueId ? (
                    <div className="flex items-center justify-center gap-2 p-2 rounded-md bg-background border">
                        <span className="font-mono text-sm">{userProfile.uniqueId}</span>
                        <Button variant="ghost" size="icon" onClick={copyToClipboard}>
                            <Copy className="h-4 w-4" />
                        </Button>
                    </div>
                  ) : (
                    <Button size="lg" onClick={handleGenerateId} disabled={generatingId || loadingProfile}>
                      {generatingId ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <KeyRound className="mr-2 h-4 w-4" />}
                      {generatingId ? "Generating..." : "Generate Unique ID"}
                    </Button>
                  )}
                  <p className="text-xs text-muted-foreground mt-2">
                    Then, DM this ID to the admin on Reddit or comment on the verification post.
                  </p>
                </CardContent>
              </Card>
            )}
            
            <ScrollArea className="flex-1 pr-4">
                <div className="space-y-6">
                    {messages.map((message) => {
                        const isSenderAdmin = message.senderRole === 'admin';
                        const justifyClass = isSenderAdmin ? 'justify-start' : 'justify-end';
                        const avatarSrc = isSenderAdmin ? "https://picsum.photos/101" : user?.photoURL || "https://picsum.photos/100";
                        const avatarFallback = isSenderAdmin ? 'A' : userProfile?.displayName?.[0] || 'U';
                        const name = isSenderAdmin ? 'desireddit4us' : 'You';
                        const messageBg = isSenderAdmin ? 'bg-muted' : 'bg-primary text-primary-foreground';
                        
                        return (
                            <div key={message.id} className={`flex items-start gap-4 ${justifyClass}`}>
                                {isSenderAdmin && (
                                     <Avatar className="h-9 w-9">
                                        <AvatarImage src={avatarSrc} alt="Avatar" data-ai-hint="avatar" />
                                        <AvatarFallback>{avatarFallback}</AvatarFallback>
                                    </Avatar>
                                )}
                                <div className={`grid gap-1 ${isSenderAdmin ? 'text-left' : 'text-right'}`}>
                                    <p className="font-semibold text-sm">{name}</p>
                                    <div className={`rounded-lg p-3 max-w-xs ${messageBg}`}>
                                        <p className="text-sm">{message.body}</p>
                                    </div>
                                </div>
                                {!isSenderAdmin && (
                                    <Avatar className="h-9 w-9">
                                        <AvatarImage src={avatarSrc} alt="Avatar" data-ai-hint="avatar"/>
                                        <AvatarFallback>{avatarFallback}</AvatarFallback>
                                    </Avatar>
                                )}
                            </div>
                        )
                    })}
                     {!isVerified && messages.length > 0 && (
                        <div className="flex items-start gap-4">
                          <Avatar className="h-9 w-9">
                            <AvatarImage src="https://picsum.photos/101" alt="Admin" data-ai-hint="avatar" />
                            <AvatarFallback>A</AvatarFallback>
                          </Avatar>
                          <div className="grid gap-1">
                            <p className="font-semibold text-sm">desireddit4us</p>
                            <div className="rounded-lg bg-muted p-3 max-w-xs">
                              <p className="text-sm italic text-muted-foreground">[System] Your messages are limited until you are verified.</p>
                            </div>
                          </div>
                        </div>
                       )}
                </div>
                <div ref={messagesEndRef} />
            </ScrollArea>

            <Separator />
            <form onSubmit={handleSendMessage} className="flex items-center gap-4">
              <Input 
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder={isChatDisabled ? "Verification is required to send messages..." : "Type your message..."} 
                disabled={isChatDisabled || sending} 
                className="flex-1" />
              <Button type="submit" disabled={isChatDisabled || sending} size="icon">
                {sending ? <Loader2 className="h-4 w-4 animate-spin"/> : <Send className="h-4 w-4" />}
                <span className="sr-only">Send</span>
              </Button>
            </form>
          </main>
        </div>
      </div>
      <AlertDialog open={showIdDialog} onOpenChange={setShowIdDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Your Unique ID is Ready!</AlertDialogTitle>
            <AlertDialogDescription>
              Copy this ID and send it to the admin on Reddit for verification.
            </AlertDialogDescription>
          </AlertDialogHeader>
           <div className="flex items-center justify-center gap-2 p-3 rounded-md bg-muted border">
                <span className="font-mono text-lg">{userProfile?.uniqueId}</span>
                <Button variant="outline" size="icon" onClick={copyToClipboard}>
                    <Copy className="h-5 w-5" />
                </Button>
            </div>
          <AlertDialogFooter>
            <AlertDialogAction onClick={() => setShowIdDialog(false)}>Got it</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

