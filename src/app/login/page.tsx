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

  // in src/app/login/page.tsx

// ... (keep all the state and handlers the same)

  return (
    <div className="flex items-center justify-center min-h-screen bg-background p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-primary tracking-wider">
            PrivateChats
          </h1>
          <p className="text-muted-foreground mt-2">
            Enter the shadows. Your private world awaits.
          p>
        </div>
        <Tabs defaultValue="login" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="login">Login</TabsTrigger>
            <TabsTrigger value="signup">Sign Up</TabsTrigger>
          </TabsList>
          {/* LOGIN TAB */}
          <TabsContent value="login">
            <Card className="bg-card/80 backdrop-blur-sm border-border/50">
              <CardHeader>
                <CardTitle>Welcome Back</CardTitle>
                <CardDescription>
                  Enter your credentials to access your world.
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
                    className="bg-input/50"
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
                    className="bg-input/50"
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
          {/* SIGNUP TAB */}
          <TabsContent value="signup">
            <Card className="bg-card/80 backdrop-blur-sm border-border/50">
              <CardHeader>
                <CardTitle>Create Your Account</CardTitle>
                <CardDescription>
                  Your Reddit username will be verified by the admin.
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
                    className="bg-input/50"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-reddit-username">Reddit Username</Label>
                  <Input
                    id="signup-reddit-username"
                    value={signupRedditUsername}
                    onChange={(e) => setSignupRedditUsername(e.target.value)}
                    required
                    className="bg-input/50"
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
                    className="bg-input/50"
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
    </div>
  );