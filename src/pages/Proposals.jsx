
import React, { useState, useEffect } from "react";
import { User } from "@/api/entities";
import { Proposal } from "@/api/entities";
import { Project } from "@/api/entities";
import { Invoice } from "@/api/entities";
import { Settings } from "@/api/entities"; // Correctly import Settings
import { InvokeLLM, SendEmail } from "@/api/integrations";
import { sendExternalEmail } from "@/api/functions"; // New function for external emails
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Plus, FileText, Send, Check, X } from "lucide-react";
import ProposalCard from "../components/proposals/ProposalCard";
import CreateProposalDialog from "../components/proposals/CreateProposalDialog";
import ProposalViewer from "../components/proposals/ProposalViewer";
import EmailPreviewDialog from "../components/common/EmailPreviewDialog";
import { format } from "date-fns";

export default function Proposals() {
  const [user, setUser] = useState(null);
  const [proposals, setProposals] = useState([]);
  const [selectedProposal, setSelectedProposal] = useState(null);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [generatingContent, setGeneratingContent] = useState(null);
  const [invoiceLoading, setInvoiceLoading] = useState({});

  // New state for email preview
  const [showEmailPreview, setShowEmailPreview] = useState(false);
  const [emailPreviewData, setEmailPreviewData] = useState(null);
  const [isSendingEmail, setIsSendingEmail] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const userData = await User.me();
      setUser(userData);

      const proposalsData = await Proposal.list("-updated_date");
      setProposals(proposalsData);

      if (proposalsData.length > 0) {
        setSelectedProposal(proposalsData[0]);
      }
    } catch (error) {
      console.error("Error loading data:", error);
    }
    setLoading(false);
  };

  const filteredProposals = proposals.filter(proposal =>
    proposal.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    proposal.client_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleProposalCreated = () => {
    setShowCreateDialog(false);
    loadData();
  };

  const handleProposalSelect = (proposal) => {
    setSelectedProposal(proposal);
  };

  const handleSendToClient = async (proposal) => {
    setGeneratingContent(proposal.id);

    try {
      // Correctly fetch settings from the Settings entity
      const settingsData = await Settings.list();
      console.log("Proposal data:", proposal);
      console.log("Settings data:", settings);
      console.log("AI response:", proposalContent);
      console.log("Subject:", proposalContent.subject_line || `Proposal: ${proposal.title} - ${settings.company_name}`);
      console.log("HTML content length:", proposalContent.html_content?.length);
      const settings = settingsData.length > 0 ? settingsData[0] : {
        company_name: "Nex-a Tech Solutions",
        company_logo_url: "",
        primary_color: "#72FD67",
        secondary_color: "#1E1E1D",
        accent_color: "#F2F2F2",
        email_theme: "light",
      };

      // Generate beautiful proposal with AI - simplified prompt to avoid network issues
      const proposalContent = await InvokeLLM({
        prompt: `Create a professional HTML proposal for ${settings.company_name}.

Theme: ${settings.email_theme}
Colors: Primary ${settings.primary_color}, Secondary ${settings.secondary_color}, Accent ${settings.accent_color}
Logo: ${settings.company_logo_url || 'none'}

Proposal: ${proposal.title} for ${proposal.client_name}
Type: ${proposal.project_type}
Budget: $${proposal.total_fee?.toLocaleString()}
Timeline: ${proposal.timeline || "TBD"}

Description: ${proposal.description}
Scope: ${proposal.scope_of_work || "To be defined"}

Create a complete HTML email with:
- Professional header with logo and company name
- Executive summary
- Project details and scope
- Investment information
- Accept proposal button
- Clean, branded styling using the specified theme and colors

Make it self-contained HTML with inline CSS.`,
        response_json_schema: {
          type: "object",
          properties: {
            html_content: { type: "string" },
            subject_line: { type: "string" }
          }
        }
      });
      
      setEmailPreviewData({
        recipient: proposal.client_email,
        subject: proposalContent.subject_line || `Proposal: ${proposal.title} - ${settings.company_name}`,
        body: proposalContent.html_content,
        proposalId: proposal.id,
        generatedContent: proposalContent.html_content
      });
      setShowEmailPreview(true);

    } catch (error) {
      console.error("Error generating proposal content:", error); 
      // Get settings again for fallback template (in case of error before settings were fetched)
      let fallbackSettings;
      try {
        const settingsData = await Settings.list();
        fallbackSettings = settingsData.length > 0 ? settingsData[0] : {
          company_name: "Nex-a Tech Solutions",
          company_logo_url: "",
          primary_color: "#72FD67",
          secondary_color: "#1E1E1D",
          accent_color: "#F2F2F2",
          email_theme: "light",
        };
      } catch (settingsError) {
        // Ultimate fallback if settings can't be fetched
        fallbackSettings = {
          company_name: "Nex-a Tech Solutions",
          company_logo_url: "",
          primary_color: "#72FD67",
          secondary_color: "#1E1E1D",
          accent_color: "#F2F2F2",
          email_theme: "light",
        };
      }
      
      // Provide fallback HTML template if AI fails
      const fallbackHTML = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: Arial, sans-serif; margin: 0; padding: 20px; background: ${fallbackSettings.accent_color}; }
            .container { max-width: 800px; margin: 0 auto; background: white; padding: 40px; border-radius: 10px; box-shadow: 0 4px 20px rgba(0,0,0,0.1); }
            .header { text-align: center; margin-bottom: 40px; padding-bottom: 20px; border-bottom: 2px solid ${fallbackSettings.primary_color}; }
            .logo { max-width: 200px; height: auto; margin-bottom: 20px; }
            .company-name { font-size: 28px; font-weight: bold; color: ${fallbackSettings.secondary_color}; margin: 0; }
            .proposal-title { font-size: 24px; color: ${fallbackSettings.primary_color}; margin: 30px 0 20px 0; text-align: center; }
            .section { margin: 30px 0; }
            .section h3 { color: ${fallbackSettings.secondary_color}; border-bottom: 1px solid #eee; padding-bottom: 10px; }
            .highlight-box { background: ${fallbackSettings.accent_color}; padding: 20px; border-radius: 8px; margin: 20px 0; }
            .investment { text-align: center; font-size: 32px; font-weight: bold; color: ${fallbackSettings.primary_color}; margin: 30px 0; }
            .accept-btn { display: inline-block; background: ${fallbackSettings.primary_color}; color: ${fallbackSettings.secondary_color}; padding: 15px 40px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 18px; margin: 20px 0; }
            .footer { margin-top: 40px; padding-top: 20px; border-top: 1px solid #eee; text-align: center; color: #666; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              ${fallbackSettings.company_logo_url ? `<img src="${fallbackSettings.company_logo_url}" alt="${fallbackSettings.company_name}" class="logo">` : ''}
              <h1 class="company-name">${fallbackSettings.company_name}</h1>
            </div>
            
            <h2 class="proposal-title">PROJECT PROPOSAL</h2>
            
            <div class="section">
              <h3>Executive Summary</h3>
              <p>We are pleased to present this proposal for <strong>${proposal.title}</strong> for ${proposal.client_name}. This ${proposal.project_type} project will deliver significant value to your organization.</p>
            </div>
            
            <div class="section">
              <h3>Project Overview</h3>
              <div class="highlight-box">
                <p><strong>Project:</strong> ${proposal.title}</p>
                <p><strong>Type:</strong> ${proposal.project_type}</p>
                <p><strong>Timeline:</strong> ${proposal.timeline || 'To be determined'}</p>
                <p><strong>Description:</strong> ${proposal.description}</p>
              </div>
            </div>
            
            <div class="section">
              <h3>Scope of Work</h3>
              <p>${proposal.scope_of_work || 'Detailed scope to be finalized upon project acceptance.'}</p>
            </div>
            
            <div class="investment">Investment: $${proposal.total_fee?.toLocaleString()}</div>
            
            <div style="text-align: center; margin: 40px 0;">
              <a href="${window.location.origin}/proposal/${proposal.id}" class="accept-btn">Accept This Proposal</a>
            </div>
            
            <div class="footer">
              <p>Thank you for considering ${fallbackSettings.company_name} for your project needs.</p>
              <p>We look forward to working with you!</p>
            </div>
          </div>
        </body>
        </html>
      `;

      setEmailPreviewData({
        recipient: proposal.client_email,
        subject: `Proposal: ${proposal.title} - ${fallbackSettings.company_name}`,
        body: fallbackHTML,
        proposalId: proposal.id,
        generatedContent: fallbackHTML
      });
      setShowEmailPreview(true);
      
      // Show user-friendly message
      alert("AI generation temporarily unavailable. Using standard proposal template. You can edit the content before sending.");
    } finally {
      setGeneratingContent(null);
    }
  };

  const handleConfirmSendProposal = async (subject, body) => {
      if (!emailPreviewData) return;
      
      setIsSendingEmail(true);
      const { proposalId, recipient, generatedContent } = emailPreviewData;

      try {
        // Check if Gmail is connected
        const settingsData = await Settings.list();
        const gmailConnected = settingsData.length > 0 && settingsData[0].gmail_refresh_token;

        if (gmailConnected) {
          // Use the backend function to send via Gmail
          await sendExternalEmail({
            to: recipient,
            subject: subject,
            body: body,
          });
        } else {
          // Use the standard integration for internal/invited users
          await SendEmail({
            to: recipient,
            subject: subject,
            body: body,
          });
        }

        // Option 1: Use the custom send_proposal endpoint (recommended)
        try {
          const response = await fetch(`${import.meta.env.VITE_API_URL || 'ttps://organization-portal-deppipeline.onrender.com/api'}/proposals/${proposalId}/send_proposal/`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
            },
            body: JSON.stringify({
              generated_content: generatedContent
            }),
          });

          if (!response.ok) {
            throw new Error('Failed to update proposal status');
          }
        } catch (error) {
          console.error('Error with custom endpoint, trying direct update:', error);
          
          // Option 2: Fallback to direct update (simplified payload)
          await Proposal.update(proposalId, {
            status: "sent",
            generated_content: generatedContent
            // Remove sent_date - let the backend handle it automatically
          });
        }

        setShowEmailPreview(false);
        setEmailPreviewData(null);
        loadData();
      } catch (error) {
        console.error("Error sending proposal email:", error);
        if (error.response?.data?.error?.includes("outside the app")) {
          alert("Failed to send proposal: The default mailer can only send to users invited to this app. Please connect your Gmail account in Settings to send emails to any address.");
        } else {
          alert("Failed to send proposal. Please try again.");
        }
      } finally {
        setIsSendingEmail(false);
      }
    };


    const handleAcceptProposal = async (proposal) => {
      try {
        await Proposal.update(proposal.id, { status: "accepted" });
      
        const clientId = proposal.client_id || 
                        proposal.clientId || 
                        proposal.client?.id || 
                        proposal.client;
        
        console.log("Final clientId:", clientId);

        if (!clientId) {
          console.error("? NO CLIENT ID FOUND!");
          console.error("Available proposal fields:", Object.keys(proposal));
          alert("Error: No client ID found in proposal. Check console for details.");
          return;
        }

        // 2. Create project from proposal
        const projectData = {
          title: proposal.title,
          description: proposal.description,
          project_type: proposal.project_type,
          client: clientId, // Use the found client ID
          client_name: proposal.client_name,
          client_email: proposal.client_email,
          total_fee: proposal.total_fee,
          status: "active",
          current_stage: "discovery",
          start_date: new Date().toISOString().split('T')[0],
          stage_completion: {
            discovery: false,
            design: false,
            development: false,
            testing: false,
            deployment: false,
            training: false
          }
        };
        
        console.log("=== PROJECT DATA BEING SENT ===");
        console.log(projectData);
        
        await Project.create(projectData);

        alert("Proposal accepted and project has been created successfully!");
        loadData();
      } catch (error) {
        console.error("Error accepting proposal:", error);
        console.error("EXACT ERROR:", error.response?.data);
        console.error("Error status:", error.response?.status);
        console.error("EXACT ERROR:", JSON.stringify(error.response.data, null, 2));
        alert("There was an error creating the project. Please check the console.");
      }
    };

  // Helper function to determine the next project stage
  const getNextStage = (currentStage) => {
    const stagesOrder = [
      "discovery",
      "design",
      "development",
      "testing",
      "deployment",
      "training"
    ];
    const currentIndex = stagesOrder.indexOf(currentStage);
    if (currentIndex < stagesOrder.length - 1) {
      return stagesOrder[currentIndex + 1];
    }
    return "completed"; // Indicates all defined stages are done
  };

  const handleStageComplete = async (project, stage) => {
    setInvoiceLoading(prev => ({ ...prev, [stage]: true }));

    try {
      // Generate AI invoice description
      const stageDescriptions = {
        discovery: "Discovery & Requirements Analysis",
        design: "System Design & Architecture",
        development: "Development & Configuration",
        testing: "Testing & Quality Assurance",
        deployment: "Deployment & Implementation",
        training: "Training & Handoff"
      };

      const stagePercentages = {
        discovery: 15,
        design: 20,
        development: 30,
        testing: 15,
        deployment: 15,
        training: 5
      };

      const aiDescription = await InvokeLLM({
        prompt: `Generate a professional invoice description for the "${stageDescriptions[stage]}" phase of a ${project.project_type} project titled "${project.title}" for client "${project.client_name}".

        Include specific deliverables and work completed in this phase. Be detailed and professional.

        Project context: ${project.description}`,
        response_json_schema: {
          type: "object",
          properties: {
            description: { type: "string" }
          }
        }
      });

      // Generate proper 4-digit sequential invoice number
      const existingInvoices = await Invoice.list("-created_date", 100); // Fetch recent invoices to find max number
      const invoiceNumbers = existingInvoices
        .map(inv => {
          const match = inv.invoice_number.match(/^INV-(\d+)$/); // Match only invoices with the "INV-XXXX" format
          return match ? parseInt(match[1]) : 0;
        })
        .filter(num => num > 0);

      const nextNumber = invoiceNumbers.length > 0 ? Math.max(...invoiceNumbers) + 1 : 1;
      const invoiceNumber = `INV-${nextNumber.toString().padStart(4, '0')}`;

      const amount = (project.total_fee * stagePercentages[stage]) / 100;

      await Invoice.create({
        project_id: project.id,
        invoice_number: invoiceNumber,
        client_id: project.client_id, // Ensure client_id is passed for consistency
        client_name: project.client_name,
        client_email: project.client_email || "", // Fallback for email
        stage: stage,
        stage_description: aiDescription.description,
        amount: amount,
        percentage: stagePercentages[stage],
        status: "pending", // New invoices created upon stage completion start as pending
        due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
      });

      // Update project stage completion and current stage
      const updatedStageCompletion = { ...project.stage_completion, [stage]: true };
      await Project.update(project.id, {
        stage_completion: updatedStageCompletion,
        current_stage: getNextStage(stage)
      });

      // Refresh data after changes
      loadData();

    } catch (error) {
      console.error("Error creating invoice:", error);
    }

    setInvoiceLoading(prev => ({ ...prev, [stage]: false }));
  };

  if (loading) {
    return (
      <div className="p-8">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-slate-200 rounded w-64"></div>
          <div className="grid lg:grid-cols-3 gap-6">
            <div className="h-96 bg-slate-200 rounded-xl"></div>
            <div className="lg:col-span-2 h-96 bg-slate-200 rounded-xl"></div>
          </div>
        </div>
      </div>
    );
  }

  if (user?.access_level === "client") {
    return (
      <div className="p-8 text-center">
        <div className="text-slate-500">
          <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p>Access denied. Proposals are only available to admin and staff users.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 bg-gradient-to-br from-slate-50 to-slate-100 min-h-screen">
      <div className="max-w-7xl mx-auto space-y-4 sm:space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-2">Proposals</h1>
            <p className="text-slate-600 text-sm sm:text-base">Create and manage client proposals</p>
          </div>
          <Button
            onClick={() => setShowCreateDialog(true)}
            className="w-full sm:w-auto bg-amber-500 hover:bg-amber-600 text-slate-900 font-semibold"
          >
            <Plus className="w-4 h-4 mr-2" />
            New Proposal
          </Button>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 items-stretch sm:items-center">
          <Input
            placeholder="Search proposals..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full sm:max-w-md bg-white/80 backdrop-blur-sm border-slate-200"
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
          <div className="space-y-4 order-2 lg:order-1">
            <h3 className="font-semibold text-slate-900 text-lg">
              Proposals ({filteredProposals.length})
            </h3>
            <div className="space-y-3 max-h-96 lg:max-h-[600px] overflow-y-auto">
              {filteredProposals.map((proposal) => (
                <ProposalCard
                  key={proposal.id}
                  proposal={proposal}
                  isSelected={selectedProposal?.id === proposal.id}
                  onClick={() => handleProposalSelect(proposal)}
                />
              ))}
              {filteredProposals.length === 0 && (
                <div className="text-center py-8 text-slate-500">
                  <p>No proposals found</p>
                </div>
              )}
            </div>
          </div>

          <div className="lg:col-span-2 order-1 lg:order-2">
            {selectedProposal ? (
              <ProposalViewer
                proposal={selectedProposal}
                onAccept={handleAcceptProposal}
                onSendToClient={handleSendToClient}
                userRole={user?.access_level}
                generatingContent={generatingContent}
              />
            ) : (
              <Card className="h-64 sm:h-96 flex items-center justify-center bg-white/80 backdrop-blur-sm">
                <div className="text-center text-slate-500">
                  <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>Select a proposal to view details</p>
                </div>
              </Card>
            )}
          </div>
        </div>

        {showCreateDialog && (
          <CreateProposalDialog
            onClose={() => setShowCreateDialog(false)}
            onProposalCreated={handleProposalCreated}
          />
        )}

        {showEmailPreview && emailPreviewData && (
          <EmailPreviewDialog
            open={showEmailPreview}
            onClose={() => setShowEmailPreview(false)}
            onSend={handleConfirmSendProposal}
            initialSubject={emailPreviewData.subject}
            initialBody={emailPreviewData.body}
            recipient={emailPreviewData.recipient}
            sending={isSendingEmail}
          />
        )}
      </div>
    </div>
  );
}
