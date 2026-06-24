import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
    const requestUrl = new URL(request.url);
    const code = requestUrl.searchParams.get('code');

    // If no code, redirect to login with error
    if (!code) {
        return NextResponse.redirect(
            new URL('/auth/login?error=confirmation_failed', request.url)
        );
    }

    try {
        const cookieStore = await cookies();
        
        // Create Supabase client with cookies
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

        // Exchange the code for a session
        const { data, error } = await supabase.auth.exchangeCodeForSession(code);

        if (error) {
            console.error('Callback error:', error);
            return NextResponse.redirect(
                new URL('/auth/login?error=confirmation_failed', request.url)
            );
        }

        // Email confirmed successfully
        // Sign out the user so they can log in manually
        if (data.session) {
            await supabase.auth.signOut();
        }

        // Redirect to login page with success message
        return NextResponse.redirect(
            new URL('/auth/login?confirmed=true', request.url)
        );
    } catch (error) {
        console.error('Callback handler error:', error);
        return NextResponse.redirect(
            new URL('/auth/login?error=confirmation_failed', request.url)
        );
    }
}