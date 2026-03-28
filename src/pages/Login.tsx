import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Helmet } from "react-helmet-async";
import { AlertCircle, Activity, ArrowRight, BarChart3, TrendingUp, PieChart, Zap, Eye, EyeOff } from "lucide-react";
import { SportIcon } from "@/components/SportIcon";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { authApi } from "@/services/api";

const Login = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    if (!email || !password) {
      setError("Please fill in all fields");
      setIsLoading(false);
      return;
    }

    if (!email.includes("@")) {
      setError("Please enter a valid email");
      setIsLoading(false);
      return;
    }

    try {
      const res = await authApi.login({ email, password }) as any;
      
      const payloadData = res?.data || res;
      const token = payloadData?.token || res?.token;
      const user = payloadData?.user || res?.user;
      
      if (token && user) {
          localStorage.setItem('token', token);
          localStorage.setItem('user', typeof user === 'string' ? user : JSON.stringify(user));
          // Explicitly redirect with window.location to force full reload of React Tree to register token
          window.location.href = "/";
      } else {
          setError("Login succeeded but failed to receive session token. Server might be misconfigured.");
          setIsLoading(false);
          return;
      }
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      setError(error.response?.data?.message || "Login failed. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <Helmet>
        <title>Login - SportBuzz</title>
        <meta name="description" content="Login to SportBuzz" />
      </Helmet>

      <div className="min-h-screen relative flex items-center justify-center p-4 overflow-hidden bg-slate-950">
        {/* 3D Background Elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-red-600/20 rounded-full blur-[100px] animate-pulse" />
          <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-blue-600/10 rounded-full blur-[100px] animate-pulse delay-1000" />

          {/* Floating Shapes & Icons */}
          {/* Cricket - Top Right */}
          <div className="absolute top-[15%] right-[10%] animate-bounce duration-[4000ms]">
            <div className="w-16 h-16 bg-gradient-to-br from-green-500/20 to-transparent backdrop-blur-md rounded-xl border border-white/10 rotate-12 flex items-center justify-center shadow-[0_0_15px_rgba(34,197,94,0.3)]">
              <SportIcon sport="cricket" className="w-8 h-8 opacity-80" />
            </div>
          </div>

          {/* Football - Bottom Left */}
          <div className="absolute bottom-[20%] left-[8%] animate-bounce duration-[5000ms] delay-500">
            <div className="w-20 h-20 bg-gradient-to-br from-blue-500/20 to-transparent backdrop-blur-md rounded-full border border-white/10 -rotate-12 flex items-center justify-center shadow-[0_0_20px_rgba(59,130,246,0.3)]">
              <SportIcon sport="football" className="w-10 h-10 opacity-80" />
            </div>
          </div>

          {/* Basketball - Top Left */}
          <div className="absolute top-[25%] left-[15%] animate-bounce duration-[6000ms] delay-1000">
            <div className="w-14 h-14 bg-gradient-to-br from-orange-500/20 to-transparent backdrop-blur-md rounded-full border border-white/10 rotate-45 flex items-center justify-center shadow-[0_0_15px_rgba(249,115,22,0.3)]">
              <SportIcon sport="basketball" className="w-7 h-7 opacity-80" />
            </div>
          </div>

          {/* Tennis - Bottom Right */}
          <div className="absolute bottom-[25%] right-[15%] animate-bounce duration-[5500ms] delay-1500">
            <div className="w-12 h-12 bg-gradient-to-br from-yellow-500/20 to-transparent backdrop-blur-md rounded-xl border border-white/10 rotate-[-12deg] flex items-center justify-center shadow-[0_0_15px_rgba(234,179,8,0.3)]">
              <SportIcon sport="tennis" className="w-6 h-6 opacity-80" />
            </div>
          </div>

          {/* Analytics - Bar Chart - Mid Right */}
          <div className="absolute top-[50%] right-[5%] animate-pulse duration-[4000ms]">
            <div className="w-16 h-16 bg-gradient-to-br from-purple-500/10 to-transparent backdrop-blur-sm rounded-lg border border-white/5 flex items-center justify-center transform hover:scale-110 transition-transform">
              <BarChart3 className="text-purple-400/60 w-8 h-8" />
            </div>
          </div>

          {/* Analytics - Trending - Mid Left */}
          <div className="absolute top-[45%] left-[5%] animate-pulse duration-[4500ms] delay-700">
            <div className="w-14 h-14 bg-gradient-to-br from-cyan-500/10 to-transparent backdrop-blur-sm rounded-lg border border-white/5 flex items-center justify-center transform hover:scale-110 transition-transform">
              <TrendingUp className="text-cyan-400/60 w-7 h-7" />
            </div>
          </div>

          {/* Analytics - Pie Chart - Top Center (Subtle) */}
          <div className="absolute top-[10%] left-[50%] -translate-x-1/2 animate-bounce [animation-duration:8000ms] delay-200">
            <div className="w-12 h-12 bg-gradient-to-br from-pink-500/10 to-transparent backdrop-blur-sm rounded-full border border-white/5 flex items-center justify-center opacity-60">
              <PieChart className="text-pink-400/50 w-6 h-6" />
            </div>
          </div>
        </div>

        {/* Glassmorphic Card */}
        <Card className="w-full max-w-md relative z-10 bg-black/40 backdrop-blur-xl border-white/10 shadow-2xl overflow-hidden before:absolute before:inset-0 before:bg-gradient-to-b before:from-white/5 before:to-transparent before:pointer-events-none">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary via-blue-500 to-primary opacity-80" />

          <CardHeader className="space-y-4 pt-8 pb-6 text-center">
            <div className="mx-auto w-12 h-12 bg-primary/20 rounded-xl flex items-center justify-center shadow-lg shadow-primary/20 mb-2 transform hover:scale-105 transition-transform duration-300 backdrop-blur-sm border border-primary/20">
              <Zap className="text-primary w-7 h-7" fill="currentColor" />
            </div>
            <div className="space-y-1">
              <CardTitle className="text-3xl font-bold tracking-tight text-white">
                Welcome to <span className="gradient-text">SportBuzz</span>
              </CardTitle>
              <CardDescription className="text-slate-400 text-base">
                Compare players, analyze teams, and predict wins by venue.
              </CardDescription>
            </div>
          </CardHeader>

          <CardContent className="space-y-6 pb-8">
            <form onSubmit={handleLogin} className="space-y-5">
              {error && (
                <Alert className="bg-red-500/10 border-red-500/20 animate-in fade-in slide-in-from-top-2">
                  <AlertCircle className="h-4 w-4 text-red-500" />
                  <AlertDescription className="text-red-400">{error}</AlertDescription>
                </Alert>
              )}

              <div className="space-y-2 group">
                <Label htmlFor="email" className="text-slate-300 ml-1 text-sm font-medium transition-colors group-focus-within:text-red-500">
                  Email Address
                </Label>
                <div className="relative">
                  <Input
                    id="email"
                    type="email"
                    placeholder="name@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="bg-slate-950/50 border-slate-800 text-white placeholder:text-slate-600 h-11 pl-4 focus:border-red-500/50 focus:ring-red-500/20 transition-all duration-300 hover:border-slate-700"
                  />
                </div>
              </div>

              <div className="space-y-2 group">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password" className="text-slate-300 ml-1 text-sm font-medium transition-colors group-focus-within:text-red-500">
                    Password
                  </Label>
                  <button type="button" onClick={() => navigate("/forgot-password")} className="text-xs text-slate-500 hover:text-red-400 transition-colors">Forgot password?</button>
                </div>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="bg-slate-950/50 border-slate-800 text-white placeholder:text-slate-600 h-11 pl-4 pr-12 focus:border-red-500/50 focus:ring-red-500/20 transition-all duration-300 hover:border-slate-700"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-300 transition-colors"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <Button
                type="submit"
                disabled={isLoading}
                className="w-full h-11 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 text-white font-semibold shadow-lg shadow-red-600/20 transition-all duration-300 hover:shadow-red-600/40 hover:-translate-y-0.5 active:translate-y-0 text-base"
              >
                {isLoading ? (
                  "Signing in..."
                ) : (
                  <span className="flex items-center gap-2">
                    Sign In <ArrowRight className="w-4 h-4 ml-1 opacity-70" />
                  </span>
                )}
              </Button>
            </form>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-slate-800/50" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-black/40 px-2 text-slate-500">Or continue with</span>
              </div>
            </div>

            {/* Social Login Buttons */}
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => {
                  const apiBase = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
                  window.location.href = `${apiBase.replace('/api', '')}/api/auth/google`;
                }}
                className="flex items-center justify-center gap-2 px-4 py-3 rounded-lg bg-slate-900/50 border border-slate-800 hover:border-slate-700 hover:bg-slate-900/80 transition-all duration-300 group"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path fill="#EA4335" d="M5.26620003,9.76452941 C6.19878754,6.93863203 8.85444915,4.90909091 12,4.90909091 C13.6909091,4.90909091 15.2181818,5.50909091 16.4181818,6.49090909 L19.9090909,3 C17.7818182,1.14545455 15.0545455,0 12,0 C7.27006974,0 3.1977497,2.69829785 1.23999023,6.65002441 L5.26620003,9.76452941 Z" />
                  <path fill="#34A853" d="M16.0407269,18.0125889 C14.9509167,18.7163016 13.5660892,19.0909091 12,19.0909091 C8.86648613,19.0909091 6.21911939,17.076871 5.27698177,14.2678769 L1.23746264,17.3349879 C3.19279051,21.2936293 7.26500293,24 12,24 C14.9328362,24 17.7353462,22.9573905 19.834192,20.9995801 L16.0407269,18.0125889 Z" />
                  <path fill="#4A90E2" d="M19.834192,20.9995801 C22.0291676,18.9520994 23.4545455,15.903663 23.4545455,12 C23.4545455,11.2909091 23.3454545,10.5272727 23.1818182,9.81818182 L12,9.81818182 L12,14.4545455 L18.4363636,14.4545455 C18.1187732,16.013626 17.2662994,17.2212117 16.0407269,18.0125889 L19.834192,20.9995801 Z" />
                  <path fill="#FBBC05" d="M5.27698177,14.2678769 C5.03832634,13.556323 4.90909091,12.7937589 4.90909091,12 C4.90909091,11.2182781 5.03443647,10.4668121 5.26620003,9.76452941 L1.23999023,6.65002441 C0.43658717,8.26043162 0,10.0753848 0,12 C0,13.9195484 0.444780743,15.7301709 1.23746264,17.3349879 L5.27698177,14.2678769 Z" />
                </svg>
              </button>
              <button
                type="button"
                onClick={() => {
                  const apiBase = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
                  window.location.href = `${apiBase.replace('/api', '')}/api/auth/discord`;
                }}
                className="flex items-center justify-center gap-2 px-4 py-3 rounded-lg bg-[#5865F2]/20 border border-[#5865F2]/30 hover:bg-[#5865F2]/30 hover:border-[#5865F2]/50 transition-all duration-300 group"
              >
                <svg className="w-6 h-6 text-[#5865F2]" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037 13.46 13.46 0 0 0-1.063 2.193 18.42 18.42 0 0 0-4.57 0 13.56 13.56 0 0 0-1.064-2.193.074.074 0 0 0-.078-.037 19.736 19.736 0 0 0-4.885 1.515.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.118.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .085.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.086 2.157 2.419 0 1.334-.956 2.42-2.157 2.42zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.086 2.157 2.419 0 1.334-.946 2.42-2.157 2.42z" />
                </svg>
              </button>
            </div>

            <div className="text-center">
              <p className="text-slate-400 text-sm">
                New to SportBuzz?{" "}
                <button
                  onClick={() => navigate("/signup")}
                  className="text-red-500 hover:text-red-400 font-semibold transition-colors hover:underline decoration-red-500/30 underline-offset-4"
                >
                  Create an account
                </button>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
};

export default Login;
