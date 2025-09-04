import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useNavigate } from 'react-router-dom';
import { 
  Mail, 
  AlertCircle, 
  ArrowLeft,
  CheckCircle,
  Lock
} from "lucide-react";

// Import your API functions - FIXED: Added missing import
import { auth } from '@/api/client.js';
import { sendPasswordReset } from "@/api/integrations";

export default function ForgotPassword() {
  const navigate = useNavigate(); // ✅ Only navigation hook declaration
  const [step, setStep] = useState(1); // 1: email input, 2: success message, 3: reset form
  const [email, setEmail] = useState("");
  const [resetData, setResetData] = useState({
    token: "",
    newPassword: "",
    confirmPassword: ""
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Check for token in URL on component mount
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const tokenFromUrl = urlParams.get('token');
    
    if (tokenFromUrl) {
      setResetData(prev => ({ ...prev, token: tokenFromUrl }));
      setStep(3); // Go directly to reset form
    }
  }, []);

  // FIXED: Simplified and corrected logic
  const handleSendReset = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      // Step 1: Generate the reset token
      const tokenResponse = await auth.forgotPassword(email);
      
      if (!tokenResponse.token) {
        throw new Error("Failed to generate reset token");
      }

      // Step 2: Use hardcoded settings (no auth required)
      const settings = {
        company_name: "Your App",
        primary_color: "#72FD67",
        secondary_color: "#1E1E1D",
        accent_color: "#F2F2F2",
        email_theme: "light",
        company_email: "",
        company_phone: "",
        company_address: ""
      };

      // Step 3: Create the reset URL
      const resetUrl = `${window.location.origin}/reset-password?token=${tokenResponse.token}`;

      // Step 4: Apply email theme colors
      const isDarkEmail = settings.email_theme === "dark";
      const isContrastEmail = settings.email_theme === "contrast";
      
      let emailBgColor, emailContainerBg, emailTextColor, emailLightTextColor, emailDetailBoxBg, emailBorderColor;
      
      if (isDarkEmail) {
        emailBgColor = "#1a1a1a";
        emailContainerBg = "#2a2a2a";
        emailTextColor = "#ffffff";
        emailLightTextColor = "#cccccc";
        emailDetailBoxBg = "#333333";
        emailBorderColor = "#404040";
      } else if (isContrastEmail) {
        emailBgColor = "#ffffff";
        emailContainerBg = "#ffffff";
        emailTextColor = "#1E1E1D";
        emailLightTextColor = "#666666";
        emailDetailBoxBg = "#1a1a1a";
        emailBorderColor = "#333333";
      } else {
        // Light theme
        emailBgColor = "#F2F2F2";
        emailContainerBg = "white";
        emailTextColor = "#1E1E1D";
        emailLightTextColor = "#666";
        emailDetailBoxBg = settings.accent_color;
        emailBorderColor = "#E0E0E0";
      }

      // Step 5: Create HTML email content
      const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1">
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,200;12..96,300;12..96,400;12..96,500;12..96,600;12..96,700;12..96,800&display=swap');
            body { 
              font-family: 'Bricolage Grotesque', -apple-system, sans-serif; 
              margin: 0; 
              padding: 20px; 
              background: ${emailBgColor}; 
              line-height: 1.6;
            }
            .container { 
              max-width: 600px; 
              margin: 0 auto; 
              background: ${emailContainerBg}; 
              border-radius: 16px; 
              overflow: hidden; 
              box-shadow: 0 20px 50px rgba(0,0,0,0.1); 
            }
            .header { 
              background: ${settings.primary_color};
              color: ${settings.secondary_color}; 
              padding: 40px; 
              text-align: center; 
            }
            .logo { 
              width: 80px; 
              height: 80px; 
              margin: 0 auto 20px; 
              display: flex; 
              align-items: center; 
              justify-content: center; 
              border-radius: 16px;
              background: ${settings.secondary_color}; 
              color: ${settings.primary_color};
              font-size: 32px;
            }
            .content { 
              padding: 40px; 
            }
            .detail-box { 
              background: ${emailDetailBoxBg}; 
              padding: 24px; 
              border-radius: 12px; 
              margin: 20px 0;
              ${isContrastEmail ? `border: 1px solid ${emailBorderColor};` : ''}
            }
            .reset-button { 
              display: inline-block; 
              background: linear-gradient(135deg, ${settings.primary_color} 0%, #5DE055 100%); 
              color: ${settings.secondary_color}; 
              padding: 16px 32px; 
              text-decoration: none; 
              border-radius: 12px; 
              font-weight: 700; 
              font-size: 16px;
              margin: 20px 0; 
              transition: transform 0.2s;
            }
            .reset-button:hover {
              transform: translateY(-2px);
            }
            .footer { 
              background: ${emailDetailBoxBg}; 
              padding: 30px 40px; 
              text-align: center; 
              border-top: 1px solid ${emailBorderColor}; 
              ${isContrastEmail ? `border: 1px solid ${emailBorderColor}; border-top: none;` : ''}
            }
            h1 { 
              margin: 0; 
              font-size: 17px; 
              font-weight: 500; 
            }
            h2 { 
              margin: 0 0 10px 0; 
              font-size: 24px; 
              font-weight: 600; 
              color: ${emailTextColor}; 
            }
            h3 { 
              margin: 0 0 15px 0; 
              font-size: 18px; 
              font-weight: 600; 
              color: ${emailTextColor}; 
            }
            p { 
              margin: 0 0 12px 0; 
              color: ${emailLightTextColor}; 
              font-size: 15px;
            }
            .highlight { 
              color: ${emailTextColor}; 
              font-weight: 600; 
            }
            .security-note { 
              background: ${isDarkEmail ? '#2d1b1b' : isContrastEmail ? '#fef2f2' : '#fef2f2'}; 
              border: 1px solid ${isDarkEmail ? '#4a2626' : isContrastEmail ? '#fecaca' : '#fecaca'}; 
              border-radius: 8px; 
              padding: 16px; 
              margin: 20px 0; 
              color: ${isDarkEmail ? '#f87171' : isContrastEmail ? '#991b1b' : '#991b1b'}; 
            }
            .url-box { 
              background: ${emailDetailBoxBg}; 
              padding: 16px; 
              border-radius: 8px; 
              margin: 20px 0; 
              border: 1px solid ${emailBorderColor};
              word-break: break-all;
              font-family: monospace;
              font-size: 14px;
              color: ${emailTextColor};
            }
            ${isContrastEmail ? `
            .content h2, .content h3 { color: #ffffff; }
            .content .highlight { color: #ffffff; }
            .content p { color: #cccccc; }
            .detail-box .highlight { color: #ffffff; }
            ` : ''}
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Autolab Integration Studios</h1>
            </div>
            
            <div class="content">
              <h2>Password Reset Request</h2>
              
              <p>Hello,</p>
              
              <p>We received a request to reset the password for your account associated with <span class="highlight">${email}</span>.</p>
              
              <p>Click the button below to reset your password:</p>
              
              <div style="text-align: center; margin: 30px 0;">
                <a href="${resetUrl}" class="reset-button">Reset Your Password</a>
              </div>
              
              <div class="detail-box">
                <h3>Can't click the button?</h3>
                <p>Copy and paste this link in your browser:</p>
                <div class="url-box">${resetUrl}</div>
              </div>
              
              <div class="security-note">
                <h3 style="margin-top: 0; color: inherit;">🔒 Security Notice</h3>
                <ul style="margin: 10px 0; padding-left: 20px;">
                  <li>This reset link will expire in 24 hours</li>
                  <li>If you didn't request this reset, please ignore this email</li>
                  <li>Never share this link with anyone</li>
                  <li>For security, this link can only be used once</li>
                </ul>
              </div>
              
              <div class="detail-box">
                <h3>Need help?</h3>
                <p>If you're having trouble resetting your password or didn't request this reset, please contact our support team.</p>
                ${settings.company_email ? `<p><span class="highlight">Email:</span> ${settings.company_email}</p>` : ''}
                ${settings.company_phone ? `<p><span class="highlight">Phone:</span> ${settings.company_phone}</p>` : ''}
              </div>
            </div>
            
            <div class="footer">
              <p class="highlight" style="margin-bottom: 15px; font-size: 16px;">This is an automated security email from ${settings.company_name}</p>
              ${settings.company_address ? `<p style="margin-bottom: 8px;">${settings.company_address}</p>` : ''}
              <p style="font-size: 12px; color: ${emailLightTextColor};">
                This email was sent because a password reset was requested for your account. 
                If you didn't make this request, you can safely ignore this email.
              </p>
            </div>
          </div>
        </body>
        </html>
      `;

      // Step 6: Create plain text version
      const plainTextBody = `
Password Reset Request

Hello,

We received a request to reset the password for your account associated with ${email}.

Reset your password by clicking this link: ${resetUrl}

This link will expire in 24 hours.

If you didn't request this reset, please ignore this email.

Best regards,
${settings.company_name} Team

---
This is an automated security email. If you need help, please contact support.
${settings.company_email ? `Email: ${settings.company_email}` : ''}
${settings.company_phone ? `Phone: ${settings.company_phone}` : ''}
      `.trim();

      // Step 7: Send email using unauthenticated endpoint
      await sendPasswordReset({
        to: email,
        subject: `Password Reset - ${settings.company_name}`,
        body: plainTextBody,
        html_message: htmlContent
      });

      setStep(2); // Move to success step
      
    } catch (err) {
      console.error('Password reset error:', err);
      let errorMessage = "Failed to send reset email. Please try again.";
      
      if (err.response?.data?.error) {
        errorMessage = err.response.data.error;
      } else if (err.detail) {
        errorMessage = err.detail;
      } else if (err.error) {
        errorMessage = err.error;
      } else if (err.message) {
        errorMessage = err.message;
      } else if (typeof err === 'string') {
        errorMessage = err;
      }
      
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Handle password reset with token
  const handleResetPassword = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    // Client-side validation
    if (resetData.newPassword !== resetData.confirmPassword) {
      setError("Passwords do not match");
      setLoading(false);
      return;
    }

    if (resetData.newPassword.length < 8) {
      setError("Password must be at least 8 characters long");
      setLoading(false);
      return;
    }

    try {
      const response = await auth.resetPassword(resetData.token, resetData.newPassword);
      
      // ✅ FIXED: Navigate to login after successful password reset
      navigate("/login", { 
        state: { message: "Password reset successfully. Please log in with your new password." }
      });
    } catch (err) {
      console.error('Password reset error:', err);
      let errorMessage = "Failed to reset password. The token may be invalid or expired.";
      
      if (err.response?.data?.error) {
        errorMessage = err.response.data.error;
      } else if (err.detail) {
        errorMessage = err.detail;
      } else if (err.error) {
        errorMessage = err.error;
      } else if (err.message) {
        errorMessage = err.message;
      } else if (typeof err === 'string') {
        errorMessage = err;
      }
      
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Step 1: Email input
  if (step === 1) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="flex items-center gap-2 mb-4">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => navigate("/login")}
                className="p-1"
              >
                <ArrowLeft className="w-4 h-4" />
              </Button>
              <div className="mx-auto w-12 h-12 bg-[#72FD67] rounded-full flex items-center justify-center">
                <Lock className="w-6 h-6 text-[#1E1E1D]" />
              </div>
            </div>
            <CardTitle className="text-2xl font-bold">Reset your password</CardTitle>
            <p className="text-gray-600 mt-2">
              Enter your email address and we'll send you a link to reset your password.
            </p>
          </CardHeader>
          
          <CardContent>
            {error && (
              <Alert variant="destructive" className="mb-4">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            
            <div className="space-y-4">
              <div>
                <Label htmlFor="email">Email Address</Label>
                <Input
                  type="email"
                  id="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email address"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && email) {
                      handleSendReset(e);
                    }
                  }}
                />
              </div>

              <Button 
                onClick={handleSendReset}
                disabled={loading || !email}
                className="w-full bg-[#72FD67] hover:bg-green-400 text-[#1E1E1D] font-semibold"
              >
                {loading ? "Sending reset link..." : "Send reset link"}
              </Button>
            </div>

            <div className="text-center mt-4">
              <Button
                variant="ghost"
                onClick={() => navigate("/login")}
                className="text-sm font-medium text-[#72FD67] hover:text-green-400 transition-colors duration-200"
              >
                Back to sign in
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Step 2: Success message
  if (step === 2) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto w-12 h-12 bg-[#72FD67] rounded-full flex items-center justify-center mb-4">
              <CheckCircle className="w-6 h-6 text-[#1E1E1D]" />
            </div>
            <CardTitle className="text-2xl font-bold">Check your email</CardTitle>
            <p className="text-gray-600 mt-2">
              We've sent a password reset link to <strong>{email}</strong>
            </p>
          </CardHeader>
          
          <CardContent className="space-y-4">
            <div className="text-sm text-gray-600 space-y-2">
              <p>If you don't see the email in your inbox:</p>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li>Check your spam or junk folder</li>
                <li>Make sure you entered the correct email address</li>
                <li>Wait a few minutes for the email to arrive</li>
              </ul>
            </div>

            <Button
              onClick={() => setStep(1)}
              variant="outline"
              className="w-full"
            >
              Try different email address
            </Button>

            <Button
              onClick={() => navigate("/login")}
              className="w-full bg-[#72FD67] hover:bg-green-400 text-[#1E1E1D] font-semibold"
            >
              Back to sign in
            </Button>

            <div className="text-center">
              <Button
                variant="ghost"
                onClick={handleSendReset}
                disabled={loading}
                className="text-sm font-medium text-[#72FD67] hover:text-green-400 transition-colors duration-200"
              >
                {loading ? "Sending..." : "Resend email"}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Step 3: Password reset form (accessed via reset link)
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto w-12 h-12 bg-[#72FD67] rounded-full flex items-center justify-center mb-4">
            <Lock className="w-6 h-6 text-[#1E1E1D]" />
          </div>
          <CardTitle className="text-2xl font-bold">Set new password</CardTitle>
          <p className="text-gray-600 mt-2">
            Enter your new password below.
          </p>
        </CardHeader>
        
        <CardContent>
          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          
          <div className="space-y-4">
            {/* Only show token field if token wasn't provided in URL */}
            {!resetData.token && (
              <div>
                <Label htmlFor="token">Reset Token</Label>
                <Input
                  type="text"
                  id="token"
                  value={resetData.token}
                  onChange={(e) => setResetData({...resetData, token: e.target.value})}
                  placeholder="Enter the token from your email"
                />
              </div>
            )}

            <div>
              <Label htmlFor="newPassword">New Password</Label>
              <Input
                type="password"
                id="newPassword"
                value={resetData.newPassword}
                onChange={(e) => setResetData({...resetData, newPassword: e.target.value})}
                placeholder="Enter your new password"
              />
              <p className="text-xs text-gray-500 mt-1">
                Password must be at least 8 characters long
              </p>
            </div>

            <div>
              <Label htmlFor="confirmPassword">Confirm New Password</Label>
              <Input
                type="password"
                id="confirmPassword"
                value={resetData.confirmPassword}
                onChange={(e) => setResetData({...resetData, confirmPassword: e.target.value})}
                placeholder="Confirm your new password"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && resetData.token && resetData.newPassword && resetData.confirmPassword) {
                    handleResetPassword(e);
                  }
                }}
              />
            </div>

            <Button 
              onClick={handleResetPassword}
              disabled={loading || !resetData.token || !resetData.newPassword || !resetData.confirmPassword}
              className="w-full bg-[#72FD67] hover:bg-green-400 text-[#1E1E1D] font-semibold"
            >
              {loading ? "Resetting password..." : "Reset password"}
            </Button>
          </div>

          <div className="text-center mt-4">
            <Button
              variant="ghost"
              onClick={() => navigate("/login")}
              className="text-sm font-medium text-[#72FD67] hover:text-green-400 transition-colors duration-200"
            >
              Back to sign in
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}