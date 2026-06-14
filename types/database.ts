export interface Folder {
  id: string;
  owner_id: string;
  parent_folder_id: string | null;
  name: string;
  created_at: string;
  updated_at: string;
}

export interface File {
  id: string;
  owner_id: string;
  folder_id: string | null;
  file_name: string;
  file_type: string;
  file_size: number;
  storage_provider: string;
  object_key: string | null;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface FileUpload {
  file_name: string;
  file_type: string;
  file_size: number;
  folder_id: string | null;
  storage_provider?: string;
  object_key?: string;
  status?: string;
}

export interface FolderCreate {
  name: string;
  parent_folder_id?: string | null;
}

export interface BreadcrumbItem {
  id: string | null;
  name: string;
}