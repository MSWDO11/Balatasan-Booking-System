
"use client";

import { useState } from "react";
import { SmartNavbar } from "@/components/smart-navbar";
import { Footer } from "@/components/footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Mail, Lock, Loader2, UserPlus, LogIn, Eye, EyeOff, KeyRound } from "lucide-react";
import Image from "next/image";
import { useAuth, useFirestore, useDoc, useMemoFirebase } from "@/firebase";
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, sendPasswordResetEmail } from "firebase/auth";
import { useRouter } from "next/navigation";
import { useUser } from "@/firebase";
import { useEffect } from "react";
import { doc } from "firebase/firestore";

export default function LoginPage() {
  const [isSignUp, setIsSignUp] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [resetSent, setResetSent] = useState(false);
  const auth = useAuth();
  const { user } = useUser();
  const firestore = useFirestore();
  const router = useRouter();

  // Check if logged-in user is admin
  const adminDocRef = useMemoFirebase(
    () => (firestore && user) ? doc(firestore, "roles_admin", user.uid) : null,
    [firestore, user]
  );
  const { data: adminRole, isLoading: isAdminLoading } = useDoc(adminDocRef);
  const isMasterAdmin = user?.email?.toLowerCase() === "leonardalindat58@gmail.com";
  const isAdmin = isMasterAdmin || !!adminRole;

  useEffect(() => {
    if (!user) return;
    // For master admin email — redirect immediately, no Firestore check needed
    if (isMasterAdmin) { router.push("/admin/dashboard"); return; }
    // For other users — wait for admin role check to finish
    if (adminDocRef && isAdminLoading) return;
    if (!!adminRole) {
      router.push("/admin/dashboard");
    } else {
      router.push("/");
    }
  }, [user, isMasterAdmin, adminRole, isAdminLoading, adminDocRef, router]);

  const handleForgotPassword = async () => {
    if (!email.trim()) {
      setErrorMsg("Enter your email address above, then click Forgot Password.");
      return;
    }
    try {
      await sendPasswordResetEmail(auth, email.trim());
      setResetSent(true);
      setErrorMsg("");
    } catch {
      setErrorMsg("Could not send reset email. Check the address and try again.");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMsg("");

    try {
      if (isSignUp) {
        await createUserWithEmailAndPassword(auth, email, password);
      } else {
        await signInWithEmailAndPassword(auth, email, password);
      }
      // Success — useEffect handles redirect based on admin role
    } catch (err: any) {
      const code = err?.code ?? "";
      if (code === "auth/email-already-in-use")      setErrorMsg("This email is already registered. Try signing in instead.");
      else if (code === "auth/invalid-email")         setErrorMsg("That email address doesn't look right.");
      else if (code === "auth/weak-password")         setErrorMsg("Password must be at least 6 characters.");
      else if (code === "auth/wrong-password" ||
               code === "auth/invalid-credential")   setErrorMsg("Incorrect email or password.");
      else if (code === "auth/user-not-found")        setErrorMsg("No account found with that email.");
      else if (code === "auth/too-many-requests")     setErrorMsg("Too many attempts. Please wait a moment and try again.");
      else                                            setErrorMsg("Something went wrong. Please try again.");
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-secondary/10">
      <SmartNavbar />
      <main className="flex-grow flex items-center justify-center py-12 px-4">
        <Card className="w-full max-w-md border-none shadow-2xl">
          <CardHeader className="text-center space-y-2">
            <div className="mx-auto w-16 h-16 rounded-full overflow-hidden border-2 border-primary/20 shadow-md mb-2">
              <Image src="/logo.png" alt="Balatasan Logo" width={64} height={64} className="object-cover w-full h-full" />
            </div>
            <CardTitle className="text-3xl font-headline font-bold">
              {isSignUp ? "Create Account" : "Welcome Back"}
            </CardTitle>
            <CardDescription>
              {isSignUp 
                ? "Join Balatasan Stay and start planning your escape." 
                : "Sign in to manage your resort bookings."}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input 
                    id="email" 
                    type="email" 
                    placeholder="name@example.com" 
                    className="pl-10" 
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input 
                    id="password" 
                    type={showPassword ? "text" : "password"} 
                    placeholder="••••••••" 
                    className="pl-10 pr-10" 
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-primary transition-colors"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
              <div className="flex justify-center pt-2">
                <Button
                  type="submit"
                  disabled={isLoading}
                  className="w-full"
                  size="lg"
                >
                  {isLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : isSignUp ? (
                    <span className="flex items-center gap-2"><UserPlus className="h-4 w-4" /> Sign Up</span>
                  ) : (
                    <span className="flex items-center gap-2"><LogIn className="h-4 w-4" /> Sign In</span>
                  )}
                </Button>
              </div>
              {!isSignUp && (
                <div className="text-center">
                  <button
                    type="button"
                    onClick={handleForgotPassword}
                    className="text-xs text-primary hover:underline font-medium"
                  >
                    <KeyRound className="inline h-3 w-3 mr-1" />
                    Forgot password?
                  </button>
                  {resetSent && (
                    <p className="text-xs text-green-600 mt-1 font-medium">
                      Reset link sent — check your email.
                    </p>
                  )}
                </div>
              )}
              {/* Error message shown for both sign-in and sign-up */}
              {errorMsg && (
                <p className="text-xs text-destructive text-center font-medium">{errorMsg}</p>
              )}
            </form>
          </CardContent>
          <CardFooter className="flex flex-col space-y-4">
            <div className="relative w-full">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-card px-2 text-muted-foreground">Or continue with</span>
              </div>
            </div>
            <div className="flex justify-center">
              <Button 
                variant="outline" 
                size="lg"
                className="w-full"
                onClick={() => { setIsSignUp(!isSignUp); setErrorMsg(""); setResetSent(false); }}
                disabled={isLoading}
              >
                {isSignUp ? "Already have an account? Sign In" : "New to Balatasan? Create an account"}
              </Button>
            </div>
          </CardFooter>
        </Card>
      </main>
      <Footer />
    </div>
  );
}

