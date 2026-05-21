'use client';

import { useEffect, useMemo, useState } from 'react';
import AuthGuard from '../../components/AuthGuard';
import SocialAppShell from '../../components/SocialAppShell';

type SearchResult = {
  type: string;
  id: string;
  title: string;
  subtitle: string;
  meta: string;
  href: string;
};

export default function SearchPage() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [source, setSource] = useState('empty');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const q = params.get('q') || '';
    setQuery(q);

    if (q.trim()) {
      runSearch(q);
    }
  }, []);

  async function runSearch(q = query) {
    setLoading(true);

    try {
      const response = await fetch(`/api/search?q=${encodeURIComponent(q)}`, {
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

  const grouped = useMemo(() => {
    return results.reduce((acc: any, item) => {
      acc[item.type] = acc[item.type] || [];
      acc[item.type].push(item);
      return acc;
    }, {});
  }, [results]);

  return (
    <AuthGuard>
      <SocialAppShell
        active="explore"
        title="Search"
        subtitle="Search creators, posts, reels and stories across VibeLoop."
      >
        <section className="vlSearchPageBox">
          <div>
            <h2>Global Search</h2>
            <p>
              Find creators, reels, stories and posts.
              <span className="vlSourceBadge"> {source === 'backend' ? 'Live Backend' : 'Fallback Ready'}</span>
            </p>
          </div>

          <div className="vlSearchPageInput">
            <input
              value={query}
              placeholder="Search anything..."
              onChange={(event) => setQuery(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter') runSearch();
              }}
            />

            <button type="button" onClick={() => runSearch()}>
              {loading ? 'Searching...' : 'Search'}
            </button>
          </div>
        </section>

        {loading && (
          <div className="vlFeedLoader">
            <div />
            <h2>Searching VibeLoop...</h2>
            <p>Checking creators, reels, stories and posts.</p>
          </div>
        )}

        {!loading && query && !results.length && (
          <div className="adminEmpty">No results found for "{query}".</div>
        )}

        {!loading && Object.keys(grouped).map((type) => (
          <section className="vlSearchGroup" key={type}>
            <h3>{type.toUpperCase()}</h3>

            <div className="vlSearchResults">
              {grouped[type].map((item: SearchResult) => (
                <a className="vlSearchResultCard" href={item.href} key={`${item.type}-${item.id}`}>
                  <div>{item.type[0].toUpperCase()}</div>

                  <section>
                    <b>{item.title}</b>
                    <span>{item.subtitle}</span>
                    <small>{item.meta}</small>
                  </section>

                  <em>Open</em>
                </a>
              ))}
            </div>
          </section>
        ))}
      </SocialAppShell>
    </AuthGuard>
  );
}
