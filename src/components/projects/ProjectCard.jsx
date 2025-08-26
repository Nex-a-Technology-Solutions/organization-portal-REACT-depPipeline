import React, { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { 
  Clock, 
  DollarSign, 
  MoreVertical, 
  FileText, 
  Settings,
  Upload,
  ChevronDown
} from "lucide-react";
import { format } from "date-fns";
import PlatformIcon from "./PlatformIcon";
import FileUploadDialog from "./FileUploadDialog";
import PlatformSelector from "./PlatformSelector";

const statusColors = {
  proposal: "bg-blue-100 text-blue-800 border-blue-200",
  active: "bg-green-100 text-green-800 border-green-200",
  completed: "bg-emerald-100 text-emerald-800 border-emerald-200",
  on_hold: "bg-yellow-100 text-yellow-800 border-yellow-200",
  cancelled: "bg-red-100 text-red-800 border-red-200"
};

const typeColors = {
  integrations: "bg-purple-100 text-purple-800 border-purple-200",
  automations: "bg-blue-100 text-blue-800 border-blue-200",
  "automations+integrations": "bg-indigo-100 text-indigo-800 border-indigo-200",
  apps: "bg-green-100 text-green-800 border-green-200",
  websites: "bg-orange-100 text-orange-800 border-orange-200"
};

const stageProgress = {
  discovery: 15,
  design: 35,
  development: 65,
  testing: 80,
  deployment: 95,
  training: 100
};

export default function ProjectCard({ project, isSelected, onClick, userRole, onProjectUpdated }) {
  const [showDropdown, setShowDropdown] = useState(false);
  const [showFileDialog, setShowFileDialog] = useState(false);
  const [showPlatformSelector, setShowPlatformSelector] = useState(false);
  const [showAllPlatforms, setShowAllPlatforms] = useState(false);

  const handleCardClick = (e) => {
    // Don't trigger card selection when clicking on dropdown or buttons
    if (e.target.closest('.dropdown-trigger') || e.target.closest('button')) {
      return;
    }
    onClick();
  };

  const handleFilesUpdated = () => {
    onProjectUpdated && onProjectUpdated();
  };

  const handlePlatformsUpdated = () => {
    onProjectUpdated && onProjectUpdated();
    setShowPlatformSelector(false);
  };

  // Show limited platforms by default, with expand option
  const displayedPlatforms = showAllPlatforms 
    ? project.platforms || []
    : (project.platforms || []).slice(0, 3);
  
  const hasMorePlatforms = (project.platforms || []).length > 3;

  return (
    <>
      <Card 
        className={`cursor-pointer transition-all duration-200 rounded-lg border-l-4 ${
          isSelected 
            ? "border-green-500 bg-white shadow-lg" 
            : "border-transparent bg-white/80 backdrop-blur-sm hover:bg-white hover:shadow-md"
        }`}
        onClick={handleCardClick}
      >
        <CardContent className="p-4 space-y-3">
          <div className="flex justify-between items-start">
            <div className="flex-1">
              <h4 className="font-semibold text-slate-900 text-sm leading-tight mb-1">
                {project.title}
              </h4>
              <p className="text-xs text-slate-500">{project.client_name}</p>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex flex-col gap-1 items-end">
                <Badge className={`text-xs ${statusColors[project.status]}`}>
                  {project.status?.replace('_', ' ')}
                </Badge>
                <Badge variant="outline" className={`text-xs ${typeColors[project.project_type]}`}>
                  {project.project_type?.replace('+', ' + ')}
                </Badge>
              </div>
              
              {/* Dropdown Menu */}
              <div className="relative dropdown-trigger">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0"
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowDropdown(!showDropdown);
                  }}
                >
                  <MoreVertical className="w-3 h-3" />
                </Button>
                
                {showDropdown && (
                  <div className="absolute right-0 top-6 bg-white border rounded-md shadow-lg z-10 min-w-[160px]">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="w-full justify-start text-xs h-8"
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowFileDialog(true);
                        setShowDropdown(false);
                      }}
                    >
                      <Upload className="w-3 h-3 mr-2" />
                      Upload Files
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="w-full justify-start text-xs h-8"
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowPlatformSelector(true);
                        setShowDropdown(false);
                      }}
                    >
                      <Settings className="w-3 h-3 mr-2" />
                      Platforms
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Platforms Section */}
          {(project.platforms && project.platforms.length > 0) && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-500 font-medium">Platforms</span>
                {hasMorePlatforms && !showAllPlatforms && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-4 p-0 text-xs text-blue-600 hover:text-blue-700"
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowAllPlatforms(true);
                    }}
                  >
                    +{(project.platforms || []).length - 3} more
                  </Button>
                )}
              </div>
              <div className="flex flex-wrap gap-1">
                {displayedPlatforms.map(platform => (
                  <PlatformIcon 
                    key={platform} 
                    platform={platform} 
                    size="sm" 
                    showTooltip={true}
                  />
                ))}
                {showAllPlatforms && hasMorePlatforms && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0 text-xs text-gray-500"
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowAllPlatforms(false);
                    }}
                  >
                    <ChevronDown className="w-3 h-3" />
                  </Button>
                )}
              </div>
            </div>
          )}

          <div className="space-y-2">
            <div className="flex justify-between items-center text-xs text-slate-500">
              <span className="capitalize">{project.current_stage?.replace('_', ' ')}</span>
              <span>{stageProgress[project.current_stage] || 0}%</span>
            </div>
            <Progress 
              value={stageProgress[project.current_stage] || 0} 
              className="h-1.5 bg-slate-100" 
            />
          </div>

          <div className="flex justify-between items-center text-xs text-slate-500">
            <div className="flex items-center gap-3">
              {userRole !== "client" && project.total_fee && (
                <span className="flex items-center gap-1 font-medium">
                  <DollarSign className="w-3 h-3" />
                  ${project.total_fee.toLocaleString()}
                </span>
              )}
              {project.total_hours > 0 && (
                <span className="flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {project.total_hours}h
                </span>
              )}
              {project.files_count > 0 && (
                <span className="flex items-center gap-1">
                  <FileText className="w-3 h-3" />
                  {project.files_count}
                </span>
              )}
            </div>
            
            {project.start_date && (
              <span>
                Started {format(new Date(project.start_date), "MMM d")}
              </span>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Click outside to close dropdown */}
      {showDropdown && (
        <div 
          className="fixed inset-0 z-5"
          onClick={() => setShowDropdown(false)}
        />
      )}

      {/* File Upload Dialog */}
      {showFileDialog && (
        <FileUploadDialog
          project={project}
          onClose={() => setShowFileDialog(false)}
          onFilesUpdated={handleFilesUpdated}
        />
      )}

      {/* Platform Selector Dialog */}
      {showPlatformSelector && (
        <PlatformSelector
          project={project}
          onClose={() => setShowPlatformSelector(false)}
          onPlatformsUpdated={handlePlatformsUpdated}
        />
      )}
    </>
  );
}