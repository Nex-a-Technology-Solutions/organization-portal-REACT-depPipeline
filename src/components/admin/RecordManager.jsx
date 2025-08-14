import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { 
  Edit, 
  Trash2, 
  Save, 
  X, 
  AlertTriangle,
  Search,
  Plus
} from "lucide-react";
import { format } from "date-fns";

// Import all entities
import { User } from "@/api/entities";
import { Client } from "@/api/entities";
import { Project } from "@/api/entities";
import { Task } from "@/api/entities";
import { TimeEntry } from "@/api/entities";
import { Proposal } from "@/api/entities";
import { Invoice } from "@/api/entities";
import { Expense } from "@/api/entities";
import { Settings } from "@/api/entities";
import { ProjectRequest } from "@/api/entities";

const entities = {
  User: { entity: User, name: "Users", icon: "👤" },
  Client: { entity: Client, name: "Clients", icon: "🏢" },
  Project: { entity: Project, name: "Projects", icon: "📁" },
  Task: { entity: Task, name: "Tasks", icon: "✅" },
  TimeEntry: { entity: TimeEntry, name: "Time Entries", icon: "⏰" },
  Proposal: { entity: Proposal, name: "Proposals", icon: "📄" },
  Invoice: { entity: Invoice, name: "Invoices", icon: "🧾" },
  Expense: { entity: Expense, name: "Expenses", icon: "💰" },
  Settings: { entity: Settings, name: "Settings", icon: "⚙️" },
  ProjectRequest: { entity: ProjectRequest, name: "Project Requests", icon: "📋" }
};

