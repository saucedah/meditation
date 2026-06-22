import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Search, Sparkles, TerminalSquare, FolderGit2, LayoutDashboard, Radio, History, Settings, ArrowRight, type LucideIcon } from 'lucide-react';
import { api } from '../lib/api';
import { useLaunch } from '../lib/useLaunch';

interface Action {
  id: string;
  group: string;
  label: string;
  hint?: string;
  icon: LucideIcon;
  run: () => void;
}

export function CommandPalette({ onClose }: { onClose: () => void }) {
  const nav = useNavigate();
  const { launch } = useLaunch();
  const [q, setQ] = useState('');
  const [sel, setSel] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const projects = useQuery({ queryKey: ['projects'], queryFn: () => api.listProjects() });

  useEffect(() => inputRef.current?.focus(), []);

  const actions = useMemo<Action[]>(() => {
    const go = (to: string) => () => {
      nav(to);
      onClose();
    };
    const navActions: Action[] = [
      { id: 'nav-dash', group: 'Navigate', label: 'Dashboard', icon: LayoutDashboard, run: go('/') },
      { id: 'nav-proj', group: 'Navigate', label: 'Projects', icon: FolderGit2, run: go('/projects') },
      { id: 'nav-sess', group: 'Navigate', label: 'Sessions', icon: Radio, run: go('/sessions') },
      { id: 'nav-hist', group: 'Navigate', label: 'History', icon: History, run: go('/history') },
      { id: 'nav-set', group: 'Navigate', label: 'Settings', icon: Settings, run: go('/settings') },
    ];
    const projActions: Action[] = (projects.data ?? []).flatMap((p) => [
      {
        id: `claude-${p.id}`,
        group: 'Launch',
        label: `Open Claude · ${p.name}`,
        hint: p.path,
        icon: Sparkles,
        run: () => {
          launch(p.id, { type: 'claude' });
          onClose();
        },
      },
      {
        id: `term-${p.id}`,
        group: 'Launch',
        label: `Open Terminal · ${p.name}`,
        hint: p.path,
        icon: TerminalSquare,
        run: () => {
          launch(p.id, { type: 'terminal' });
          onClose();
        },
      },
      {
        id: `open-${p.id}`,
        group: 'Go to project',
        label: p.name,
        hint: p.path,
        icon: ArrowRight,
        run: go(`/projects?focus=${p.id}`),
      },
    ]);
    return [...navActions, ...projActions];
  }, [projects.data, nav, launch, onClose]);

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    if (!term) return actions;
    return actions.filter(
      (a) => a.label.toLowerCase().includes(term) || a.hint?.toLowerCase().includes(term)
    );
  }, [q, actions]);

  useEffect(() => setSel(0), [q]);

  const onKey = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSel((s) => Math.min(s + 1, filtered.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSel((s) => Math.max(s - 1, 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      filtered[sel]?.run();
    } else if (e.key === 'Escape') {
      onClose();
    }
  };

  let lastGroup = '';

  return (
    <div className="palette-overlay" onClick={onClose}>
      <div className="palette" onClick={(e) => e.stopPropagation()} onKeyDown={onKey}>
        <div className="palette-input">
          <Search size={18} className="muted" />
          <input
            ref={inputRef}
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search projects, launch Claude, navigate…"
          />
          <span className="kbd">esc</span>
        </div>
        <div className="palette-list">
          {filtered.length === 0 && <div className="empty" style={{ padding: 32 }}>No matches</div>}
          {filtered.map((a, i) => {
            const showGroup = a.group !== lastGroup;
            lastGroup = a.group;
            return (
              <div key={a.id}>
                {showGroup && <div className="palette-group">{a.group}</div>}
                <div
                  className={`palette-item ${i === sel ? 'sel' : ''}`}
                  onMouseEnter={() => setSel(i)}
                  onClick={() => a.run()}
                >
                  <a.icon size={16} />
                  <span>{a.label}</span>
                  {a.hint && <span className="pi-sub">{a.hint}</span>}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
