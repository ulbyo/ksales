
import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useSearchParams, Link } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Spinner } from "@/components/ui/Spinner";

type AuthMode = "login" | "signup" | "reset";

const Auth = () => {
  const [searchParams] = useSearchParams();
  const resetMode = searchParams.get("reset") === "true";
  const { signIn, signUp, resetPassword, loading } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [mode, setMode] = useState<AuthMode>(resetMode ? "reset" : "login");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      if (mode === "login") {
        await signIn(email, password);
      } else if (mode === "signup") {
        if (password !== confirmPassword) {
          throw new Error("Passwords do not match");
        }
        await signUp(email, password);
      } else if (mode === "reset") {
        await resetPassword(email);
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <Spinner />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-black p-4">
      <div className="w-full max-w-md">
        <Link to="/" className="text-white hover:text-gray-300 block mb-8 text-sm">
          ← Back to Home
        </Link>
        
        <Card className="bg-black border-gray-800 text-white shadow-lg backdrop-blur-md bg-opacity-80">
          <CardHeader>
            <CardTitle className="text-xl font-semibold">K-Pop Album Pulse</CardTitle>
            <CardDescription className="text-gray-400 text-xs">
              {mode === "login" ? "Sign in to your account" : mode === "signup" ? "Create a new account" : "Reset your password"}
            </CardDescription>
          </CardHeader>
          
          {mode !== "reset" ? (
            <Tabs value={mode} onValueChange={(v) => setMode(v as AuthMode)}>
              <TabsList className="grid grid-cols-2 mb-6 bg-gray-900">
                <TabsTrigger value="login" className="text-xs">Login</TabsTrigger>
                <TabsTrigger value="signup" className="text-xs">Sign Up</TabsTrigger>
              </TabsList>
              
              <TabsContent value="login">
                <form onSubmit={handleSubmit}>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <label htmlFor="email" className="text-xs font-medium text-gray-300 block">
                        Email
                      </label>
                      <Input
                        id="email"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        placeholder="your@email.com"
                        className="bg-gray-900 border-gray-700 text-xs"
                      />
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <label htmlFor="password" className="text-xs font-medium text-gray-300 block">
                          Password
                        </label>
                        <button
                          type="button"
                          onClick={() => setMode("reset")}
                          className="text-xs text-gray-400 hover:text-white"
                        >
                          Forgot password?
                        </button>
                      </div>
                      <Input
                        id="password"
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        placeholder="••••••••"
                        className="bg-gray-900 border-gray-700 text-xs"
                      />
                    </div>
                  </CardContent>
                  <CardFooter>
                    <Button 
                      type="submit" 
                      className="w-full bg-white text-black hover:bg-gray-200 text-xs"
                      disabled={submitting}
                    >
                      {submitting ? <Spinner size="sm" className="border-black mr-2" /> : null}
                      Sign In
                    </Button>
                  </CardFooter>
                </form>
              </TabsContent>
              
              <TabsContent value="signup">
                <form onSubmit={handleSubmit}>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <label htmlFor="signup-email" className="text-xs font-medium text-gray-300 block">
                        Email
                      </label>
                      <Input
                        id="signup-email"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        placeholder="your@email.com"
                        className="bg-gray-900 border-gray-700 text-xs"
                      />
                    </div>
                    <div className="space-y-2">
                      <label htmlFor="signup-password" className="text-xs font-medium text-gray-300 block">
                        Password
                      </label>
                      <Input
                        id="signup-password"
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        placeholder="••••••••"
                        className="bg-gray-900 border-gray-700 text-xs"
                      />
                    </div>
                    <div className="space-y-2">
                      <label htmlFor="confirm-password" className="text-xs font-medium text-gray-300 block">
                        Confirm Password
                      </label>
                      <Input
                        id="confirm-password"
                        type="password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        required
                        placeholder="••••••••"
                        className="bg-gray-900 border-gray-700 text-xs"
                      />
                    </div>
                  </CardContent>
                  <CardFooter>
                    <Button 
                      type="submit"
                      className="w-full bg-white text-black hover:bg-gray-200 text-xs"
                      disabled={submitting}
                    >
                      {submitting ? <Spinner size="sm" className="border-black mr-2" /> : null}
                      Create Account
                    </Button>
                  </CardFooter>
                </form>
              </TabsContent>
            </Tabs>
          ) : (
            <form onSubmit={handleSubmit}>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <label htmlFor="reset-email" className="text-xs font-medium text-gray-300 block">
                    Email
                  </label>
                  <Input
                    id="reset-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    placeholder="your@email.com"
                    className="bg-gray-900 border-gray-700 text-xs"
                  />
                </div>
                <p className="text-gray-400 text-xs">
                  Enter your email address and we'll send you a link to reset your password.
                </p>
              </CardContent>
              <CardFooter className="flex flex-col gap-4">
                <Button 
                  type="submit"
                  className="w-full bg-white text-black hover:bg-gray-200 text-xs"
                  disabled={submitting}
                >
                  {submitting ? <Spinner size="sm" className="border-black mr-2" /> : null}
                  Send Reset Link
                </Button>
                <Button 
                  type="button"
                  variant="outline"
                  className="w-full text-xs border-gray-700 hover:bg-gray-900"
                  onClick={() => setMode("login")}
                >
                  Back to Login
                </Button>
              </CardFooter>
            </form>
          )}
        </Card>
      </div>
    </div>
  );
};

export default Auth;
