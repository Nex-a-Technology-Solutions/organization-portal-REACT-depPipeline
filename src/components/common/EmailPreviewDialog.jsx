import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Send, Loader2, X } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";

export default function EmailPreviewDialog({
  open,
  onClose,
  onSend,
  initialSubject,
  initialBody,
  recipient,
  sending,
}) {
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");

  useEffect(() => {
    if (open) {
      setSubject(initialSubject);
      setBody(initialBody);
    }
  }, [open, initialSubject, initialBody]);

  const handleSend = () => {
    onSend(subject, body);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-7xl max-h-[95vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Review and Send Email</DialogTitle>
          <DialogDescription>
            You can edit the subject and body before sending. The email will be sent to: {recipient}
          </DialogDescription>
        </DialogHeader>
        
        <div className="flex-grow grid grid-cols-1 lg:grid-cols-2 gap-6 min-h-0 py-4">
          {/* Editor Side */}
          <div className="space-y-4 flex flex-col min-h-0">
            <div>
              <Label htmlFor="subject">Subject</Label>
              <Input
                id="subject"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="font-semibold"
              />
            </div>
            <div className="flex-grow flex flex-col min-h-0">
              <Label htmlFor="body">Body (HTML)</Label>
              <Textarea
                id="body"
                value={body}
                onChange={(e) => setBody(e.target.value)}
                className="flex-grow font-mono text-sm min-h-96"
                placeholder="Enter email body HTML here..."
              />
            </div>
          </div>

          {/* Preview Side */}
          <div className="flex flex-col min-h-0">
            <Label>Live Preview</Label>
            <div className="flex-grow mt-2 border border-gray-200 rounded-lg overflow-hidden min-h-96">
              <iframe
                srcDoc={body}
                title="Email Preview"
                className="w-full h-full min-h-96"
                sandbox="allow-same-origin" // For security
              />
            </div>
          </div>
        </div>
        
        <DialogFooter>
          <Button type="button" variant="outline" onClick={onClose}>
            <X className="w-4 h-4 mr-2" />
            Cancel
          </Button>
          <Button
            type="button"
            onClick={handleSend}
            disabled={sending}
            className="bg-[#72FD67] hover:bg-green-400 text-[#1E1E1D] font-semibold"
          >
            {sending ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Send className="w-4 h-4 mr-2" />
            )}
            {sending ? "Sending..." : "Send Email"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}