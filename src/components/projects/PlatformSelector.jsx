import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { X, Plus, Check } from 'lucide-react';
import PlatformIcon, { PLATFORM_ICONS } from './PlatformIcon';

const PlatformSelector = ({ project, onClose, onPlatformsUpdated }) => {
  const [selectedPlatforms, setSelectedPlatforms] = useState(project.platforms || []);
  const [saving, setSaving] = useState(false);

  // Group platforms by category for better organization
  const platformCategories = {
    'Google Ecosystem': [
      'google_sheets', 'google_drive', 'google_appsheet', 
      'google_appscript', 'google_workspace', 'google_cloud'
    ],
    'Automation Platforms': ['zapier', 'make'],
    'AI & Machine Learning': ['openai', 'anthropic'],
    'Form Builders': ['jotform', 'typeform'],
    'E-commerce': ['shopify', 'woocommerce', 'stripe', 'paypal'],
    'CRM & Sales': ['hubspot', 'salesforce'],
    'Productivity': ['notion', 'airtable', 'slack', 'microsoft_365', 'calendly'],
    'Web Development': ['wordpress', 'webflow', 'bubble'],
    'Marketing': ['mailchimp'],
    'Custom': ['custom_api', 'other']
  };

  const togglePlatform = (platform) => {
    setSelectedPlatforms(prev => 
      prev.includes(platform) 
        ? prev.filter(p => p !== platform)
        : [...prev, platform]
    );
  };

  const savePlatforms = async () => {
    setSaving(true);
    try {
      const { djangoClient } = await import("@/api/client");
      const apiClient = djangoClient.getClient();
      
      await apiClient.patch(`/projects/${project.id}/update_platforms/`, {
        platforms: selectedPlatforms
      });
      
      onPlatformsUpdated && onPlatformsUpdated();
      onClose();
      
    } catch (error) {
      console.error('Error updating platforms:', error);
    }
    setSaving(false);
  };

  const clearAll = () => {
    setSelectedPlatforms([]);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <Card className="w-full max-w-4xl max-h-[90vh] overflow-y-auto m-4">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Select Platforms - {project.title}</CardTitle>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="w-4 h-4" />
          </Button>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {/* Selected Platforms Summary */}
          {selectedPlatforms.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-medium text-gray-700">
                  Selected Platforms ({selectedPlatforms.length})
                </h3>
                <Button variant="outline" size="sm" onClick={clearAll}>
                  Clear All
                </Button>
              </div>
              <div className="flex flex-wrap gap-2">
                {selectedPlatforms.map(platform => (
                  <div key={platform} className="flex items-center space-x-1">
                    <PlatformIcon platform={platform} size="sm" />
                    <Badge 
                      variant="secondary" 
                      className="cursor-pointer hover:bg-red-100"
                      onClick={() => togglePlatform(platform)}
                    >
                      {PLATFORM_ICONS[platform]?.description?.split(' ')[0] || platform}
                      <X className="w-3 h-3 ml-1" />
                    </Badge>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {/* Platform Selection Grid */}
          <div className="space-y-6">
            {Object.entries(platformCategories).map(([category, platforms]) => (
              <div key={category} className="space-y-3">
                <h3 className="text-lg font-semibold text-gray-900">{category}</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                  {platforms.map(platform => {
                    const isSelected = selectedPlatforms.includes(platform);
                    const config = PLATFORM_ICONS[platform];
                    
                    if (!config) return null;
                    
                    return (
                      <div
                        key={platform}
                        className={`relative cursor-pointer rounded-lg border-2 p-3 hover:shadow-md transition-all ${
                          isSelected 
                            ? 'border-blue-500 bg-blue-50' 
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                        onClick={() => togglePlatform(platform)}
                      >
                        {isSelected && (
                          <div className="absolute top-2 right-2">
                            <Check className="w-4 h-4 text-blue-600" />
                          </div>
                        )}
                        
                        <div className="flex flex-col items-center space-y-2">
                          <PlatformIcon platform={platform} size="md" />
                          <div className="text-center">
                            <p className="text-sm font-medium text-gray-900 line-clamp-1">
                              {config.description.split(' ')[0]}
                            </p>
                            <p className="text-xs text-gray-500 line-clamp-2">
                              {config.description}
                            </p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
          
          {/* Action Buttons */}
          <div className="flex justify-end space-x-3 pt-4 border-t">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button onClick={savePlatforms} disabled={saving}>
              {saving ? 'Saving...' : 'Save Platforms'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default PlatformSelector;