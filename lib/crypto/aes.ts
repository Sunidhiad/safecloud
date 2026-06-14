import crypto from 'crypto';

const MASTER_KEY = process.env.ENCRYPTION_MASTER_KEY || 'default-encryption-key-please-change-me-32';

// Derive a 32-byte key from the master key
function getEncryptionKey(): Buffer {
    return crypto.createHash('sha256').update(MASTER_KEY).digest();
}

export interface EncryptedData {
    encryptedBuffer: Buffer;
    iv: string;
    authTag: string;
}

export interface DecryptedData {
    decryptedBuffer: Buffer;
}

/**
 * Encrypts a buffer using AES-256-GCM
 * @param buffer - The plaintext buffer to encrypt
 * @returns Encrypted data with IV and auth tag
 */
export async function encryptBuffer(buffer: Buffer): Promise<EncryptedData> {
    const key = getEncryptionKey();
    const iv = crypto.randomBytes(12); // 12 bytes IV for GCM
    
    const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
    
    const encryptedBuffer = Buffer.concat([
        cipher.update(buffer),
        cipher.final()
    ]);
    
    const authTag = cipher.getAuthTag();
    
    return {
        encryptedBuffer,
        iv: iv.toString('base64'),
        authTag: authTag.toString('base64')
    };
}

/**
 * Decrypts a buffer using AES-256-GCM
 * @param encryptedBuffer - The encrypted buffer
 * @param iv - Initialization vector (base64 string)
 * @param authTag - Authentication tag (base64 string)
 * @returns Decrypted plaintext buffer
 */
export async function decryptBuffer(
    encryptedBuffer: Buffer,
    iv: string,
    authTag: string
): Promise<Buffer> {
    const key = getEncryptionKey();
    const ivBuffer = Buffer.from(iv, 'base64');
    const authTagBuffer = Buffer.from(authTag, 'base64');
    
    const decipher = crypto.createDecipheriv('aes-256-gcm', key, ivBuffer);
    decipher.setAuthTag(authTagBuffer);
    
    return Buffer.concat([
        decipher.update(encryptedBuffer),
        decipher.final()
    ]);
}

/**
 * Test function to verify encryption/decryption works
 */
export async function testEncryption(): Promise<boolean> {
    const testText = 'Hello SafeCloud!';
    const testBuffer = Buffer.from(testText);
    
    const { encryptedBuffer, iv, authTag } = await encryptBuffer(testBuffer);
    const decryptedBuffer = await decryptBuffer(encryptedBuffer, iv, authTag);
    
    const decryptedText = decryptedBuffer.toString();
    
    return testText === decryptedText;
}