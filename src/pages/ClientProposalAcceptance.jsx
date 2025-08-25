import React, { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Proposal } from "@/api/entities";
import { auth, PublicProposal } from "@/api/client"; // Add PublicProposal import
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { UserPlus, AlertCircle, CheckCircle, Mail, Lock, User, FileText, DollarSign } from "lucide-react";

export default function ClientProposalAcceptance() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [proposal, setProposal] = useState(null);
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
    password_confirm: "",
    full_name: "",
    company: "",
    phone: ""
  });
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    const proposalIdParam = searchParams.get("proposalId");
    const emailParam = searchParams.get("email");
    
    if (!proposalIdParam || !emailParam) {
      setError("Invalid proposal link. Required parameters are missing.");
      setLoading(false);
      return;
    }

    // Fetch proposal details using public API
    const fetchProposal = async () => {
      try {
        // Use the new public API endpoint
        const data = await PublicProposal.validate(proposalIdParam, emailParam);
        
        if (!data.valid) {
          setError(data.error || "Invalid proposal or email address.");
          setLoading(false);
          return;
        }

        setProposal(data.proposal);
        setFormData(prev => ({
          ...prev,
          email: data.proposal.client_email,
          username: data.proposal.client_email, // Default username to email
          full_name: data.proposal.client_name || ""
        }));
        setLoading(false);
      } catch (error) {
        console.error("Error fetching proposal:", error);
        
        let errorMessage = "Failed to load proposal details. Please try again.";
        
        if (error.response) {
          console.error("Proposal fetch error response:", error.response.data);
          console.error("Proposal fetch error status:", error.response.status);
          
          if (error.response.data) {
            if (typeof error.response.data === 'string') {
              errorMessage = error.response.data;
            } else if (error.response.data.error) {
              errorMessage = error.response.data.error;
            } else if (error.response.data.detail) {
              errorMessage = error.response.data.detail;
            } else if (error.response.data.message) {
              errorMessage = error.response.data.message;
            }
          }
        } else if (error.message) {
          errorMessage = error.message;
        }
        
        setError(errorMessage);
        setLoading(false);
      }
    };

    fetchProposal();
  }, [searchParams]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError("");
    setSuccess("");

    try {
      // Register the client user
      const userData = {
        username: formData.username,
        email: formData.email,
        password: formData.password,
        password_confirm: formData.password_confirm,
        full_name: formData.full_name,
        company: formData.company,
        phone: formData.phone,
        role: "client", // Set role as client
        access_level: "client", // Set access_level as client
        from_proposal: true // Flag to indicate this came from proposal acceptance
      };

      await auth.register(userData);

      // Accept the proposal using the public API
      await PublicProposal.accept(proposal.id, formData.email);

      setSuccess("Account created and proposal accepted successfully! Redirecting to login...");
      
      // Redirect to login after 2 seconds
      setTimeout(() => {
        navigate('/login', { 
          state: { 
            message: "Account created successfully! Your proposal has been accepted. Please log in to view your project details.",
            email: formData.email
          }
        });
      }, 2000);

    } catch (error) {
      console.error("Registration/acceptance error:", error);
      
      // Extract detailed error information
      let errorMessage = "Registration failed. Please try again.";
      
      if (error.response) {
        // Server responded with an error status
        console.error("Error response data:", error.response.data);
        console.error("Error status:", error.response.status);
        console.error("Error headers:", error.response.headers);
        
        if (error.response.data) {
          if (typeof error.response.data === 'string') {
            errorMessage = error.response.data;
          } else if (error.response.data.error) {
            errorMessage = error.response.data.error;
          } else if (error.response.data.detail) {
            errorMessage = error.response.data.detail;
          } else if (error.response.data.message) {
            errorMessage = error.response.data.message;
          } else {
            // Show all validation errors if they exist
            const errors = [];
            for (const [field, messages] of Object.entries(error.response.data)) {
              if (Array.isArray(messages)) {
                errors.push(`${field}: ${messages.join(', ')}`);
              } else if (typeof messages === 'string') {
                errors.push(`${field}: ${messages}`);
              }
            }
            if (errors.length > 0) {
              errorMessage = errors.join('; ');
            }
          }
        }
      } else if (error.request) {
        // Network error
        errorMessage = "Network error. Please check your connection and try again.";
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      setError(errorMessage);
    }
    
    setSubmitting(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#72FD67] mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading proposal...</p>
        </div>
      </div>
    );
  }

  if (error && !proposal) {
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
      <Card className="w-full max-w-2xl">
        <CardHeader className="text-center">
          <div className="mx-auto w-12 h-12 bg-[#72FD67] rounded-full flex items-center justify-center mb-4">
            <FileText className="w-6 h-6 text-[#1E1E1D]" />
          </div>
          <CardTitle className="text-2xl font-bold">Accept Proposal & Create Account</CardTitle>
          {proposal && (
            <p className="text-gray-600 mt-2">
              Create your account to accept this proposal and start your project.
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

          {/* Proposal Summary */}
          {proposal && (
            <div className="bg-gray-50 p-4 rounded-lg mb-6">
              <h4 className="font-medium text-gray-700 mb-3 flex items-center gap-2">
                <FileText className="w-4 h-4" />
                Proposal Summary
              </h4>
              <div className="space-y-2 text-sm text-gray-600">
                <p><strong>Project:</strong> {proposal.title}</p>
                <p><strong>Type:</strong> {proposal.project_type}</p>
                <p><strong>Timeline:</strong> {proposal.timeline || 'To be determined'}</p>
                <div className="flex items-center gap-1">
                  <DollarSign className="w-4 h-4" />
                  <strong>Investment:</strong> ${proposal.total_fee?.toLocaleString()}
                </div>
                <p><strong>Description:</strong> {proposal.description}</p>
              </div>
            </div>
          )}
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="full_name" className="flex items-center gap-2">
                  <User className="w-4 h-4" />
                  Full Name
                </Label>
                <Input
                  id="full_name"
                  value={formData.full_name}
                  onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                  placeholder="Your full name"
                  required
                />
              </div>
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
                  This email was pre-assigned from the proposal
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="company">Company (Optional)</Label>
                <Input
                  id="company"
                  value={formData.company}
                  onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                  placeholder="Your company name"
                />
              </div>
              <div>
                <Label htmlFor="phone">Phone (Optional)</Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="Your phone number"
                />
              </div>
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

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
            </div>

            <div className="bg-green-50 border border-green-200 p-4 rounded-lg">
              <p className="text-sm text-green-700">
                <strong>By creating your account, you agree to accept this proposal.</strong> Once your account is created, the proposal will be automatically accepted and your project will begin.
              </p>
            </div>

            <Button 
              type="submit" 
              disabled={submitting}
              className="w-full bg-[#72FD67] hover:bg-green-400 text-[#1E1E1D] font-semibold"
            >
              {submitting ? "Creating Account & Accepting Proposal..." : "Accept Proposal & Create Account"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}