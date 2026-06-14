import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAppStore } from '@/store/useAppStore';

export function usePresence() {
  const { user, onlineUsers, setOnlineUsers } = useAppStore();

  useEffect(() => {
    if (!user) return;

    const channelName = 'global-presence';
    const presenceChannel = supabase.channel(channelName, {
      config: {
        presence: {
          key: user.email || user.name || user.id,
        },
      },
    });

    presenceChannel
      .on('presence', { event: 'sync' }, () => {
        const state = presenceChannel.presenceState();
        const onlineSet = new Set<string>();
        
        Object.keys(state).forEach((key) => {
          onlineSet.add(key);
          const presences = state[key] as any[];
          presences.forEach((p) => {
            if (p.email) onlineSet.add(p.email);
            if (p.name) onlineSet.add(p.name);
          });
        });
        
        setOnlineUsers(onlineSet);
      })
      .on('presence', { event: 'join' }, ({ key, newPresences }) => {
         // Because we need to update state based on previous, and Zustand store gives us the current,
         // We can just grab the latest from store. But `onlineUsers` in closure might be stale.
         // Actually sync is usually enough but let's do this via callback if possible.
         useAppStore.setState((state) => {
            const next = new Set(state.onlineUsers);
            next.add(key);
            newPresences.forEach((p: any) => {
               if (p.email) next.add(p.email);
               if (p.name) next.add(p.name);
            });
            return { onlineUsers: next };
         });
      })
      .on('presence', { event: 'leave' }, ({ key, leftPresences }) => {
         useAppStore.setState((state) => {
            const next = new Set(state.onlineUsers);
            next.delete(key);
            leftPresences.forEach((p: any) => {
               if (p.email) next.delete(p.email);
               if (p.name) next.delete(p.name);
            });
            return { onlineUsers: next };
         });
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await presenceChannel.track({
            online_at: new Date().toISOString(),
            email: user.email,
            name: user.name,
          });
        }
      });

    return () => {
      supabase.removeChannel(presenceChannel);
    };
  }, [user]);

  const isOnline = (identifier: string) => {
    return onlineUsers.has(identifier);
  };

  return { onlineUsers, isOnline };
}