export default function RecordManager() {
  const [selectedEntity, setSelectedEntity] = useState("User");
  const [records, setRecords] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(false);
  const [editingRecord, setEditingRecord] = useState(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deletingRecord, setDeletingRecord] = useState(null);
  const [editFormData, setEditFormData] = useState({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadRecords();
  }, [selectedEntity]);

  const loadRecords = async () => {
    setLoading(true);
    try {
      const entityData = await entities[selectedEntity].entity.list("-updated_date", 100);
      setRecords(entityData);
    } catch (error) {
      console.error(`Error loading ${selectedEntity}:`, error);
      setRecords([]);
    }
    setLoading(false);
  };

  const handleEdit = (record) => {
    setEditingRecord(record);
    setEditFormData({ ...record });
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await entities[selectedEntity].entity.update(editingRecord.id, editFormData);
      setEditingRecord(null);
      setEditFormData({});
      loadRecords();
    } catch (error) {
      console.error("Error updating record:", error);
      alert("Failed to update record. Please try again.");
    }
    setSaving(false);
  };

  const handleDelete = async () => {
    if (!deletingRecord) return;
    
    try {
      await entities[selectedEntity].entity.delete(deletingRecord.id);
      setShowDeleteDialog(false);
      setDeletingRecord(null);
      loadRecords();
    } catch (error) {
      console.error("Error deleting record:", error);
      alert("Failed to delete record. Please try again.");
    }
  };

  const renderFieldEditor = (key, value, type = "string") => {
    if (key === "id" || key === "created_date" || key === "updated_date" || key === "created_by") {
      return (
        <Input
          value={value || ""}
          disabled
          className="bg-gray-100 text-gray-500"
        />
      );
    }

    if (type === "boolean") {
      return (
        <Select
          value={value ? "true" : "false"}
          onValueChange={(val) => setEditFormData({ ...editFormData, [key]: val === "true" })}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="true">True</SelectItem>
            <SelectItem value="false">False</SelectItem>
          </SelectContent>
        </Select>
      );
    }

    if (type === "number") {
      return (
        <Input
          type="number"
          value={value || ""}
          onChange={(e) => setEditFormData({ ...editFormData, [key]: parseFloat(e.target.value) || 0 })}
        />
      );
    }

    if (type === "date") {
      return (
        <Input
          type="date"
          value={value || ""}
          onChange={(e) => setEditFormData({ ...editFormData, [key]: e.target.value })}
        />
      );
    }

    if (typeof value === "string" && value.length > 100) {
      return (
        <Textarea
          value={value || ""}
          onChange={(e) => setEditFormData({ ...editFormData, [key]: e.target.value })}
          rows={4}
        />
      );
    }

    return (
      <Input
        value={value || ""}
        onChange={(e) => setEditFormData({ ...editFormData, [key]: e.target.value })}
      />
    );
  };

  const renderFieldValue = (key, value) => {
    if (key === "created_date" || key === "updated_date") {
      return <span className="text-sm text-gray-500">{format(new Date(value), "MMM d, yyyy HH:mm")}</span>;
    }

    if (typeof value === "boolean") {
      return <Badge variant={value ? "default" : "secondary"}>{value ? "True" : "False"}</Badge>;
    }

    if (typeof value === "object" && value !== null) {
      return <span className="text-sm text-gray-500">Object</span>;
    }

    if (typeof value === "string" && value.length > 50) {
      return <span className="text-sm">{value.substring(0, 50)}...</span>;
    }

    return <span className="text-sm">{String(value)}</span>;
  };

  const getFieldType = (key, value) => {
    if (key.includes("date")) return "date";
    if (typeof value === "boolean") return "boolean";
    if (typeof value === "number") return "number";
    return "string";
  };

  const filteredRecords = records.filter(record => {
    const searchString = JSON.stringify(record).toLowerCase();
    return searchString.includes(searchTerm.toLowerCase());
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-[#1E1E1D]">Record Manager</h2>
          <p className="text-gray-600">Edit and delete records across all entities</p>
        </div>
        <div className="flex gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              placeholder="Search records..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 w-64"
            />
          </div>
        </div>
      </div>

      <Tabs value={selectedEntity} onValueChange={setSelectedEntity}>
        <TabsList className="grid grid-cols-5 md:grid-cols-10 gap-1 h-auto p-1 bg-white/90">
          {Object.entries(entities).map(([key, config]) => (
            <TabsTrigger 
              key={key} 
              value={key}
              className="flex flex-col items-center gap-1 px-2 py-2 text-xs"
            >
              <span className="text-lg">{config.icon}</span>
              <span className="hidden md:inline">{config.name}</span>
            </TabsTrigger>
          ))}
        </TabsList>

        {Object.entries(entities).map(([key, config]) => (
          <TabsContent key={key} value={key} className="space-y-4">
            <Card className="bg-white/90 backdrop-blur-sm">
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle className="flex items-center gap-2">
                    <span className="text-2xl">{config.icon}</span>
                    {config.name} ({filteredRecords.length})
                  </CardTitle>
                  {loading && (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-[#1E1E1D]"></div>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {filteredRecords.map((record) => (
                    <Card key={record.id} className="border border-gray-200">
                      <CardContent className="p-4">
                        <div className="flex justify-between items-start">
                          <div className="flex-1 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {Object.entries(record).slice(0, 6).map(([fieldKey, fieldValue]) => (
                              <div key={fieldKey}>
                                <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                                  {fieldKey.replace(/_/g, " ")}
                                </label>
                                <div className="mt-1">
                                  {renderFieldValue(fieldKey, fieldValue)}
                                </div>
                              </div>
                            ))}
                          </div>
                          <div className="flex gap-2 ml-4">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleEdit(record)}
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setDeletingRecord(record);
                                setShowDeleteDialog(true);
                              }}
                              className="text-red-600 hover:text-red-700 hover:bg-red-50"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                  
                  {filteredRecords.length === 0 && !loading && (
                    <div className="text-center py-8 text-gray-500">
                      <p>No records found</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        ))}
      </Tabs>

      {editingRecord && (
      <Dialog open={true} onOpenChange={() => setEditingRecord(null)}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              Edit {entities[selectedEntity].name.slice(0, -1)} - {editingRecord.id}
            </DialogTitle>
          </DialogHeader>
          {/* form inputs */}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingRecord(null)}>
              <X className="w-4 h-4 mr-2" />
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              <Save className="w-4 h-4 mr-2" />
              {saving ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    )}

          <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-red-600">
            <AlertTriangle className="w-5 h-5" />
            Confirm Deletion
          </DialogTitle>
        </DialogHeader>
        {/* confirmation text */}
        <DialogFooter>
          <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
            Cancel
          </Button>
          <Button 
            onClick={handleDelete}
            className="bg-red-600 hover:bg-red-700 text-white"
          >
            <Trash2 className="w-4 h-4 mr-2" />
            Delete Record
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>

    </div>
  );
}