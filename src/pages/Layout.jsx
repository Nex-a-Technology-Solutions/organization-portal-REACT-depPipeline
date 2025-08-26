import React, { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { User } from "@/api/entities";
import { Client } from "@/api/entities";
import { Settings } from "@/api/entities";
import { UserInvitation } from "@/api/entities";
import {
  LayoutDashboard,
  FolderOpen,
  FileText,
  Receipt,
  Clock,
  Users,
  Briefcase,
  Settings as SettingsIcon,
  LogOut,
  Menu,
  X,
  Zap
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import ImpersonationBanner from "@/components/admin/ImpersonationBanner";

const navigationItems = [
  {
    title: "Dashboard",
    url: createPageUrl("Dashboard"),
    icon: LayoutDashboard,
    roles: ["admin", "staff", "client"]
  },
  {
    title: "Projects",
    url: createPageUrl("Projects"),
    icon: FolderOpen,
    roles: ["admin", "staff", "client"]
  },
  {
    title: "Proposals",
    url: createPageUrl("Proposals"),
    icon: FileText,
    roles: ["admin", "staff"]
  },
  {
    title: "Invoices",
    url: createPageUrl("Invoices"),
    icon: Receipt,
    roles: ["admin", "staff"]
  },
  {
    title: "Time Tracking",
    url: createPageUrl("TimeTracking"),
    icon: Clock,
    roles: ["admin", "staff"]
  },
  {
    title: "Books",
    url: createPageUrl("Books"),
    icon: Receipt,
    roles: ["admin"]
  },
  {
    title: "Clients",
    url: createPageUrl("Clients"),
    icon: Briefcase,
    roles: ["admin", "staff"]
  },
  {
    title: "Team",
    url: createPageUrl("Team"),
    icon: Users,
    roles: ["admin"]
  },
  {
    title: "Settings",
    url: createPageUrl("Settings"),
    icon: SettingsIcon,
    roles: ["admin"]
  }
];

// Define public routes that don't require authentication
const PUBLIC_ROUTES = ['/login', '/register', '/clientProposalAcceptance', '/userInviteAcceptance', '/forgot-password', '/reset-password'];

export default function Layout({ children, currentPageName }) {
  const location = useLocation();
  const [user, setUser] = useState(null);
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authRequired, setAuthRequired] = useState(true);

  useEffect(() => {
    // Check if current route is public
    const isPublicRoute = PUBLIC_ROUTES.some(route => 
      location.pathname === route || location.pathname.startsWith(route)
    );
    
    setAuthRequired(!isPublicRoute);
    
    if (isPublicRoute) {
      // For public routes, just load settings and skip user authentication
      loadSettingsOnly();
    } else {
      // For protected routes, load user and settings
      loadUser();
    }
  }, [location.pathname]);

  const loadSettingsOnly = async () => {
    try {
      // Load settings for branding even on public pages
      const settingsData = await Settings.list();
      if (settingsData && settingsData.length > 0) {
        setSettings(settingsData[0]);
      }
    } catch (error) {
      console.error("Error loading settings:", error);
      // Don't block public pages if settings fail to load
    }
    setLoading(false);
  };

  const loadUser = async () => {
    try {
      // Always try to load user data first to show loading screen
      // Check if we're in impersonation mode
      const isImpersonating = localStorage.getItem('is_impersonating') === 'true';
      const impersonatedUser = JSON.parse(localStorage.getItem('impersonated_user') || 'null');
      
      let userData;
      
      if (isImpersonating && impersonatedUser) {
        // Use the impersonated user data
        userData = impersonatedUser;
      } else {
        // Try to get the actual current user - this will show loading while we wait
        try {
          userData = await User.me();
        } catch (userError) {
          // If User.me() fails, then check authentication status
          if (!User.isAuthenticated()) {
            // Wait a moment to show loading screen even on quick auth failures
            await new Promise(resolve => setTimeout(resolve, 2000));
            setUser(null);
            setLoading(false);
            return;
          }
          // If authenticated but User.me() failed, rethrow the error
          throw userError;
        }
      }
      
      // Load settings for branding
      try {
        const settingsData = await Settings.list();
        if (settingsData && settingsData.length > 0) {
          setSettings(settingsData[0]);
        }
      } catch (settingsError) {
        console.error("Error loading settings:", settingsError);
        // Continue even if settings fail
      }
      
      // Replace the loadUser function's role assignment logic with this:

if (!userData.access_level) {
  let roleAssigned = false;

  // 1. Check if user is an invited client
  try {
    const clientRecord = await Client.filter({ email: userData.email }, 1);
    if (clientRecord && clientRecord.length > 0) {
      const updateData = { access_level: "client" };
      if (!isImpersonating) {
        await User.updateMyUserData(updateData);
        await Client.update(clientRecord[0].id, { user_id: userData.id });
      }
      userData = { ...userData, ...updateData };
      roleAssigned = true;
    }
  } catch (clientError) {
    console.error("Error checking client record:", clientError);
  }

  // 2. If not a client, check if user is an invited staff/admin
  if (!roleAssigned) {
    try {
      const invitation = await UserInvitation.filter({ email: userData.email, status: 'pending' }, 1);
      if (invitation && invitation.length > 0) {
        const inv = invitation[0];
        const updateData = {
          access_level: inv.role,
          phone: inv.phone || "",
          hourly_rate: inv.hourly_rate || 0,
          specialization: inv.specialization || ""
        };
        if (!isImpersonating) {
          await User.updateMyUserData(updateData);
          await UserInvitation.update(inv.id, { status: 'accepted' });
        }
        userData = { ...userData, ...updateData };
        roleAssigned = true;
      }
    } catch (invitationError) {
      console.error("Error checking invitations:", invitationError);
    }
  }
  
  // 3. If no role assigned yet, check if they are the first user (admin)
  if (!roleAssigned) {
    try {
      const allUsers = await User.list();
      if (allUsers && allUsers.length === 1 && !isImpersonating) {
        const updateData = {
          access_level: "admin",
          phone: "000-000-0000",
          hourly_rate: 0,
          specialization: "Admin"
        };
        await User.updateMyUserData(updateData);
        userData = { ...userData, ...updateData };
        roleAssigned = true;
      }
    } catch (userListError) {
      console.error("Error checking user list:", userListError);
    }
  }

  // 4. NEW: If user created account normally but no invitation, give them basic access
  if (!roleAssigned) {
    // Instead of logging them out, assign a default role
    // You can change this logic based on your business requirements
    try {
      const updateData = {
        access_level: "staff", // or "client" depending on your default
        phone: "",
        hourly_rate: 0,
        specialization: ""
      };
      if (!isImpersonating) {
        await User.updateMyUserData(updateData);
      }
      userData = { ...userData, ...updateData };
      roleAssigned = true;
    } catch (updateError) {
      console.error("Error assigning default role:", updateError);
    }
  }

  // 5. Only logout if everything failed
  if (!roleAssigned) {
    if (!isImpersonating) {
      await User.logout();
    }
    setUser(null);
    setLoading(false);
    return;
  }
}
      
      setUser(userData);
    } catch (error) {
      console.error("User not logged in or error loading user:", error);
      // If there's an authentication error, clear tokens and set user to null
      if (error.response?.status === 401 || error.response?.status === 403) {
        await User.logout();
      }
      setUser(null);
    }
    setLoading(false);
  };

  const handleLogout = async () => {
    await User.logout();
    window.location.href = '/login';
  };
  
  const filteredNavItems = navigationItems.filter(item => 
    user?.access_level && item.roles.includes(user.access_level)
  );

  const companyName = settings?.company_name || "Nex-a Portal";
  const logoUrl = settings?.company_logo_url;
  const primaryColor = settings?.primary_color || "#72FD67";
  const isDarkMode = settings?.dark_mode || false;

  // Dark mode styles - only change page backgrounds, keep cards and navigation unchanged
  const darkModeStyles = isDarkMode ? `
    .dark-mode {
      background: #1a1a1a !important;
    }
    
    .dark-mode .bg-gradient-to-br {
      background: linear-gradient(135deg, #1a1a1a, #2a2a2a) !important;
    }
    
    .dark-mode .bg-\\[\\#F2F2F2\\] {
      background: #1a1a1a !important;
    }
    
    .dark-mode .bg-gradient-to-br.from-\\[\\#F2F2F2\\] {
      background: linear-gradient(135deg, #1a1a1a, #2a2a2a) !important;
    }
    
    .dark-mode .bg-gradient-to-br.from-\\[\\#F5F7FA\\] {
      background: linear-gradient(135deg, #1a1a1a, #2a2a2a) !important;
    }
    
    .dark-mode .bg-gradient-to-br.from-slate-50 {
      background: linear-gradient(135deg, #1a1a1a, #2a2a2a) !important;
    }
  ` : '';

  // Loading screen styles with modern loader
  const loaderStyles = `
    .loader-5 {
      animation: rotate 1.8s cubic-bezier(0.4, 0, 0.2, 1) infinite;
      height: 60px;
      width: 60px;
      filter: drop-shadow(0 4px 12px rgba(114, 253, 103, 0.25));
    }

    .loader-5:before,
    .loader-5:after {
      border-radius: 50%;
      content: "";
      display: block;
      height: 24px;
      width: 24px;
    }
    
    .loader-5:before {
      animation: ball1 1.8s cubic-bezier(0.4, 0, 0.2, 1) infinite;
      background: linear-gradient(135deg, #72FD67, #5DE055);
      box-shadow: 36px 0 0 rgba(114, 253, 103, 0.2);
      margin-bottom: 12px;
      filter: drop-shadow(0 2px 8px rgba(114, 253, 103, 0.4));
    }
    
    .loader-5:after {
      animation: ball2 1.8s cubic-bezier(0.4, 0, 0.2, 1) infinite;
      background: linear-gradient(135deg, #5DE055, #72FD67);
      box-shadow: 36px 0 0 rgba(93, 224, 85, 0.2);
      filter: drop-shadow(0 2px 8px rgba(93, 224, 85, 0.4));
    }

    @keyframes rotate {
      0% {
        transform: rotate(0deg) scale(0.9);
      }
      50% {
        transform: rotate(360deg) scale(1.1);
      }
      100% {
        transform: rotate(720deg) scale(0.9);
      }
    }

    @keyframes ball1 {
      0% {
        box-shadow: 36px 0 0 rgba(114, 253, 103, 0.2);
        transform: translate(0, 0);
      }
      50% {
        box-shadow: 0 0 0 rgba(114, 253, 103, 0.6);
        margin-bottom: 0;
        transform: translate(18px, 18px) scale(1.2);
      }
      100% {
        box-shadow: 36px 0 0 rgba(114, 253, 103, 0.2);
        margin-bottom: 12px;
        transform: translate(0, 0);
      }
    }

    @keyframes ball2 {
      0% {
        box-shadow: 36px 0 0 rgba(93, 224, 85, 0.2);
        transform: translate(0, 0);
      }
      50% {
        box-shadow: 0 0 0 rgba(93, 224, 85, 0.6);
        margin-top: -24px;
        transform: translate(18px, 18px) scale(1.2);
      }
      100% {
        box-shadow: 36px 0 0 rgba(93, 224, 85, 0.2);
        margin-top: 0;
        transform: translate(0, 0);
      }
    }
  `;

  if (loading) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${isDarkMode ? 'dark-mode' : 'bg-[#F2F2F2]'}`}>
        <style>
          {`
            @import url('https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,200;12..96,300;12..96,400;12..96,500;12..96,600;12..96,700;12..96,800&display=swap');
            * {
              font-family: 'Bricolage Grotesque', -apple-system, BlinkMacSystemFont, sans-serif;
            }
            ${darkModeStyles}
            ${loaderStyles}
          `}
        </style>
        <div className="loader-5"></div>
      </div>
    );
  }

  // If this is a public route, just render the children with minimal styling
  if (!authRequired) {
    return (
      <div className={`min-h-screen ${isDarkMode ? 'dark-mode' : 'bg-gradient-to-br from-[#F2F2F2] to-gray-100'}`}>
        <style>
          {`
            @import url('https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,200;12..96,300;12..96,400;12..96,500;12..96,600;12..96,700;12..96,800&display=swap');
            * {
              font-family: 'Bricolage Grotesque', -apple-system, BlinkMacSystemFont, sans-serif;
            }
            ${darkModeStyles}
          `}
        </style>
        {children}
      </div>
    );
  }

  // Show loading screen while authentication is being processed
  if (authRequired && !user && !loading) {
    return (
      <div className={`min-h-screen flex flex-col items-center justify-center text-center p-4 ${isDarkMode ? 'dark-mode' : 'bg-gradient-to-br from-[#F2F2F2] to-gray-100'}`}>
        <style>
          {`
            @import url('https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,200;12..96,300;12..96,400;12..96,500;12..96,600;12..96,700;12..96,800&display=swap');
            * {
              font-family: 'Bricolage Grotesque', -apple-system, BlinkMacSystemFont, sans-serif;
            }
            ${darkModeStyles}
            ${loaderStyles}
          `}
        </style>
        <div className="loader-5 mb-8"></div>
        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-[#1E1E1D] mb-3">Setting up your account...</h1>
        <p className="text-gray-600 mt-3 mb-8 max-w-md text-sm sm:text-base font-medium px-4">
          Please wait while we verify your access and prepare your dashboard.
        </p>
      </div>
    );
  }

  // If authentication is required but user is not logged in after all processing
  if (authRequired && !user) {
    return (
      <div className={`min-h-screen flex flex-col items-center justify-center text-center p-4 ${isDarkMode ? 'dark-mode' : 'bg-gradient-to-br from-[#F2F2F2] to-gray-100'}`}>
        <style>
          {`
            @import url('https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,200;12..96,300;12..96,400;12..96,500;12..96,600;12..96,700;12..96,800&display=swap');
            * {
              font-family: 'Bricolage Grotesque', -apple-system, BlinkMacSystemFont, sans-serif;
            }
            ${darkModeStyles}
          `}
        </style>
        {logoUrl ? (
          <div className="w-16 h-16 sm:w-20 sm:h-20 mb-6 flex items-center justify-center">
            <img src={logoUrl} alt={companyName} className="max-w-full max-h-full object-contain" />
          </div>
        ) : (
          <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-r from-[#1E1E1D] to-gray-800 rounded-2xl flex items-center justify-center shadow-2xl mb-6">
            <Zap className="w-6 h-6 sm:w-8 sm:h-8 text-[#72FD67]" />
          </div>
        )}
        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-[#1E1E1D] mb-3">Access Restricted</h1>
        <p className="text-gray-600 mt-3 mb-8 max-w-md text-sm sm:text-base font-medium px-4">
          This is an invitation-only platform. Please contact {companyName} to request access.
        </p>
        <div className="space-y-3">
          <Button 
            onClick={() => window.location.href = '/login'} 
            className="bg-[#1E1E1D] hover:bg-gray-800 text-white text-base sm:text-lg px-6 sm:px-8 py-4 sm:py-6 rounded-xl shadow-lg hover:shadow-xl transition-all font-semibold w-full max-w-sm"
          >
            Sign In (Invited Users Only)
          </Button>
          <p className="text-xs text-gray-500">
            If you were invited, sign in with the email address that received the invitation.
          </p>
        </div>
      </div>
    );
  }

  return (
    <SidebarProvider>
      <style>
        {`
          @import url('https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,200;12..96,300;12..96,400;12..96,500;12..96,600;12..96,700;12..96,800&display=swap');
          * {
            font-family: 'Bricolage Grotesque', -apple-system, BlinkMacSystemFont, sans-serif;
          }
          ${darkModeStyles}
        `}
      </style>
      <div className={`min-h-screen flex flex-col w-full ${isDarkMode ? 'dark-mode' : 'bg-gradient-to-br from-[#F2F2F2] to-gray-100'}`}>
        <ImpersonationBanner />
        
        <div className="flex flex-1">
          <Sidebar className="border-r hidden md:flex border-gray-200 bg-white/90 backdrop-blur-xl">
            <SidebarHeader className="p-4 lg:p-6 border-gray-200 border-b">
              <div className="flex flex-col mt-10 mb-5 items-center text-center">
                <div>
                  <h2 className="font-bold text-[#1E1E1D] text-lg">{companyName}</h2>
                  <p className="text-xs text-gray-500 font-medium">Business Portal</p>
                </div>
              </div>
            </SidebarHeader>
            
            <SidebarContent className="p-2 lg:p-3">
              <SidebarGroup>
                <SidebarGroupLabel className="text-xs font-semibold text-gray-500 uppercase tracking-wider px-3 py-2 hidden lg:block">
                  Navigation
                </SidebarGroupLabel>
                <SidebarGroupContent>
                  <SidebarMenu className="space-y-1">
                    {filteredNavItems.map((item) => (
                      <SidebarMenuItem key={item.title}>
                        <SidebarMenuButton 
                          asChild 
                          className={`transition-all duration-200 rounded-xl ${
                            location.pathname === item.url 
                              ? `bg-[${primaryColor}] text-[#1E1E1D] font-semibold shadow-md` 
                              : 'text-gray-600 hover:bg-gray-100 hover:text-[#1E1E1D]'
                          }`}
                          style={location.pathname === item.url ? { backgroundColor: primaryColor } : {}}
                        >
                          <Link to={item.url} className="flex items-center gap-3 px-2 lg:px-3 py-2 lg:py-3">
                            <item.icon className="w-5 h-5 flex-shrink-0" />
                            <span className="font-medium text-sm lg:text-base hidden lg:block">{item.title}</span>
                          </Link>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    ))}
                  </SidebarMenu>
                </SidebarGroupContent>
              </SidebarGroup>
            </SidebarContent>

            <SidebarFooter className="p-3 lg:p-4 border-gray-200 border-t">
              {user && (
                <div className="space-y-3">
                  <div className="flex items-center gap-3 p-2 lg:p-3 bg-[#F2F2F2] rounded-xl">
                    <div 
                      className="w-8 h-8 lg:w-10 lg:h-10 rounded-full flex items-center justify-center flex-shrink-0"
                      style={{ background: `linear-gradient(135deg, ${primaryColor}, #5DE055)` }}
                    >
                      <span className="text-[#1E1E1D] font-bold text-xs lg:text-sm">
                        {user.full_name?.charAt(0) || 'U'}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0 hidden lg:block">
                      <p className="font-semibold text-[#1E1E1D] text-sm truncate">
                        {user.full_name}
                      </p>
                      <div className="flex items-center gap-2">
                        <Badge 
                          variant="secondary" 
                          className={`text-xs ${
                            user.access_level === 'admin' 
                              ? 'text-[#1E1E1D]'
                              : user.access_level === 'staff'
                              ? 'bg-blue-100 text-blue-700'
                              : user.access_level === 'client'
                              ? 'bg-purple-100 text-purple-700'
                              : 'bg-gray-100 text-gray-600'
                          }`}
                          style={user.access_level === 'admin' ? { backgroundColor: primaryColor } : {}}
                        >
                          {user.access_level}
                        </Badge>
                      </div>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    onClick={handleLogout}
                    className="w-full justify-center lg:justify-start gap-2 text-gray-600 hover:text-[#1E1E1D] hover:bg-gray-100 p-2"
                  >
                    <LogOut className="w-4 h-4" />
                    <span className="hidden lg:inline">Sign Out</span>
                  </Button>
                </div>
              )}
            </SidebarFooter>
          </Sidebar>

          <main className="flex-1 flex flex-col min-w-0">
            <header className="backdrop-blur-xl px-4 py-3 md:hidden bg-white/90 border-gray-200 border-b">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <SidebarTrigger className="hover:bg-gray-100 p-2 rounded-lg transition-colors duration-200" />
                  <div className="flex items-center gap-2">
                    {logoUrl ? (
                      <div className="w-8 h-8 flex items-center justify-center">
                        <img src={logoUrl} alt={companyName} className="max-w-full max-h-full object-contain" />
                      </div>
                    ) : (
                      <div className="w-8 h-8 bg-gradient-to-r from-[#1E1E1D] to-gray-800 rounded-xl flex items-center justify-center">
                        <Zap className="w-4 h-4" style={{ color: primaryColor }} />
                      </div>
                    )}
                    <h1 className="text-lg font-bold text-[#1E1E1D]">{companyName}</h1>
                  </div>
                </div>
                {user && (
                  <div className="flex items-center gap-2">
                    <div 
                      className="w-8 h-8 rounded-full flex items-center justify-center"
                      style={{ background: `linear-gradient(135deg, ${primaryColor}, #5DE055)` }}
                    >
                      <span className="text-[#1E1E1D] font-bold text-sm">
                        {user.full_name?.charAt(0) || 'U'}
                      </span>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleLogout}
                      className="text-gray-600 hover:text-[#1E1E1D]"
                    >
                      <LogOut className="w-4 h-4" />
                    </Button>
                  </div>
                )}
              </div>
            </header>

            <div className="flex-1 overflow-auto">
              {children}
            </div>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
