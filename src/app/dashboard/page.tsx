// src/app/dashboard/page.tsx

"use client";

import { useState } from "react";
import { useAuth, UserProfile } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Copy, Send } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { generateVerificationId } from "@/app/actions";
import { Input } from "@/components/ui/input";

// Component for when the user's status is 'pending'
function VerificationPending({ userProfile }: { userProfile: UserProfile }) {
  const [uniqueId, setUniqueId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleGenerateId = async () => {
    setLoading(true);
    const result = await generateVerificationId();
    if (result.error) {
      toast({ variant: "destructive", title: "Error", description: result.error });
    } else if (result.uniqueId) {
      setUniqueId(result.uniqueId);
      toast({ title: "Success!", description: "Your unique ID has been generated." });
    }
    setLoading(false);
  };

  const copyToClipboard = () => {
    if (uniqueId) {
      navigator.clipboard.writeText(uniqueId);
      toast({ description: "Unique ID copied to clipboard!" });
    }
  };

  return (
    <div className="flex items-center justify-center h-full">
      <Card className="w-full max-w-lg bg-card/80 backdrop-blur-sm border-border/50">
        <CardHeader>
          <CardTitle>Verification Required</CardTitle>
          <CardDescription>
            Welcome, {userProfile.name}! To begin chatting, please complete the verification process.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6 text-center">
          {!uniqueId ? (
            <>
              <p className="text-muted-foreground">
                Click the button below to generate a unique ID. You will then need to send this ID to the admin on Reddit for approval.
              </p>
              <Button onClick={handleGenerateId} disabled={loading}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Generate My Unique ID
              </Button>
            </>
          ) : (
            <div className="space-y-4">
              <p className="text-muted-foreground">
                Your verification ID is ready. Please send this ID to <span className="font-bold text-primary">u/desireddit4us</span> on Reddit.
              </p>
              <div className="flex items-center justify-center gap-2 p-4 rounded-md bg-secondary">
                <p className="text-2xl font-bold tracking-widest text-accent">{uniqueId}</p>
                <Button variant="ghost" size="icon" onClick={copyToClipboard} aria-label="Copy ID">
                  <Copy className="h-5 w-5" />
                </Button>
              </div>
              <p className="text-sm text-muted-foreground">
                Once the admin approves your request, this page will unlock and you can begin chatting.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// Component for when the user's status is 'verified'
function ChatInterface({ userProfile }: { userProfile: UserProfile }) {
  // We will build the full chat UI here in a future step
  return (
    <div className="flex flex-col h-full max-w-3xl mx-auto">
      <div className="flex-grow p-4 space-y-4 overflow-y-auto">
        {/* Chat messages will go here */}
        <div className="text-center text-muted-foreground text-sm">
          You are now verified. You can start chatting with the admin.
        </div>
      </div>
      <div className="p-4 border-t border-border bg-card/80 backdrop-blur-sm">
        <div className="relative">
          <Input placeholder="Type your message..." className="pr-12 bg-input/50" />
          <Button size="icon" className="absolute top-1/2 right-2 -translate-y-1/2">
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const { userProfile, loading } = useAuth();

  if (loading) {
    return <div className="flex items-center justify-center h-[80vh]"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  if (!userProfile) {
    return <div className="flex items-center justify-center h-[80vh]"><p className="text-destructive">Could not load user profile. Please try logging in again.</p></div>;
  }
  
  // Conditionally render the correct UI based on user's verification status
  return (
    <div className="h-full">
      {userProfile.status === 'verified' ? (
        <ChatInterface userProfile={userProfile} />
      ) : (
        <VerificationPending userProfile={userProfile} />
      )}
    </div>
  );
}