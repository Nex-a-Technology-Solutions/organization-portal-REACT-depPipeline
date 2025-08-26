import React, { useState, useEffect } from "react";
import { User } from "@/api/entities";
import { Project } from "@/api/entities";
import { Invoice } from "@/api/entities";
import { TimeEntry } from "@/api/entities";
import { Task } from "@/api/entities";
import { Client } from "@/api/entities";
import { Notification } from "@/api/entities";
import { entities } from "@/api/client"; // Import entities from client.js for dashboard stats
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import {
  FolderOpen,
  Receipt,
  Clock,
  TrendingUp,
  FileText,
  UserPlus,
  PackagePlus,
  CheckCircle2,
  Plus,
  DollarSign,
  Users,
} from "lucide-react";
import StatsCard from "../components/dashboard/StatsCard";
import RecentActivity from "../components/dashboard/RecentActivity";
import ProjectProgress from "../components/dashboard/ProjectProgress";
import NotificationsPanel from "../components/dashboard/NotificationsPanel";
import CreateProposalDialog from "../components/proposals/CreateProposalDialog";
import AddClientDialog from "../components/clients/AddClientDialog";
import CreateInvoiceDialog from "../components/invoices/CreateInvoiceDialog";
import AddExpenseDialog from "../components/books/AddExpenseDialog";
import ProjectRequestDialog from "../components/clients/ProjectRequestDialog";

