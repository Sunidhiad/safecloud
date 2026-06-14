import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { encryptBuffer } from '@/lib/crypto/aes';

export const runtime = 'nodejs';
export const maxDuration = 60;

const STORAGE_SERVER_URL = process.env.STORAGE_SERVER_URL;
const STORAGE_SERVER_SECRET = process.env.STORAGE_SERVER_SECRET;
const ENCRYPTION_MASTER_KEY = process.env.ENCRYPTION_MASTER_KEY;

export async function POST(request: NextRequest) {
    console.log('========================================');
    console.log('📤 UPLOAD API ROUTE STARTED');
    console.log('========================================');
    
    try {
        // 1. Validate environment variables
        console.log('🔍 Checking environment variables...');
        if (!STORAGE_SERVER_URL) {
            console.error('❌ STORAGE_SERVER_URL is not set');
            return NextResponse.json(
                { error: 'Storage server URL not configured' },
                { status: 500 }
            );
        }
        if (!STORAGE_SERVER_SECRET) {
            console.error('❌ STORAGE_SERVER_SECRET is not set');
            return NextResponse.json(
                { error: 'Storage server secret not configured' },
                { status: 500 }
            );
        }
        if (!ENCRYPTION_MASTER_KEY) {
            console.error('❌ ENCRYPTION_MASTER_KEY is not set');
            return NextResponse.json(
                { error: 'Encryption key not configured' },
                { status: 500 }
            );
        }
        console.log('✅ Environment variables OK');
        console.log(`📍 Storage Server URL: ${STORAGE_SERVER_URL}`);

        // 2. Authenticate user with Supabase
        console.log('🔐 Authenticating user...');
        const cookieStore = await cookies();
        const supabase = createServerClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
            {
                cookies: {
                    getAll() {
                        return cookieStore.getAll();
                    },
                    setAll(cookiesToSet: { name: any; value: any; options: any; }[]) {
                        try {
                            cookiesToSet.forEach(({ name, value, options }) =>
                                cookieStore.set(name, value, options)
                            );
                        } catch {
                            // Handle error
                        }
                    },
                },
            }
        );

        const { data: { user }, error: authError } = await supabase.auth.getUser();
        
        if (authError || !user) {
            console.error('❌ Authentication failed:', authError?.message || 'No user found');
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            );
        }
        console.log(`✅ User authenticated: ${user.id} (${user.email})`);

        // 3. Parse form data
        console.log('📦 Parsing form data...');
        let formData: FormData;
        let file: File | null = null;
        let folderId: string | null = null;
        
        try {
            formData = await request.formData();
            file = formData.get('file') as File;
            folderId = formData.get('folderId') as string | null;
        } catch (parseError) {
            console.error('❌ Failed to parse form data:', parseError);
            return NextResponse.json(
                { error: 'Invalid form data' },
                { status: 400 }
            );
        }

        // 4. Validate file
        console.log('🔍 Validating file...');
        if (!file || file.size === 0) {
            console.error('❌ No file provided or file is empty');
            return NextResponse.json(
                { error: 'No file provided or file is empty' },
                { status: 400 }
            );
        }

        const maxSize = 100 * 1024 * 1024; // 100MB
        if (file.size > maxSize) {
            console.error(`❌ File too large: ${file.size} bytes (max: ${maxSize})`);
            return NextResponse.json(
                { error: 'File size exceeds 100MB limit' },
                { status: 400 }
            );
        }
        console.log(`✅ File validated: ${file.name} (${file.size} bytes, type: ${file.type})`);
        console.log(`📁 Target folder: ${folderId || 'root'}`);

        // 5. Convert file to buffer
        console.log('🔄 Converting file to buffer...');
        let bytes: ArrayBuffer;
        let originalBuffer: Buffer;
        try {
            bytes = await file.arrayBuffer();
            originalBuffer = Buffer.from(bytes);
            console.log(`✅ Buffer created: ${originalBuffer.length} bytes`);
        } catch (bufferError) {
            console.error('❌ Failed to convert file to buffer:', bufferError);
            return NextResponse.json(
                { error: 'Failed to process file' },
                { status: 500 }
            );
        }

        // 6. Encrypt the file buffer
        console.log('🔐 Encrypting file with AES-256-GCM...');
        let encryptedBuffer: Buffer;
        let iv: string;
        let authTag: string;
        try {
            const encryptionResult = await encryptBuffer(originalBuffer);
            encryptedBuffer = encryptionResult.encryptedBuffer;
            iv = encryptionResult.iv;
            authTag = encryptionResult.authTag;
            console.log(`✅ File encrypted: ${originalBuffer.length} bytes → ${encryptedBuffer.length} bytes`);
        } catch (encryptError) {
            console.error('❌ Encryption failed:', encryptError);
            return NextResponse.json(
                { error: 'Failed to encrypt file' },
                { status: 500 }
            );
        }

        // 7. Generate object key for storage server
        const timestamp = Date.now();
        const safeFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
        const folderPath = folderId || 'root';
        const objectKey = `safecloud/${user.id}/${folderPath}/${timestamp}-${safeFileName}.enc`;
        console.log(`📦 Object key generated: ${objectKey}`);

        // 8. Upload encrypted file to storage server
        console.log(`📤 Sending to storage server: ${STORAGE_SERVER_URL}/upload`);
        
        let uploadResponse: Response;
        try {
            // Create form data with proper Blob for Node.js fetch
            const uploadFormData = new FormData();
            
            // Convert Buffer to an ArrayBuffer slice and create Blob
            const arrayBuffer = encryptedBuffer.buffer.slice(
                encryptedBuffer.byteOffset,
                encryptedBuffer.byteOffset + encryptedBuffer.byteLength
            );
            // Create a Uint8Array view so Blob receives an ArrayBufferView (avoids SharedArrayBuffer typing issue)
            const uint8 = new Uint8Array(arrayBuffer as ArrayBuffer);
            const blob = new Blob([uint8], { type: 'application/octet-stream' });
            uploadFormData.append('file', blob, objectKey);
            uploadFormData.append('objectKey', objectKey);

            console.log(`📦 FormData created: file size = ${blob.size} bytes`);
            console.log(`🔑 Using storage secret: ${STORAGE_SERVER_SECRET.substring(0, 10)}...`);

            uploadResponse = await fetch(`${STORAGE_SERVER_URL}/upload`, {
                method: 'POST',
                headers: {
                    'x-storage-secret': STORAGE_SERVER_SECRET,
                },
                body: uploadFormData
            });
        } catch (fetchError) {
            console.error('❌ Failed to reach storage server:', fetchError);
            return NextResponse.json(
                { error: `Cannot reach storage server at ${STORAGE_SERVER_URL}. Make sure it's running.` },
                { status: 503 }
            );
        }

        console.log(`📥 Storage server response status: ${uploadResponse.status}`);

        if (!uploadResponse.ok) {
            let errorMessage: string;
            try {
                const errorText = await uploadResponse.text();
                console.error('❌ Storage server error response:', errorText);
                try {
                    const errorJson = JSON.parse(errorText);
                    errorMessage = errorJson.error || errorJson.message || 'Storage server upload failed';
                } catch {
                    errorMessage = errorText.substring(0, 200);
                }
            } catch (readError) {
                errorMessage = `Storage server returned status ${uploadResponse.status}`;
            }
            
            return NextResponse.json(
                { error: errorMessage },
                { status: uploadResponse.status }
            );
        }
        
        const storageResponse = await uploadResponse.json();
        console.log('✅ File uploaded to storage server successfully', storageResponse);

        // 9. Save metadata to Supabase
        console.log('💾 Saving metadata to Supabase...');
        let fileData;
        try {
            const { data, error: dbError } = await supabase
                .from('files')
                .insert({
                    file_name: file.name,
                    file_type: file.type,
                    file_size: file.size,
                    owner_id: user.id,
                    folder_id: folderId || null,
                    storage_provider: 'private-server',
                    object_key: objectKey,
                    encryption_iv: iv,
                    encryption_auth_tag: authTag,
                    status: 'uploaded',
                })
                .select()
                .single();

            if (dbError) {
                console.error('❌ Database insert failed:', dbError);
                throw new Error(dbError.message);
            }
            fileData = data;
            console.log(`✅ Metadata saved to Supabase (file_id: ${fileData.id})`);
        } catch (dbError) {
            console.error('❌ Database error, attempting rollback...');
            // Rollback: Delete from storage server if DB insert fails
            try {
                await fetch(`${STORAGE_SERVER_URL}/files/${objectKey}`, {
                    method: 'DELETE',
                    headers: { 'x-storage-secret': STORAGE_SERVER_SECRET }
                });
                console.log('🗑️ Rollback: Deleted from storage server');
            } catch (deleteError) {
                console.error('⚠️ Rollback failed:', deleteError);
            }
            
            return NextResponse.json(
                { error: dbError instanceof Error ? dbError.message : 'Failed to save file metadata' },
                { status: 500 }
            );
        }

        // 10. Log activity
        console.log('📝 Logging activity...');
        try {
            await supabase
                .from('file_activity_logs')
                .insert({
                    file_id: fileData.id,
                    user_id: user.id,
                    action: 'upload'
                });
            console.log('✅ Activity logged');
        } catch (logError) {
            console.warn('⚠️ Failed to log activity:', logError);
            // Don't fail the request for logging errors
        }

        console.log('========================================');
        console.log('✅ UPLOAD COMPLETED SUCCESSFULLY');
        console.log('========================================');
        console.log(`📄 File: ${file.name}`);
        console.log(`🔑 File ID: ${fileData.id}`);
        console.log(`📁 Folder: ${folderId || 'root'}`);
        console.log(`🔐 Encrypted: Yes (AES-256-GCM)`);
        console.log(`☁️ Storage: Private server (${STORAGE_SERVER_URL})`);
        console.log('========================================');

        return NextResponse.json({
            success: true,
            file: fileData,
            message: 'File encrypted and uploaded to private storage server successfully',
        });
        
    } catch (error) {
        console.error('========================================');
        console.error('❌ UNHANDLED UPLOAD ERROR');
        console.error('========================================');
        console.error(error);
        console.error('========================================');
        
        return NextResponse.json(
            { 
                error: error instanceof Error ? error.message : 'Internal server error',
                details: process.env.NODE_ENV === 'development' ? String(error) : undefined
            },
            { status: 500 }
        );
    }
}