import fs from 'fs/promises';
import path from 'path';
import * as pdfParse from 'pdf-parse';
import mammoth from 'mammoth';

export async function extractTextFromPDF(filePath: string): Promise<string> {
  try {
    const dataBuffer = await fs.readFile(filePath);
    const data = await (pdfParse as any)(dataBuffer);
    return data.text;
  } catch (error) {
    console.error('PDF text extraction error:', error);
    return '';
  }
}

export async function extractTextFromDOCX(filePath: string): Promise<string> {
  try {
    const dataBuffer = await fs.readFile(filePath);
    const result = await mammoth.extractRawText({ buffer: dataBuffer });
    return result.value;
  } catch (error) {
    console.error('DOCX text extraction error:', error);
    return '';
  }
}

export async function extractTextFromTXT(filePath: string): Promise<string> {
  try {
    const content = await fs.readFile(filePath, 'utf-8');
    return content;
  } catch (error) {
    console.error('TXT text extraction error:', error);
    return '';
  }
}

export async function extractTextFromFile(filePath: string, fileType: string): Promise<string> {
  const extension = path.extname(filePath).toLowerCase();
  
  switch (extension) {
    case '.pdf':
      return await extractTextFromPDF(filePath);
    case '.docx':
      return await extractTextFromDOCX(filePath);
    case '.txt':
    case '.md':
    case '.json':
    case '.xml':
    case '.csv':
      return await extractTextFromTXT(filePath);
    default:
      return '';
  }
}