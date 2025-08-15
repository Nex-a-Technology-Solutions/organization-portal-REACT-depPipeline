import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { auth } from "@/api/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { UserPlus, AlertCircle, CheckCircle, Mail, Lock, User, Phone, DollarSign, Briefcase } from "lucide-react";

export default function Register() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
    password_confirm: "",
    full_name: "",
    role: "staff",
    phone: "",
    specialization: "",
    hourly_rate: "",
    access_level: "staff"
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError("");
    setSuccess("");

    // Basic validation
    if (formData.password !== formData.password_confirm) {
      setError("Passwords don't match");
      setSubmitting(false);
      return;
    }

    try {
      // Register the user using the existing auth client
      const userData = {
        username: formData.username,
        email: formData.email,
        password: formData.password,
        password_confirm: formData.password_confirm,
        full_name: formData.full_name,
        role: formData.role,
        phone: formData.phone,
        specialization: formData.specialization,
        hourly_rate: formData.hourly_rate ? parseFloat(formData.hourly_rate) : null,
        access_level: formData.role, // Set access_level same as role
        from_invitation: false // This is regular registration, not from invitation
      };

      await auth.register(userData);

      // Clear any invalid tokens that might have been stored during registration
      localStorage.removeItem('token');
      localStorage.removeItem('auth_token');
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      
      // You can also clear all auth-related data if needed
      // localStorage.clear(); // Use this if you want to clear everything

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

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <Card className="w-full max-w-lg">
        <CardHeader className="text-center">
          <div className="mx-auto w-12 h-12 bg-[#72FD67] rounded-full flex items-center justify-center mb-4">
            <UserPlus className="w-6 h-6 text-[#1E1E1D]" />
          </div>
          <CardTitle className="text-2xl font-bold">Create Your Account</CardTitle>
          <p className="text-gray-600 mt-2">
            Join our platform and get started today!
          </p>
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
            {/* Basic Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="full_name" className="flex items-center gap-2">
                  <User className="w-4 h-4" />
                  Full Name
                </Label>
                <Input
                  id="full_name"
                  value={formData.full_name}
                  onChange={(e) => handleInputChange('full_name', e.target.value)}
                  placeholder="Enter your full name"
                />
              </div>

              <div>
                <Label htmlFor="username" className="flex items-center gap-2">
                  <User className="w-4 h-4" />
                  Username
                </Label>
                <Input
                  id="username"
                  value={formData.username}
                  onChange={(e) => handleInputChange('username', e.target.value)}
                  placeholder="Choose a username"
                  required
                />
              </div>
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
                onChange={(e) => handleInputChange('email', e.target.value)}
                placeholder="Enter your email address"
                required
              />
            </div>

            <div>
              <Label htmlFor="phone" className="flex items-center gap-2">
                <Phone className="w-4 h-4" />
                Phone Number
              </Label>
              <Input
                id="phone"
                type="tel"
                value={formData.phone}
                onChange={(e) => handleInputChange('phone', e.target.value)}
                placeholder="Enter your phone number"
              />
            </div>

            {/* Role Selection */}
            <div>
              <Label htmlFor="role" className="flex items-center gap-2">
                <Briefcase className="w-4 h-4" />
                Role
              </Label>
              <Select value={formData.role} onValueChange={(value) => handleInputChange('role', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select your role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="staff">Staff</SelectItem>
                  <SelectItem value="manager">Manager</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="contractor">Contractor</SelectItem>
                  <SelectItem value="consultant">Consultant</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Professional Details */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="specialization">Specialization</Label>
                <Input
                  id="specialization"
                  value={formData.specialization}
                  onChange={(e) => handleInputChange('specialization', e.target.value)}
                  placeholder="Your area of expertise"
                />
              </div>

              <div>
                <Label htmlFor="hourly_rate" className="flex items-center gap-2">
                  <DollarSign className="w-4 h-4" />
                  Hourly Rate
                </Label>
                <Input
                  id="hourly_rate"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.hourly_rate}
                  onChange={(e) => handleInputChange('hourly_rate', e.target.value)}
                  placeholder="0.00"
                />
              </div>
            </div>

            {/* Password Fields */}
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
                  onChange={(e) => handleInputChange('password', e.target.value)}
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
                  onChange={(e) => handleInputChange('password_confirm', e.target.value)}
                  placeholder="Confirm your password"
                  required
                />
              </div>
            </div>

            <Button 
              type="submit" 
              disabled={submitting}
              className="w-full bg-[#72FD67] hover:bg-green-400 text-[#1E1E1D] font-semibold"
            >
              {submitting ? "Creating Account..." : "Create Account"}
            </Button>

            <div className="text-center text-sm text-gray-600">
              Already have an account?{" "}
              <button
                type="button"
                onClick={() => navigate('/login')}
                className="text-[#72FD67] hover:underline font-medium"
              >
                Sign in here
              </button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}