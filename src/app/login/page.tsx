// src/app/login/page.tsx

"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { createUser, signInUser } from "../actions"; // We will create this file next

export default function LoginPage() {
  const { toast } = useToast();
  const [loginRedditUsername, setLoginRedditUsername] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [signupName, setSignupName] = useState("");
  const [signupRedditUsername, setSignupRedditUsername] = useState("");
  const [signupPassword, setSignupPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSignUp = async () => {
    setLoading(true);
    const result = await createUser({
      name: signupName,
      redditUsername: signupRedditUsername,
      password: signupPassword,
    });

    if (result.error) {
      toast({
        variant: "destructive",
        title: "Sign Up Failed",
        description: result.error,
      });
    } else {
      toast({
        title: "Account Created!",
        description: "Please log in with your new credentials.",
      });
      // Optionally switch to the login tab
    }
    setLoading(false);
  };

  const handleSignIn = async () => {
    setLoading(true);
    const result = await signInUser({
      redditUsername: loginRedditUsername,
      password: loginPassword,
    });

    if (result.error) {
      toast({
        variant: "destructive",
        title: "Sign In Failed",
        description: result.error,
      });
    } else {
      // On successful login, Next.js will automatically redirect
      // to the dashboard if you set up middleware (we'll do this later).
      // For now, you can manually redirect if needed.
      window.location.href = '/dashboard';
    }
    setLoading(false);
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-background">
      <Tabs defaultValue="login" className="w-[400px]">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="login">Login</TabsTrigger>
          <TabsTrigger value="signup">Sign Up</TabsTrigger>
        </TabsList>
        <TabsContent value="login">
          <Card>
            <CardHeader>
              <CardTitle>Login</CardTitle>
              <CardDescription>
                Enter your Reddit Username and password to access your account.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="login-reddit-username">Reddit Username</Label>
                <Input
                  id="login-reddit-username"
                  value={loginRedditUsername}
                  onChange={(e) => setLoginRedditUsername(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="login-password">Password</Label>
                <Input
                  id="login-password"
                  type="password"
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  required
                />
              </div>
            </CardContent>
            <CardFooter>
              <Button onClick={handleSignIn} disabled={loading} className="w-full">
                {loading ? "Signing In..." : "Sign In"}
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
        <TabsContent value="signup">
          <Card>
            <CardHeader>
              <CardTitle>Sign Up</CardTitle>
              <CardDescription>
                Create a new account. Your Reddit username will be verified by the admin.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="signup-name">Name</Label>
                <Input
                  id="signup-name"
                  value={signupName}
                  onChange={(e) => setSignupName(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="signup-reddit-username">Reddit Username</Label>
                <Input
                  id="signup-reddit-username"
                  value={signupRedditUsername}
                  onChange={(e) => setSignupRedditUsername(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="signup-password">Password</Label>
                <Input
                  id="signup-password"
                  type="password"
                  value={signupPassword}
                  onChange={(e) => setSignupPassword(e.target.value)}
                  required
                />
              </div>
            </CardContent>
            <CardFooter>
              <Button onClick={handleSignUp} disabled={loading} className="w-full">
                {loading ? "Creating Account..." : "Create Account"}
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}