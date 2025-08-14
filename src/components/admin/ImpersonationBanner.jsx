import React from "react";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ArrowLeft, Eye, AlertTriangle } from "lucide-react";

export default function ImpersonationBanner() {
  const handleStopImpersonating = () => {
    // Get the original user from localStorage
    const originalUser = JSON.parse(localStorage.getItem('original_user') || 'null');
    
    if (originalUser) {
      // Restore the original user
      sessionStorage.setItem('current_user', JSON.stringify(originalUser));
    }
    
    // Clear impersonation data
    localStorage.removeItem('impersonated_user');
    localStorage.removeItem('original_user');
    localStorage.removeItem('is_impersonating');
    
    // Reload the page
    window.location.reload();
  };

  const impersonatedUser = JSON.parse(localStorage.getItem('impersonated_user') || 'null');
  
  if (!impersonatedUser || localStorage.getItem('is_impersonating') !== 'true') {
    return null;
  }

  return (
    <Alert className="bg-orange-50 border-orange-200 rounded-none border-x-0 border-t-0">
      <AlertTriangle className="h-4 w-4 text-orange-600" />
      <AlertDescription className="flex items-center justify-between w-full">
        <div className="flex items-center gap-2">
          <Eye className="w-4 h-4 text-orange-600" />
          <span className="font-medium text-orange-800">
            Admin View: You are viewing the app as{' '}
            <strong>{impersonatedUser.full_name || impersonatedUser.name}</strong>
            {' '}({impersonatedUser.access_level || 'client'})
          </span>
        </div>
        <Button
          size="sm"
          variant="outline"
          onClick={handleStopImpersonating}
          className="ml-4 bg-white hover:bg-orange-50 border-orange-200 text-orange-700 hover:text-orange-800"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Return to Admin View
        </Button>
      </AlertDescription>
    </Alert>
  );
}