import React, { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { PublicInvitation } from "@/api/client";
import { auth } from "@/api/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { UserPlus, AlertCircle, CheckCircle, Mail, Lock, User } from "lucide-react";

export default function UserInviteAcceptance() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [invitation, setInvitation] = useState(null);
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
    password_confirm: ""
  });
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    const emailParam = searchParams.get("email");
    
    if (!emailParam) {
      setError("Invalid invitation link. Email parameter is missing.");
      setLoading(false);
      return;
    }

    // Fetch invitation details using the public API
    const fetchInvitation = async () => {
      try {
        const data = await PublicInvitation.validate(emailParam);
        
        if (!data.valid) {
          setError(data.error || "Invalid or expired invitation. Please contact your administrator.");
          setLoading(false);
          return;
        }

        const invite = data.invitation;
        setInvitation(invite);
        setFormData(prev => ({
          ...prev,
          email: invite.email,
          username: invite.email // Default username to email
        }));
        setLoading(false);
      } catch (error) {
        console.error("Error fetching invitation:", error);
        setError(error.message || "Failed to load invitation details. Please try again.");
        setLoading(false);
      }
    };

    fetchInvitation();
  }, [searchParams]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError("");
    setSuccess("");

    try {
      // Register the user using the existing auth client
      const userData = {
        username: formData.username,
        email: formData.email,
        password: formData.password,
        password_confirm: formData.password_confirm,
        full_name: invitation.full_name,
        role: invitation.role,
        phone: invitation.phone,
        specialization: invitation.specialization,
        hourly_rate: invitation.hourly_rate,
        access_level: invitation.role, // Set access_level same as role
        from_invitation: true
      };

      await auth.register(userData);

      // Update invitation status to accepted using the public API
      await PublicInvitation.updateStatus(formData.email, 'accepted');

      setSuccess("Account created successfully! Redirecting to login...");
      
      // Redirect to login after 2 seconds
      setTimeout(() => {
        navigate('/login', { 
          state: { 
            message: "Account created successfully! Please log in with your credentials.",
            email: formData.email
          }
        });
      }, 2000);

    } catch (error) {
      console.error("Registration error:", error);
      setError(error.message || "Registration failed. Please try again.");
    }
    
    setSubmitting(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#72FD67] mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading invitation...</p>
        </div>
      </div>
    );
  }

  if (error && !invitation) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
            <div className="mt-4 text-center">
              <Button onClick={() => navigate('/')} variant="outline">
                Go to Home
              </Button>
            </div>
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
            <UserPlus className="w-6 h-6 text-[#1E1E1D]" />
          </div>
          <CardTitle className="text-2xl font-bold">Complete Your Registration</CardTitle>
          {invitation && (
            <p className="text-gray-600 mt-2">
              Welcome {invitation.full_name}! You've been invited to join as {invitation.role}.
            </p>
          )}
        </CardHeader>
        
        <CardContent>
          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          
          {success && (
            <Alert className="border-green-200 bg-green-50 text-green-800 mb-4">
              <CheckCircle className="h-4 w-4" />
              <AlertDescription>{success}</AlertDescription>
            </Alert>
          )}
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="email" className="flex items-center gap-2">
                <Mail className="w-4 h-4" />
                Email Address
              </Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                disabled
                className="bg-gray-100"
              />
              <p className="text-sm text-gray-500 mt-1">
                This email was pre-assigned in your invitation
              </p>
            </div>

            <div>
              <Label htmlFor="username" className="flex items-center gap-2">
                <User className="w-4 h-4" />
                Username
              </Label>
              <Input
                id="username"
                value={formData.username}
                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                placeholder="Choose a username"
                required
              />
            </div>

            <div>
              <Label htmlFor="password" className="flex items-center gap-2">
                <Lock className="w-4 h-4" />
                Password
              </Label>
              <Input
                id="password"
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                placeholder="Create a secure password"
                required
              />
            </div>

            <div>
              <Label htmlFor="password_confirm">Confirm Password</Label>
              <Input
                id="password_confirm"
                type="password"
                value={formData.password_confirm}
                onChange={(e) => setFormData({ ...formData, password_confirm: e.target.value })}
                placeholder="Confirm your password"
                required
              />
            </div>

            {invitation && (
              <div className="bg-gray-50 p-3 rounded-lg">
                <h4 className="font-medium text-sm text-gray-700 mb-2">Your Role & Details:</h4>
                <div className="text-sm text-gray-600 space-y-1">
                  <p><strong>Role:</strong> {invitation.role}</p>
                  {invitation.specialization && (
                    <p><strong>Specialization:</strong> {invitation.specialization}</p>
                  )}
                  {invitation.hourly_rate && (
                    <p><strong>Hourly Rate:</strong> ${invitation.hourly_rate}</p>
                  )}
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  You can update additional details in your profile after logging in.
                </p>
              </div>
            )}

            <Button 
              type="submit" 
              disabled={submitting}
              className="w-full bg-[#72FD67] hover:bg-green-400 text-[#1E1E1D] font-semibold"
            >
              {submitting ? "Creating Account..." : "Create Account"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}