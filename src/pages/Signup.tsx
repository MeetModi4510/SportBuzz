import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Helmet } from "react-helmet-async";
import { AlertCircle, ArrowRight, BarChart3, TrendingUp, PieChart, UserPlus, Eye, EyeOff } from "lucide-react";
import { SportIcon } from "@/components/SportIcon";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { authApi } from "@/services/api";

const Signup = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    password: "",
    confirmPassword: "",
    securityQuestion: "",
    securityAnswer: "",
  });
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    // Validation
    if (!formData.fullName || !formData.email || !formData.password || !formData.confirmPassword) {
      setError("Please fill in all fields");
      setIsLoading(false);
      return;
    }

    if (!formData.email.includes("@")) {
      setError("Please enter a valid email");
      setIsLoading(false);
      return;
    }

    if (formData.password.length < 6) {
      setError("Password must be at least 6 characters");
      setIsLoading(false);
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match");
      setIsLoading(false);
      return;
    }

    if (!formData.securityQuestion || !formData.securityAnswer) {
      setError("Please select a security question and provide an answer");
      setIsLoading(false);
      return;
    }

    try {
      // Call backend API
      const res = await authApi.signup({
        fullName: formData.fullName,
        email: formData.email,
        password: formData.password,
        securityQuestion: formData.securityQuestion,
        securityAnswer: formData.securityAnswer
      }) as any;
      
      const payloadData = res?.data || res;
      const token = payloadData?.token || res?.token;
      const user = payloadData?.user || res?.user;
      
      if (token && user) {
          localStorage.setItem('token', token);
          localStorage.setItem('user', typeof user === 'string' ? user : JSON.stringify(user));
          window.location.href = "/";
      } else {
          setError("Account created but failed to receive session token.");
          setIsLoading(false);
          return;
      }
    } catch (err: any) {
      console.error("Signup error:", err);
      if (err.response) {
        // The request was made and the server responded with a status code
        const data = err.response.data;
        if (typeof data === 'string' && data.includes('<html')) {
           setError("Backend server is not reachable. Is it running on port 5000?");
        } else {
           setError(data?.message || `Signup failed with status ${err.response.status}`);
        }
      } else if (err.request) {
        // The request was made but no response was received
        setError("Network error: Could not reach the server.");
      } else {
        // Something happened in setting up the request that triggered an Error
        setError(err.message || "Signup failed. Please try again.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <Helmet>
        <title>Sign Up - SportBuzz</title>
        <meta name="description" content="Create a new SportBuzz account" />
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

          <CardHeader className="space-y-4 pt-8 pb-4 text-center">
            <div className="mx-auto w-12 h-12 bg-primary/20 rounded-xl flex items-center justify-center shadow-lg shadow-primary/20 mb-2 transform hover:scale-105 transition-transform duration-300 backdrop-blur-sm border border-primary/20">
              <UserPlus className="text-primary w-7 h-7" />
            </div>
            <div className="space-y-1">
              <CardTitle className="text-3xl font-bold tracking-tight text-white">
                Join <span className="gradient-text">SportBuzz</span>
              </CardTitle>
              <CardDescription className="text-slate-400 text-base">
                Create an account to get started
              </CardDescription>
            </div>
          </CardHeader>

          <CardContent className="space-y-5 pb-8">
            <form onSubmit={handleSignup} className="space-y-4">
              {error && (
                <Alert className="bg-red-500/10 border-red-500/20 animate-in fade-in slide-in-from-top-2">
                  <AlertCircle className="h-4 w-4 text-red-500" />
                  <AlertDescription className="text-red-400">{error}</AlertDescription>
                </Alert>
              )}

              <div className="space-y-2 group">
                <Label htmlFor="fullName" className="text-slate-300 ml-1 text-sm font-medium transition-colors group-focus-within:text-red-500">
                  Full Name
                </Label>
                <Input
                  id="fullName"
                  type="text"
                  name="fullName"
                  placeholder="John Doe"
                  value={formData.fullName}
                  onChange={handleChange}
                  className="bg-slate-950/50 border-slate-800 text-white placeholder:text-slate-600 h-11 pl-4 focus:border-red-500/50 focus:ring-red-500/20 transition-all duration-300 hover:border-slate-700"
                />
              </div>

              <div className="space-y-2 group">
                <Label htmlFor="email" className="text-slate-300 ml-1 text-sm font-medium transition-colors group-focus-within:text-red-500">
                  Email Address
                </Label>
                <Input
                  id="email"
                  type="email"
                  name="email"
                  placeholder="name@example.com"
                  value={formData.email}
                  onChange={handleChange}
                  className="bg-slate-950/50 border-slate-800 text-white placeholder:text-slate-600 h-11 pl-4 focus:border-red-500/50 focus:ring-red-500/20 transition-all duration-300 hover:border-slate-700"
                />
              </div>

              <div className="space-y-2 group">
                <Label htmlFor="password" className="text-slate-300 ml-1 text-sm font-medium transition-colors group-focus-within:text-red-500">
                  Password
                </Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    name="password"
                    placeholder="••••••••"
                    value={formData.password}
                    onChange={handleChange}
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

              <div className="space-y-2 group">
                <Label htmlFor="confirmPassword" className="text-slate-300 ml-1 text-sm font-medium transition-colors group-focus-within:text-red-500">
                  Confirm Password
                </Label>
                <div className="relative">
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    name="confirmPassword"
                    placeholder="••••••••"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    className="bg-slate-950/50 border-slate-800 text-white placeholder:text-slate-600 h-11 pl-4 pr-12 focus:border-red-500/50 focus:ring-red-500/20 transition-all duration-300 hover:border-slate-700"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-300 transition-colors"
                  >
                    {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <div className="space-y-2 group">
                <Label htmlFor="securityQuestion" className="text-slate-300 ml-1 text-sm font-medium transition-colors group-focus-within:text-red-500">
                  Security Question
                </Label>
                <select
                  id="securityQuestion"
                  name="securityQuestion"
                  value={formData.securityQuestion}
                  onChange={(e) => setFormData(prev => ({ ...prev, securityQuestion: e.target.value }))}
                  className="w-full h-11 px-4 rounded-md bg-slate-950/50 border border-slate-800 text-white focus:outline-none focus:border-red-500/50 focus:ring-2 focus:ring-red-500/20 transition-all duration-300 hover:border-slate-700"
                >
                  <option value="" className="bg-slate-900">Select a security question...</option>
                  <option value="What is your pet's name?" className="bg-slate-900">What is your pet's name?</option>
                  <option value="What city were you born in?" className="bg-slate-900">What city were you born in?</option>
                  <option value="What is your mother's maiden name?" className="bg-slate-900">What is your mother's maiden name?</option>
                  <option value="What was your first car?" className="bg-slate-900">What was your first car?</option>
                  <option value="What is your favorite sports team?" className="bg-slate-900">What is your favorite sports team?</option>
                  <option value="What is your childhood nickname?" className="bg-slate-900">What is your childhood nickname?</option>
                </select>
              </div>

              <div className="space-y-2 group">
                <Label htmlFor="securityAnswer" className="text-slate-300 ml-1 text-sm font-medium transition-colors group-focus-within:text-red-500">
                  Security Answer
                </Label>
                <Input
                  id="securityAnswer"
                  type="text"
                  name="securityAnswer"
                  placeholder="Your answer..."
                  value={formData.securityAnswer}
                  onChange={handleChange}
                  className="bg-slate-950/50 border-slate-800 text-white placeholder:text-slate-600 h-11 pl-4 focus:border-red-500/50 focus:ring-red-500/20 transition-all duration-300 hover:border-slate-700"
                />
              </div>

              <Button
                type="submit"
                disabled={isLoading}
                className="w-full h-11 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 text-white font-semibold shadow-lg shadow-red-600/20 transition-all duration-300 hover:shadow-red-600/40 hover:-translate-y-0.5 active:translate-y-0 text-base mt-2"
              >
                {isLoading ? (
                  "Creating account..."
                ) : (
                  <span className="flex items-center gap-2">
                    Create Account <ArrowRight className="w-4 h-4 ml-1 opacity-70" />
                  </span>
                )}
              </Button>
            </form>

            <div className="text-center pt-2">
              <p className="text-slate-400 text-sm">
                Already have an account?{" "}
                <button
                  onClick={() => navigate("/login")}
                  className="text-red-500 hover:text-red-400 font-semibold transition-colors hover:underline decoration-red-500/30 underline-offset-4"
                >
                  Login here
                </button>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
};

export default Signup;
