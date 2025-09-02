import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { auth } from "@/api/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  LogIn, 
  AlertCircle, 
  Mail, 
  Lock, 
  Phone, 
  ArrowLeft,
} from "lucide-react";

// OAuth2 Google Sign-In component (extracted from debug page)
const GoogleOAuth2SignIn = ({ onSuccess, onError }) => {
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const handleMessage = (event) => {
      if (event.origin !== window.location.origin) return;
      
      console.log('Received OAuth2 callback message:', event.data);
      
      if (event.data.type === 'google-oauth-success') {
        setIsLoading(false);
        onSuccess(event.data.result);
        
        // Clear any intervals
        if (window.oauthCheckInterval) {
          clearInterval(window.oauthCheckInterval);
        }
      } else if (event.data.type === 'google-oauth-error') {
        setIsLoading(false);
        onError(new Error(event.data.error || 'OAuth2 authentication failed'));
        
        // Clear any intervals
        if (window.oauthCheckInterval) {
          clearInterval(window.oauthCheckInterval);
        }
      }
    };

    window.addEventListener('message', handleMessage);
    
    return () => {
      window.removeEventListener('message', handleMessage);
      if (window.oauthCheckInterval) {
        clearInterval(window.oauthCheckInterval);
      }
    };
  }, [onSuccess, onError]);

  const handleOAuth2Login = () => {
    setIsLoading(true);
    
    const clientId = '463551739763-nat3ea1vstq8ofld68qousutlg7gucap.apps.googleusercontent.com';
    const redirectUri = encodeURIComponent(window.location.origin + '/auth/google/callback');
    const scope = encodeURIComponent('openid email profile');
    const responseType = 'code';
    const state = Math.random().toString(36).substring(2, 15);
    
    sessionStorage.setItem('oauth_state', state);
    
    const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?` +
      `client_id=${clientId}&` +
      `redirect_uri=${redirectUri}&` +
      `scope=${scope}&` +
      `response_type=${responseType}&` +
      `state=${state}&` +
      `access_type=offline&` +
      `prompt=consent`;
    
    console.log('=== OAUTH2 DEBUG ===');
    console.log('OAuth2 URL:', authUrl);
    console.log('Redirect URI:', decodeURIComponent(redirectUri));
    console.log('Scopes:', decodeURIComponent(scope));
    console.log('State:', state);
    
    const popup = window.open(
      authUrl, 
      'google-oauth', 
      'width=500,height=600,scrollbars=yes,resizable=yes'
    );
    
    if (!popup) {
      setIsLoading(false);
      onError(new Error('Popup blocked. Please allow popups and try again.'));
      return;
    }
    
    // Check if popup was closed manually
    const checkClosed = setInterval(() => {
      if (popup.closed) {
        clearInterval(checkClosed);
        setIsLoading(false);
        // Only show error if we haven't already processed success/error
        if (isLoading) {
          onError(new Error('Google Sign-In was cancelled'));
        }
      }
    }, 1000);
    
    window.oauthCheckInterval = checkClosed;
  };

  return (
    <Button
      type="button"
      variant="outline"
      className="w-full flex items-center justify-center gap-3 py-3"
      onClick={handleOAuth2Login}
      disabled={isLoading}
    >
      <svg className="w-5 h-5" viewBox="0 0 24 24">
        <path
          fill="#4285F4"
          d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
        />
        <path
          fill="#34A853"
          d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
        />
        <path
          fill="#FBBC05"
          d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
        />
        <path
          fill="#EA4335"
          d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
        />
      </svg>
      {isLoading ? "Connecting..." : "Continue with Google"}
    </Button>
  );
};

// Production Microsoft Sign-In component using MSAL
const MicrosoftSignIn = ({ onSuccess, onError }) => {
  const [isLoading, setIsLoading] = useState(false);

  const handleMicrosoftLogin = async () => {
    setIsLoading(true);
    try {
      // Initialize MSAL (Microsoft Authentication Library)
      const { PublicClientApplication } = await import('@azure/msal-browser');
      
      const msalConfig = {
        auth: {
          clientId: import.meta.env.VITE_MICROSOFT_CLIENT_ID,
          authority: 'https://login.microsoftonline.com/common',
          redirectUri: window.location.origin,
        },
      };

      const msalInstance = new PublicClientApplication(msalConfig);
      await msalInstance.initialize();

      const loginRequest = {
        scopes: ['openid', 'profile', 'email'],
      };

      const response = await msalInstance.loginPopup(loginRequest);
      await onSuccess(response.accessToken || response.idToken);
    } catch (error) {
      onError(error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button
      type="button"
      variant="outline"
      className="w-full flex items-center justify-center gap-3 py-3"
      onClick={handleMicrosoftLogin}
      disabled={isLoading}
    >
      <svg className="w-5 h-5" viewBox="0 0 24 24">
        <path fill="#F25022" d="M1 1h10v10H1z"/>
        <path fill="#00A4EF" d="M13 1h10v10H13z"/>
        <path fill="#7FBA00" d="M1 13h10v10H1z"/>
        <path fill="#FFB900" d="M13 13h10v10H13z"/>
      </svg>
      {isLoading ? "Connecting..." : "Continue with Microsoft Account"}
    </Button>
  );
};

// Phone verification component with real SMS service
const PhoneVerification = ({ onSuccess, onBack }) => {
  const [step, setStep] = useState(1);
  const [phoneNumber, setPhoneNumber] = useState("");
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSendOTP = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      await auth.sendPhoneOTP(phoneNumber);
      setStep(2);
    } catch (err) {
      setError(err.error || "Failed to send OTP. Please check your phone number.");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const result = await auth.verifyPhoneOTP(phoneNumber, otp);
      onSuccess(result);
    } catch (err) {
      setError(err.error || "Invalid verification code. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (step === 1) {
    return (
      <div>
        <div className="flex items-center gap-2 mb-4">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onBack}
            className="p-1"
          >
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <h3 className="font-semibold">Enter your phone number</h3>
        </div>

        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <form onSubmit={handleSendOTP} className="space-y-4">
          <div>
            <Label htmlFor="phone">Phone Number</Label>
            <Input
              type="tel"
              id="phone"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              placeholder="+1 (555) 123-4567"
              required
            />
            <p className="text-xs text-gray-500 mt-1">
              Include country code (e.g., +1 for US)
            </p>
          </div>
          
          <Button type="submit" disabled={loading || !phoneNumber} className="w-full">
            {loading ? "Sending verification code..." : "Send verification code"}
          </Button>
        </form>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center gap-2 mb-4">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => setStep(1)}
          className="p-1"
        >
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <h3 className="font-semibold">Enter verification code</h3>
      </div>

      <p className="text-sm text-gray-600 mb-4">
        We sent a 6-digit verification code to {phoneNumber}
      </p>

      {error && (
        <Alert variant="destructive" className="mb-4">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <form onSubmit={handleVerifyOTP} className="space-y-4">
        <div>
          <Label htmlFor="otp">Verification Code</Label>
          <Input
            type="text"
            id="otp"
            value={otp}
            onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
            placeholder="123456"
            maxLength={6}
            required
          />
        </div>
        
        <Button type="submit" disabled={loading || otp.length !== 6} className="w-full">
          {loading ? "Verifying..." : "Verify code"}
        </Button>

        <Button
          type="button"
          variant="ghost"
          className="w-full text-sm"
          onClick={() => setStep(1)}
          disabled={loading}
        >
          Didn't receive code? Try different number
        </Button>
      </form>
    </div>
  );
};

export default function Login() {
  const navigate = useNavigate();
  const [currentView, setCurrentView] = useState("main");
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleEmailSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const result = await auth.login(formData);
      if (result.access) {
        navigate("/dashboard");
      }
    } catch (err) {
      setError(err.detail || err.error || "Invalid email or password");
    } finally {
      setLoading(false);
    }
  };

  // Updated Google login handler to use OAuth2 flow
  const handleGoogleSuccess = async (result) => {
    setLoading(true);
    setError("");

    try {
      console.log('Google OAuth2 success result:', result);
      
      // The result should contain the authentication data from the backend
      if (result.access) {
        navigate("/dashboard");
      } else {
        throw new Error('No access token received from Google authentication');
      }
    } catch (err) {
      console.error('Google login processing error:', err);
      setError(err.message || "Google authentication failed");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleError = (error) => {
    console.error('Google login error:', error);
    
    setError("");
    
    let errorMessage = "Google authentication failed. Please try again.";
    
    if (error.message?.includes('not configured') || error.message?.includes('unregistered_origin')) {
      errorMessage = "Google Sign-In is not properly configured for this domain. Please contact support or try email login.";
    } else if (error.message?.includes('popup blocked')) {
      errorMessage = "Google Sign-In popup was blocked. Please allow popups and try again.";
    } else if (error.message?.includes('cancelled')) {
      errorMessage = "Google Sign-In was cancelled.";
    } else if (error.message?.includes('Invalid state parameter')) {
      errorMessage = "Security validation failed. Please try again.";
    } else if (error.message) {
      errorMessage = error.message;
    }
    
    setError(errorMessage);
  };

  const handleSocialLogin = async (provider, token) => {
    setLoading(true);
    setError("");

    try {
      let result;
      switch (provider) {
        case "microsoft":
          result = await auth.microsoftLogin(token);
          break;
        default:
          throw new Error(`Unsupported provider: ${provider}`);
      }
      
      if (result.access) {
        navigate("/dashboard");
      }
    } catch (err) {
      setError(err.error || err.detail || `${provider} authentication failed`);
    } finally {
      setLoading(false);
    }
  };

  const handlePhoneSuccess = (result) => {
    if (result.access) {
      navigate("/dashboard");
    }
  };

  if (currentView === "email") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="flex items-center gap-2 mb-4">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setCurrentView("main")}
                className="p-1"
              >
                <ArrowLeft className="w-4 h-4" />
              </Button>
              <div className="mx-auto w-12 h-12 bg-[#72FD67] rounded-full flex items-center justify-center">
                <Mail className="w-6 h-6 text-[#1E1E1D]" />
              </div>
            </div>
            <CardTitle className="text-2xl font-bold">Sign in with Email</CardTitle>
          </CardHeader>
          
          <CardContent>
            {error && (
              <Alert variant="destructive" className="mb-4">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            
            <form onSubmit={handleEmailSubmit} className="space-y-4">
              <div>
                <Label htmlFor="email">Email Address</Label>
                <Input
                  type="email"
                  name="email"
                  id="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="Enter your email address"
                  required
                />
              </div>

              <div>
                <Label htmlFor="password">Password</Label>
                <Input
                  type="password"
                  name="password"
                  id="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Enter your password"
                  required
                />
              </div>

              <Button 
                type="submit" 
                disabled={loading}
                className="w-full bg-[#72FD67] hover:bg-green-400 text-[#1E1E1D] font-semibold"
              >
                {loading ? "Signing in..." : "Sign In"}
              </Button>
            </form>

            <div className="text-center mt-4">
              <a href="/forgot-password" className="text-sm text-blue-600 hover:underline">
                Forgot your password?
              </a>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (currentView === "phone") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto w-12 h-12 bg-[#72FD67] rounded-full flex items-center justify-center mb-4">
              <Phone className="w-6 h-6 text-[#1E1E1D]" />
            </div>
          </CardHeader>
          
          <CardContent>
            <PhoneVerification 
              onSuccess={handlePhoneSuccess}
              onBack={() => setCurrentView("main")}
            />
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto w-12 h-12 bg-[#72FD67] rounded-full flex items-center justify-center mb-4">
            <LogIn className="w-6 h-6 text-[#1E1E1D]" />
          </div>
          <CardTitle className="text-2xl font-bold">Log in or sign up</CardTitle>
          <p className="text-gray-600 mt-2">
            Welcome back! Please sign in to your account.
          </p>
        </CardHeader>
        
        <CardContent className="space-y-4">
          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <Button 
            onClick={() => setCurrentView("email")}
            className="w-full bg-[#72FD67] hover:bg-green-400 text-[#1E1E1D] font-semibold py-3"
            disabled={loading}
          >
            <Mail className="w-5 h-5 mr-2" />
            Continue with Email
          </Button>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-gray-50 px-2 text-gray-500">OR</span>
            </div>
          </div>

          <div className="space-y-3">
            <GoogleOAuth2SignIn 
              onSuccess={handleGoogleSuccess}
              onError={handleGoogleError}
            />

            <MicrosoftSignIn 
              onSuccess={(token) => handleSocialLogin("microsoft", token)}
              onError={(error) => setError("Microsoft authentication failed. Please try again.")}
            />

            <Button
              type="button"
              variant="outline"
              className="w-full flex items-center justify-center gap-3 py-3"
              onClick={() => setCurrentView("phone")}
              disabled={loading}
            >
              <Phone className="w-5 h-5" />
              Continue with phone
            </Button>
          </div>

          <div className="text-center text-xs text-gray-500 mt-6">
            By continuing, you agree to our{" "}
            <a href="/terms" className="underline hover:text-gray-700">Terms of Use</a>
            {" and "}
            <a href="/privacy" className="underline hover:text-gray-700">Privacy Policy</a>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}