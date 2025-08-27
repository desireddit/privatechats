// src/app/dashboard/chat/page.tsx

"use client";

import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Copy } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { generateVerificationId } from "@/app/actions"; // We will create this next

function VerificationPending() {
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
      <Card className="w-full max-w-lg">
        <CardHeader>
          <CardTitle>Verification Required</CardTitle>
          <CardDescription>
            To begin chatting, please complete the verification process.
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
                Generate Unique ID
              </Button>
            </>
          ) : (
            <div className="space-y-4">
              <p className="text-muted-foreground">
                Your verification ID is ready. Please send this ID to <span className="font-bold text-primary">u/desireddit4us</span> on Reddit via DM or as a comment on the verification post.
              </p>
              <div className="flex items-center justify-center gap-2 p-4 rounded-md bg-secondary">
                <p className="text-2xl font-bold tracking-widest text-accent">{uniqueId}</p>
                <Button variant="ghost" size="icon" onClick={copyToClipboard}>
                  <Copy className="h-5 w-5" />
                </Button>
              </div>
              <p className="text-sm text-muted-foreground">Once the admin approves your request, this page will unlock and you can begin chatting.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function ChatInterface() {
  // We will build the full chat UI here in a future step
  return (
    <div className="flex items-center justify-center h-full">
      <h1 className="text-2xl font-bold">Welcome! Chat is unlocked.</h1>
    </div>
  );
}


export default function ChatPage() {
  const { user, loading } = useAuth();

  if (loading) {
    return <div className="flex items-center justify-center h-full"><Loader2 className="h-8 w-8 animate-spin" /></div>;
  }

  // Conditionally render based on user's verification status
  if (user?.status === 'verified') {
    return <ChatInterface />;
  } else {
    return <VerificationPending />;
  }
}