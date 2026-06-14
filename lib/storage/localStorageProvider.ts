import fs from 'fs/promises';
import path from 'path';

interface StorageProvider {
  uploadFile(objectKey: string, fileBuffer: Buffer, contentType: string): Promise<string>;
  downloadFile(objectKey: string): Promise<Buffer>;
  deleteFile(objectKey: string): Promise<void>;
}

export class LocalStorageProvider implements StorageProvider {
  private uploadsDir: string;

  constructor() {
    this.uploadsDir = path.join(process.cwd(), 'uploads');
    this.ensureUploadsDirectory();
  }

  private async ensureUploadsDirectory(): Promise<void> {
    try {
      await fs.access(this.uploadsDir);
    } catch {
      await fs.mkdir(this.uploadsDir, { recursive: true });
    }
  }

  private async ensureDirectoryExists(dirPath: string): Promise<void> {
    try {
      await fs.access(dirPath);
    } catch {
      await fs.mkdir(dirPath, { recursive: true });
    }
  }

  async uploadFile(objectKey: string, fileBuffer: Buffer, contentType: string): Promise<string> {
    try {
      const fullPath = path.join(this.uploadsDir, objectKey);
      const directory = path.dirname(fullPath);
      
      // Ensure directory exists
      await this.ensureDirectoryExists(directory);
      
      // Write file
      await fs.writeFile(fullPath, fileBuffer);
      
      return objectKey;
    } catch (error) {
      console.error('Local storage upload error:', error);
      throw new Error(`Failed to upload file: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async downloadFile(objectKey: string): Promise<Buffer> {
    try {
      const fullPath = path.join(this.uploadsDir, objectKey);
      const fileBuffer = await fs.readFile(fullPath);
      return fileBuffer;
    } catch (error) {
      console.error('Local storage download error:', error);
      throw new Error(`Failed to download file: ${error instanceof Error ? error.message : 'File not found'}`);
    }
  }

  async deleteFile(objectKey: string): Promise<void> {
    try {
      const fullPath = path.join(this.uploadsDir, objectKey);
      await fs.unlink(fullPath);
    } catch (error) {
      console.error('Local storage delete error:', error);
      // Don't throw if file doesn't exist
      if ((error as any).code !== 'ENOENT') {
        throw new Error(`Failed to delete file: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }
  }
}

export const localStorageProvider = new LocalStorageProvider();