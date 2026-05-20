import { useCallback, useEffect, useState } from 'react';
import { apiGet } from '../api/client';
import { posts as fallbackPosts, stories as fallbackStories } from '../data/mock';
import { Post, Story } from '../types/social';

type PremiumFeedState = {
  posts: Post[];
  stories: Story[];
  loading: boolean;
  refreshing: boolean;
  error: string;
  backendMode: 'live' | 'fallback';
};

export function usePremiumFeed() {
  const [state, setState] = useState<PremiumFeedState>({
    posts: fallbackPosts,
    stories: fallbackStories,
    loading: true,
    refreshing: false,
    error: '',
    backendMode: 'fallback'
  });

  const loadFeed = useCallback(async (isRefresh = false) => {
    setState((prev) => ({
      ...prev,
      loading: !isRefresh,
      refreshing: isRefresh,
      error: ''
    }));

    try {
      const data = await apiGet('/api/v1/feed');

      setState({
        posts: data?.posts?.length ? data.posts : fallbackPosts,
        stories: data?.stories?.length ? data.stories : fallbackStories,
        loading: false,
        refreshing: false,
        error: '',
        backendMode: 'live'
      });
    } catch (error: any) {
      setState({
        posts: fallbackPosts,
        stories: fallbackStories,
        loading: false,
        refreshing: false,
        error: error?.message || 'Live feed unavailable. Showing demo feed.',
        backendMode: 'fallback'
      });
    }
  }, []);

  useEffect(() => {
    loadFeed();
  }, [loadFeed]);

  return {
    ...state,
    refresh: () => loadFeed(true)
  };
}
