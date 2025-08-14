
import React, { useState, useEffect } from "react";
import { User } from "@/api/entities";
import { Client } from "@/api/entities";
import { Project } from "@/api/entities";
import { Proposal } from "@/api/entities";
// SendEmail integration is no longer needed if email sending is removed
// import { SendEmail } from "@/api/integrations"; // This import can be removed

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, UserPlus, Users, Search } from "lucide-react";
import AddClientDialog from "../components/clients/AddClientDialog";
import ClientCard from "../components/clients/ClientCard";

export default function Clients() {
  const [currentUser, setCurrentUser] = useState(null);
  const [clients, setClients] = useState([]);
  const [projects, setProjects] = useState([]);
  const [proposals, setProposals] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [showAddDialog, setShowAddDialog] = useState(false);
  // invitingClient state is no longer needed
  // const [invitingClient, setInvitingClient] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [userData, clientsData, projectsData, proposalsData] = await Promise.all([
        User.me(),
        Client.list("-created_date"),
        Project.list("-created_date"),
        Proposal.list("-created_date")
      ]);
      setCurrentUser(userData);
      setClients(clientsData);
      setProjects(projectsData);
      setProposals(proposalsData);
    } catch (error) {
      console.error("Error loading data:", error);
    }
    setLoading(false);
  };

  const handleClientAdded = () => {
    setShowAddDialog(false);
    loadData();
  };

  // The handleInviteClient function has been removed as per the outline.
  // const handleInviteClient = async (client) => {
  //   setInvitingClient(client.id);
  //   try {
  //     const appUrl = window.location.origin;
  //     const emailBody = `Hi ${client.name},

  // You've been invited to access the client portal for TechFlow Integration Solutions.

  // This will allow you to view your project progress, track tasks, and request new projects directly.

  // To get started, please click the link below to sign in or create your account using this email address (${client.email}):

  // ${appUrl}

  // Once you sign in, your account will be automatically set up and linked to your client profile.

  // Best regards,
  // The TechFlow Team`;

  //     await SendEmail({
  //       to: client.email,
  //       subject: `You're invited to the TechFlow Client Portal`,
  //       body: emailBody,
  //     });

  //     alert("Invitation sent successfully!");
  //   } catch (error) {
  //     console.error("Error sending invitation:", error);
  //     alert("Failed to send invitation. Please try again.");
  //   }
  //   setInvitingClient(null);
  // };

  const getClientProjects = (clientId) => {
    return projects.filter(project => project.client_id === clientId);
  };

  const getClientProposals = (clientId) => {
    return proposals.filter(proposal => proposal.client_id === clientId);
  };

  const filteredClients = clients.filter(client =>
    client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    client.company?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    client.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="p-8">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-slate-200 rounded w-64"></div>
          <div className="h-10 bg-slate-200 rounded w-full"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array(3).fill(0).map((_, i) => (
              <div key={i} className="h-48 bg-slate-200 rounded-xl"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (currentUser?.access_level === "client") {
     return (
      <div className="p-8 text-center">
        <div className="text-slate-500">
          <Users className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p>Access Denied.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 bg-gradient-to-br from-[#F2F2F2] to-gray-100 min-h-screen">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-[#1E1E1D] mb-2">Clients</h1>
            <p className="text-gray-600 font-medium">Manage your business clients and their projects</p>
          </div>
          <Button
            onClick={() => setShowAddDialog(true)}
            className="bg-[#72FD67] hover:bg-green-400 text-[#1E1E1D] font-semibold shadow-lg"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add New Client
          </Button>
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input
            placeholder="Search clients by name, company, or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 bg-white/80 backdrop-blur-sm border-gray-200 font-medium"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredClients.map((client) => (
            <ClientCard
              key={client.id}
              client={client}
              projects={getClientProjects(client.id)}
              proposals={getClientProposals(client.id)}
              // The onInvite and isInviting props are removed as per the outline
              // onInvite={handleInviteClient}
              // isInviting={invitingClient === client.id}
            />
          ))}
        </div>

        {filteredClients.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            <Users className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p className="font-medium">No clients found</p>
          </div>
        )}

        {showAddDialog && (
          <AddClientDialog
            onClose={() => setShowAddDialog(false)}
            onClientAdded={handleClientAdded}
          />
        )}
      </div>
    </div>
  );
}