export default function Dashboard() {
  const [user, setUser] = useState(null);
  const [projects, setProjects] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [timeEntries, setTimeEntries] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [dashboardStats, setDashboardStats] = useState(null); // New state for dashboard stats
  const [loading, setLoading] = useState(true);

  // State for dialogs
  const [showCreateProposal, setShowCreateProposal] = useState(false);
  const [showAddClient, setShowAddClient] = useState(false);
  const [showCreateInvoice, setShowCreateInvoice] = useState(false);
  const [showAddExpense, setShowAddExpense] = useState(false);
  const [showRequestProject, setShowRequestProject] = useState(false);

  useEffect(() => {
    loadDashboardData();
  }, []);

  // Updated notification loading section in Dashboard.jsx

// In the loadDashboardData function, replace the notification loading part:

const loadDashboardData = async () => {
  setLoading(true);
  try {
    const userData = await User.me();
    setUser(userData);

    let projectsData = [];
    let invoicesData = [];
    let timeEntriesData = [];
    let notificationsData = [];
    let statsData = null;

    // Load dashboard stats from backend
    try {
      statsData = await entities.getDashboardStats();
      setDashboardStats(statsData);
    } catch (error) {
      console.error("Error loading dashboard stats:", error);
    }

    if (userData.access_level === "admin") {
      
      try {
        // Updated notification loading - use filter method with proper parameters
        const notificationPromise = Notification.filter({ is_read: false }, "-created_date", 20);
        
        [projectsData, invoicesData, timeEntriesData, notificationsData] = await Promise.all([
          Project.list("-updated_date", 20),
          Invoice.list("-created_date", 10),
          TimeEntry.list("-created_date", 10),
          notificationPromise
        ]);
        
      } catch (error) {
        console.error("Dashboard: Error loading admin data:", error);
        
        // Try loading individually if Promise.all fails
        try {
          projectsData = await Project.list("-updated_date", 20);
        } catch (projectError) {
          console.error("Dashboard: Error loading projects:", projectError);
        }
        
        try {
          invoicesData = await Invoice.list("-created_date", 10);
        } catch (invoiceError) {
          console.error("Dashboard: Error loading invoices:", invoiceError);
        }
        
        try {
          timeEntriesData = await TimeEntry.list("-created_date", 10);
        } catch (timeError) {
          console.error("Dashboard: Error loading time entries:", timeError);
        }
        
        try {
          notificationsData = await Notification.filter({ is_read: false }, "-created_date", 20);
        } catch (notificationError) {
          console.error("Dashboard: Error loading notifications:", notificationError);
          notificationsData = []; // Set to empty array on error
        }
      }
      
    } else if (userData.access_level === "staff") {
      
      try {
        const allTasks = await Task.filter({ assigned_to: userData.email }, "-created_date");
        const projectIds = [...new Set(allTasks.map(task => task.project_id))];
        
        const allProjects = await Project.list("-updated_date", 20);
        projectsData = allProjects.filter(project => projectIds.includes(project.id));
        
        timeEntriesData = await TimeEntry.filter({ user_email: userData.email }, "-created_date", 10);
        invoicesData = await Invoice.list("-created_date", 10);
        
        // Load notifications for staff users too
        try {
          notificationsData = await Notification.filter({ is_read: false }, "-created_date", 10);
        } catch (notificationError) {
          console.error("Dashboard: Error loading staff notifications:", notificationError);
          notificationsData = [];
        }
      } catch (error) {
        console.error("Dashboard: Error loading staff data:", error);
      }
      
    } else if (userData.access_level === "client") {
      
      try {
        const clientRecord = await Client.filter({ user_id: userData.id }, 1);
        if (clientRecord.length > 0) {
          projectsData = await Project.filter({ client_id: clientRecord[0].id }, "-updated_date", 20);
        } else {
          console.log("Dashboard: No client record found for user");
        }
        
        // Load notifications for client users
        try {
          notificationsData = await Notification.filter({ is_read: false }, "-created_date", 5);
        } catch (notificationError) {
          console.error("Dashboard: Error loading client notifications:", notificationError);
          notificationsData = [];
        }
      } catch (error) {
        console.error("Dashboard: Error loading client data:", error);
      }
    }
    
    setProjects(projectsData);
    setInvoices(invoicesData);
    setTimeEntries(timeEntriesData);
    setNotifications(notificationsData);
  } catch (error) {
    console.error("Error loading dashboard data:", error);
  }
  setLoading(false);
};

// Updated notification handlers
const handleClearNotification = async (id) => {
  try {
    await Notification.markAsRead(id);
    setNotifications(prev => prev.filter(n => n.id !== id));
  } catch (error) {
    console.error("Error clearing notification:", error);
  }
};

const handleClearAllNotifications = async () => {
  try {
    await Notification.markAllRead();
    setNotifications([]);
  } catch (error) {
    console.error("Error clearing all notifications:", error);
  }
};

  // Use dashboard stats from backend or fallback to calculated values
  const getStatsValue = (statKey, fallbackCalculation) => {
    return dashboardStats ? dashboardStats[statKey] : fallbackCalculation();
  };

  const activeProjects = getStatsValue('active_projects', () => 
    projects.filter(p => p.status === "active").length
  );

  const totalRevenue = getStatsValue('total_revenue', () =>
    invoices.filter(i => i.status === "paid").reduce((sum, i) => sum + (i.amount || 0), 0)
  );

  const pendingInvoices = getStatsValue('pending_invoices', () =>
    invoices.filter(i => i.status === "sent").length
  );

  const thisWeekHours = timeEntries
    .filter(t => new Date(t.date) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000))
    .reduce((sum, t) => sum + (t.hours || 0), 0);

  // Additional stats from backend
  const totalClients = dashboardStats?.total_clients || 0;
  const totalProjects = getStatsValue('total_projects', () => projects.length);
  const netProfit = dashboardStats?.net_profit || 0;
  const overdueInvoices = dashboardStats?.overdue_invoices || 0;

  if (loading) {
    return (
      <div className="p-4 sm:p-6 lg:p-8">
        <div className="animate-pulse space-y-6 sm:space-y-8">
          <div className="h-6 sm:h-8 bg-gray-200 rounded w-48 sm:w-64"></div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            {Array(4).fill(0).map((_, i) => (
              <div key={i} className="h-28 sm:h-32 bg-gray-200 rounded-xl"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 bg-gradient-to-br from-[#F5F7FA] to-gray-50 min-h-screen">
      <style>
        {`
          @import url('https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,200;12..96,300;12..96,400;12..96,500;12..96,600;12..96,700;12..96,800&display=swap');
          * {
            font-family: 'Bricolage Grotesque', -apple-system, BlinkMacSystemFont, sans-serif;
          }
        `}
      </style>
      <div className="max-w-7xl mx-auto space-y-6 sm:space-y-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-[#1E1E1D] mb-2">
              Welcome back, {user?.full_name?.split(' ')[0] || 'User'}
            </h1>
            <p className="text-gray-600 text-base sm:text-lg font-medium">
              {user?.access_level === "admin" ? "Manage your business operations" : 
               user?.access_level === "staff" ? "Track your projects and time" : 
               "View your project progress and request new work"}
            </p>
          </div>
        </div>
        
        {user?.access_level === "admin" && (
           <NotificationsPanel
            notifications={notifications}
            onClear={handleClearNotification}
            onClearAll={handleClearAllNotifications}
          />
        )}

        {user?.access_level !== "client" && (
          <div className="bg-white/80 backdrop-blur-sm border border-gray-200/80 rounded-2xl shadow-lg p-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Button onClick={() => setShowCreateProposal(true)} variant="ghost" className="flex flex-col h-20 gap-2">
                <FileText className="w-6 h-6 text-amber-500"/>
                <span className="font-semibold text-slate-700">New Proposal</span>
              </Button>
              <Button onClick={() => setShowAddClient(true)} variant="ghost" className="flex flex-col h-20 gap-2">
                <UserPlus className="w-6 h-6 text-green-500"/>
                <span className="font-semibold text-slate-700">New Client</span>
              </Button>
              <Button onClick={() => setShowCreateInvoice(true)} variant="ghost" className="flex flex-col h-20 gap-2">
                <Receipt className="w-6 h-6 text-blue-500"/>
                <span className="font-semibold text-slate-700">New Invoice</span>
              </Button>
              <Button onClick={() => setShowAddExpense(true)} variant="ghost" className="flex flex-col h-20 gap-2">
                <PackagePlus className="w-6 h-6 text-purple-500"/>
                <span className="font-semibold text-slate-700">New Expense</span>
              </Button>
            </div>
          </div>
        )}

        {user?.access_level === "client" && (
          <div className="bg-white/80 backdrop-blur-sm border border-gray-200/80 rounded-2xl shadow-lg p-4">
            <div className="flex justify-center">
              <Button onClick={() => setShowRequestProject(true)} className="bg-[#72FD67] hover:bg-green-400 text-[#1E1E1D] font-semibold px-8 py-6 text-lg rounded-xl shadow-lg">
                <Plus className="w-6 h-6 mr-3" />
                Request New Project
              </Button>
            </div>
          </div>
        )}

        {/* Updated Stats Grid with Backend Data */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatsCard
            title="Active Projects"
            value={activeProjects}
            icon={FolderOpen}
            gradient="from-blue-600 to-blue-700"
            description="Currently in progress"
          />
          
          {user?.access_level !== "client" && (
            <>
              <StatsCard
                title="Revenue (Paid)"
                value={`$${totalRevenue.toLocaleString()}`}
                icon={TrendingUp}
                gradient="from-emerald-600 to-emerald-700"
                description="Total received"
              />
              <StatsCard
                title="Pending Invoices"
                value={pendingInvoices}
                icon={Receipt}
                gradient="from-amber-600 to-amber-700"
                description="Awaiting payment"
              />
              <StatsCard
                title="This Week Hours"
                value={`${thisWeekHours}h`}
                icon={Clock}
                gradient="from-purple-600 to-purple-700"
                description="Team logged time"
              />
            </>
          )}

          {user?.access_level === "client" && (
            <StatsCard
              title="Your Projects"
              value={projects.length}
              icon={CheckCircle2}
              gradient="from-emerald-600 to-emerald-700"
              description="Total projects"
            />
          )}
        </div>

        {/* Additional Stats Row for Admin Users */}
        {user?.access_level === "admin" && dashboardStats && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <StatsCard
              title="Total Clients"
              value={totalClients}
              icon={Users}
              gradient="from-indigo-600 to-indigo-700"
              description="All clients"
            />
            <StatsCard
              title="Total Projects"
              value={totalProjects}
              icon={FolderOpen}
              gradient="from-cyan-600 to-cyan-700"
              description="All time"
            />
            <StatsCard
              title="Net Profit"
              value={`$${netProfit.toLocaleString()}`}
              icon={DollarSign}
              gradient="from-green-600 to-green-700"
              description="Revenue - Expenses"
            />
            <StatsCard
              title="Overdue Invoices"
              value={overdueInvoices}
              icon={Receipt}
              gradient="from-red-600 to-red-700"
              description="Past due date"
            />
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <RecentActivity 
              projects={projects} 
              invoices={invoices} 
              userRole={user?.access_level} 
            />
          </div>
          <div className="order-first lg:order-last">
            <ProjectProgress projects={projects.slice(0, 5)} />
          </div>
        </div>
      </div>

      {showCreateProposal && (
        <CreateProposalDialog
          onClose={() => setShowCreateProposal(false)}
          onProposalCreated={() => handleCreation(setShowCreateProposal)}
        />
      )}
      {showAddClient && (
        <AddClientDialog
          onClose={() => setShowAddClient(false)}
          onClientAdded={() => handleCreation(setShowAddClient)}
        />
      )}
      {showCreateInvoice && (
        <CreateInvoiceDialog
          projects={projects}
          onClose={() => setShowCreateInvoice(false)}
          onInvoiceCreated={() => handleCreation(setShowCreateInvoice)}
        />
      )}
      {showAddExpense && (
        <AddExpenseDialog
          projects={projects}
          onClose={() => setShowAddExpense(false)}
          onExpenseAdded={() => handleCreation(setShowAddExpense)}
        />
      )}
      {showRequestProject && (
        <ProjectRequestDialog
          onClose={() => setShowRequestProject(false)}
          onRequestCreated={() => handleCreation(setShowRequestProject)}
        />
      )}
    </div>
  );
}