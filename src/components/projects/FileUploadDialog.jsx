import React, { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { X, Upload, FileText, Image, FileImage, Download, Trash2, Eye } from 'lucide-react';

const FileUploadDialog = ({ project, onClose, onFilesUpdated }) => {
  const [files, setFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [projectFiles, setProjectFiles] = useState(project.files || []);
  const [dragOver, setDragOver] = useState(false);

  const fileTypeOptions = [
    { value: 'document', label: 'Document' },
    { value: 'image', label: 'Image' },
    { value: 'erd', label: 'ERD/Diagram' },
    { value: 'specification', label: 'Specification' },
    { value: 'contract', label: 'Contract' },
    { value: 'report', label: 'Report' },
    { value: 'other', label: 'Other' }
  ];

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    setDragOver(false);
    
    const droppedFiles = Array.from(e.dataTransfer.files);
    addFiles(droppedFiles);
  }, []);

  const handleDragOver = useCallback((e) => {
    e.preventDefault();
    setDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e) => {
    e.preventDefault();
    setDragOver(false);
  }, []);

  const addFiles = (fileList) => {
    const newFiles = Array.from(fileList).map(file => ({
      id: Math.random().toString(36).substr(2, 9),
      file,
      name: file.name,
      description: '',
      file_type: getFileType(file.name),
      preview: file.type.startsWith('image/') ? URL.createObjectURL(file) : null
    }));
    
    setFiles(prev => [...prev, ...newFiles]);
  };

  const getFileType = (fileName) => {
    const extension = fileName.split('.').pop().toLowerCase();
    if (['jpg', 'jpeg', 'png', 'gif', 'bmp', 'svg'].includes(extension)) {
      return 'image';
    }
    if (['pdf', 'doc', 'docx'].includes(extension)) {
      return 'document';
    }
    return 'other';
  };

  const removeFile = (fileId) => {
    setFiles(prev => prev.filter(f => f.id !== fileId));
  };

  const updateFileDetails = (fileId, field, value) => {
    setFiles(prev => prev.map(f => 
      f.id === fileId ? { ...f, [field]: value } : f
    ));
  };

  const uploadFiles = async () => {
    if (files.length === 0) return;
    
    setUploading(true);
    
    try {
      for (const fileData of files) {
        const formData = new FormData();
        formData.append('file', fileData.file);
        formData.append('name', fileData.name);
        formData.append('description', fileData.description);
        formData.append('file_type', fileData.file_type);

        const { djangoClient } = await import("@/api/client");
        const apiClient = djangoClient.getClient();
        
        await apiClient.post(`/projects/${project.id}/upload_file/`, formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        });
      }
      
      // Refresh project files
      const response = await apiClient.get(`/projects/${project.id}/files/`);
      setProjectFiles(response.data);
      
      setFiles([]);
      onFilesUpdated && onFilesUpdated();
      
    } catch (error) {
      console.error('Error uploading files:', error);
    }
    
    setUploading(false);
  };

  const deleteFile = async (fileId) => {
    try {
      const { djangoClient } = await import("@/api/client");
      const apiClient = djangoClient.getClient();
      
      await apiClient.delete(`/project-files/${fileId}/`);
      
      // Refresh project files
      const response = await apiClient.get(`/projects/${project.id}/files/`);
      setProjectFiles(response.data);
      
      onFilesUpdated && onFilesUpdated();
      
    } catch (error) {
      console.error('Error deleting file:', error);
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getFileIcon = (file) => {
    if (file.is_image) return <Image className="w-4 h-4" />;
    if (file.is_pdf) return <FileText className="w-4 h-4" />;
    return <FileText className="w-4 h-4" />;
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <Card className="w-full max-w-4xl max-h-[90vh] overflow-y-auto m-4">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Project Files - {project.title}</CardTitle>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="w-4 h-4" />
          </Button>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {/* File Upload Section */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Upload New Files</h3>
            
            <div
              className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
                dragOver ? 'border-blue-400 bg-blue-50' : 'border-gray-300 hover:border-gray-400'
              }`}
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
            >
              <Upload className="w-12 h-12 mx-auto text-gray-400 mb-4" />
              <p className="text-gray-600 mb-2">
                Drag and drop files here, or{' '}
                <label className="text-blue-600 hover:text-blue-700 cursor-pointer">
                  click to browse
                  <Input
                    type="file"
                    multiple
                    className="hidden"
                    onChange={(e) => addFiles(e.target.files)}
                  />
                </label>
              </p>
              <p className="text-sm text-gray-500">
                Supports PDF, images, documents, and more
              </p>
            </div>
            
            {/* Files to Upload */}
            {files.length > 0 && (
              <div className="space-y-3">
                <h4 className="font-medium">Files to Upload ({files.length})</h4>
                {files.map((file) => (
                  <Card key={file.id} className="p-4">
                    <div className="flex items-start space-x-4">
                      {file.preview && (
                        <img src={file.preview} alt="Preview" className="w-16 h-16 object-cover rounded" />
                      )}
                      <div className="flex-1 space-y-2">
                        <div className="flex items-center justify-between">
                          <Input
                            value={file.name}
                            onChange={(e) => updateFileDetails(file.id, 'name', e.target.value)}
                            placeholder="File name"
                            className="font-medium"
                          />
                          <Button variant="ghost" size="sm" onClick={() => removeFile(file.id)}>
                            <X className="w-4 h-4" />
                          </Button>
                        </div>
                        <Textarea
                          value={file.description}
                          onChange={(e) => updateFileDetails(file.id, 'description', e.target.value)}
                          placeholder="File description (optional)"
                          className="resize-none"
                          rows={2}
                        />
                        <div className="flex items-center space-x-4">
                          <Select 
                            value={file.file_type} 
                            onValueChange={(value) => updateFileDetails(file.id, 'file_type', value)}
                          >
                            <SelectTrigger className="w-40">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {fileTypeOptions.map((option) => (
                                <SelectItem key={option.value} value={option.value}>
                                  {option.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <span className="text-sm text-gray-500">
                            {formatFileSize(file.file.size)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </Card>
                ))}
                
                <div className="flex justify-end space-x-2">
                  <Button variant="outline" onClick={() => setFiles([])}>
                    Clear All
                  </Button>
                  <Button onClick={uploadFiles} disabled={uploading}>
                    {uploading ? 'Uploading...' : `Upload ${files.length} Files`}
                  </Button>
                </div>
              </div>
            )}
          </div>
          
          {/* Existing Files */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">
                Existing Files ({projectFiles.length})
              </h3>
            </div>
            
            {projectFiles.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <FileText className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p>No files uploaded yet</p>
              </div>
            ) : (
              <div className="grid gap-4">
                {projectFiles.map((file) => (
                  <Card key={file.id} className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="flex-shrink-0">
                          {getFileIcon(file)}
                        </div>
                        <div className="flex-1">
                          <h4 className="font-medium text-gray-900">{file.name}</h4>
                          {file.description && (
                            <p className="text-sm text-gray-600 mt-1">{file.description}</p>
                          )}
                          <div className="flex items-center space-x-4 mt-2">
                            <Badge variant="outline" className="text-xs">
                              {fileTypeOptions.find(opt => opt.value === file.file_type)?.label || file.file_type}
                            </Badge>
                            <span className="text-xs text-gray-500">
                              {formatFileSize(file.file_size)}
                            </span>
                            {file.uploaded_by_name && (
                              <span className="text-xs text-gray-500">
                                by {file.uploaded_by_name}
                              </span>
                            )}
                            <span className="text-xs text-gray-500">
                              {new Date(file.created_date).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        {file.is_image && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => window.open(file.file_url, '_blank')}
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => window.open(file.file_url, '_blank')}
                        >
                          <Download className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => deleteFile(file.id)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default FileUploadDialog;