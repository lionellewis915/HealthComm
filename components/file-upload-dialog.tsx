'use client';

/*
 * NOTE: This component requires Supabase Storage to be configured.
 * To set up storage:
 * 1. Go to Supabase Dashboard > Storage
 * 2. Create a new bucket named 'patient-files'
 * 3. Set the bucket to public or configure appropriate RLS policies
 */

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Upload } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface FileUploadDialogProps {
  patientId: string;
  onUploadComplete?: () => void;
}

export function FileUploadDialog({ patientId, onUploadComplete }: FileUploadDialogProps) {
  const [open, setOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [description, setDescription] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const { toast } = useToast();

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      toast({
        title: 'No file selected',
        description: 'Please select a file to upload',
        variant: 'destructive',
      });
      return;
    }

    setUploading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const fileExt = selectedFile.name.split('.').pop();
      const fileName = `${patientId}/${Date.now()}.${fileExt}`;

      const { error: uploadError, data } = await supabase.storage
        .from('patient-files')
        .upload(fileName, selectedFile);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('patient-files')
        .getPublicUrl(fileName);

      const { error: dbError } = await supabase.from('patient_files').insert({
        patient_id: patientId,
        uploaded_by: user.id,
        file_name: selectedFile.name,
        file_type: selectedFile.type,
        file_url: publicUrl,
        file_size: selectedFile.size,
        description: description.trim() || null,
      });

      if (dbError) throw dbError;

      toast({
        title: 'Success',
        description: 'File uploaded successfully',
      });

      setOpen(false);
      setDescription('');
      setSelectedFile(null);
      if (onUploadComplete) onUploadComplete();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to upload file',
        variant: 'destructive',
      });
    } finally {
      setUploading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Upload className="mr-2 h-4 w-4" />
          Upload File
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Upload Patient File</DialogTitle>
          <DialogDescription>
            Upload prescriptions, lab results, or other medical documents
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="description">Description (Optional)</Label>
            <Textarea
              id="description"
              placeholder="e.g., Prescription for hypertension medication"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              disabled={uploading}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="file">Select File</Label>
            <Input
              id="file"
              type="file"
              onChange={handleFileSelect}
              disabled={uploading}
              accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
            />
            {selectedFile && (
              <p className="text-sm text-foreground">
                Selected: {selectedFile.name} ({(selectedFile.size / 1024).toFixed(1)} KB)
              </p>
            )}
            <p className="text-xs text-muted-foreground">
              Accepted formats: PDF, JPG, PNG, DOC, DOCX (Max 10MB)
            </p>
          </div>
          <Button
            onClick={handleUpload}
            disabled={!selectedFile || uploading}
            className="w-full"
          >
            <Upload className="mr-2 h-4 w-4" />
            {uploading ? 'Uploading...' : 'Upload File'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
