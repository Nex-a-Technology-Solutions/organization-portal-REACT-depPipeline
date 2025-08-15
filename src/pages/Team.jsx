
import React, { useState, useEffect } from "react";
import { User } from "@/api/entities";
import { UserInvitation} from "@/api/entities";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Users, Mail, Phone, UserPlus, Shield, Award } from "lucide-react";
import InviteUserDialog from "../components/team/InviteUserDialog";

export default function Team() {
  const [currentUser, setCurrentUser] = useState(null);
  const [users, setUsers] = useState([]);
  const [invitations, setInvitations] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterRole, setFilterRole] = useState("all");
  const [loading, setLoading] = useState(true);
  const [showInviteDialog, setShowInviteDialog] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const userData = await User.me();
      setCurrentUser(userData);
      
      if (userData.access_level !== "admin") {
        setLoading(false);
        return;
      }

      const [allUsers, pendingInvitations] = await Promise.all([
        User.list("-created_date"),
        UserInvitation.filter({ status: "pending" }, "-created_date")
      ]);

      setUsers(allUsers);
      setInvitations(pendingInvitations);
    } catch (error) {
      console.error("Error loading data:", error);
    }
    setLoading(false);
  };

  const handleRoleUpdate = async (userId, newRole) => {
    try {
      await User.updateUser(userId, { access_level: newRole });
      loadData(); // Reload the data after successful update
    } catch (error) {
      console.error("Error updating user role:", error);
      alert("Failed to update user role. Please try again.");
    }
  };

  const handleUserInvited = () => {
    setShowInviteDialog(false);
    loadData();
  };

  const filteredUsers = users.filter(user => {
    const isClient = user.access_level === 'client';
    if (isClient) return false; // Exclude clients from team page

    const matchesSearch = user.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = filterRole === "all" || user.access_level === filterRole;
    return matchesSearch && matchesRole;
  });

  const filteredInvitations = invitations.filter(invitation => {
    const matchesSearch = invitation.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         invitation.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = filterRole === "all" || invitation.role === filterRole;
    return matchesSearch && matchesRole;
  });

  const roleColors = {
    admin: "bg-emerald-100 text-emerald-800 border-emerald-200",
    staff: "bg-blue-100 text-blue-800 border-blue-200"
  };

  const roleIcons = {
    admin: Shield,
    staff: Award
  };

  if (loading) {
    return (
      <div className="p-8">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-slate-200 rounded w-64"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
            {Array(6).fill(0).map((_, i) => (
              <div key={i} className="h-48 bg-slate-200 rounded-xl"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (currentUser?.access_level !== "admin") {
    return (
      <div className="p-8 text-center">
        <div className="text-slate-500">
          <Users className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p>Access denied. Team management is only available to admin users.</p>
        </div>
      </div>
    );
  }

  const teamUsers = users.filter(u => u.access_level !== 'client');
  const stats = {
    total: teamUsers.length,
    admin: teamUsers.filter(u => u.access_level === "admin").length,
    staff: teamUsers.filter(u => u.access_level === "staff").length,
    pending: invitations.length,
  };
  

  return (
    <div className="p-4 md:p-8 bg-gradient-to-br from-[#F2F2F2] to-gray-100 min-h-screen">
      <style>
        {`
          @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap');
          * {
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
          }
        `}
      </style>
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-[#1E1E1D] mb-2">Team Management</h1>
            <p className="text-gray-600 font-medium">Manage internal team members and their access levels</p>
          </div>
          <Button
            onClick={() => setShowInviteDialog(true)}
            className="bg-[#72FD67] hover:bg-green-400 text-[#1E1E1D] font-semibold shadow-lg"
          >
            <UserPlus className="w-4 h-4 mr-2" />
            Invite User
          </Button>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="bg-white/80 backdrop-blur-sm">
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-[#1E1E1D]">{stats.total}</div>
              <div className="text-sm text-gray-500 font-medium">Active Team</div>
            </CardContent>
          </Card>
          <Card className="bg-white/80 backdrop-blur-sm">
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-emerald-900">{stats.admin}</div>
              <div className="text-sm text-emerald-600 font-medium">Admins</div>
            </CardContent>
          </Card>
          <Card className="bg-white/80 backdrop-blur-sm">
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-blue-900">{stats.staff}</div>
              <div className="text-sm text-blue-600 font-medium">Staff</div>
            </CardContent>
          </Card>
          <Card className="bg-white/80 backdrop-blur-sm">
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-amber-900">{stats.pending}</div>
              <div className="text-sm text-amber-600 font-medium">Pending Invites</div>
            </CardContent>
          </Card>
        </div>

        <div className="flex gap-4 items-center">
          <Input
            placeholder="Search team members..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="max-w-md bg-white/80 backdrop-blur-sm border-gray-200 font-medium"
          />
          <Select value={filterRole} onValueChange={setFilterRole}>
            <SelectTrigger className="w-40 bg-white/80 backdrop-blur-sm border-gray-200">
              <SelectValue placeholder="Filter by role" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Roles</SelectItem>
              <SelectItem value="admin">Admins</SelectItem>
              <SelectItem value="staff">Staff</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {filteredInvitations.length > 0 && (
          <div>
            <h2 className="text-xl font-semibold text-[#1E1E1D] mb-4">Pending Invitations</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredInvitations.map((invitation) => (
                <Card key={invitation.id} className="bg-white/80 backdrop-blur-sm border-gray-200 shadow-lg opacity-70">
                  <CardHeader className="pb-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center">
                          <span className="text-gray-500 font-bold text-lg">
                            {invitation.full_name?.charAt(0) || 'U'}
                          </span>
                        </div>
                        <div>
                          <h3 className="font-semibold text-gray-700">{invitation.full_name}</h3>
                          <p className="text-sm text-gray-500 font-medium">{invitation.email}</p>
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600 font-medium">Invited as</span>
                      <Badge className={roleColors[invitation.role]}>
                        {invitation.role}
                      </Badge>
                    </div>
                    <div className="flex justify-between items-center text-xs text-gray-400 pt-2 border-t">
                      <span>Invited on {new Date(invitation.created_date).toLocaleDateString()}</span>
                      <Badge variant="outline" className="bg-amber-100 text-amber-800 border-amber-200">Pending</Badge>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
            <hr className="my-6" />
          </div>
        )}
         
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredUsers.map((user) => {
            const RoleIcon = roleIcons[user.access_level] || Users;
            
            return (
              <Card key={user.id} className="bg-white/80 backdrop-blur-sm border-gray-200 shadow-lg hover:shadow-xl transition-shadow">
                <CardHeader className="pb-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-gradient-to-r from-[#1E1E1D] to-gray-700 rounded-full flex items-center justify-center">
                        <span className="text-[#72FD67] font-bold text-lg">
                          {user.full_name?.charAt(0) || 'U'}
                        </span>
                      </div>
                      <div>
                        <h3 className="font-semibold text-[#1E1E1D]">{user.full_name}</h3>
                        <p className="text-sm text-gray-500 font-medium">{user.email}</p>
                      </div>
                    </div>
                    <RoleIcon className="w-5 h-5 text-gray-400" />
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between items-center">
                    
                    <span className="text-sm text-gray-600 font-medium">Role</span>
                      <Select
                        value={user.access_level}
                        onValueChange={(value) => handleRoleUpdate(user.id, value)}
                        disabled={user.id === currentUser.id}
                      >

                      <SelectTrigger className="w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="admin">Admin</SelectItem>
                        <SelectItem value="staff">Staff</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600 font-medium">Status</span>
                    <Badge className={roleColors[user.access_level]}>
                      {user.access_level}
                    </Badge>
                  </div>

                  {user.specialization && (
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600 font-medium">Specialization</span>
                      <span className="text-sm font-medium text-[#1E1E1D]">{user.specialization}</span>
                    </div>
                  )}

                  {user.hourly_rate && (
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600 font-medium">Hourly Rate</span>
                      <span className="text-sm font-medium text-[#1E1E1D]">${user.hourly_rate}/hr</span>
                    </div>
                  )}

                  {user.phone && (
                    <div className="flex items-center gap-2 pt-2 border-t border-gray-100">
                      <Phone className="w-4 h-4 text-gray-400" />
                      <span className="text-sm text-gray-600 font-medium">{user.phone}</span>
                    </div>
                  )}

                  <div className="flex items-center gap-2 text-xs text-gray-400">
                    <span>Joined {new Date(user.created_date).toLocaleDateString()}</span>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {filteredUsers.length === 0 && filteredInvitations.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            <Users className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p className="font-medium">No team members or pending invitations found matching your search criteria</p>
          </div>
        )}

        {showInviteDialog && (
          <InviteUserDialog
            onClose={() => setShowInviteDialog(false)}
            onUserInvited={handleUserInvited}
          />
        )}
      </div>
    </div>
  );
}
