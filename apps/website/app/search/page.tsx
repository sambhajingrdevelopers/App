'use client';

import { useEffect, useState } from 'react';
import AuthGuard from '../../components/AuthGuard';
import SocialAppShell from '../../components/SocialAppShell';

type TabType = 'all' | 'creator' | 'post' | 'reel' | 'story';

export default function SearchPage() {
  const [query, setQuery] = useState('');
  const [activeTab, setActiveTab] = useState<TabType>('all');
  const [results, setResults] = useState<any[]>([]);
  const [source, setSource] = useState('loading');
  const [loading, setLoading] = useState(false);

  async function runSearch(value = query) {
    setLoading(true);

    try {
      const response = await fetch(`/api/search-all?q=${encodeURIComponent(value)}`, {
        cache: 'no-store'
      });

      const data = await response.json();

      setResults(data.results || []);
      setSource(data.source || 'fallback');
    } catch {
      setSource('fallback');
      setResults([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    runSearch('');
  }, []);

  const filteredResults =
    activeTab === 'all'
      ? results
      : results.filter((item) => item.type === activeTab);

  const counts = {
    all: results.length,
    creator: results.filter((item) => item.type === 'creator').length,
    post: results.filter((item) => item.type === 'post').length,
    reel: results.filter((item) => item.type === 'reel').length,
    story: results.filter((item) => item.type === 'story').length
  };

  return (
    <AuthGuard>
      <SocialAppShell
        active="search"
        title="Search"
        subtitle="Search creators, posts, reels and stories."
      >
        <section className="searchHero">
          <div>
            <span>{source === 'backend' ? 'Live Backend Search' : 'Fallback Search Ready'}</span>
            <h2>Global search engine</h2>
            <p>Find creators, posts, reels and stories from one smart search.</p>
          </div>
        </section>

        <section className="searchBox">
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter') runSearch();
            }}
            placeholder="Search @mira, reels, posts, stories..."
          />

          <button type="button" onClick={() => runSearch()}>
            {loading ? 'Searching...' : 'Search'}
          </button>
        </section>

        <section className="searchTabs">
          <button className={activeTab === 'all' ? 'active' : ''} onClick={() => setActiveTab('all')}>
            All {counts.all}
          </button>
          <button className={activeTab === 'creator' ? 'active' : ''} onClick={() => setActiveTab('creator')}>
            Creators {counts.creator}
          </button>
          <button className={activeTab === 'post' ? 'active' : ''} onClick={() => setActiveTab('post')}>
            Posts {counts.post}
          </button>
          <button className={activeTab === 'reel' ? 'active' : ''} onClick={() => setActiveTab('reel')}>
            Reels {counts.reel}
          </button>
          <button className={activeTab === 'story' ? 'active' : ''} onClick={() => setActiveTab('story')}>
            Stories {counts.story}
          </button>
        </section>

        <section className="searchResults">
          {filteredResults.map((item) => (
            <a className="searchResultCard" href={item.href} key={`${item.type}-${item.id}`}>
              <div className={`searchResultIcon ${item.color || ''}`}>
                {item.type === 'creator' ? '👤' : item.type === 'post' ? '▣' : item.type === 'reel' ? '▶' : '◎'}
              </div>

              <div>
                <b>{item.title}</b>
                <p>{item.subtitle}</p>
                <span>{item.meta}</span>
              </div>

              <em>{item.type}</em>
            </a>
          ))}

          {!filteredResults.length && (
            <div className="adminEmpty">
              {loading ? 'Searching...' : 'No results found.'}
            </div>
          )}
        </section>
      </SocialAppShell>
    </AuthGuard>
  );
}
