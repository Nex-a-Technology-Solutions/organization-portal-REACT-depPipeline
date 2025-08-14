import React, { useState, useEffect } from "react";
import { User } from "@/api/entities";
import { Client } from "@/api/entities";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Search, Eye, User as UserIcon, Building, ArrowLeft } from "lucide-react";

export default function UserImpersonationDialog({ open, onClose }) {
  const [users, setUsers] = useState([]);
  const [clients, setClients] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (open) {
      loadUsers();
    }
  }, [open]);

  const loadUsers = async () => {
    setLoading(true);
    try {
      const [usersData, clientsData] = await Promise.all([
        User.list("-created_date"),
        Client.list("-created_date")
      ]);
      setUsers(usersData);
      setClients(clientsData);
    } catch (error) {
      console.error("Error loading users:", error);
    }
    setLoading(false);
  };

  const handleImpersonate = (user) => {
    // Store the original user info for returning later
    const originalUser = JSON.parse(localStorage.getItem('original_user') || 'null');
    if (!originalUser) {
      // Only store if we're not already impersonating
      const currentUser = JSON.parse(sessionStorage.getItem('current_user') || 'null');
      localStorage.setItem('original_user', JSON.stringify(currentUser));
    }
    
    // Set the impersonated user
    localStorage.setItem('impersonated_user', JSON.stringify(user));
    sessionStorage.setItem('current_user', JSON.stringify(user));
    
    // Show impersonation banner
    localStorage.setItem('is_impersonating', 'true');
    
    // Reload the page to apply changes
    window.location.reload();
  };

  const filteredUsers = users.filter(user =>
    user.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredClients = clients.filter(client =>
    client.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    client.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    client.company?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <Dialog open={open} onOpenChange={onClose}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <div className="flex items-center justify-center p-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Eye className="w-5 h-5" />
            View App As User
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              placeholder="Search by name or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          <div className="space-y-4">
            {/* Staff and Admin Users */}
            {filteredUsers.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold text-gray-600 uppercase tracking-wider mb-3">
                  Staff & Admin Users ({filteredUsers.length})
                </h3>
                <div className="space-y-2">
                  {filteredUsers.map((user) => (
                    <Card key={user.id} className="hover:shadow-md transition-shadow">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center">
                              <UserIcon className="w-5 h-5 text-white" />
                            </div>
                            <div>
                              <h4 className="font-medium text-gray-900">{user.full_name}</h4>
                              <p className="text-sm text-gray-500">{user.email}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <Badge 
                              variant={
                                user.access_level === 'admin' ? 'default' : 
                                user.access_level === 'staff' ? 'secondary' : 'outline'
                              }
                            >
                              {user.access_level}
                            </Badge>
                            <Button
                              size="sm"
                              onClick={() => handleImpersonate(user)}
                              className="bg-blue-600 hover:bg-blue-700"
                            >
                              <Eye className="w-4 h-4 mr-2" />
                              View As
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {/* Client Users */}
            {filteredClients.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold text-gray-600 uppercase tracking-wider mb-3">
                  Clients ({filteredClients.length})
                </h3>
                <div className="space-y-2">
                  {filteredClients.map((client) => {
                    // Find associated user if exists
                    const associatedUser = users.find(u => u.id === client.user_id);
                    
                    return (
                      <Card key={client.id} className="hover:shadow-md transition-shadow">
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-purple-600 rounded-full flex items-center justify-center">
                                <Building className="w-5 h-5 text-white" />
                              </div>
                              <div>
                                <h4 className="font-medium text-gray-900">{client.name}</h4>
                                <p className="text-sm text-gray-500">{client.email}</p>
                                {client.company && (
                                  <p className="text-xs text-gray-400">{client.company}</p>
                                )}
                              </div>
                            </div>
                            <div className="flex items-center gap-3">
                              <Badge variant="outline" className="bg-purple-50 text-purple-700">
                                client
                              </Badge>
                              {associatedUser ? (
                                <Button
                                  size="sm"
                                  onClick={() => handleImpersonate({
                                    ...associatedUser,
                                    access_level: 'client'
                                  })}
                                  className="bg-purple-600 hover:bg-purple-700"
                                >
                                  <Eye className="w-4 h-4 mr-2" />
                                  View As
                                </Button>
                              ) : (
                                <Button size="sm" disabled variant="outline">
                                  No User Account
                                </Button>
                              )}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </div>
            )}

            {filteredUsers.length === 0 && filteredClients.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                <UserIcon className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>No users found matching your search.</p>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}