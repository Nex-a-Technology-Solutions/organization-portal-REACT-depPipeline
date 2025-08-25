
import React, { useState, useEffect } from "react";
import { User } from "@/api/entities";
import { Invoice } from "@/api/entities";
import { Project } from "@/api/entities";
import { Settings } from "@/api/entities";
import { SendEmail } from "@/api/integrations";
import { sendExternalEmail } from "@/api/functions"; // New function for external emails
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Receipt, 
  Send, 
  CheckCircle2, 
  Clock, 
  AlertTriangle,
  DollarSign,
  Calendar,
  FileText,
  Mail,
  Plus
} from "lucide-react";
import { format } from "date-fns";
import InvoiceCard from "../components/invoices/InvoiceCard";
import InvoiceViewer from "../components/invoices/InvoiceViewer";
import CreateInvoiceDialog from "../components/invoices/CreateInvoiceDialog";
import EmailPreviewDialog from "../components/common/EmailPreviewDialog";

export default function Invoices() {
  const [user, setUser] = useState(null);
  const [invoices, setInvoices] = useState([]);
  const [projects, setProjects] = useState([]);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState("all");
  const [loading, setLoading] = useState(true);
  const [sendingInvoice, setSendingInvoice] = useState(null);
  const [showCreateInvoice, setShowCreateInvoice] = useState(false);

  // New state for email preview
  const [showEmailPreview, setShowEmailPreview] = useState(false);
  const [emailPreviewData, setEmailPreviewData] = useState(null);
  const [isSendingEmail, setIsSendingEmail] = useState(false);


  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const userData = await User.me();
      setUser(userData);

      if (userData.access_level === "client") {
        setLoading(false);
        return;
      }

      const [invoicesData, projectsData] = await Promise.all([
        Invoice.list("-created_date"),
        Project.list("-updated_date")
      ]);

      setInvoices(invoicesData);
      setProjects(projectsData);
      
      if (!selectedInvoice && invoicesData.length > 0) {
        setSelectedInvoice(invoicesData[0]);
      }
    } catch (error) {
      console.error("Error loading data:", error);
    }
    setLoading(false);
  };
  
  const handleInvoiceCreated = () => {
    setShowCreateInvoice(false);
    loadData();
  };

  const filteredInvoices = invoices.filter(invoice => {
    const matchesSearch = invoice.client_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         invoice.invoice_number.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesTab = activeTab === "all" || invoice.status === activeTab;
    return matchesSearch && matchesTab;
  });

  const handleSendInvoice = async (invoice) => {
    setSendingInvoice(invoice.id);
    
    try {
      const project = projects.find(p => p.id === invoice.project_id);
      
      // Get company settings for invoice branding
      const settingsData = await Settings.list();
      const settings = settingsData.length > 0 ? settingsData[0] : {
        company_name: "Nex-a Portal",
        company_logo_url: "",
        primary_color: "#72FD67",
        secondary_color: "#1E1E1D",
        accent_color: "#F2F2F2",
        email_theme: "light", // Default to light theme
        company_address: "",
        company_phone: "",
        company_email: "",
        payment_terms: "Payment is due within 30 days of receipt",
        invoice_footer: "Thank you for your business!",
        bank_name: "",
        account_name: "",
        bsb: "",
        account_number: "",
        paypal_email: "",
        stripe_link: ""
      };

      // Apply email theme colors
      const isDarkEmail = settings.email_theme === "dark";
      const isContrastEmail = settings.email_theme === "contrast";
      
      let emailBgColor, emailContainerBg, emailTextColor, emailLightTextColor, emailHeaderBg, emailDetailBoxBg, emailBorderColor;
      
      if (isDarkEmail) {
        emailBgColor = "#1a1a1a";
        emailContainerBg = "#2a2a2a";
        emailTextColor = "#ffffff";
        emailLightTextColor = "#cccccc";
        emailHeaderBg = `linear-gradient(135deg, #333 0%, #444 100%)`;
        emailDetailBoxBg = "#333333";
        emailBorderColor = "#404040";
      } else if (isContrastEmail) {
        emailBgColor = "#ffffff";
        emailContainerBg = "#ffffff";
        emailTextColor = "#1E1E1D"; // Text color for main content
        emailLightTextColor = "#666666"; // Light text color for details
        emailHeaderBg = `linear-gradient(135deg, ${settings.secondary_color} 0%, #444 100%)`;
        emailDetailBoxBg = "#1a1a1a";
        emailBorderColor = "#333333";
      } else {
        // Light theme
        emailBgColor = "#F2F2F2";
        emailContainerBg = "white";
        emailTextColor = "#1E1E1D";
        emailLightTextColor = "#666";
        emailHeaderBg = `linear-gradient(135deg, ${settings.secondary_color} 0%, #444 100%)`;
        emailDetailBoxBg = settings.accent_color;
        emailBorderColor = "#E0E0E0";
      }

      // Generate beautiful branded HTML invoice
      const invoiceHTML = `
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
              max-width: 800px; 
              margin: 0 auto; 
              background: ${emailContainerBg}; 
              border-radius: 16px; 
              overflow: hidden; 
              box-shadow: 0 20px 50px rgba(0,0,0,0.1); 
            }
            .header { 
              background: ${settings.primary_color};
              color: white; 
              padding: 40px; 
              text-align: center; 
            }
            .logo { 
              width: 100px; 
              height: 100px; 
              margin: 0 auto 20px; 
              display: flex; 
              align-items: center; 
              justify-content: center; 
            }
            .logo img {
              max-width: 100%;
              max-height: 100%;
              object-fit: contain;
            }
            .logo-fallback {
              width: 100px; 
              height: 100px; 
              margin: 0 auto 20px; 
              display: flex; 
              align-items: center; 
              justify-content: center; 
              border-radius: 16px;
              background: ${settings.primary_color}; 
              color: ${settings.secondary_color};
            }
            .content { 
              padding: 40px; 
            }
            .invoice-details { 
              display: grid; 
              grid-template-columns: 1fr 1fr; 
              gap: 40px; 
              margin-bottom: 40px; 
            }
            @media (max-width: 640px) {
              .invoice-details { 
                grid-template-columns: 1fr; 
                gap: 20px; 
              }
            }
            .detail-box { 
              background: ${emailDetailBoxBg}; 
              padding: 24px; 
              border-radius: 12px; 
              ${isContrastEmail ? `border: 1px solid ${emailBorderColor};` : ''}
            }
            .amount-box { 
              background: linear-gradient(135deg, ${settings.primary_color} 0%, #5DE055 100%); 
              color: ${settings.secondary_color}; 
              padding: 30px; 
              border-radius: 16px; 
              text-align: center; 
              margin: 30px 0; 
            }
            .payment-methods { 
              background: ${emailDetailBoxBg}; 
              padding: 30px; 
              border-radius: 12px; 
              margin: 30px 0; 
              ${isContrastEmail ? `border: 1px solid ${emailBorderColor};` : ''}
            }
            .method { 
              margin-bottom: 20px; 
              padding-bottom: 20px; 
              border-bottom: 1px solid ${emailBorderColor}; 
            }
            .method:last-child { 
              border-bottom: none; 
              margin-bottom: 0; 
              padding-bottom: 0; 
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
              font-size: 32px; 
              font-weight: 700; 
            }
            h2 { 
              margin: 0 0 10px 0; 
              font-size: 24px; 
              font-weight: 600; 
              color: ${emailTextColor}; 
            }
            h3 { 
              margin: 0 0 15px 0; 
              font-size: 20px; 
              font-weight: 600; 
              color: ${emailTextColor}; 
            }
            h4 { 
              margin: 0 0 8px 0; 
              font-size: 16px; 
              font-weight: 600; 
              color: ${emailTextColor}; 
            }
            p { 
              margin: 0 0 8px 0; 
              color: ${emailLightTextColor}; 
            }
            .highlight { 
              color: ${emailTextColor}; 
              font-weight: 600; 
            }
            ${isContrastEmail ? `
            .content h2, .content h3 { color: #ffffff; } /* For contrast, headings inside content are white */
            .content h4 { color: #ffffff; }
            .content .highlight { color: #ffffff; }
            .content p { color: #cccccc; } /* Light text for paragraphs */
            .detail-box .highlight { color: #ffffff; }
            ` : ''}
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
            </div>
            
            <div class="content">
              <div style="text-align: center; margin-bottom: 40px;">
                <h2 style="color:${emailLightTextColor}; font-size: 15px; margin-bottom: 5px;">This invoice reflects the agreed-upon project deliverables and corresponding payment for the current stage of completion. Please review the details carefully. Payment is requested in accordance with the terms outlined in our agreement/proposal to ensure smooth continuation and timely delivery of the project.</h2>
                <p style="text-align:start; font-size: 12px; color: ${emailLightTextColor};">Invoice #${invoice.invoice_number}</p>
              </div>

              <div class="invoice-details">
                <div class="detail-box">
                  <h3>Bill To</h3>
                  <h4 class="highlight">${invoice.client_name}</h4>
                  <p>${invoice.client_email}</p>
                  ${project ? `<p style="margin-top: 15px;"><span class="highlight">Project:</span> ${project.title}</p>` : ''}
                </div>
                
                <div class="detail-box">
                  <h3>Invoice Details</h3>
                  <p><span class="highlight">Date:</span> ${format(new Date(), 'MMMM d, yyyy')}</p>
                  <p><span class="highlight">Due Date:</span> ${format(new Date(invoice.due_date), 'MMMM d, yyyy')}</p>
                  <p><span class="highlight">Stage:</span> ${invoice.stage_description}</p>
                </div>
              </div>

              <div class="amount-box">
                <h2 style="color: ${settings.secondary_color}; margin-bottom: 10px;">Total Amount Due</h2>
                <h1 style="color: ${settings.secondary_color}; font-size: 48px;">$${invoice.amount?.toLocaleString()}</h1>
              </div>

              ${invoice.project_description ? `
              <div class="detail-box" style="margin: 30px 0;">
                <h3>Project Context</h3>
                <p style="color: ${isContrastEmail ? '#cccccc' : emailLightTextColor}; font-size: 15px; line-height: 1.7;">${invoice.project_description}</p>
              </div>
              ` : ''}

              <div class="detail-box" style="margin: 30px 0;">
                <h3>Work Description for this Invoice</h3>
                <p style="color: ${isContrastEmail ? '#cccccc' : emailTextColor}; font-size: 16px; line-height: 1.8;">${invoice.stage_description}</p>
              </div>

              ${(settings.bank_name || settings.paypal_email || settings.stripe_link) ? `
              <div class="payment-methods">
                <h3>Payment Options</h3>
                
                ${settings.bank_name ? `
                <div class="method">
                  <h4>🏦 Bank Transfer</h4>
                  <p><span class="highlight">Bank:</span> ${settings.bank_name}</p>
                  ${settings.account_name ? `<p><span class="highlight">Account Name:</span> ${settings.account_name}</p>` : ''}
                  ${settings.bsb ? `<p><span class="highlight">BSB:</span> ${settings.bsb}</p>` : ''}
                  ${settings.account_number ? `<p><span class="highlight">Account #:</span> ${settings.account_number}</p>` : ''}
                </div>
                ` : ''}
                
                ${settings.paypal_email ? `
                <div class="method">
                  <h4>💳 PayPal</h4>
                  <p>Send payment to: <span class="highlight">${settings.paypal_email}</span></p>
                </div>
                ` : ''}
                
                ${settings.stripe_link ? `
                <div class="method">
                  <h4>🔒 Online Payment</h4>
                  <p>Pay securely online: <a href="${settings.stripe_link}" style="color: ${settings.primary_color}; font-weight: 600; text-decoration: none;">Click here to pay</a></p>
                </div>
                ` : ''}
              </div>
              ` : ''}

              <div class="detail-box">
                <h4>Payment Terms</h4>
                <p>${settings.payment_terms}</p>
              </div>
            </div>
            
            <div class="footer">
              <p class="highlight" style="margin-bottom: 15px; font-size: 18px;">${settings.invoice_footer}</p>
              ${settings.company_address ? `<p style="margin-bottom: 8px;">${settings.company_address}</p>` : ''}
              <div style="display: flex; justify-content: center; gap: 20px; flex-wrap: wrap; margin-top: 10px;">
                ${settings.company_phone ? `<p style="margin: 0;">📞 ${settings.company_phone}</p>` : ''}
                ${settings.company_email ? `<p style="margin: 0;">✉️ ${settings.company_email}</p>` : ''}
              </div>
            </div>
          </div>
        </body>
        </html>
      `;
      
      setEmailPreviewData({
        recipient: invoice.client_email,
        subject: `Invoice ${invoice.invoice_number} from ${settings.company_name}`,
        body: invoiceHTML,
        invoiceId: invoice.id
      });
      setShowEmailPreview(true);

    } catch (error) {
      console.error("Error preparing invoice:", error);
    } finally {
      setSendingInvoice(null);
    }
  };

// Replace the handleConfirmSendInvoice function in your Invoices component with this updated version:

  const handleConfirmSendInvoice = async (subject, body) => {
    if (!emailPreviewData) return;

    setIsSendingEmail(true);
    const { invoiceId, recipient } = emailPreviewData;
    
    try {
      // Check if Gmail is connected
      const settingsData = await Settings.list();
      const gmailConnected = settingsData.length > 0 && settingsData[0].gmail_refresh_token;

      // Create plain text version of the email
      const plainTextBody = `
  Invoice ${emailPreviewData.subject.split(' ')[1]} from ${settingsData[0]?.company_name || 'Nex-a Portal'}

  Dear ${recipient},

  Please find attached your invoice details:

  Invoice Number: ${selectedInvoice?.invoice_number}
  Amount Due: $${selectedInvoice?.amount?.toLocaleString()}
  Due Date: ${selectedInvoice?.due_date}

  ${selectedInvoice?.stage_description}

  Payment Terms: ${settingsData[0]?.payment_terms || 'Payment is due within 30 days of receipt'}

  Thank you for your business!

  Best regards,
  ${settingsData[0]?.company_name || 'Nex-a Portal'} Team
      `.trim();

      if (gmailConnected) {
        // Use the backend function to send via Gmail with both plain text and HTML
        await sendExternalEmail({
          to: recipient,
          subject: subject,
          body: plainTextBody,
          html_message: body // The HTML content goes here
        });
      } else {
        // Use the standard integration for internal/invited users with both plain text and HTML
        await SendEmail({
          to: recipient,
          subject: subject,
          body: plainTextBody,
          html_message: body // The HTML content goes here
        });
      }

      // Update invoice status
      try {
        // First get the current invoice data
        const currentInvoice = await Invoice.get(invoiceId);
        
        // Then update with all required fields
        const updateData = {
          project: currentInvoice.project,
          invoice_number: currentInvoice.invoice_number,
          client: currentInvoice.client,
          stage: currentInvoice.stage,
          stage_description: currentInvoice.stage_description,
          amount: currentInvoice.amount,
          percentage: currentInvoice.percentage,
          due_date: currentInvoice.due_date,
          status: "sent",
          sent_date: new Date().toISOString().split('T')[0]
        };

        
        await Invoice.update(invoiceId, updateData);
        
      } catch (error) {
        console.error("Error updating invoice status:", error);
      }

      setShowEmailPreview(false);
      setEmailPreviewData(null);
      loadData();
    } catch (error) {
      console.error("Error sending invoice:", error);
      if (error.response?.data?.error?.includes("outside the app")) {
        alert("Failed to send invoice: The default mailer can only send to users invited to this app. Please connect your Gmail account in Settings to send emails to any address.");
      } else {
        alert("Failed to send invoice email.");
      }
    } finally {
      setIsSendingEmail(false);
    }
  };

  const handleMarkAsPaid = async (invoice) => {
    try {
      // Send all required fields for the PUT request
      const updateData = {
        project: invoice.project,
        invoice_number: invoice.invoice_number,
        client: invoice.client,
        stage: invoice.stage,
        stage_description: invoice.stage_description,
        amount: invoice.amount,
        percentage: invoice.percentage,
        due_date: invoice.due_date,
        status: "paid",
        paid_date: new Date().toISOString().split('T')[0]
      };
      
      await Invoice.update(invoice.id, updateData);
      loadData();
      
    } catch (error) {
      console.error("Error updating invoice:", error);
      
      if (error.response) {
        console.error("Error response status:", error.response.status);
        console.error("Error response data:", JSON.stringify(error.response.data, null, 2));
      }
      
      alert("Failed to mark invoice as paid. Check console for details.");
    }
  };
  
  const getStatusStats = () => {
    const stats = {
      all: invoices.length,
      draft: invoices.filter(i => i.status === "draft").length,
      sent: invoices.filter(i => i.status === "sent").length,
      paid: invoices.filter(i => i.status === "paid").length,
      overdue: invoices.filter(i => i.status === "overdue").length
    };
    return stats;
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
          <Receipt className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p>Access denied. Invoices are only available to admin and staff users.</p>
        </div>
      </div>
    );
  }

  const stats = getStatusStats();

  return (
    <div className="p-4 md:p-8 bg-gradient-to-br from-slate-50 to-slate-100 min-h-screen">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 mb-2">Invoices</h1>
            <p className="text-slate-600">Manage client invoicing and payments</p>
          </div>
          <div className="flex gap-3">
             <Button
                onClick={() => setShowCreateInvoice(true)}
                className="bg-slate-900 hover:bg-slate-800 text-white font-semibold"
              >
                <Plus className="w-4 h-4 mr-2" />
                New Invoice
              </Button>
            <div className="flex items-center gap-2 text-sm text-slate-600">
              <DollarSign className="w-4 h-4" />
              Total Revenue: $
              {invoices.filter(i => i.status === "paid").reduce((sum, i) => sum + (i.amount || 0), 0).toLocaleString()}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <Card className="bg-white/80 backdrop-blur-sm">
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-slate-900">{stats.all}</div>
              <div className="text-sm text-slate-500">Total</div>
            </CardContent>
          </Card>
          <Card className="bg-white/80 backdrop-blur-sm">
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-gray-900">{stats.draft}</div>
              <div className="text-sm text-gray-500">Draft</div>
            </CardContent>
          </Card>
          <Card className="bg-white/80 backdrop-blur-sm">
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-blue-900">{stats.sent}</div>
              <div className="text-sm text-blue-500">Sent</div>
            </CardContent>
          </Card>
          <Card className="bg-white/80 backdrop-blur-sm">
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-green-900">{stats.paid}</div>
              <div className="text-sm text-green-500">Paid</div>
            </CardContent>
          </Card>
          <Card className="bg-white/80 backdrop-blur-sm">
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-red-900">{stats.overdue}</div>
              <div className="text-sm text-red-500">Overdue</div>
            </CardContent>
          </Card>
        </div>

        <div className="flex gap-4 items-center">
          <Input
            placeholder="Search invoices..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="max-w-md bg-white/80 backdrop-blur-sm border-slate-200"
          />
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="bg-white/80 backdrop-blur-sm">
              <TabsTrigger value="all">All</TabsTrigger>
              <TabsTrigger value="draft">Draft</TabsTrigger>
              <TabsTrigger value="sent">Sent</TabsTrigger>
              <TabsTrigger value="paid">Paid</TabsTrigger>
              <TabsTrigger value="overdue">Overdue</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          <div className="space-y-4">
            <h3 className="font-semibold text-slate-900 text-lg">
              Invoices ({filteredInvoices.length})
            </h3>
            <div className="space-y-3 max-h-[600px] overflow-y-auto">
              {filteredInvoices.map((invoice) => (
                <InvoiceCard
                  key={invoice.id}
                  invoice={invoice}
                  project={projects.find(p => p.id === invoice.project_id)}
                  isSelected={selectedInvoice?.id === invoice.id}
                  onClick={() => setSelectedInvoice(invoice)}
                />
              ))}
              {filteredInvoices.length === 0 && (
                <div className="text-center py-8 text-slate-500">
                  <p>No invoices found</p>
                </div>
              )}
            </div>
          </div>

          <div className="lg:col-span-2">
            {selectedInvoice ? (
              <InvoiceViewer
                invoice={selectedInvoice}
                project={projects.find(p => p.id === selectedInvoice.project_id)}
                onSendInvoice={handleSendInvoice}
                onMarkAsPaid={handleMarkAsPaid}
                sendingInvoice={sendingInvoice}
              />
            ) : (
              <Card className="h-96 flex items-center justify-center bg-white/80 backdrop-blur-sm">
                <div className="text-center text-slate-500">
                  <Receipt className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>Select an invoice to view details</p>
                </div>
              </Card>
            )}
          </div>
        </div>
      </div>
       {showCreateInvoice && (
        <CreateInvoiceDialog
          projects={projects.filter(p => p.status === 'active')}
          onClose={() => setShowCreateInvoice(false)}
          onInvoiceCreated={handleInvoiceCreated}
        />
      )}
      {showEmailPreview && emailPreviewData && (
        <EmailPreviewDialog
          open={showEmailPreview}
          onClose={() => setShowEmailPreview(false)}
          onSend={handleConfirmSendInvoice}
          initialSubject={emailPreviewData.subject}
          initialBody={emailPreviewData.body}
          recipient={emailPreviewData.recipient}
          sending={isSendingEmail}
        />
      )}
    </div>
  );
}
