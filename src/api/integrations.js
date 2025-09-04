// src/api/integrations.js

import { djangoClient } from './client';

// Core integration functions - implement these in your Django backend
export const Core = {
  InvokeLLM: async (prompt, options = {}) => {
    try {
      // You'll need to create this endpoint in Django
      const response = await djangoClient.getClient().post('/integrations/llm/invoke/', {
        prompt,
        ...options
      });
      return response.data;
    } catch (error) {
      console.error('Error invoking LLM:', error);
      throw error;
    }
  },

  SendEmail: async (emailData) => {
    try {
      // You'll need to create this endpoint in Django
      const response = await djangoClient.getClient().post('/integrations/email/send/', emailData);
      return response.data;
    } catch (error) {
      console.error('Error sending email:', error);
      throw error;
    }
  },

 UploadFile: async (fileData) => {
    try {
      // Create FormData for file upload
      const formData = new FormData();
      if (fileData.file) {
        formData.append('file', fileData.file);
      }
      
      // Add other fields
      Object.keys(fileData).forEach(key => {
        if (key !== 'file') {
          formData.append(key, fileData[key]);
        }
      });

      // You'll need to create this endpoint in Django
      const response = await djangoClient.getClient().post('/integrations/file/upload/', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        }
      });
      return response.data;
    } catch (error) {
      console.error('Error uploading file:', error);
      throw error;
    }
  },

  GenerateImage: async (imagePrompt, options = {}) => {
    try {
      // You'll need to create this endpoint in Django
      const response = await djangoClient.getClient().post('/integrations/image/generate/', {
        prompt: imagePrompt,
        ...options
      });
      return response.data;
    } catch (error) {
      console.error('Error generating image:', error);
      throw error;
    }
  },

  // FIXED: Send file_url in request body, not URL path
  ExtractDataFromUploadedFile: async (fileUrl, extractionOptions = {}) => {
    try {
      // POST to /integrations/file/extract/ with file_url in body
      const response = await djangoClient.getClient().post('/integrations/file/extract/', {
        file_url: fileUrl,
        ...extractionOptions
      });
      return response.data;
    } catch (error) {
      console.error('Error extracting data from file:', error);
      throw error;
    }
  }
};

// Export individual functions for backward compatibility
export const InvokeLLM = Core.InvokeLLM;
export const SendEmail = Core.SendEmail;
export const UploadFile = Core.UploadFile;
export const GenerateImage = Core.GenerateImage;
export const ExtractDataFromUploadedFile = Core.ExtractDataFromUploadedFile;

// Re-export sendExternalEmail from functions
export const sendExternalEmail = async (emailData) => {
  try {
    const response = await djangoClient.getClient().post('/integrations/email/send/', emailData);
    return response.data;
  } catch (error) {
    console.error('Error sending external email:', error);
    throw error;
  }
};


export const sendPasswordReset = async (emailData) => {
  try {
    // Use the unauthenticated email endpoint specifically for password resets
    const response = await djangoClient.getClient().post('/auth/send-password-reset-email/', emailData);
    return response.data;
  } catch (error) {
    console.error('Error sending password reset email:', error);
    throw error;
  }
};
// Alternative: If you don't need these integrations yet, use placeholder implementations
/*
export const Core = {
  InvokeLLM: () => Promise.reject(new Error('LLM integration not implemented in Django backend')),
  SendEmail: () => Promise.reject(new Error('Email integration not implemented in Django backend')),
  UploadFile: () => Promise.reject(new Error('File upload integration not implemented in Django backend')),
  GenerateImage: () => Promise.reject(new Error('Image generation not implemented in Django backend')),
  ExtractDataFromUploadedFile: () => Promise.reject(new Error('Data extraction not implemented in Django backend'))
};

export const InvokeLLM = Core.InvokeLLM;
export const SendEmail = Core.SendEmail;
export const UploadFile = Core.UploadFile;
export const GenerateImage = Core.GenerateImage;
export const ExtractDataFromUploadedFile = Core.ExtractDataFromUploadedFile;
export const sendExternalEmail = Core.SendEmail;
*/