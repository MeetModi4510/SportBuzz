import { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { Loader2, CheckCircle2, XCircle } from "lucide-react";

const OAuthCallback = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();

    useEffect(() => {
        const token = searchParams.get("token");
        const userData = searchParams.get("user");
        const error = searchParams.get("error");

        if (error) {
            // OAuth failed
            setTimeout(() => {
                navigate("/login?error=" + error);
            }, 2000);
            return;
        }

        if (token && userData) {
            // OAuth successful
            try {
                const user = JSON.parse(decodeURIComponent(userData));

                // Store authentication data
                localStorage.setItem("token", token);
                localStorage.setItem("user", JSON.stringify(user));

                // Redirect to dashboard
                setTimeout(() => {
                    navigate("/");
                }, 1500);
            } catch (err) {
                console.error("Failed to parse user data:", err);
                navigate("/login?error=invalid_data");
            }
        } else {
            // Missing required data
            navigate("/login?error=missing_data");
        }
    }, [searchParams, navigate]);

    const error = searchParams.get("error");

    return (
        <>
            <Helmet>
                <title>Authenticating - SportBuzz</title>
            </Helmet>

            <div className="min-h-screen flex items-center justify-center bg-slate-950">
                <div className="text-center space-y-4">
                    {error ? (
                        <>
                            <XCircle className="w-16 h-16 text-red-500 mx-auto animate-pulse" />
                            <h2 className="text-2xl font-bold text-white">Authentication Failed</h2>
                            <p className="text-slate-400">Redirecting to login...</p>
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
