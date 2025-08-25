import React, { useState } from "react";
import { UserInvitation } from "@/api/client";
import { SendEmail } from "@/api/integrations";
import { sendExternalEmail } from "@/api/functions";
import { Settings } from "@/api/entities";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Mail, Send, AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function InviteUserDialog({ onClose, onUserInvited }) {
  const [formData, setFormData] = useState({
    email: "",
    full_name: "",
    role: "staff",
    phone: "",
    specialization: "",
    hourly_rate: "",
    personal_message: ""
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");

    try {
      // First, create the invitation record in the database
      const invitationData = {
        email: formData.email,
        full_name: formData.full_name,
        role: formData.role,
        phone: formData.phone || "",
        specialization: formData.specialization || "",
        hourly_rate: formData.hourly_rate ? parseFloat(formData.hourly_rate) : null,
        status: "pending"
      };

      await UserInvitation.send(invitationData);
      
      // Get company settings for branding
      const settingsData = await Settings.list();
      const settings = settingsData.length > 0 ? settingsData[0] : {
        company_name: "Nex-a Portal",
        company_logo_url: "",
        primary_color: "#72FD67",
        secondary_color: "#1E1E1D",
        accent_color: "#F2F2F2",
        email_theme: "light",
      };
      
      // Then send the email
      const appUrl = window.location.origin;
      
      // Create HTML email body matching the proposal format
      const htmlEmailBody = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: Arial, sans-serif; margin: 0; padding: 20px; background: ${settings.accent_color}; }
            .container { max-width: 600px; margin: 0 auto; background: white; padding: 40px; border-radius: 10px; box-shadow: 0 4px 20px rgba(0,0,0,0.1); }
            .header { text-align: center; margin-bottom: 40px; padding-bottom: 20px; border-bottom: 2px solid ${settings.primary_color}; }
            .logo { max-width: 200px; height: auto; margin-bottom: 20px; }
            .company-name { font-size: 28px; font-weight: bold; color: ${settings.secondary_color}; margin: 0; }
            .invitation-title { font-size: 24px; color: ${settings.primary_color}; margin: 30px 0 20px 0; text-align: center; }
            .greeting { font-size: 18px; color: ${settings.secondary_color}; margin: 20px 0; }
            .section { margin: 30px 0; }
            .section h3 { color: ${settings.secondary_color}; border-bottom: 1px solid #eee; padding-bottom: 10px; }
            .highlight-box { background: ${settings.accent_color}; padding: 20px; border-radius: 8px; margin: 20px 0; }
            .role-badge { display: inline-block; background: ${settings.primary_color}; color: ${settings.secondary_color}; padding: 8px 16px; border-radius: 20px; font-weight: bold; font-size: 14px; margin: 10px 0; }
            .personal-message { background: #f8f9fa; padding: 20px; border-left: 4px solid ${settings.primary_color}; margin: 20px 0; font-style: italic; }
            .accept-btn { display: inline-block; background: ${settings.primary_color}; color: ${settings.secondary_color}; padding: 15px 40px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 18px; margin: 20px 0; }
            .accept-btn:hover { opacity: 0.9; }
            .footer { margin-top: 40px; padding-top: 20px; border-top: 1px solid #eee; text-align: center; color: #666; font-size: 14px; }
            .important-note { background: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 8px; margin: 20px 0; color: #856404; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              ${settings.company_logo_url ? `<img src="${settings.company_logo_url}" alt="${settings.company_name}" class="logo">` : ''}
              <h1 class="company-name">${settings.company_name}</h1>
            </div>
            
            <h2 class="invitation-title">TEAM INVITATION</h2>
            
            <div class="greeting">
              Hi ${formData.full_name || formData.email},
            </div>
            
            <div class="section">
              <p>You've been invited to join our team! We're excited to have you on board.</p>
              
              <div class="highlight-box">
                <p><strong>Your Role:</strong> <span class="role-badge">${formData.role.toUpperCase()}</span></p>
                ${formData.specialization ? `<p><strong>Specialization:</strong> ${formData.specialization}</p>` : ''}
                ${formData.hourly_rate ? `<p><strong>Hourly Rate:</strong> $${formData.hourly_rate}/hour</p>` : ''}
              </div>
              
              ${formData.personal_message ? `
              <div class="personal-message">
                <strong>Personal Message:</strong><br>
                ${formData.personal_message.replace(/\n/g, '<br>')}
              </div>
              ` : ''}
            </div>
            
            <div class="section">
              <h3>Next Steps</h3>
              <p>To accept your invitation and create your account, please click the button below:</p>
              
              <div style="text-align: center; margin: 30px 0;">
                <a href="${appUrl}/userInviteAcceptance?email=${encodeURIComponent(formData.email)}" class="accept-btn">Accept Invitation</a>
              </div>
              
              <div class="important-note">
                <strong>Important:</strong> This invitation is specifically for <strong>${formData.email}</strong>. Please use this email address to complete your registration.
              </div>
            </div>
            
            <div class="footer">
              <p>Welcome to the team!</p>
              <p><strong>${settings.company_name}</strong></p>
            </div>
          </div>
        </body>
        </html>
      `;

      // Plain text fallback
      const plainTextBody = `Hi ${formData.full_name || formData.email},

You've been invited to join the ${formData.role} team on ${settings.company_name}.

${formData.personal_message ? `Personal message:
${formData.personal_message}

` : ''}To accept your invitation and create your account, please click the link below:

${appUrl}/userInviteAcceptance?email=${encodeURIComponent(formData.email)}

Important: This invitation is specifically for ${formData.email}. Please use this email address to complete your registration.

Best regards,
${settings.company_name} Team`;

      try {
        // Check if Gmail is connected
        const gmailConnected = settings.gmail_refresh_token;

        if (gmailConnected) {
          // Use the backend function to send via Gmail with HTML
          await sendExternalEmail({
            to: formData.email,
            subject: `You're invited to join ${settings.company_name}`,
            body: plainTextBody,
            html_message: htmlEmailBody
          });
        } else {
          // Use the standard integration for internal/invited users with HTML
          await SendEmail({
            to: formData.email,
            subject: `You're invited to join ${settings.company_name}`,
            body: plainTextBody,
            html_message: htmlEmailBody
          });
        }
        
        setSuccess("Invitation sent successfully!");
        
        // Close dialog after a short delay
        setTimeout(() => {
          onUserInvited();
        }, 1500);
        
      } catch (emailError) {
        console.error("Email sending error:", emailError);
        
        let emailErrorMessage = "Invitation created but email could not be sent. ";
        
        if (emailError.response?.data?.error?.includes("outside the app")) {
          emailErrorMessage += "The default mailer can only send to users invited to this app. Please connect your Gmail account in Settings to send emails to send emails to any address.";
        } else {
          emailErrorMessage += "The user can still sign up with the invited email address.";
        }
        
        setError(emailErrorMessage);
        
        // Still call onUserInvited to refresh the list
        setTimeout(() => {
          onUserInvited();
        }, 2000);
      }

    } catch (error) {
      console.error("Error creating invitation:", error);
      
      let errorMessage = "Error creating invitation. ";
      
      if (error.response?.data?.error) {
        errorMessage += error.response.data.error;
      } else if (error.response?.data?.email) {
        errorMessage += error.response.data.email[0];
      } else if (error.email) {
        errorMessage += error.email[0];
      } else {
        errorMessage += "Please check the details and try again.";
      }
      
      setError(errorMessage);
    }
    
    setLoading(false);
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Mail className="w-5 h-5" />
            Invite New Team Member
          </DialogTitle>
        </DialogHeader>
        
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        
        {success && (
          <Alert className="border-green-200 bg-green-50 text-green-800">
            <Mail className="h-4 w-4" />
            <AlertDescription>{success}</AlertDescription>
          </Alert>
        )}
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="full_name">Full Name</Label>
              <Input
                id="full_name"
                value={formData.full_name}
                onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                placeholder="John Doe"
                required
              />
            </div>
            <div>
              <Label htmlFor="email">Email Address</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="john@company.com"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="role">Role</Label>
              <Select value={formData.role} onValueChange={(value) => setFormData({ ...formData, role: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="staff">Staff</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="phone">Phone</Label>
              <Input
                id="phone"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="Phone number"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="specialization">Specialization</Label>
              <Input
                id="specialization"
                value={formData.specialization}
                onChange={(e) => setFormData({ ...formData, specialization: e.target.value })}
                placeholder="e.g. Backend Development"
              />
            </div>
            <div>
              <Label htmlFor="hourly_rate">Hourly Rate ($)</Label>
              <Input
                id="hourly_rate"
                type="number"
                min="0"
                step="0.01"
                value={formData.hourly_rate}
                onChange={(e) => setFormData({ ...formData, hourly_rate: e.target.value })}
                placeholder="0.00"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="personal_message">Personal Message (Optional)</Label>
            <Textarea
              id="personal_message"
              value={formData.personal_message}
              onChange={(e) => setFormData({ ...formData, personal_message: e.target.value })}
              placeholder="Add a personal welcome message..."
              rows={3}
            />
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={loading} 
              className="bg-[#72FD67] hover:bg-green-400 text-[#1E1E1D] font-semibold"
            >
              <Send className="w-4 h-4 mr-2" />
              {loading ? "Sending..." : "Send Invitation"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}