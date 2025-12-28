const LOCAL_TAGS_KEY = 'bmad_local_tags';

export interface LocalTag {
  id: string;
  name: string;
  isLocal: boolean;
}

export function getLocalTags(): LocalTag[] {
  if (typeof window === 'undefined') return [];
  try {
    const tags = localStorage.getItem(LOCAL_TAGS_KEY);
    return tags ? JSON.parse(tags) : [];
  } catch (error) {
    console.error('Error reading local tags:', error);
    return [];
  }
}

export function saveLocalTag(name: string): LocalTag {
  const tags = getLocalTags();
  const existingTag = tags.find(tag => tag.name.toLowerCase() === name.toLowerCase());
  
  if (existingTag) return existingTag;
  
  const newTag: LocalTag = {
    id: `local-${Date.now()}`,
    name: name.trim(),
    isLocal: true
  };
  
  const updatedTags = [...tags, newTag];
  localStorage.setItem(LOCAL_TAGS_KEY, JSON.stringify(updatedTags));
  return newTag;
}

export function removeLocalTag(id: string): void {
  const tags = getLocalTags().filter(tag => tag.id !== id);
  localStorage.setItem(LOCAL_TAGS_KEY, JSON.stringify(tags));
}

export function syncLocalTags(serverTags: { id: number; name: string }[]): void {
  const localTags = getLocalTags();
  if (localTags.length === 0) return;
  
  // Remove any local tags that now exist on the server
  const updatedLocalTags = localTags.filter(
    localTag => !serverTags.some(serverTag => 
      serverTag.name.toLowerCase() === localTag.name.toLowerCase()
    )
  );
  
  localStorage.setItem(LOCAL_TAGS_KEY, JSON.stringify(updatedLocalTags));
}
