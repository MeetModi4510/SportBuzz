import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { Loader2, CheckCircle2, XCircle } from "lucide-react";

const OAuthCallback = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const [status, setStatus] = useState<'loading' | 'error'>('loading');
    const [errorMsg, setErrorMsg] = useState('');

    useEffect(() => {
        const token = searchParams.get("token");
        const userData = searchParams.get("user");
        const error = searchParams.get("error");

        if (error) {
            setStatus('error');
            setErrorMsg('OAuth authentication failed');
            setTimeout(() => {
                navigate("/login?error=" + error);
            }, 2000);
            return;
        }

        if (token && userData) {
            // Store token first
            localStorage.setItem("token", token);

            // Try to get full user data from API to match email login format
            fetch('/api/auth/me', {
                headers: { 'Authorization': `Bearer ${token}` }
            })
            .then(res => res.json())
            .then(data => {
                if (data.success && data.data?.user) {
                    // Store full user data (with role, etc.) - matches email login
                    localStorage.setItem("user", JSON.stringify(data.data.user));
                } else {
                    // Fallback: use the user data from URL params
                    try {
                        const user = JSON.parse(decodeURIComponent(userData));
                        localStorage.setItem("user", JSON.stringify(user));
                    } catch {
                        localStorage.setItem("user", userData);
                    }
                }
                // Redirect to dashboard
                window.location.href = "/";
            })
            .catch(() => {
                // API call failed - still try with URL data
                try {
                    const user = JSON.parse(decodeURIComponent(userData));
                    localStorage.setItem("user", JSON.stringify(user));
                } catch {
                    localStorage.setItem("user", userData);
                }
                window.location.href = "/";
            });
        } else {
            setStatus('error');
            setErrorMsg('Missing authentication data');
            setTimeout(() => {
                navigate("/login?error=missing_data");
            }, 2000);
        }
    }, [searchParams, navigate]);

    return (
        <>
            <Helmet>
                <title>Authenticating - SportBuzz</title>
            </Helmet>

            <div className="min-h-screen flex items-center justify-center bg-slate-950">
                <div className="text-center space-y-4">
                    {status === 'error' ? (
                        <>
                            <XCircle className="w-16 h-16 text-red-500 mx-auto animate-pulse" />
                            <h2 className="text-2xl font-bold text-white">Authentication Failed</h2>
                            <p className="text-slate-400">{errorMsg || 'Redirecting to login...'}</p>
                        </>
                    ) : (
                        <>
                            <div className="relative">
                                <Loader2 className="w-16 h-16 text-primary mx-auto animate-spin" />
                                <CheckCircle2 className="w-8 h-8 text-primary absolute top-4 left-1/2 -translate-x-1/2 opacity-0 animate-ping" />
                            </div>
                            <h2 className="text-2xl font-bold gradient-text">Signing you in...</h2>
                            <p className="text-slate-400">Please wait a moment</p>
                        </>
                    )}
                </div>
            </div>
        </>
    );
};

export default OAuthCallback;
