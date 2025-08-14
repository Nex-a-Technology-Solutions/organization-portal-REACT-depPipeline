
import React, { useState, useEffect } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { Proposal } from "@/api/entities";
import { Settings } from "@/api/entities";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  CheckCircle2,
  Calendar,
  DollarSign,
  FileText,
  Building,
  Mail,
  Phone,
  MapPin,
  Clock,
  Loader2 // Added Loader2
} from "lucide-react";
import { format } from "date-fns";

import { Notification } from "@/api/entities";
import { Invoice } from "@/api/entities";
import { Project } from "@/api/entities";
import { sendExternalEmail } from "@/api/functions";
import { SendEmail } from "@/api/integrations";
import { createPageUrl } from "@/utils";

export default function ProposalView() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [proposal, setProposal] = useState(null);
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false); // For accept/decline actions
  const [error, setError] = useState(null); // New state for errors
  const location = useLocation(); // New hook

  useEffect(() => {
    loadProposal();
  }, [id, location.pathname]); // Changed dependency as per outline suggestion, added `id` for consistency with `useParams`

  const loadProposal = async () => {
    try {
      const [proposalData, settingsData] = await Promise.all([
        Proposal.list().then(proposals => proposals.find(p => p.id === id)),
        Settings.list()
      ]);

      if (!proposalData) {
        setLoading(false);
        return;
      }

      setProposal(proposalData);

      if (settingsData.length > 0) {
        setSettings(settingsData[0]);
      } else {
        // Default settings
        setSettings({
          company_name: "TechFlow Integration Solutions",
          company_logo_url: "",
          primary_color: "#72FD67",
          secondary_color: "#1E1E1D",
          accent_color: "#F2F2F2",
          company_address: "",
          company_phone: "",
          company_email: ""
        });
      }
    } catch (error) {
      console.error("Error loading proposal:", error);
      setError("Failed to load proposal details.");
    }
    setLoading(false);
  };

  const handleAccept = async () => {
    if (!proposal || !settings) {
      setError("Proposal or settings not loaded. Please refresh the page.");
      return;
    }

    setActionLoading(true);
    setError(null);
    try {
      // 1. Update proposal status
      await Proposal.update(proposal.id, { status: "accepted" });
      setProposal(prev => ({ ...prev, status: "accepted" })); // Update local state immediately

      // 2. Create the project
      const projectData = await Project.create({
        title: proposal.title,
        description: proposal.description,
        project_type: proposal.project_type,
        client_id: proposal.client_id,
        client_name: proposal.client_name,
        client_email: proposal.client_email,
        total_fee: proposal.total_fee,
        status: "active",
        current_stage: "discovery",
        start_date: new Date().toISOString().split('T')[0],
        stage_completion: { discovery: false, design: false, development: false, testing: false, deployment: false, training: false }
      });

      // 3. Create the first invoice for the 'discovery' stage
      const firstStagePercentage = 15;
      const firstInvoiceAmount = (proposal.total_fee * firstStagePercentage) / 100;

      const invoiceNumber = `INV-${Date.now().toString().slice(-6)}`;

      const invoiceData = await Invoice.create({
        project_id: projectData.id,
        project_description: projectData.description, // Added this line as per the outline
        invoice_number: invoiceNumber,
        client_id: proposal.client_id,
        client_name: proposal.client_name,
        client_email: proposal.client_email,
        stage: 'discovery',
        stage_description: `Initial deposit for ${proposal.title} (Discovery Phase)`,
        amount: firstInvoiceAmount,
        percentage: firstStagePercentage,
        status: 'draft', // Start as draft
        due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] // 30 days from now
      });

      // 4. Send the invoice email
      const emailSubject = `Invoice ${invoiceNumber} from ${settings.company_name}`;
      const emailBody = generateInvoiceHtml(invoiceData, projectData, settings);

      if (settings.gmail_refresh_token) {
        await sendExternalEmail({ to: proposal.client_email, subject: emailSubject, body: emailBody });
      } else {
        await SendEmail({ to: proposal.client_email, subject: emailSubject, body: emailBody });
      }

      // 5. Update invoice status to 'sent'
      await Invoice.update(invoiceData.id, { status: 'sent', sent_date: new Date().toISOString().split('T')[0] });

      // 6. Create admin notification
      await Notification.create({
        title: "Proposal Accepted!",
        message: `"${proposal.title}" for ${proposal.client_name} was accepted and project created.`,
        link: createPageUrl(`Projects?projectId=${projectData.id}`)
      });

      // 7. Redirect to thank you page
      window.location.href = createPageUrl(`ThankYou?proposalId=${proposal.id}`);

    } catch (err) {
      console.error("Error during proposal acceptance:", err);
      setError("An error occurred while processing your acceptance. Please contact us directly.");
      setActionLoading(false);
      // Revert local proposal status if subsequent steps fail
      setProposal(prev => ({ ...prev, status: "sent" }));
    }
  };

  const handleDecline = async () => {
    if (!proposal) return;
    setActionLoading(true);
    setError(null);
    try {
      await Proposal.update(proposal.id, { status: "declined" });
      setProposal(prev => ({ ...prev, status: 'declined' }));
    } catch (err) {
      console.error("Error declining proposal:", err);
      setError("An error occurred. Please try again.");
    }
    setActionLoading(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  if (!proposal) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Proposal Not Found</h1>
          <p className="text-gray-600">The proposal you're looking for doesn't exist or may have been removed.</p>
        </div>
      </div>
    );
  }

  const primaryColor = settings?.primary_color || "#72FD67";
  const secondaryColor = settings?.secondary_color || "#1E1E1D";
  const accentColor = settings?.accent_color || "#F2F2F2";
  const companyName = settings?.company_name || "TechFlow Integration Solutions";

  // Parse the project type for display
  const projectTypeDisplay = proposal.project_type?.replace('+', ' + ').replace(/\b\w/g, l => l.toUpperCase());

  // Payment structure
  const stages = [
    { name: "Discovery & Requirements", percentage: 15 },
    { name: "Design & Architecture", percentage: 20 },
    { name: "Development & Configuration", percentage: 30 },
    { name: "Testing & QA", percentage: 15 },
    { name: "Deployment & Implementation", percentage: 15 },
    { name: "Training & Handoff", percentage: 5 }
  ];

  return (
    <div className="min-h-screen" style={{ background: `linear-gradient(135deg, ${accentColor}, #f8fafc)` }}>
      <style>
        {`
          @import url('https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,200;12..96,300;12..96,400;12..96,500;12..96,600;12..96,700;12..96,800&display=swap');
          * {
            font-family: 'Bricolage Grotesque', -apple-system, BlinkMacSystemFont, sans-serif;
          }
        `}
      </style>

      {/* Header */}
      <div className="bg-white/90 backdrop-blur-sm border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              {settings?.company_logo_url ? (
                <img
                  src={settings.company_logo_url}
                  alt={companyName}
                  className="h-12 w-auto object-contain"
                />
              ) : (
                <div
                  className="h-12 w-12 rounded-xl flex items-center justify-center"
                  style={{ background: `linear-gradient(135deg, ${secondaryColor}, #4a5568)` }}
                >
                  <span className="text-2xl">⚡</span>
                </div>
              )}
              <div>
                <h1 className="text-xl font-bold" style={{ color: secondaryColor }}>
                  {companyName}
                </h1>
                <p className="text-sm text-gray-600">Project Proposal</p>
              </div>
            </div>

            <Badge
              className={`px-3 py-1 ${
                proposal.status === 'accepted'
                  ? 'bg-green-100 text-green-800 border-green-200'
                  : proposal.status === 'sent'
                  ? 'bg-blue-100 text-blue-800 border-blue-200'
                  : proposal.status === 'declined'
                  ? 'bg-red-100 text-red-800 border-red-200'
                  : 'bg-gray-100 text-gray-800 border-gray-200'
              }`}
            >
              {proposal.status === 'accepted' ? 'Accepted' :
               proposal.status === 'sent' ? 'Under Review' :
               proposal.status === 'declined' ? 'Declined' :
               proposal.status}
            </Badge>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-8 space-y-8">
        {/* Hero Section */}
        <Card className="bg-white/90 backdrop-blur-sm border-gray-200 shadow-xl overflow-hidden">
          <div
            className="h-32 flex items-end p-8"
            style={{ background: `linear-gradient(135deg, ${secondaryColor}, #4a5568)` }}
          >
            <div className="text-white">
              <h1 className="text-3xl font-bold mb-2">{proposal.title}</h1>
              <p className="text-white/90">Proposal for {proposal.client_name}</p>
            </div>
          </div>

          <CardContent className="p-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
              <div className="flex items-center gap-3">
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center"
                  style={{ backgroundColor: primaryColor }}
                >
                  <DollarSign className="w-6 h-6" style={{ color: secondaryColor }} />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Total Investment</p>
                  <p className="text-2xl font-bold" style={{ color: secondaryColor }}>
                    ${proposal.total_fee?.toLocaleString()}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center"
                  style={{ backgroundColor: primaryColor }}
                >
                  <Clock className="w-6 h-6" style={{ color: secondaryColor }} />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Timeline</p>
                  <p className="text-xl font-semibold" style={{ color: secondaryColor }}>
                    {proposal.timeline || "8-12 weeks"}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center"
                  style={{ backgroundColor: primaryColor }}
                >
                  <FileText className="w-6 h-6" style={{ color: secondaryColor }} />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Project Type</p>
                  <p className="text-lg font-semibold" style={{ color: secondaryColor }}>
                    {projectTypeDisplay}
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* New: Generated Content from outline */}
        {proposal.generated_content && (
          <div
            className="prose max-w-none text-gray-700 leading-relaxed"
            dangerouslySetInnerHTML={{ __html: proposal.generated_content }}
          />
        )}

        {/* Project Overview */}
        <Card className="bg-white/90 backdrop-blur-sm border-gray-200 shadow-lg">
          <CardContent className="p-8">
            <h2 className="text-2xl font-bold mb-4" style={{ color: secondaryColor }}>
              Project Overview
            </h2>
            <div className="prose max-w-none">
              <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                {proposal.description}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Scope of Work */}
        {proposal.scope_of_work && (
          <Card className="bg-white/90 backdrop-blur-sm border-gray-200 shadow-lg">
            <CardContent className="p-8">
              <h2 className="text-2xl font-bold mb-4" style={{ color: secondaryColor }}>
                Detailed Scope of Work
              </h2>
              <div className="prose max-w-none">
                <div className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                  {proposal.scope_of_work}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Payment Structure */}
        <Card className="bg-white/90 backdrop-blur-sm border-gray-200 shadow-lg">
          <CardContent className="p-8">
            <h2 className="text-2xl font-bold mb-6" style={{ color: secondaryColor }}>
              Investment & Payment Structure
            </h2>
            <div className="space-y-4">
              {stages.map((stage, index) => (
                <div
                  key={index}
                  className="flex justify-between items-center p-4 rounded-xl border"
                  style={{ backgroundColor: accentColor }}
                >
                  <div>
                    <h4 className="font-semibold" style={{ color: secondaryColor }}>
                      {stage.name}
                    </h4>
                    <p className="text-sm text-gray-600">
                      {stage.percentage}% of total project investment
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-xl font-bold" style={{ color: secondaryColor }}>
                      ${((proposal.total_fee * stage.percentage) / 100).toLocaleString()}
                    </p>
                  </div>
                </div>
              ))}

              <div
                className="flex justify-between items-center p-4 rounded-xl border-2"
                style={{
                  backgroundColor: primaryColor,
                  borderColor: primaryColor,
                  color: secondaryColor
                }}
              >
                <div>
                  <h4 className="font-bold text-lg">Total Project Investment</h4>
                  <p className="text-sm opacity-80">Paid across project milestones</p>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold">
                    ${proposal.total_fee?.toLocaleString()}
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* New Action Buttons / Status Messages */}
        {proposal.status === "sent" && (
          <div className="mt-12 text-center p-8 bg-gray-50 rounded-lg">
            <h2 className="text-2xl font-bold text-gray-900">Ready to proceed?</h2>
            <p className="text-gray-600 mt-2">Accept the proposal to automatically create the project and receive your first invoice.</p>
            {error && <p className="mt-4 text-red-600 bg-red-100 p-3 rounded-md">{error}</p>}
            <div className="mt-6 flex justify-center gap-4">
              <Button
                size="lg"
                variant="outline"
                onClick={handleDecline}
                disabled={actionLoading}
                className="px-10 py-6 text-lg"
              >
                Decline
              </Button>
              <Button
                size="lg"
                onClick={handleAccept}
                disabled={actionLoading}
                className="px-10 py-6 text-lg"
                style={{ backgroundColor: primaryColor, color: secondaryColor }}
              >
                {actionLoading && <Loader2 className="w-5 h-5 mr-3 animate-spin" />}
                Accept & Start Project
              </Button>
            </div>
            <p className="text-sm text-gray-500 mt-2">
              Valid until {format(new Date(proposal.valid_until), "MMMM d, yyyy")}
            </p>
          </div>
        )}

        {proposal.status === "accepted" && (
          <div className="mt-12 text-center p-8 bg-green-50 text-green-800 rounded-lg">
            <h2 className="text-2xl font-bold">Proposal Accepted!</h2>
            <p className="mt-2">This proposal was accepted. We're excited to work with you!</p>
          </div>
        )}

        {proposal.status === "declined" && (
          <div className="mt-12 text-center p-8 bg-red-50 text-red-800 rounded-lg">
            <h2 className="text-2xl font-bold">Proposal Declined</h2>
            <p className="mt-2">This proposal was declined.</p>
          </div>
        )}


        {/* Contact Information */}
        <Card className="bg-white/90 backdrop-blur-sm border-gray-200 shadow-lg">
          <CardContent className="p-8">
            <h2 className="text-2xl font-bold mb-6" style={{ color: secondaryColor }}>
              Questions? Get in Touch
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {settings?.company_email && (
                <div className="flex items-center gap-3">
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center"
                    style={{ backgroundColor: primaryColor }}
                  >
                    <Mail className="w-6 h-6" style={{ color: secondaryColor }} />
                  </div>
                  <div>
                    <p className="font-semibold" style={{ color: secondaryColor }}>Email</p>
                    <p className="text-gray-600">{settings.company_email}</p>
                  </div>
                </div>
              )}

              {settings?.company_phone && (
                <div className="flex items-center gap-3">
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center"
                    style={{ backgroundColor: primaryColor }}
                  >
                    <Phone className="w-6 h-6" style={{ color: secondaryColor }} />
                  </div>
                  <div>
                    <p className="font-semibold" style={{ color: secondaryColor }}>Phone</p>
                    <p className="text-gray-600">{settings.company_phone}</p>
                  </div>
                </div>
              )}

              {settings?.company_address && (
                <div className="flex items-center gap-3">
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center"
                    style={{ backgroundColor: primaryColor }}
                  >
                    <MapPin className="w-6 h-6" style={{ color: secondaryColor }} />
                  </div>
                  <div>
                    <p className="font-semibold" style={{ color: secondaryColor }}>Address</p>
                    <p className="text-gray-600">{settings.company_address}</p>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center py-8">
          <p className="text-gray-500">
            © {new Date().getFullYear()} {companyName}. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  );
}

