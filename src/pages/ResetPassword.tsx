import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Helmet } from "react-helmet-async";
import { AlertCircle, Lock, CheckCircle, Eye, EyeOff } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import axios from "axios";

const ResetPassword = () => {
    const navigate = useNavigate();
    const { token } = useParams<{ token: string }>();
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setSuccess("");
        setIsLoading(true);

        if (!password || !confirmPassword) {
            setError("Please fill in all fields");
            setIsLoading(false);
            return;
        }

        if (password.length < 6) {
            setError("Password must be at least 6 characters");
            setIsLoading(false);
            return;
        }

        if (password !== confirmPassword) {
            setError("Passwords do not match");
            setIsLoading(false);
            return;
        }

        const API_BASE = import.meta.env.VITE_API_URL 
            ? import.meta.env.VITE_API_URL 
            : (import.meta.env.PROD ? '/api' : 'http://localhost:5000/api');
        try {
            const response = await axios.post(`${API_BASE}/auth/reset-password/${token}`, { password });
            setSuccess(response.data.message);
            setTimeout(() => {
                navigate("/login");
            }, 2000);
        } catch (err: unknown) {
            const error = err as { response?: { data?: { message?: string } } };
            setError(error.response?.data?.message || "Something went wrong. Please try again.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <>
            <Helmet>
                <title>Reset Password - SportBuzz</title>
                <meta name="description" content="Reset your SportBuzz password" />
            </Helmet>

            <div className="min-h-screen relative flex items-center justify-center p-4 overflow-hidden bg-slate-950">
                {/* Background Elements */}
                <div className="absolute inset-0 overflow-hidden">
                    <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-red-600/20 rounded-full blur-[100px] animate-pulse" />
                    <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-blue-600/10 rounded-full blur-[100px] animate-pulse delay-1000" />
                </div>

                {/* Card */}
                <Card className="w-full max-w-md relative z-10 bg-black/40 backdrop-blur-xl border-white/10 shadow-2xl overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary via-blue-500 to-primary opacity-80" />

                    <CardHeader className="space-y-4 pt-8 pb-6 text-center">
                        <div className="mx-auto w-12 h-12 bg-primary/20 rounded-xl flex items-center justify-center shadow-lg shadow-primary/20 mb-2">
                            <Lock className="text-primary w-7 h-7" />
                        </div>
                        <div className="space-y-1">
                            <CardTitle className="text-2xl font-bold tracking-tight text-white">
                                Reset Password
                            </CardTitle>
                            <CardDescription className="text-slate-400">
                                Enter your new password below.
                            </CardDescription>
                        </div>
                    </CardHeader>

                    <CardContent className="space-y-6 pb-8">
                        <form onSubmit={handleSubmit} className="space-y-5">
                            {error && (
                                <Alert className="bg-red-500/10 border-red-500/20 animate-in fade-in slide-in-from-top-2">
                                    <AlertCircle className="h-4 w-4 text-red-500" />
                                    <AlertDescription className="text-red-400">{error}</AlertDescription>
                                </Alert>
                            )}

                            {success && (
                                <Alert className="bg-green-500/10 border-green-500/20 animate-in fade-in slide-in-from-top-2">
                                    <CheckCircle className="h-4 w-4 text-green-500" />
                                    <AlertDescription className="text-green-400">{success}</AlertDescription>
                                </Alert>
                            )}

                            <div className="space-y-2 group">
                                <Label htmlFor="password" className="text-slate-300 ml-1 text-sm font-medium">
                                    New Password
                                </Label>
                                <div className="relative">
                                    <Input
                                        id="password"
                                        type={showPassword ? "text" : "password"}
                                        placeholder="••••••••"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        className="bg-slate-950/50 border-slate-800 text-white placeholder:text-slate-600 h-11 pl-4 pr-12 focus:border-red-500/50 focus:ring-red-500/20"
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
                                <Label htmlFor="confirmPassword" className="text-slate-300 ml-1 text-sm font-medium">
                                    Confirm Password
                                </Label>
                                <div className="relative">
                                    <Input
                                        id="confirmPassword"
                                        type={showConfirmPassword ? "text" : "password"}
                                        placeholder="••••••••"
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                        className="bg-slate-950/50 border-slate-800 text-white placeholder:text-slate-600 h-11 pl-4 pr-12 focus:border-red-500/50 focus:ring-red-500/20"
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

                            <Button
                                type="submit"
                                disabled={isLoading}
                                className="w-full h-11 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 text-white font-semibold shadow-lg shadow-red-600/20"
                            >
                                {isLoading ? "Resetting..." : "Reset Password"}
                            </Button>
                        </form>
                    </CardContent>
                </Card>
            </div>
        </>
    );
};

export default ResetPassword;
