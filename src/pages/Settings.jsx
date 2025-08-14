
import React, { useState, useEffect, useRef } from "react";
import { User } from "@/api/entities";
import { Settings } from "@/api/entities";
import { UploadFile } from "@/api/integrations";
import { getGmailAuthUrl } from "@/api/functions";
import { disconnectGmail } from "@/api/functions";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Settings as SettingsIcon, CreditCard, Building, Save, Upload, Palette, Image, Link, Mail, Power, PowerOff, CheckCircle, AlertCircle, Shield } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import RecordManager from "../components/admin/RecordManager";
import UserImpersonationDialog from "../components/admin/UserImpersonationDialog"; // Added import

function GmailConnectCard({ settings, onDisconnect }) {
  const [connecting, setConnecting] = useState(false);
  const [disconnecting, setDisconnecting] = useState(false);
  const [error, setError] = useState(null); // New state for error messages

  const handleConnect = async () => {
    setConnecting(true);
    setError(null); // Clear any previous error
    try {
      const { data } = await getGmailAuthUrl();
      if (data.authorizationUrl) {
        window.location.href = data.authorizationUrl;
      }
    } catch (error) { // Changed errorRes to error as per outline and common practice
      console.error("Error getting auth URL:", error);
      // Custom, more helpful error message for this specific case
      if (error.response?.data?.error?.includes("Gmail API credentials are not configured")) {
        setError("Configuration incomplete. Please provide your Gmail API credentials in your app's environment settings as described in the 'Setup Required' section below.");
      } else if (error.response?.data?.error) {
        setError(error.response.data.error);
      } else {
        setError("Could not start connection process. An unknown error occurred.");
      }
      setConnecting(false);
    }
  };

  const handleDisconnect = async () => {
    setDisconnecting(true);
    try {
      await disconnectGmail();
      onDisconnect();
    } catch (error) {
      console.error("Error disconnecting:", error);
      alert("Could not disconnect. See console for details.");
    }
    setDisconnecting(false);
  };

  const isConnected = !!settings?.gmail_connected_email;

  return (
    <Card className="bg-white/90 backdrop-blur-sm border-gray-200">
      <CardHeader>
        <CardTitle className="text-[#1E1E1D]">Gmail Connection</CardTitle>
        <CardDescription>
          Connect your Gmail account to send emails directly from the app.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isConnected ? (
          <div className="flex items-center justify-between p-4 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-center gap-3">
              <CheckCircle className="w-6 h-6 text-green-600" />
              <div>
                <p className="font-semibold text-green-800">Connected as:</p>
                <p className="text-sm text-green-700">{settings.gmail_connected_email}</p>
              </div>
            </div>
            <Button variant="destructive" onClick={handleDisconnect} disabled={disconnecting}>
              <PowerOff className="w-4 h-4 mr-2" />
              {disconnecting ? "Disconnecting..." : "Disconnect"}
            </Button>
          </div>
        ) : (
          <div className="space-y-4"> {/* Added space-y-4 for consistent spacing */}
            <div className="flex items-center justify-between p-4 bg-gray-50 border border-gray-200 rounded-lg">
              <div className="flex items-center gap-3">
                <AlertCircle className="w-6 h-6 text-gray-500" />
                <div>
                  <p className="font-semibold text-gray-800">Not Connected</p>
                  <p className="text-sm text-gray-600">You are currently using the default email provider.</p>
                </div>
              </div>
              <Button onClick={handleConnect} disabled={connecting} className="bg-blue-600 hover:bg-blue-700">
                <Mail className="w-4 h-4 mr-2" />
                {connecting ? "Redirecting..." : "Connect with Gmail"}
              </Button>
            </div>
            
            {error && ( // Display error message if present
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-red-600 mt-0.5" />
                  <div>
                    <p className="font-semibold text-red-800">Configuration Error</p>
                    <p className="text-sm text-red-700 mt-1">{error}</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
         <div className="mt-4 p-4 bg-blue-50 border-l-4 border-blue-400 text-blue-800">
            <p className="text-sm">
                <strong>Setup Required:</strong> To connect Gmail, you need to configure the following environment variables in your app settings:
            </p>
            <ul className="text-sm mt-2 space-y-1 ml-4 list-disc">
                <li><code>GMAIL_CLIENT_ID</code> - Your Google OAuth Client ID</li>
                <li><code>GMAIL_CLIENT_SECRET</code> - Your Google OAuth Client Secret</li>
            </ul>
            <p className="text-sm mt-2">
                Get these credentials from the <a href="https://console.cloud.google.com/apis/credentials" target="_blank" rel="noopener noreferrer" className="underline">Google Cloud Console</a>.
            </p>
        </div>
      </CardContent>
    </Card>
  );
}


export default function SettingsPage() {
  const [user, setUser] = useState(null);
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const logoInputRef = useRef(null);
  const [formData, setFormData] = useState({
    company_name: "TechFlow Integration Solutions",
    company_address: "",
    company_phone: "",
    company_email: "",
    company_logo_url: "",
    primary_color: "#72FD67",
    secondary_color: "#1E1E1D",
    accent_color: "#F2F2F2",
    dark_mode: false,
    email_theme: "light", // Added email theme
    bank_name: "",
    account_name: "",
    bsb: "",
    account_number: "",
    paypal_email: "",
    stripe_link: "",
    payment_terms: "Payment is due within 30 days of receipt",
    invoice_footer: "Thank you for your business!"
  });
  const [showImpersonationDialog, setShowImpersonationDialog] = useState(false); // Added new state

  const location = useLocation();
  const navigate = useNavigate();

  const queryParams = new URLSearchParams(location.search);
  const defaultTab = queryParams.get("tab") || "company";

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const userData = await User.me();
      setUser(userData);

      if (userData.access_level !== "admin") {
        setLoading(false);
        return;
      }

      const settingsData = await Settings.list();
      if (settingsData.length > 0) {
        setSettings(settingsData[0]);
        // Merge fetched data with initial formData to ensure all keys are present
        setFormData(prev => ({ ...prev, ...settingsData[0] }));
      }
    } catch (error) {
      console.error("Error loading settings:", error);
    }
    setLoading(false);
  };
  
  const handleDisconnect = () => {
      loadData(); // Re-fetch settings to update UI
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      if (settings) {
        await Settings.update(settings.id, formData);
      } else {
        await Settings.create(formData);
      }
      loadData();
    } catch (error) {
      console.error("Error saving settings:", error);
    }
    setSaving(false);
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleLogoUpload = async (file) => {
    setUploadingLogo(true);
    try {
      const { file_url } = await UploadFile({ file });
      setFormData(prev => ({ ...prev, company_logo_url: file_url }));
    } catch (error) {
      console.error("Error uploading logo:", error);
      alert("Failed to upload logo. Please try again.");
    }
    setUploadingLogo(false);
  };

  if (loading) {
    return (
      <div className="p-8">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-slate-200 rounded w-64"></div>
          <div className="grid gap-6">
            <div className="h-96 bg-slate-200 rounded-xl"></div>
          </div>
        </div>
      </div>
    );
  }

  if (user?.access_level !== "admin") {
    return (
      <div className="p-8 text-center">
        <div className="text-slate-500">
          <SettingsIcon className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p>Access denied. Settings are only available to admin users.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 bg-gradient-to-br from-[#F2F2F2] to-gray-100 min-h-screen">
      <style>
        {`
          @import url('https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,200;12..96,300;12..96,400;12..96,500;12..96,600;12..96,700;12..96,800&display=swap');
          * {
            font-family: 'Bricolage Grotesque', -apple-system, BlinkMacSystemFont, sans-serif;
          }
        `}
      </style>
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-[#1E1E1D] mb-2">Settings</h1>
            <p className="text-gray-600 font-medium">Manage company settings and branding</p>
          </div>
          <div className="flex gap-3"> {/* Added flex gap div for buttons */}
            <Button
              onClick={() => setShowImpersonationDialog(true)}
              variant="outline"
              className="border-blue-200 text-blue-700 hover:bg-blue-50"
            >
              <Shield className="w-4 h-4 mr-2" />
              View as User
            </Button>
            <Button
              onClick={handleSave}
              disabled={saving}
              className="bg-[#72FD67] hover:bg-green-400 text-[#1E1E1D] font-semibold"
            >
              <Save className="w-4 h-4 mr-2" />
              {saving ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </div>

        <Tabs defaultValue={defaultTab} onValueChange={(value) => navigate(`/Settings?tab=${value}`)} className="space-y-6">
          <TabsList className="bg-white/90 backdrop-blur-sm border-gray-200">
            <TabsTrigger value="company" className="flex items-center gap-2">
              <Building className="w-4 h-4" />
              Company
            </TabsTrigger>
            <TabsTrigger value="branding" className="flex items-center gap-2">
              <Palette className="w-4 h-4" />
              Branding
            </TabsTrigger>
            <TabsTrigger value="payments" className="flex items-center gap-2">
              <CreditCard className="w-4 h-4" />
              Payment Details
            </TabsTrigger>
            <TabsTrigger value="connections" className="flex items-center gap-2">
                <Link className="w-4 h-4" />
                Connections
            </TabsTrigger>
            <TabsTrigger value="admin" className="flex items-center gap-2">
              <Shield className="w-4 h-4" />
              Admin Tools
            </TabsTrigger>
          </TabsList>

          <TabsContent value="company">
            <Card className="bg-white/90 backdrop-blur-sm border-gray-200">
              <CardHeader>
                <CardTitle className="text-[#1E1E1D]">Company Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <Label htmlFor="company_name">Company Name</Label>
                    <Input
                      id="company_name"
                      value={formData.company_name}
                      onChange={(e) => handleInputChange("company_name", e.target.value)}
                      className="font-medium"
                    />
                  </div>
                  <div>
                    <Label htmlFor="company_email">Company Email</Label>
                    <Input
                      id="company_email"
                      type="email"
                      value={formData.company_email}
                      onChange={(e) => handleInputChange("company_email", e.target.value)}
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="company_address">Company Address</Label>
                  <Textarea
                    id="company_address"
                    value={formData.company_address}
                    onChange={(e) => handleInputChange("company_address", e.target.value)}
                    placeholder="123 Business St, City, State 12345"
                    rows={3}
                  />
                </div>

                <div>
                  <Label htmlFor="company_phone">Phone Number</Label>
                  <Input
                    id="company_phone"
                    value={formData.company_phone}
                    onChange={(e) => handleInputChange("company_phone", e.target.value)}
                    placeholder="(555) 123-4567"
                  />
                </div>

                <div>
                  <Label htmlFor="payment_terms">Payment Terms</Label>
                  <Textarea
                    id="payment_terms"
                    value={formData.payment_terms}
                    onChange={(e) => handleInputChange("payment_terms", e.target.value)}
                    rows={2}
                  />
                </div>

                <div>
                  <Label htmlFor="invoice_footer">Invoice Footer</Label>
                  <Textarea
                    id="invoice_footer"
                    value={formData.invoice_footer}
                    onChange={(e) => handleInputChange("invoice_footer", e.target.value)}
                    rows={2}
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="branding">
            <Card className="bg-white/90 backdrop-blur-sm border-gray-200">
              <CardHeader>
                <CardTitle className="text-[#1E1E1D]">Brand Identity</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <Label className="text-base font-semibold">Company Logo</Label>
                  <div className="mt-2 space-y-4">
                    {formData.company_logo_url && (
                      <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
                        <img 
                          src={formData.company_logo_url} 
                          alt="Company Logo" 
                          className="h-16 w-16 object-contain bg-white rounded border"
                        />
                        <div>
                          <p className="text-sm font-medium text-gray-700">Current Logo</p>
                          <p className="text-xs text-gray-500">Upload a new logo to replace this one</p>
                        </div>
                      </div>
                    )}
                    
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => logoInputRef.current?.click()}
                        disabled={uploadingLogo}
                        className="mb-2"
                      >
                        {uploadingLogo ? (
                          <>
                            <div className="w-4 h-4 animate-spin rounded-full border-2 border-gray-300 border-t-gray-600 mr-2" />
                            Uploading...
                          </>
                        ) : (
                          <>
                            <Upload className="w-4 h-4 mr-2" />
                            Upload Logo
                          </>
                        )}
                      </Button>
                      <p className="text-sm text-gray-500">
                        PNG, JPG, or SVG. Max 2MB. Square format recommended.
                      </p>
                    </div>
                    <input
                      ref={logoInputRef}
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files[0];
                        if (file) handleLogoUpload(file);
                      }}
                      className="hidden"
                    />
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-[#1E1E1D] mb-4">Theme Settings</h3>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border">
                      <div>
                        <h4 className="font-semibold text-[#1E1E1D]">Dark Mode</h4>
                        <p className="text-sm text-gray-600">Enable dark theme across the app</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={formData.dark_mode}
                          onChange={(e) => handleInputChange("dark_mode", e.target.checked)}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#72FD67]"></div>
                      </label>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-[#1E1E1D] mb-4">Email Theme Selection</h3>
                  <p className="text-sm text-gray-600 mb-6">Choose how your invoices and proposals appear to clients</p>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Light Theme Preview */}
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <Label className="text-base font-medium">Light Theme</Label>
                        <input
                          type="radio"
                          name="email_theme"
                          value="light"
                          checked={formData.email_theme === "light"}
                          onChange={() => handleInputChange("email_theme", "light")}
                          className="w-4 h-4 text-[#72FD67] border-gray-300 focus:ring-[#72FD67]"
                        />
                      </div>
                      
                      <div className="border-2 rounded-lg overflow-hidden shadow-sm" style={{
                        borderColor: formData.email_theme === "light" ? formData.primary_color : "#e5e7eb"
                      }}>
                        <div className="h-80 p-4 text-xs" style={{
                          background: "linear-gradient(135deg, #1E1E1D 0%, #444 100%)",
                          color: "white"
                        }}>
                          <div className="text-center mb-3">
                            {formData.company_logo_url ? (
                              <div className="w-8 h-8 mx-auto mb-2 flex items-center justify-center">
                                <img src={formData.company_logo_url} alt="Logo" className="max-w-full max-h-full object-contain" />
                              </div>
                            ) : (
                              <div className="w-8 h-8 mx-auto mb-2 rounded flex items-center justify-center" style={{ backgroundColor: formData.primary_color }}>
                                <span style={{ color: formData.secondary_color }}>⚡</span>
                              </div>
                            )}
                            <div className="font-bold text-sm">{formData.company_name}</div>
                            <div className="text-xs opacity-75">Business Portal</div>
                          </div>
                          
                          <div className="bg-white text-gray-900 p-4 rounded mb-2">
                            <div className="text-center mb-3">
                              <div className="font-bold text-base mb-1" style={{ color: formData.primary_color }}>PROPOSAL</div>
                              <div className="text-xs text-gray-600 mb-2">System Integration Project</div>
                            </div>
                            
                            <div className="space-y-2 mb-3">
                              <div className="flex justify-between text-xs">
                                <span className="font-medium">Client:</span>
                                <span className="text-gray-600">Acme Corporation</span>
                              </div>
                              <div className="flex justify-between text-xs">
                                <span className="font-medium">Timeline:</span>
                                <span className="text-gray-600">8-12 weeks</span>
                              </div>
                            </div>
                            
                            <div className="bg-gray-50 p-3 rounded mb-3">
                              <div className="text-xs font-medium mb-1">Project Overview</div>
                              <div className="text-xs text-gray-600 leading-relaxed">Comprehensive system integration to streamline business operations and enhance productivity...</div>
                            </div>
                            
                            <div className="text-center p-3 rounded text-sm font-bold" style={{
                              background: `linear-gradient(135deg, ${formData.primary_color}, #5DE055)`,
                              color: formData.secondary_color
                            }}>
                              Investment: $25,000
                            </div>
                            
                            <div className="text-center mt-3">
                              <div className="inline-block px-4 py-2 rounded text-xs font-semibold text-white" style={{ backgroundColor: formData.primary_color }}>
                                Accept Proposal
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      <div className="text-xs text-gray-500 text-center">
                        Clean, professional look with white content cards
                      </div>
                    </div>

                    {/* Dark Theme Preview */}
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <Label className="text-base font-medium">Dark Theme</Label>
                        <input
                          type="radio"
                          name="email_theme"
                          value="dark"
                          checked={formData.email_theme === "dark"}
                          onChange={() => handleInputChange("email_theme", "dark")}
                          className="w-4 h-4 text-[#72FD67] border-gray-300 focus:ring-[#72FD67]"
                        />
                      </div>
                      
                      <div className="border-2 rounded-lg overflow-hidden shadow-sm" style={{
                        borderColor: formData.email_theme === "dark" ? formData.primary_color : "#e5e7eb"
                      }}>
                        <div className="h-80 p-4 text-xs bg-gray-900">
                          <div className="text-center mb-3">
                            {formData.company_logo_url ? (
                              <div className="w-8 h-8 mx-auto mb-2 flex items-center justify-center">
                                <img src={formData.company_logo_url} alt="Logo" className="max-w-full max-h-full object-contain" />
                              </div>
                            ) : (
                              <div className="w-8 h-8 mx-auto mb-2 rounded flex items-center justify-center" style={{ backgroundColor: formData.primary_color }}>
                                <span style={{ color: formData.secondary_color }}>⚡</span>
                              </div>
                            )}
                            <div className="font-bold text-sm text-white">{formData.company_name}</div>
                            <div className="text-xs text-gray-400">Business Portal</div>
                          </div>
                          
                          <div className="bg-gray-800 text-white p-4 rounded mb-2 border border-gray-700">
                            <div className="text-center mb-3">
                              <div className="font-bold text-base mb-1" style={{ color: formData.primary_color }}>PROPOSAL</div>
                              <div className="text-xs text-gray-400 mb-2">System Integration Project</div>
                            </div>
                            
                            <div className="space-y-2 mb-3">
                              <div className="flex justify-between text-xs">
                                <span className="font-medium text-white">Client:</span>
                                <span className="text-gray-300">Acme Corporation</span>
                              </div>
                              <div className="flex justify-between text-xs">
                                <span className="font-medium text-white">Timeline:</span>
                                <span className="text-gray-300">8-12 weeks</span>
                              </div>
                            </div>
                            
                            <div className="bg-gray-700 p-3 rounded mb-3">
                              <div className="text-xs font-medium mb-1 text-white">Project Overview</div>
                              <div className="text-xs text-gray-300 leading-relaxed">Comprehensive system integration to streamline business operations and enhance productivity...</div>
                            </div>
                            
                            <div className="text-center p-3 rounded text-sm font-bold" style={{
                              background: `linear-gradient(135deg, ${formData.primary_color}, #5DE055)`,
                              color: formData.secondary_color
                            }}>
                              Investment: $25,000
                            </div>
                            
                            <div className="text-center mt-3">
                              <div className="inline-block px-4 py-2 rounded text-xs font-semibold text-white" style={{ backgroundColor: formData.primary_color }}>
                                Accept Proposal
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      <div className="text-xs text-gray-500 text-center">
                        Modern dark theme with high contrast
                      </div>
                    </div>

                    {/* Contrast Theme Preview */}
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <Label className="text-base font-medium">Contrast Theme</Label>
                        <input
                          type="radio"
                          name="email_theme"
                          value="contrast"
                          checked={formData.email_theme === "contrast"}
                          onChange={() => handleInputChange("email_theme", "contrast")}
                          className="w-4 h-4 text-[#72FD67] border-gray-300 focus:ring-[#72FD67]"
                        />
                      </div>
                      
                      <div className="border-2 rounded-lg overflow-hidden shadow-sm" style={{
                        borderColor: formData.email_theme === "contrast" ? formData.primary_color : "#e5e7eb"
                      }}>
                        <div className="h-80 p-4 text-xs bg-white">
                          <div className="text-center mb-3 text-gray-900">
                            {formData.company_logo_url ? (
                              <div className="w-8 h-8 mx-auto mb-2 flex items-center justify-center">
                                <img src={formData.company_logo_url} alt="Logo" className="max-w-full max-h-full object-contain" />
                              </div>
                            ) : (
                              <div className="w-8 h-8 mx-auto mb-2 rounded flex items-center justify-center" style={{ backgroundColor: formData.primary_color }}>
                                <span style={{ color: formData.secondary_color }}>⚡</span>
                              </div>
                            )}
                            <div className="font-bold text-sm">{formData.company_name}</div>
                            <div className="text-xs text-gray-600">Business Portal</div>
                          </div>
                          
                          <div className="bg-gray-900 text-white p-4 rounded mb-2 border border-gray-300">
                            <div className="text-center mb-3">
                              <div className="font-bold text-base mb-1" style={{ color: formData.primary_color }}>PROPOSAL</div>
                              <div className="text-xs text-gray-300 mb-2">System Integration Project</div>
                            </div>
                            
                            <div className="space-y-2 mb-3">
                              <div className="flex justify-between text-xs">
                                <span className="font-medium text-white">Client:</span>
                                <span className="text-gray-300">Acme Corporation</span>
                              </div>
                              <div className="flex justify-between text-xs">
                                <span className="font-medium text-white">Timeline:</span>
                                <span className="text-gray-300">8-12 weeks</span>
                              </div>
                            </div>
                            
                            <div className="bg-gray-800 p-3 rounded mb-3">
                              <div className="text-xs font-medium mb-1 text-white">Project Overview</div>
                              <div className="text-xs text-gray-300 leading-relaxed">Comprehensive system integration to streamline business operations and enhance productivity...</div>
                            </div>
                            
                            <div className="text-center p-3 rounded text-sm font-bold" style={{
                              background: `linear-gradient(135deg, ${formData.primary_color}, #5DE055)`,
                              color: formData.secondary_color
                            }}>
                              Investment: $25,000
                            </div>
                            
                            <div className="text-center mt-3">
                              <div className="inline-block px-4 py-2 rounded text-xs font-semibold text-white" style={{ backgroundColor: formData.primary_color }}>
                                Accept Proposal
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      <div className="text-xs text-gray-500 text-center">
                        White background with bold dark content cards
                      </div>
                    </div>
                  </div>
                  
                  <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <div className="flex items-start gap-3">
                      <div className="text-blue-600 mt-0.5">ℹ️</div>
                      <div className="text-sm text-blue-800">
                        <p className="font-medium mb-1">Email Theme Preview</p>
                        <p>Choose from three distinctive email themes for your proposals and invoices. All themes use your brand colors and maintain excellent readability for professional client communications.</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-[#1E1E1D] mb-4">Brand Colors</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div>
                      <Label htmlFor="primary_color">Primary Color</Label>
                      <div className="flex items-center gap-3 mt-2">
                        <Input
                          id="primary_color"
                          type="color"
                          value={formData.primary_color}
                          onChange={(e) => handleInputChange("primary_color", e.target.value)}
                          className="w-12 h-12 p-1 border-2"
                        />
                        <Input
                          value={formData.primary_color}
                          onChange={(e) => handleInputChange("primary_color", e.target.value)}
                          placeholder="#72FD67"
                        />
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="secondary_color">Secondary Color</Label>
                      <div className="flex items-center gap-3 mt-2">
                        <Input
                          id="secondary_color"
                          type="color"
                          value={formData.secondary_color}
                          onChange={(e) => handleInputChange("secondary_color", e.target.value)}
                          className="w-12 h-12 p-1 border-2"
                        />
                        <Input
                          value={formData.secondary_color}
                          onChange={(e) => handleInputChange("secondary_color", e.target.value)}
                          placeholder="#1E1E1D"
                        />
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="accent_color">Accent Color</Label>
                      <div className="flex items-center gap-3 mt-2">
                        <Input
                          id="accent_color"
                          type="color"
                          value={formData.accent_color}
                          onChange={(e) => handleInputChange("accent_color", e.target.value)}
                          className="w-12 h-12 p-1 border-2"
                        />
                        <Input
                          value={formData.accent_color}
                          onChange={(e) => handleInputChange("accent_color", e.target.value)}
                          placeholder="#F2F2F2"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="payments">
            <Card className="bg-white/90 backdrop-blur-sm border-gray-200">
              <CardHeader>
                <CardTitle className="text-[#1E1E1D]">Payment Methods</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-[#1E1E1D] mb-4">Bank Transfer</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <Label htmlFor="bank_name">Bank Name</Label>
                      <Input
                        id="bank_name"
                        value={formData.bank_name}
                        onChange={(e) => handleInputChange("bank_name", e.target.value)}
                        placeholder="e.g. Commonwealth Bank"
                      />
                    </div>
                    <div>
                      <Label htmlFor="account_name">Account Name</Label>
                      <Input
                        id="account_name"
                        value={formData.account_name}
                        onChange={(e) => handleInputChange("account_name", e.target.value)}
                        placeholder="e.g. John Smith"
                      />
                    </div>
                    <div>
                      <Label htmlFor="bsb">BSB</Label>
                      <Input
                        id="bsb"
                        value={formData.bsb}
                        onChange={(e) => handleInputChange("bsb", e.target.value)}
                        placeholder="e.g. 062-000"
                      />
                    </div>
                    <div>
                      <Label htmlFor="account_number">Account Number</Label>
                      <Input
                        id="account_number"
                        value={formData.account_number}
                        onChange={(e) => handleInputChange("account_number", e.target.value)}
                        placeholder="e.g. 1234 5678"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-[#1E1E1D] mb-4">Online Payments</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <Label htmlFor="paypal_email">PayPal Email</Label>
                      <Input
                        id="paypal_email"
                        type="email"
                        value={formData.paypal_email}
                        onChange={(e) => handleInputChange("paypal_email", e.target.value)}
                        placeholder="payments@techflow.com"
                      />
                    </div>
                    <div>
                      <Label htmlFor="stripe_link">Stripe Payment Link</Label>
                      <Input
                        id="stripe_link"
                        value={formData.stripe_link}
                        onChange={(e) => handleInputChange("stripe_link", e.target.value)}
                        placeholder="https://buy.stripe.com/..."
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="connections">
            <GmailConnectCard settings={settings} onDisconnect={handleDisconnect} />
          </TabsContent>

          <TabsContent value="admin">
            <RecordManager />
          </TabsContent>
        </Tabs>
      </div>

      {showImpersonationDialog && (
        <UserImpersonationDialog
          open={showImpersonationDialog}
          onClose={() => setShowImpersonationDialog(false)}
        />
      )}
    </div>
  );
}
