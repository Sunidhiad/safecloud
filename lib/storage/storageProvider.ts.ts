export interface StorageProvider {
  uploadFile(objectKey: string, fileBuffer: Buffer, contentType: string): Promise<string>;
  downloadFile(objectKey: string): Promise<Buffer>;
  deleteFile(objectKey: string): Promise<void>;
}