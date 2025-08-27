// src/app/admin/login/page.tsx

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { signInAdmin } from "@/app/actions"; // We will add this function next
import { getAuth, signInWithCustomToken } from "firebase/auth";

export default function AdminLoginPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [username, setUsername] = useState("desireddit4us"); // Pre-filled for convenience
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleAdminSignIn = async () => {
    setLoading(true);
    const result = await signInAdmin({ username, password });

    if (result.error || !result.token) {
      toast({
        variant: "destructive",
        title: "Admin Login Failed",
        description: result.error || "An unknown error occurred.",
      });
      setLoading(false);
      return;
    }

    try {
      // Use the custom token from the server to sign in on the client
      const auth = getAuth();
      await signInWithCustomToken(auth, result.token);
      
      toast({
        title: "Admin Login Successful",
        description: "Redirecting to the dashboard...",
      });
      
      // Redirect to the main admin page after successful login
      router.push("/admin/users");
    } catch (error) {
      console.error("Firebase custom token sign-in error:", error);
      toast({
        variant: "destructive",
        title: "Firebase Error",
        description: "Could not sign in with custom token.",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-background">
      <Card className="w-[400px]">
        <CardHeader className="text-center">
          <CardTitle>Admin Portal</CardTitle>
          <CardDescription>
            Enter your administrator credentials to continue.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="admin-username">Username</Label>
            <Input
              id="admin-username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="admin-password">Password</Label>
            <Input
              id="admin-password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAdminSignIn()}
              required
            />
          </div>
          <Button onClick={handleAdminSignIn} disabled={loading} className="w-full">
            {loading ? "Authenticating..." : "Login"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}