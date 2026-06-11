'use client';

import { useEffect, useState } from 'react';
import AuthGuard from '../../components/AuthGuard';
import SocialAppShell from '../../components/SocialAppShell';

export default function SafetyPage() {
  const [reports, setReports] = useState<any[]>([]);
  const [blocks, setBlocks] = useState<any[]>([]);
  const [target, setTarget] = useState('');
  const [reason, setReason] = useState('Spam or fake account');
  const [details, setDetails] = useState('');
  const [blockTarget, setBlockTarget] = useState('');
  const [blockNote, setBlockNote] = useState('');
  const [message, setMessage] = useState('');
  const [source, setSource] = useState('loading');

  async function loadSafetyData() {
    try {
      const [reportsRes, blocksRes] = await Promise.all([
        fetch('/api/safety/reports', { cache: 'no-store' }),
        fetch('/api/safety/blocks', { cache: 'no-store' })
      ]);

      const reportsData = await reportsRes.json();
      const blocksData = await blocksRes.json();

      setReports(reportsData.reports || []);
      setBlocks(blocksData.blocks || []);
      setSource(reportsData.source === 'platform' || blocksData.source === 'platform' ? 'platform' : 'fallback');
    } catch {
      setSource('fallback');
    }
  }

  useEffect(() => {
    loadSafetyData();
  }, []);

  async function submitReport() {
    if (!target.trim()) {
      setMessage('Enter username or post ID to report.');
      return;
    }

    try {
      const response = await fetch('/api/safety/reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ target, reason, details })
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || 'Report failed');
      }

      setReports([data.report, ...reports]);
      setTarget('');
      setDetails('');
      setMessage('Report submitted successfully.');
    } catch {
      setMessage('Report failed. Try again.');
    }
  }

  async function blockUser() {
    if (!blockTarget.trim()) {
      setMessage('Enter username to block.');
      return;
    }

    try {
      const response = await fetch('/api/safety/block', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ target: blockTarget, note: blockNote })
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || 'Block failed');
      }

      setBlocks([data.block, ...blocks.filter((item) => item.target !== data.block.target)]);
      setBlockTarget('');
      setBlockNote('');
      setMessage('User blocked successfully.');
    } catch {
      setMessage('Block failed. Try again.');
    }
  }

  async function unblockUser(targetName: string) {
    setBlocks(blocks.filter((item) => item.target !== targetName));

    try {
      await fetch('/api/safety/unblock', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ target: targetName })
      });

      setMessage('User unblocked.');
    } catch {
      setMessage('User removed locally.');
    }
  }

  return (
    <AuthGuard>
      <SocialAppShell
        active="safety"
        title="Safety Center"
        subtitle="Report harmful content, block users and manage account safety."
      >
        <section className="safetyHero">
          <div>
            <span>{source === 'platform' ? 'Live Live Safety' : 'Safety Ready'}</span>
            <h2>Control safety, reports and blocked users</h2>
            <p>Keep the platform clean with reports, moderation and block controls.</p>
          </div>

          <button type="button" onClick={loadSafetyData}>Refresh</button>
        </section>

        {message && <div className="vlSettingsMessage">{message}</div>}

        <section className="safetyGridTwo">
          <div className="safetyPanel">
            <h3>Submit Report</h3>

            <label>
              Username / Post ID
              <input value={target} onChange={(e) => setTarget(e.target.value)} placeholder="@username or post ID" />
            </label>

            <label>
              Reason
              <select value={reason} onChange={(e) => setReason(e.target.value)}>
                <option>Spam or fake account</option>
                <option>Harassment or bullying</option>
                <option>Copyright issue</option>
                <option>Adult or harmful content</option>
                <option>Other</option>
              </select>
            </label>

            <label>
              Details
              <textarea value={details} onChange={(e) => setDetails(e.target.value)} placeholder="Explain the issue..." />
            </label>

            <button type="button" onClick={submitReport}>Submit Report</button>
          </div>

          <div className="safetyPanel">
            <h3>Block User</h3>

            <label>
              Username
              <input value={blockTarget} onChange={(e) => setBlockTarget(e.target.value)} placeholder="@username" />
            </label>

            <label>
              Note
              <textarea value={blockNote} onChange={(e) => setBlockNote(e.target.value)} placeholder="Optional note..." />
            </label>

            <button type="button" onClick={blockUser}>Block User</button>
          </div>
        </section>

        <section className="safetyGridTwo">
          <div className="safetyPanel">
            <h3>Reports</h3>

            <div className="safetyList">
              {reports.map((item) => (
                <article className="safetyItem" key={item.id}>
                  <div>
                    <b>{item.target}</b>
                    <span>{item.reason}</span>
                    <p>{item.details || 'No extra details'}</p>
                  </div>
                  <em>{item.status}</em>
                </article>
              ))}

              {!reports.length && <div className="adminEmpty">No reports yet.</div>}
            </div>
          </div>

          <div className="safetyPanel">
            <h3>Blocked Users</h3>

            <div className="safetyList">
              {blocks.map((item) => (
                <article className="safetyItem" key={item.id}>
                  <div>
                    <b>{item.target}</b>
                    <span>{item.note || 'Blocked user'}</span>
                  </div>

                  <button type="button" onClick={() => unblockUser(item.target)}>Unblock</button>
                </article>
              ))}

              {!blocks.length && <div className="adminEmpty">No blocked users.</div>}
            </div>
          </div>
        </section>
      </SocialAppShell>
    </AuthGuard>
  );
}
