import React, { useState, useEffect } from "react";
import { User } from "@/api/entities";
import { Expense } from "@/api/entities";
import { Invoice } from "@/api/entities";
import { Project } from "@/api/entities";
import { UploadFile, ExtractDataFromUploadedFile } from "@/api/integrations";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Plus, 
  Upload, 
  Camera, 
  DollarSign, 
  TrendingUp, 
  TrendingDown,
  Receipt,
  FileText,
  Eye,
  Download,
  Calendar
} from "lucide-react";
import { format } from "date-fns";
import ExpenseCard from "../components/books/ExpenseCard";
import IncomeCard from "../components/books/IncomeCard";
import AddExpenseDialog from "../components/books/AddExpenseDialog";
import BooksSummary from "../components/books/BooksSummary";

export default function Books() {
  const [user, setUser] = useState(null);
  const [expenses, setExpenses] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [projects, setProjects] = useState([]);
  const [activeTab, setActiveTab] = useState("overview");
  const [showAddExpense, setShowAddExpense] = useState(false);
  const [dateFilter, setDateFilter] = useState("this_year");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const userData = await User.me();
      setUser(userData);

      if (userData.access_level === "client" || userData.access_level === "staff") {
        setLoading(false);
        return;
      }

      const [expensesData, invoicesData, projectsData] = await Promise.all([
        Expense.list("-date"),
        Invoice.list("-created_date"),
        Project.list("-updated_date")
      ]);

      setExpenses(expensesData);
      setInvoices(invoicesData);
      setProjects(projectsData);
    } catch (error) {
      console.error("Error loading data:", error);
    }
    setLoading(false);
  };

  const handleExpenseAdded = () => {
    setShowAddExpense(false);
    loadData();
  };

  const getFilteredExpenses = () => {
    let filtered = expenses;
    
    if (categoryFilter !== "all") {
      filtered = filtered.filter(expense => expense.category === categoryFilter);
    }

    const now = new Date();
    const startOfYear = new Date(now.getFullYear(), 0, 1);
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfQuarter = new Date(now.getFullYear(), Math.floor(now.getMonth() / 3) * 3, 1);

    switch (dateFilter) {
      case "this_month":
        filtered = filtered.filter(expense => new Date(expense.date) >= startOfMonth);
        break;
      case "this_quarter":
        filtered = filtered.filter(expense => new Date(expense.date) >= startOfQuarter);
        break;
      case "this_year":
        filtered = filtered.filter(expense => new Date(expense.date) >= startOfYear);
        break;
    }

    return filtered;
  };

  const getFilteredIncome = () => {
    const paidInvoices = invoices.filter(invoice => invoice.status === "paid");
    
    const now = new Date();
    const startOfYear = new Date(now.getFullYear(), 0, 1);
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfQuarter = new Date(now.getFullYear(), Math.floor(now.getMonth() / 3) * 3, 1);

    switch (dateFilter) {
      case "this_month":
        return paidInvoices.filter(invoice => new Date(invoice.paid_date) >= startOfMonth);
      case "this_quarter":
        return paidInvoices.filter(invoice => new Date(invoice.paid_date) >= startOfQuarter);
      case "this_year":
        return paidInvoices.filter(invoice => new Date(invoice.paid_date) >= startOfYear);
      default:
        return paidInvoices;
    }
  };

  if (loading) {
    return (
      <div className="p-8">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-slate-200 rounded w-64"></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {Array(3).fill(0).map((_, i) => (
              <div key={i} className="h-32 bg-slate-200 rounded-xl"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (user?.access_level !== "admin") {
    return (
      <div className="p-8 text-center">
        <div className="text-slate-500">
          <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p>Access denied. Books are only available to admin users.</p>
        </div>
      </div>
    );
  }

  const filteredExpenses = getFilteredExpenses();
  const filteredIncome = getFilteredIncome();

  return (
    <div className="p-4 md:p-8 bg-gradient-to-br from-[#F2F2F2] to-gray-100 min-h-screen">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-[#1E1E1D] mb-2">Books</h1>
            <p className="text-gray-600 font-medium">Track income and expenses for tax purposes</p>
          </div>
          <Button
            onClick={() => setShowAddExpense(true)}
            className="bg-[#1E1E1D] hover:bg-gray-800 text-white font-semibold"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Expense
          </Button>
        </div>

        <BooksSummary 
          expenses={filteredExpenses} 
          income={filteredIncome} 
          dateFilter={dateFilter}
        />

        <div className="flex gap-4 items-center">
          <Select value={dateFilter} onValueChange={setDateFilter}>
            <SelectTrigger className="w-40 bg-white/90 backdrop-blur-sm border-gray-200">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="this_month">This Month</SelectItem>
              <SelectItem value="this_quarter">This Quarter</SelectItem>
              <SelectItem value="this_year">This Year</SelectItem>
              <SelectItem value="all">All Time</SelectItem>
            </SelectContent>
          </Select>
          
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-48 bg-white/90 backdrop-blur-sm border-gray-200">
              <SelectValue placeholder="All Categories" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              <SelectItem value="office_supplies">Office Supplies</SelectItem>
              <SelectItem value="software">Software</SelectItem>
              <SelectItem value="hardware">Hardware</SelectItem>
              <SelectItem value="travel">Travel</SelectItem>
              <SelectItem value="meals">Meals</SelectItem>
              <SelectItem value="utilities">Utilities</SelectItem>
              <SelectItem value="rent">Rent</SelectItem>
              <SelectItem value="marketing">Marketing</SelectItem>
              <SelectItem value="training">Training</SelectItem>
              <SelectItem value="other">Other</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="bg-white/90 backdrop-blur-sm border-gray-200">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="expenses">Expenses</TabsTrigger>
            <TabsTrigger value="income">Income</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid lg:grid-cols-2 gap-6">
              <div className="space-y-4">
                <h3 className="font-semibold text-[#1E1E1D] text-lg">Recent Expenses</h3>
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {filteredExpenses.slice(0, 5).map((expense) => (
                    <ExpenseCard key={expense.id} expense={expense} />
                  ))}
                </div>
              </div>
              
              <div className="space-y-4">
                <h3 className="font-semibold text-[#1E1E1D] text-lg">Recent Income</h3>
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {filteredIncome.slice(0, 5).map((invoice) => (
                    <IncomeCard key={invoice.id} invoice={invoice} />
                  ))}
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="expenses" className="space-y-4">
            <div className="grid gap-4">
              {filteredExpenses.map((expense) => (
                <ExpenseCard key={expense.id} expense={expense} detailed />
              ))}
              {filteredExpenses.length === 0 && (
                <div className="text-center py-12 text-gray-500">
                  <Receipt className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p className="font-medium">No expenses found for the selected period</p>
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="income" className="space-y-4">
            <div className="grid gap-4">
              {filteredIncome.map((invoice) => (
                <IncomeCard key={invoice.id} invoice={invoice} detailed />
              ))}
              {filteredIncome.length === 0 && (
                <div className="text-center py-12 text-gray-500">
                  <DollarSign className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p className="font-medium">No income found for the selected period</p>
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>

        {showAddExpense && (
          <AddExpenseDialog
            projects={projects}
            onClose={() => setShowAddExpense(false)}
            onExpenseAdded={handleExpenseAdded}
          />
        )}
      </div>
    </div>
  );
}