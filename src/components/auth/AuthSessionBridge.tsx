'use client';

import { useEffect } from 'react';
import {
  bootstrapSupabaseSession,
  supabaseClient,
  syncSupabaseSession,
} from '@/lib/supabase/client';

/** Keeps the in-memory client and the durable HttpOnly session bridge aligned. */
export default function AuthSessionBridge() {
  useEffect(() => {
    if (!supabaseClient) return undefined;
    let mounted = true;

    void bootstrapSupabaseSession();
    const subscription = supabaseClient.auth.onAuthStateChange((event, session) => {
      if (!mounted || !session || (event !== 'SIGNED_IN' && event !== 'TOKEN_REFRESHED')) return;
      void syncSupabaseSession(session).catch(() => undefined);
    });

    return () => {
      mounted = false;
      subscription.data.subscription.unsubscribe();
    };
  }, []);

  return null;
}
