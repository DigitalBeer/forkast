"use client";

import { useCallback, useEffect, useState, useMemo } from "react";
import { createClient } from "@/lib/supabase/client";
import { useAuthStore } from "@/store/auth";
import { getLocalTags, saveLocalTag, syncLocalTags } from "@/lib/localStorage/tags";

export interface Tag {
  id: number | string;
  name: string;
  isLocal?: boolean;
}

export function useTags() {
  const { user } = useAuthStore();
  const [serverTags, setServerTags] = useState<{id: number; name: string}[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Combine server tags with local tags
  const tags = useMemo(() => {
    const localTags = user ? [] : getLocalTags();
    return [
      ...serverTags,
      ...localTags
    ];
  }, [serverTags, user]);

  const fetchServerTags = useCallback(async () => {
    if (!user) {
      setServerTags([]);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const sb = createClient();
      const { data, error } = await sb.from("tags").select("id, name").order("name");
      if (error) throw error;
      
      setServerTags(data || []);
      
      // Sync local tags with server (for when user comes back online)
      if (data) {
        syncLocalTags(data);
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to load tags";
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchServerTags();
  }, [fetchServerTags]);

  async function createTag(name: string): Promise<Tag | null> {
    const trimmedName = name.trim();
    if (!trimmedName) return null;

    // Check if tag already exists (case-insensitive)
    const existingTag = tags.find(tag => 
      tag.name.toLowerCase() === trimmedName.toLowerCase()
    );
    
    if (existingTag) return existingTag;

    // If user is logged in, try to create on server
    if (user) {
      try {
        const sb = createClient();
        const { data, error } = await sb
          .from("tags")
          .insert({ name: trimmedName, user_id: user.id })
          .select()
          .single();

        if (error) throw error;
        
        if (data) {
          setServerTags(prev => [...prev, data]);
          return data;
        }
      } catch (error) {
        console.error('Failed to create tag on server:', error);
        // Fall through to local creation if server fails
      }
    }

    // If not logged in or server creation failed, save locally
    const localTag = saveLocalTag(trimmedName);
    return localTag;
  }

  return { 
    tags, 
    loading, 
    error, 
    createTag,
    refreshTags: fetchServerTags
  };
}
