import React from "react";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { User, Building, Mail, Phone, MapPin, UserPlus, FolderOpen, FileText, Copy, Check } from "lucide-react";

export default function ClientCard({ client, onInvite, isInviting, projects = [], proposals = [] }) {
  const [copiedInvite, setCopiedInvite] = React.useState(false);
  
  const activeProjects = projects.filter(p => p.status === "active").length;
  const completedProjects = projects.filter(p => p.status === "completed").length;
  const pendingProposals = proposals.filter(p => p.status === "sent").length;

  const handleCopyInvite = async () => {
    const inviteText = `Hi ${client.name},

You've been invited to access the client portal for Nex-a Portal.

This will allow you to view your project progress, track tasks, and request new projects directly.

To get started, please click the link below to sign in or create your account using this email address (${client.email}):

${window.location.origin}

Once you sign in, your account will be automatically set up and linked to your client profile.

Best regards,
The Nex-a Portal Team`;

    try {
      await navigator.clipboard.writeText(inviteText);
      setCopiedInvite(true);
      setTimeout(() => setCopiedInvite(false), 2000);
    } catch (err) {
      console.error('Failed to copy invitation text:', err);
    }
  };

  return (
    <Card className="bg-white/80 backdrop-blur-sm border-gray-200 shadow-lg hover:shadow-xl transition-shadow flex flex-col justify-between">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-[#1E1E1D]">{client.name}</CardTitle>
            {client.company && <p className="text-sm text-gray-500 font-medium">{client.company}</p>}
          </div>
          <div className="flex flex-col gap-1 items-end">
            {!client.user_id && (
              <Badge variant="outline" className="text-xs">Not a User</Badge>
            )}
            {client.user_id && (
              <Badge className="bg-emerald-100 text-emerald-800 border-emerald-200 text-xs">User Access</Badge>
            )}
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-3 text-sm flex-1">
        <div className="flex items-center gap-3 text-gray-600">
          <Mail className="w-4 h-4 flex-shrink-0" />
          <span>{client.email}</span>
        </div>
        {client.phone && (
          <div className="flex items-center gap-3 text-gray-600">
            <Phone className="w-4 h-4 flex-shrink-0" />
            <span>{client.phone}</span>
          </div>
        )}
        {client.billing_address && (
          <div className="flex items-start gap-3 text-gray-600">
            <MapPin className="w-4 h-4 flex-shrink-0 mt-1" />
            <span className="whitespace-pre-wrap">{client.billing_address}</span>
          </div>
        )}

        {/* Project and Proposal Summary */}
        <div className="pt-3 border-t border-gray-200">
          <div className="grid grid-cols-2 gap-4 text-center">
            <div>
              <div className="flex items-center justify-center gap-1 mb-1">
                <FolderOpen className="w-3 h-3 text-blue-600" />
                <span className="text-xs font-medium text-gray-700">Projects</span>
              </div>
              <div className="text-lg font-bold text-[#1E1E1D]">{projects.length}</div>
              {activeProjects > 0 && (
                <div className="text-xs text-green-600">{activeProjects} active</div>
              )}
            </div>
            <div>
              <div className="flex items-center justify-center gap-1 mb-1">
                <FileText className="w-3 h-3 text-amber-600" />
                <span className="text-xs font-medium text-gray-700">Proposals</span>
              </div>
              <div className="text-lg font-bold text-[#1E1E1D]">{proposals.length}</div>
              {pendingProposals > 0 && (
                <div className="text-xs text-amber-600">{pendingProposals} pending</div>
              )}
            </div>
          </div>
        </div>
      </CardContent>

      <CardFooter>
        {!client.user_id && (
          <Button
            size="sm"
            className="w-full"
            variant="outline"
            onClick={handleCopyInvite}
          >
            {copiedInvite ? (
              <>
                <Check className="w-4 h-4 mr-2 text-green-600" />
                Copied!
              </>
            ) : (
              <>
                <Copy className="w-4 h-4 mr-2" />
                Copy Invite Text
              </>
            )}
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}