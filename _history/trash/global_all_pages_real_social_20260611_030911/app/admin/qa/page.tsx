'use client';

import { useEffect, useState } from 'react';
import AdminGuard from '../../../components/AdminGuard';
import AdminLogoutButton from '../../../components/AdminLogoutButton';
import SocialAppShell from '../../../components/SocialAppShell';

export default function AdminQAPage() {
  const [qa, setQa] = useState<any>(null);
  const [message, setMessage] = useState('');

  async function loadQA() {
    setMessage('Running QA checks...');

    try {
      const response = await fetch('/api/admin/qa/system', {
        cache: 'no-store'
      });

      const data = await response.json();

      setQa(data);
      setMessage(data.success ? 'All QA checks passed.' : 'QA completed with warnings.');
    } catch {
      setMessage('QA check failed.');
    }
  }

  useEffect(() => {
    loadQA();
  }, []);

  const routeChecks = qa?.routes?.checks || [];
  const dbEntries = Object.entries(qa?.databases || {});
  const envEntries = Object.entries(qa?.environment || {});
  const warnings = qa?.warnings || [];

  return (
    <AdminGuard>
      <SocialAppShell
        active="admin"
        title="Admin QA"
        subtitle="Final production quality check for APIs, database, media and security."
      >
        <section className="qaHero">
          <div>
            <span>{qa?.source === 'platform' ? 'System QA' : 'QA Loading'}</span>
            <h2>Production QA dashboard</h2>
            <p>Check platform routes, database health, media storage and environment security.</p>
          </div>

          <div className="qaHeroActions">
            <button type="button" onClick={loadQA}>Run QA Again</button>
            <AdminLogoutButton />
          </div>
        </section>

        {message && <div className="vlSettingsMessage">{message}</div>}

        {qa && (
          <>
            <section className="qaStats">
              <div>
                <b>{qa.routes?.requiredTotal || 0}</b>
                <span>Required routes</span>
              </div>
              <div>
                <b>{qa.routes?.missingTotal || 0}</b>
                <span>Missing routes</span>
              </div>
              <div>
                <b>{qa.media?.fileCount || 0}</b>
                <span>Media files</span>
              </div>
              <div>
                <b>{warnings.length}</b>
                <span>Warnings</span>
              </div>
            </section>

            {warnings.length > 0 && (
              <section className="qaPanel danger">
                <h3>Warnings</h3>

                <div className="qaList">
                  {warnings.map((warning: string, index: number) => (
                    <article className="qaItem bad" key={index}>
                      <b>Warning</b>
                      <span>{warning}</span>
                    </article>
                  ))}
                </div>
              </section>
            )}

            <section className="qaGrid">
              <div className="qaPanel">
                <h3>Route Health</h3>

                <div className="qaList">
                  {routeChecks.map((item: any) => (
                    <article className={`qaItem ${item.loaded ? 'good' : 'bad'}`} key={item.path}>
                      <b>{item.loaded ? 'Loaded' : 'Missing'}</b>
                      <span>{item.path}</span>
                    </article>
                  ))}
                </div>
              </div>

              <div className="qaPanel">
                <h3>Database Health</h3>

                <div className="qaList">
                  {dbEntries.map(([key, value]: any) => (
                    <article className={`qaItem ${value.exists && !value.error ? 'good' : 'bad'}`} key={key}>
                      <b>{key}: {value.count}</b>
                      <span>{value.error || 'OK'}</span>
                    </article>
                  ))}
                </div>
              </div>
            </section>

            <section className="qaGrid">
              <div className="qaPanel">
                <h3>Environment</h3>

                <div className="qaList">
                  {envEntries.map(([key, value]: any) => (
                    <article className={`qaItem ${value ? 'good' : 'bad'}`} key={key}>
                      <b>{value ? 'Set' : 'Missing'}</b>
                      <span>{key}</span>
                    </article>
                  ))}
                </div>
              </div>

              <div className="qaPanel">
                <h3>Media Storage</h3>

                <div className="qaList">
                  <article className={`qaItem ${qa.media?.exists ? 'good' : 'bad'}`}>
                    <b>{qa.media?.exists ? 'Folder OK' : 'Folder Missing'}</b>
                    <span>{qa.media?.path || 'No media path'}</span>
                  </article>

                  <article className="qaItem good">
                    <b>{qa.media?.fileCount || 0} files</b>
                    <span>Permanent uploaded files tracked by storage folder</span>
                  </article>
                </div>
              </div>
            </section>
          </>
        )}
      </SocialAppShell>
    </AdminGuard>
  );
}
