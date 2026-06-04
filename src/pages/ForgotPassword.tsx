import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Helmet } from "react-helmet-async";
import { AlertCircle, ArrowLeft, Mail, CheckCircle, Shield, Eye, EyeOff, KeyRound, MessageSquare, Lock } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { authApi } from "@/services/api";

type Step = 'email' | 'choose' | 'question' | 'otp' | 'otp-verify' | 'success';

const ForgotPassword = () => {
    const navigate = useNavigate();
    const [step, setStep] = useState<Step>('email');
    const [email, setEmail] = useState("");
    
    // Security Question state
    const [securityQuestion, setSecurityQuestion] = useState("");
    const [securityAnswer, setSecurityAnswer] = useState("");
    
    // OTP state
    const [otp, setOtp] = useState("");
    const [resetToken, setResetToken] = useState("");
    const [resendCooldown, setResendCooldown] = useState(0);
    const [resendAttempts, setResendAttempts] = useState(0);
    const [rateLimitActive, setRateLimitActive] = useState(false);
    
    // Password state
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    
    // UI state
    const [error, setError] = useState("");
    const [isLoading, setIsLoading] = useState(false);

    // Resend OTP countdown effect
    useEffect(() => {
        let timer: NodeJS.Timeout;
        if (resendCooldown > 0) {
            timer = setInterval(() => {
                setResendCooldown((prev) => prev - 1);
            }, 1000);
        }
        return () => {
            if (timer) clearInterval(timer);
        };
    }, [resendCooldown]);

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
            // Check if user exists by fetching security question
            const res = await authApi.forgotPassword(email);
            setSecurityQuestion(res.data.securityQuestion);
            setStep('choose');
        } catch (err: any) {
            setError(err.response?.data?.message || "Something went wrong. Please try again.");
        } finally {
            setIsLoading(false);
        }
    };

    // Step 2a: Send OTP
    // Always navigate to the OTP screen. If rate-limited, show a countdown
    // banner there instead of silently blocking.
    const handleSendOtp = async () => {
        setError("");
        setIsLoading(true);
        try {
            const res = await authApi.sendOtp(email);
            const data = res?.data || res;
            // Always open the OTP screen
            setStep('otp');
            setRateLimitActive(false);
            if (data?.rateLimitActive) {
                // Rate limited — show countdown, hide OTP input
                setRateLimitActive(true);
                setResendCooldown(data.secondsRemaining ?? 60);
            } else {
                // OTP sent successfully — start 60s cooldown
                setResendCooldown(60);
            }
        } catch (err: any) {
            // Unexpected error — show on choose screen
            setError(err.response?.data?.message || "Could not send OTP. Please try again.");
        } finally {
            setIsLoading(false);
        }
    };

    // Resend OTP
    const handleResendOtp = async () => {
        if (resendCooldown > 0) return;
        
        setError("");
        setIsLoading(true);
        try {
            const res = await authApi.resendOtp(email);
            const data = res?.data || res;
            if (data?.rateLimitActive) {
                setRateLimitActive(true);
                setResendCooldown(data.secondsRemaining ?? 60);
            } else {
                setRateLimitActive(false);
                setResendCooldown(60);
                setError("A new OTP has been sent to your email.");
            }
        } catch (err: any) {
            setError(err.response?.data?.message || "Could not resend OTP. Please try again.");
            if (err.response?.status === 429) {
                setResendCooldown(60);
            }
        } finally {
            setIsLoading(false);
        }
    };

    // Step 3a: Verify OTP
    const handleVerifyOtp = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setIsLoading(true);

        if (!otp || otp.length !== 6) {
            setError("Please enter a valid 6-digit OTP");
            setIsLoading(false);
            return;
        }

        try {
            const res = await (authApi as any).verifyOtp({ email, otp });
            setResetToken(res.data?.resetToken || res.data?.data?.resetToken);
            setStep('otp-verify');
        } catch (err: any) {
            setError(err.response?.data?.message || "Invalid or expired OTP");
        } finally {
            setIsLoading(false);
        }
    };

    // Step 4a: Reset Password via OTP Token
    const handleOtpResetSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setIsLoading(true);

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
            await (authApi as any).resetPasswordWithToken({
                token: resetToken,
                password: newPassword
            });
            setStep('success');
        } catch (err: any) {
            setError(err.response?.data?.message || "Something went wrong. Please try again.");
        } finally {
            setIsLoading(false);
        }
    };

    // Step 3b: Submit security answer and new password (Legacy Flow)
    const handleSecurityResetSubmit = async (e: React.FormEvent) => {
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
        } catch (err: any) {
            setError(err.response?.data?.message || "Something went wrong. Please try again.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <>
            <Helmet>
                <title>Forgot Password - SportsBuzz</title>
                <meta name="description" content="Reset your SportsBuzz password" />
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
                            {step === 'choose' && <KeyRound className="text-primary w-7 h-7" />}
                            {step === 'question' && <Shield className="text-primary w-7 h-7" />}
                            {step === 'otp' && <MessageSquare className="text-primary w-7 h-7" />}
                            {step === 'otp-verify' && <Lock className="text-primary w-7 h-7" />}
                            {step === 'success' && <CheckCircle className="text-green-500 w-7 h-7" />}
                        </div>
                        <div className="space-y-1">
                            <CardTitle className="text-2xl font-bold tracking-tight text-white">
                                {step === 'email' && "Forgot Password?"}
                                {step === 'choose' && "Choose Reset Method"}
                                {step === 'question' && "Security Verification"}
                                {step === 'otp' && "Verify OTP"}
                                {step === 'otp-verify' && "Create New Password"}
                                {step === 'success' && "Password Reset!"}
                            </CardTitle>
                            <CardDescription className="text-slate-400">
                                {step === 'email' && "Enter your email to reset your password."}
                                {step === 'choose' && "How would you like to reset your password?"}
                                {step === 'question' && "Answer your security question to reset password."}
                                {step === 'otp' && "Enter the 6-digit code sent to your email."}
                                {step === 'otp-verify' && "Enter your new password below."}
                                {step === 'success' && "Your password has been updated successfully."}
                            </CardDescription>
                        </div>
                    </CardHeader>

                    <CardContent className="space-y-6 pb-8">
                        {error && step !== 'choose' && step !== 'otp' && (
                            <Alert className="bg-red-500/10 border-red-500/20 animate-in fade-in slide-in-from-top-2">
                                <AlertCircle className="h-4 w-4 text-red-500" />
                                <AlertDescription className="text-red-400">{error}</AlertDescription>
                            </Alert>
                        )}

                        {/* Step 1: Email Form */}
                        {step === 'email' && (
                            <form onSubmit={handleEmailSubmit} className="space-y-5">
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

                        {/* Step 2: Choose Method */}
                        {step === 'choose' && (
                            <div className="space-y-4">
                                <Button 
                                    onClick={() => setStep('question')}
                                    className="w-full h-14 bg-slate-900 hover:bg-slate-800 border border-slate-800 flex items-center justify-start gap-4 px-4 transition-colors"
                                >
                                    <div className="bg-primary/20 p-2 rounded-lg">
                                        <Shield className="w-5 h-5 text-primary" />
                                    </div>
                                    <div className="text-left">
                                        <div className="text-white font-semibold">Answer Security Question</div>
                                        <div className="text-slate-400 text-xs font-normal">Use the question you set during signup</div>
                                    </div>
                                </Button>
                                
                                <Button 
                                    onClick={handleSendOtp}
                                    disabled={isLoading}
                                    className="w-full h-14 bg-slate-900 hover:bg-slate-800 border border-slate-800 flex items-center justify-start gap-4 px-4 transition-colors"
                                >
                                    <div className="bg-blue-500/20 p-2 rounded-lg">
                                        <Mail className="w-5 h-5 text-blue-400" />
                                    </div>
                                    <div className="text-left flex-1">
                                        <div className="text-white font-semibold">Get OTP via Email</div>
                                        <div className="text-slate-400 text-xs font-normal">Receive a code at {email}</div>
                                    </div>
                                    {isLoading && <span className="text-slate-400 text-sm">Sending...</span>}
                                </Button>
                            </div>
                        )}

                        {/* Step 3a: Enter OTP */}
                        {step === 'otp' && (
                            <div className="space-y-5">
                                {/* Rate-limit banner: shown when user clicked too soon */}
                                {rateLimitActive && resendCooldown > 0 && (
                                    <div className="flex flex-col items-center gap-3 p-5 rounded-xl bg-amber-500/10 border border-amber-500/30 animate-in fade-in slide-in-from-top-2">
                                        <div className="w-12 h-12 rounded-full bg-amber-500/20 flex items-center justify-center">
                                            <Mail className="w-6 h-6 text-amber-400" />
                                        </div>
                                        <p className="text-amber-300 font-semibold text-sm text-center">
                                            You requested an OTP recently.
                                        </p>
                                        <p className="text-slate-400 text-xs text-center">
                                            A code was already sent to <span className="text-white font-medium">{email}</span>.<br />
                                            Enter it below, or wait to request a new one.
                                        </p>
                                        {/* Countdown ring */}
                                        <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-slate-900 border border-slate-700">
                                            <span className="text-slate-400 text-xs">Resend available in</span>
                                            <span className="text-amber-400 font-bold text-sm tabular-nums">{resendCooldown}s</span>
                                        </div>
                                    </div>
                                )}

                                {/* When rate limit clears, rateLimitActive becomes false and normal UI shows */}
                                {(!rateLimitActive || resendCooldown === 0) && error && (
                                    <Alert className="bg-red-500/10 border-red-500/20 animate-in fade-in slide-in-from-top-2">
                                        <AlertCircle className="h-4 w-4 text-red-500" />
                                        <AlertDescription className={error.includes("sent") ? "text-green-400" : "text-red-400"}>{error}</AlertDescription>
                                    </Alert>
                                )}

                                <form onSubmit={handleVerifyOtp} className="space-y-5">
                                    <div className="space-y-2">
                                        <Label htmlFor="otp" className="text-slate-300 ml-1 text-sm font-medium">
                                            6-Digit OTP Code
                                        </Label>
                                        <Input
                                            id="otp"
                                            type="text"
                                            placeholder="Enter 6 digits"
                                            maxLength={6}
                                            value={otp}
                                            onChange={(e) => setOtp(e.target.value.replace(/[^0-9]/g, ''))}
                                            className="bg-slate-950/50 border-slate-800 text-white placeholder:text-slate-600 h-11 pl-4 text-center tracking-widest text-lg font-mono focus:border-blue-500/50 focus:ring-blue-500/20"
                                        />
                                        {rateLimitActive && resendCooldown > 0 && (
                                            <p className="text-xs text-slate-500 text-center mt-1">
                                                Use the OTP from your previous email — it is still valid.
                                            </p>
                                        )}
                                    </div>

                                    <div className="flex justify-between items-center text-sm px-1">
                                        <span className="text-slate-400">Didn't receive code?</span>
                                        <button
                                            type="button"
                                            disabled={resendCooldown > 0 || isLoading}
                                            onClick={() => { setRateLimitActive(false); handleResendOtp(); }}
                                            className={`font-medium transition-colors ${
                                                resendCooldown > 0
                                                    ? 'text-slate-600 cursor-not-allowed'
                                                    : 'text-blue-400 hover:text-blue-300'
                                            }`}
                                        >
                                            {resendCooldown > 0
                                                ? `Resend in ${resendCooldown}s`
                                                : 'Resend Code'}
                                        </button>
                                    </div>

                                    <Button
                                        type="submit"
                                        disabled={isLoading || otp.length !== 6}
                                        className="w-full h-11 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 text-white font-semibold shadow-lg shadow-blue-600/20"
                                    >
                                        {isLoading ? 'Verifying...' : 'Verify Code'}
                                    </Button>
                                </form>
                            </div>
                        )}

                        {/* Step 4a: Set New Password via OTP */}
                        {step === 'otp-verify' && (
                            <form onSubmit={handleOtpResetSubmit} className="space-y-5">
                                <div className="space-y-2">
                                    <Label htmlFor="newPasswordOtp" className="text-slate-300 ml-1 text-sm font-medium">
                                        New Password
                                    </Label>
                                    <div className="relative">
                                        <Input
                                            id="newPasswordOtp"
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
                                    <Label htmlFor="confirmPasswordOtp" className="text-slate-300 ml-1 text-sm font-medium">
                                        Confirm New Password
                                    </Label>
                                    <Input
                                        id="confirmPasswordOtp"
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

                        {/* Step 3b: Security Question Form (Legacy) */}
                        {step === 'question' && (
                            <form onSubmit={handleSecurityResetSubmit} className="space-y-5">
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
                                    <Label htmlFor="newPasswordSec" className="text-slate-300 ml-1 text-sm font-medium">
                                        New Password
                                    </Label>
                                    <div className="relative">
                                        <Input
                                            id="newPasswordSec"
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
                                    <Label htmlFor="confirmPasswordSec" className="text-slate-300 ml-1 text-sm font-medium">
                                        Confirm New Password
                                    </Label>
                                    <Input
                                        id="confirmPasswordSec"
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

                        {/* Step Last: Success */}
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

                        {/* Back Buttons */}
                        {step !== 'success' && (
                            <div className="text-center">
                                <button
                                    onClick={() => {
                                        setError("");
                                        if (step === 'email') navigate("/login");
                                        else if (step === 'choose') setStep('email');
                                        else if (step === 'question' || step === 'otp') setStep('choose');
                                        else if (step === 'otp-verify') setStep('otp');
                                    }}
                                    className="text-slate-400 hover:text-white text-sm flex items-center justify-center gap-2 mx-auto transition-colors mt-6"
                                >
                                    <ArrowLeft className="w-4 h-4" />
                                    {step === 'email' ? 'Back to Login' : 'Back'}
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
