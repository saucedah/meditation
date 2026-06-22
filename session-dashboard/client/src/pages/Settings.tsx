import { useQuery } from '@tanstack/react-query';
import { Monitor, Database, Keyboard, Github } from 'lucide-react';
import { api } from '../lib/api';

export function Settings() {
  const env = useQuery({ queryKey: ['env'], queryFn: () => api.env() });

  return (
    <div className="content">
      <div className="section-head">
        <div>
          <div className="page-title">Settings</div>
          <div className="page-sub">Environment & how FleetDeck behaves on this machine.</div>
        </div>
      </div>

      <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))' }}>
        <div className="panel">
          <h3><Monitor size={14} style={{ verticalAlign: -2 }} /> Environment</h3>
          <div className="stat-row">
            <div className="stat"><div className="k">Platform</div><div className="v">{env.data?.platform ?? '…'}</div></div>
            <div className="stat"><div className="k">Windows launch</div><div className="v">{env.data?.isWindows ? 'Enabled' : 'Simulated'}</div></div>
          </div>
          {!env.data?.isWindows && (
            <div className="banner warn" style={{ marginTop: 6 }}>
              Not on Windows: launching &amp; detection are simulated. Sessions are still recorded.
            </div>
          )}
        </div>

        <div className="panel">
          <h3><Database size={14} style={{ verticalAlign: -2 }} /> Data</h3>
          <p className="muted" style={{ fontSize: 13, lineHeight: 1.6 }}>
            All data lives in a local SQLite file at <code className="mono">server/data/fleetdeck.db</code>.
            Back it up by copying that file. No cloud, no accounts.
          </p>
        </div>

        <div className="panel">
          <h3><Keyboard size={14} style={{ verticalAlign: -2 }} /> Shortcuts</h3>
          <div className="flex" style={{ justifyContent: 'space-between', padding: '6px 0' }}>
            <span>Command palette</span><span className="kbd">⌘ / Ctrl + K</span>
          </div>
          <div className="flex" style={{ justifyContent: 'space-between', padding: '6px 0' }}>
            <span>Close dialogs</span><span className="kbd">Esc</span>
          </div>
        </div>

        <div className="panel">
          <h3><Github size={14} style={{ verticalAlign: -2 }} /> About</h3>
          <p className="muted" style={{ fontSize: 13, lineHeight: 1.6 }}>
            FleetDeck v0.1 — a local mission-control dashboard for Claude Code &amp; Windows
            Terminal sessions. Built with React, Vite, Express and SQLite.
          </p>
        </div>
      </div>
    </div>
  );
}
