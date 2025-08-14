import React, { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { Proposal } from "@/api/entities";
import { Settings } from "@/api/entities";
import { CheckCircle, FileText, Mail } from "lucide-react";

export default function ThankYou() {
  const [proposal, setProposal] = useState(null);
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const location = useLocation();

  useEffect(() => {
    const fetch_data = async () => {
      try {
        const searchParams = new URLSearchParams(location.search);
        const proposalId = searchParams.get("proposalId");
        
        if (proposalId) {
          const [proposalData, settingsData] = await Promise.all([
            Proposal.get(proposalId),
            Settings.list()
          ]);
          setProposal(proposalData);
          setSettings(settingsData.length > 0 ? settingsData[0] : null);
        }
      } catch (error) {
        console.error("Error fetching data:", error);
      }
      setLoading(false);
    };
    fetch_data();
  }, [location.search]);

  const primaryColor = settings?.primary_color || "#72FD67";
  const secondaryColor = settings?.secondary_color || "#1E1E1D";
  const logoUrl = settings?.company_logo_url;
  const companyName = settings?.company_name || "Nex-a Tech Solutions";

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  if (!proposal) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 text-center p-4">
        <FileText className="w-16 h-16 text-gray-400 mb-4" />
        <h1 className="text-2xl font-bold text-gray-800">Proposal Not Found</h1>
        <p className="text-gray-600 mt-2">We couldn't find the proposal details. Please check the link or contact us.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <style>
        {`
          @import url('https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,200;12..96,300;12..96,400;12..96,500;12..96,600;12..96,700;12..96,800&display=swap');
          * {
            font-family: 'Bricolage Grotesque', -apple-system, BlinkMacSystemFont, sans-serif;
          }
        `}
      </style>
      <div className="w-full max-w-2xl mx-auto text-center">
        {logoUrl ? (
          <img src={logoUrl} alt={companyName} className="max-w-[200px] max-h-24 object-contain mx-auto mb-8" />
        ) : (
          <div className="w-16 h-16 bg-gray-800 rounded-2xl flex items-center justify-center shadow-2xl mb-8 mx-auto">
            <span className="text-3xl font-bold" style={{ color: primaryColor }}>⚡</span>
          </div>
        )}

        <div className="bg-white p-8 sm:p-12 rounded-2xl shadow-xl">
          <CheckCircle className="w-16 h-16 mx-auto mb-6" style={{ color: primaryColor }} />
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900">Thank You!</h1>
          <p className="text-lg text-gray-600 mt-4">
            We've received your acceptance for the proposal:
          </p>
          <p className="text-xl font-semibold mt-2 text-gray-800">
            "{proposal.title}"
          </p>

          <div className="my-8 h-px bg-gray-200"></div>

          <h2 className="text-2xl font-semibold text-gray-800">What Happens Next?</h2>
          <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-6 text-left">
            <div className="flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center" style={{ backgroundColor: primaryColor }}>
              <Mail className="w-6 h-6" style={{ color: secondaryColor }}/>
            </div>
            <div>
              <h3 className="font-bold text-gray-900">Initial Invoice Sent</h3>
              <p className="text-gray-600">
                The invoice for the project deposit has been sent to <strong className="text-gray-800">{proposal.client_email}</strong>. Once paid, we'll kick off the project.
              </p>
            </div>
          </div>
          <p className="text-sm text-gray-500 mt-8">
            If you have any questions, please don't hesitate to reach out. We're excited to get started!
          </p>
        </div>
      </div>
    </div>
  );
}