function generateInvoiceHtml(invoice, project, settings) {
  // This is a simplified version of the invoice HTML generation logic from the Invoices page
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Invoice ${invoice.invoice_number}</title>
      <style>
        body { font-family: sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 20px auto; padding: 20px; border: 1px solid #ddd; border-radius: 8px; }
        h1 { color: ${settings.secondary_color}; border-bottom: 2px solid ${settings.primary_color}; padding-bottom: 10px; margin-bottom: 20px; }
        strong { color: ${settings.secondary_color}; }
        .invoice-details p { margin-bottom: 5px; }
        .footer { text-align: center; margin-top: 30px; font-size: 0.9em; color: #666; }
      </style>
    </head>
    <body>
      <div class="container">
        <h1>Invoice from ${settings.company_name}</h1>
        <p>Hello ${invoice.client_name},</p>
        <p>This is your invoice for the first milestone of the project: <strong>${project.title}</strong>.</p>

        <div class="invoice-details">
          <p><strong>Invoice Number:</strong> ${invoice.invoice_number}</p>
          <p><strong>Description:</strong> ${invoice.stage_description}</p>
          ${invoice.project_description ? `<p><strong>Project Description:</strong> ${invoice.project_description}</p>` : ''}
          <p><strong>Amount Due:</strong> $${invoice.amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
          <p><strong>Due Date:</strong> ${new Date(invoice.due_date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
        </div>

        <p style="margin-top: 20px;">Thank you for your business!</p>

        <div class="footer">
          <p>${settings.company_name} | ${settings.company_email || ''} | ${settings.company_phone || ''}</p>
        </div>
      </div>
    </body>
    </html>
  `;
}
