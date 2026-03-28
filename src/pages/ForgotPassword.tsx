import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Helmet } from "react-helmet-async";
import { AlertCircle, ArrowLeft, Mail, CheckCircle, Shield, Lock, Eye, EyeOff } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { authApi } from "@/services/api";

type Step = 'email' | 'question' | 'success';

const ForgotPassword = () => {
    const navigate = useNavigate();
    const [step, setStep] = useState<Step>('email');
    const [email, setEmail] = useState("");
    const [securityQuestion, setSecurityQuestion] = useState("");
    const [securityAnswer, setSecurityAnswer] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState("");
    const [isLoading, setIsLoading] = useState(false);

    // Step 1: Submit email to get security question
    const handleEmailSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setIsLoading(true);

        if (!email || !email.includes("@")) {
            setError("Please enter a valid email address");
            setIsLoading(false);
            return;
        }

        try {
            const res = await authApi.forgotPassword(email);
            setSecurityQuestion(res.data.securityQuestion);
            setStep('question');
        } catch (err: unknown) {
            const error = err as { response?: { data?: { message?: string } } };
            setError(error.response?.data?.message || "Something went wrong. Please try again.");
        } finally {
            setIsLoading(false);
        }
    };

    // Step 2: Submit security answer and new password
    const handleResetSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setIsLoading(true);

        if (!securityAnswer) {
            setError("Please provide your security answer");
            setIsLoading(false);
            return;
        }

        if (!newPassword || newPassword.length < 6) {
            setError("Password must be at least 6 characters");
            setIsLoading(false);
            return;
        }

        if (newPassword !== confirmPassword) {
            setError("Passwords do not match");
            setIsLoading(false);
            return;
        }

        try {
            await authApi.verifySecurityAnswer({
                email,
                securityAnswer,
                newPassword
            });
            setStep('success');
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
                <title>Forgot Password - SportBuzz</title>
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
                            {step === 'email' && <Mail className="text-primary w-7 h-7" />}
                            {step === 'question' && <Shield className="text-primary w-7 h-7" />}
                            {step === 'success' && <CheckCircle className="text-green-500 w-7 h-7" />}
                        </div>
                        <div className="space-y-1">
                            <CardTitle className="text-2xl font-bold tracking-tight text-white">
                                {step === 'email' && "Forgot Password?"}
                                {step === 'question' && "Security Verification"}
                                {step === 'success' && "Password Reset!"}
                            </CardTitle>
                            <CardDescription className="text-slate-400">
                                {step === 'email' && "Enter your email to get your security question."}
                                {step === 'question' && "Answer your security question to reset password."}
                                {step === 'success' && "Your password has been updated successfully."}
                            </CardDescription>
                        </div>
                    </CardHeader>

                    <CardContent className="space-y-6 pb-8">
                        {/* Step 1: Email Form */}
                        {step === 'email' && (
                            <form onSubmit={handleEmailSubmit} className="space-y-5">
                                {error && (
                                    <Alert className="bg-red-500/10 border-red-500/20 animate-in fade-in slide-in-from-top-2">
                                        <AlertCircle className="h-4 w-4 text-red-500" />
                                        <AlertDescription className="text-red-400">{error}</AlertDescription>
                                    </Alert>
                                )}

                                <div className="space-y-2 group">
                                    <Label htmlFor="email" className="text-slate-300 ml-1 text-sm font-medium">
                                        Email Address
                                    </Label>
                                    <Input
                                        id="email"
                                        type="email"
                                        placeholder="name@example.com"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        className="bg-slate-950/50 border-slate-800 text-white placeholder:text-slate-600 h-11 pl-4 focus:border-red-500/50 focus:ring-red-500/20"
                                    />
                                </div>

                                <Button
                                    type="submit"
                                    disabled={isLoading}
                                    className="w-full h-11 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 text-white font-semibold shadow-lg shadow-red-600/20"
                                >
                                    {isLoading ? "Checking..." : "Continue"}
                                </Button>
                            </form>
                        )}

                        {/* Step 2: Security Question Form */}
                        {step === 'question' && (
                            <form onSubmit={handleResetSubmit} className="space-y-5">
                                {error && (
                                    <Alert className="bg-red-500/10 border-red-500/20 animate-in fade-in slide-in-from-top-2">
                                        <AlertCircle className="h-4 w-4 text-red-500" />
                                        <AlertDescription className="text-red-400">{error}</AlertDescription>
                                    </Alert>
                                )}

                                <div className="p-4 rounded-lg bg-slate-900/50 border border-slate-800">
                                    <p className="text-sm text-slate-400 mb-1">Your Security Question:</p>
                                    <p className="text-white font-medium">{securityQuestion}</p>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="securityAnswer" className="text-slate-300 ml-1 text-sm font-medium">
                                        Your Answer
                                    </Label>
                                    <Input
                                        id="securityAnswer"
                                        type="text"
                                        placeholder="Enter your answer..."
                                        value={securityAnswer}
                                        onChange={(e) => setSecurityAnswer(e.target.value)}
                                        className="bg-slate-950/50 border-slate-800 text-white placeholder:text-slate-600 h-11 pl-4 focus:border-red-500/50 focus:ring-red-500/20"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="newPassword" className="text-slate-300 ml-1 text-sm font-medium">
                                        New Password
                                    </Label>
                                    <div className="relative">
                                        <Input
                                            id="newPassword"
                                            type={showPassword ? "text" : "password"}
                                            placeholder="••••••••"
                                            value={newPassword}
                                            onChange={(e) => setNewPassword(e.target.value)}
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

                                <div className="space-y-2">
                                    <Label htmlFor="confirmPassword" className="text-slate-300 ml-1 text-sm font-medium">
                                        Confirm New Password
                                    </Label>
                                    <Input
                                        id="confirmPassword"
                                        type="password"
                                        placeholder="••••••••"
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                        className="bg-slate-950/50 border-slate-800 text-white placeholder:text-slate-600 h-11 pl-4 focus:border-red-500/50 focus:ring-red-500/20"
                                    />
                                </div>

                                <Button
                                    type="submit"
                                    disabled={isLoading}
                                    className="w-full h-11 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 text-white font-semibold shadow-lg shadow-red-600/20"
                                >
                                    {isLoading ? "Resetting..." : "Reset Password"}
                                </Button>
                            </form>
                        )}

                        {/* Step 3: Success */}
                        {step === 'success' && (
                            <div className="text-center space-y-4">
                                <div className="mx-auto w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mb-4">
                                    <CheckCircle className="text-green-500 w-8 h-8" />
                                </div>
                                <p className="text-slate-300">
                                    Your password has been reset successfully. You can now login with your new password.
                                </p>
                                <Button
                                    onClick={() => navigate("/login")}
                                    className="w-full h-11 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 text-white font-semibold shadow-lg shadow-red-600/20"
                                >
                                    Go to Login
                                </Button>
                            </div>
                        )}

                        {step !== 'success' && (
                            <div className="text-center">
                                <button
                                    onClick={() => step === 'question' ? setStep('email') : navigate("/login")}
                                    className="text-slate-400 hover:text-white text-sm flex items-center justify-center gap-2 mx-auto transition-colors"
                                >
                                    <ArrowLeft className="w-4 h-4" />
                                    {step === 'question' ? 'Change Email' : 'Back to Login'}
                                </button>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </>
    );
};

export default ForgotPassword;
