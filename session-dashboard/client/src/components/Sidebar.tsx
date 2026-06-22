import { NavLink } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { LayoutDashboard, FolderGit2, Radio, Terminal, History, Settings, Rocket } from 'lucide-react';
import { api } from '../lib/api';

export function Sidebar() {
  const sessions = useQuery({ queryKey: ['sessions'], queryFn: () => api.listSessions() });
  const projects = useQuery({ queryKey: ['projects'], queryFn: () => api.listProjects() });

  const activeCount = (sessions.data ?? []).filter(
    (s) => s.status === 'active' || s.status === 'needs_review'
  ).length;

  const links = [
    { to: '/', label: 'Dashboard', icon: LayoutDashboard, end: true },
    { to: '/projects', label: 'Projects', icon: FolderGit2, badge: projects.data?.length },
    { to: '/sessions', label: 'Sessions', icon: Radio, badge: activeCount || undefined },
    { to: '/commands', label: 'Commands', icon: Terminal },
    { to: '/history', label: 'History', icon: History },
    { to: '/settings', label: 'Settings', icon: Settings },
  ];

  return (
    <aside className="sidebar">
      <div className="brand">
        <div className="brand-mark">
          <Rocket size={19} />
        </div>
        <div>
          <div className="brand-name">FleetDeck</div>
          <div className="brand-sub">Mission Control</div>
        </div>
      </div>

      {links.map((l) => (
        <NavLink key={l.to} to={l.to} end={l.end} className="nav-link">
          <l.icon size={18} />
          {l.label}
          {l.badge ? <span className="nav-badge">{l.badge}</span> : null}
        </NavLink>
      ))}

      <div className="sidebar-footer">
        <div>FleetDeck v0.1 · local</div>
        <div style={{ marginTop: 4 }}>
          Press <span className="kbd">⌘K</span> for commands
        </div>
      </div>
    </aside>
  );
}
