export interface FileData {
  product_id: number;
  file_name: string;
  storage_key: string;
  url: string;
  size: number;
  content_type: string;
}

export interface SelectedFile {
  file: File;
  preview: string;
  name: string;
  uploadProgress?: number;
  status?: 'pending' | 'uploading' | 'success' | 'error';
}
