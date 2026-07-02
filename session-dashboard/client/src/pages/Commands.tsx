import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Trash2, Play, Terminal } from 'lucide-react';
import { api } from '../lib/api';
import { useToast } from '../lib/toast';
import { useLaunch } from '../lib/useLaunch';
import type { Command, CommandKind } from '../lib/types';

const KINDS: CommandKind[] = ['claude', 'dev', 'test', 'git', 'custom'];

function CommandRow({ cmd, projectId }: { cmd: Command; projectId?: string }) {
  const qc = useQueryClient();
  const toast = useToast();
  const { launch } = useLaunch();
  const del = useMutation({
    mutationFn: () => api.deleteCommand(cmd.id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['commands'] });
      toast('Command removed', 'ok');
    },
  });
  return (
    <div className="flex" style={{ padding: '10px 0', borderBottom: '1px solid var(--line-soft)' }}>
      <span className={`chip ${cmd.kind}`}>{cmd.kind}</span>
      <div>
        <div style={{ fontWeight: 600, fontSize: 14 }}>{cmd.label}</div>
        <div className="mono" style={{ fontSize: 12, color: 'var(--cyan)' }}>$ {cmd.command}</div>
      </div>
      <div className="right flex">
        {projectId && (
          <button className="btn sm ghost" onClick={() => launch(projectId, { type: 'command', command_id: cmd.id })}>
            <Play size={13} /> Run
          </button>
        )}
        <button className="btn sm ghost danger" onClick={() => del.mutate()}><Trash2 size={13} /></button>
      </div>
    </div>
  );
}

function AddCommand({ projectId }: { projectId?: string }) {
  const qc = useQueryClient();
  const toast = useToast();
  const [label, setLabel] = useState('');
  const [command, setCommand] = useState('');
  const [kind, setKind] = useState<CommandKind>('custom');

  const add = useMutation({
    mutationFn: () => api.createCommand({ label, command, kind, project_id: projectId ?? null }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['commands'] });
      setLabel(''); setCommand('');
      toast('Command added', 'ok');
    },
    onError: (e: Error) => toast(e.message, 'err'),
  });

  return (
    <div className="flex" style={{ gap: 8, marginTop: 14, flexWrap: 'wrap' }}>
      <input className="input" style={{ maxWidth: 160 }} placeholder="Label" value={label} onChange={(e) => setLabel(e.target.value)} />
      <input className="input mono" style={{ flex: 1, minWidth: 180 }} placeholder="command to run" value={command} onChange={(e) => setCommand(e.target.value)} />
      <select className="select" style={{ maxWidth: 120 }} value={kind} onChange={(e) => setKind(e.target.value as CommandKind)}>
        {KINDS.map((k) => <option key={k} value={k}>{k}</option>)}
      </select>
      <button className="btn primary" onClick={() => label && command && add.mutate()} disabled={add.isPending}>
        <Plus size={15} /> Add
      </button>
    </div>
  );
}

export function Commands() {
  const [projectId, setProjectId] = useState('');
  const projects = useQuery({ queryKey: ['projects'], queryFn: () => api.listProjects() });
  const globals = useQuery({ queryKey: ['commands', 'global'], queryFn: () => api.listCommands({ scope: 'global' }) });
  const projectCmds = useQuery({
    queryKey: ['commands', projectId],
    queryFn: () => api.listCommands({ project_id: projectId }),
    enabled: !!projectId,
  });

  return (
    <div className="content">
      <div className="section-head">
        <div>
          <div className="page-title">Commands</div>
          <div className="page-sub">Reusable launch commands — global templates and per-project.</div>
        </div>
      </div>

      <div className="panel" style={{ marginBottom: 20 }}>
        <h3><Terminal size={14} style={{ verticalAlign: -2 }} /> Global templates</h3>
        <div className="muted" style={{ fontSize: 13, marginBottom: 6 }}>
          Quick reference shown in the palette. Project commands are what actually launch.
        </div>
        {(globals.data ?? []).map((c) => <CommandRow key={c.id} cmd={c} />)}
        <AddCommand />
      </div>

      <div className="panel">
        <h3>Project commands</h3>
        <select className="select" style={{ maxWidth: 320, marginBottom: 12 }} value={projectId} onChange={(e) => setProjectId(e.target.value)}>
          <option value="">Choose a project…</option>
          {(projects.data ?? []).map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>
        {projectId ? (
          <>
            {(projectCmds.data ?? []).length
              ? (projectCmds.data ?? []).map((c) => <CommandRow key={c.id} cmd={c} projectId={projectId} />)
              : <div className="muted" style={{ fontSize: 13 }}>No commands for this project yet.</div>}
            <AddCommand projectId={projectId} />
          </>
        ) : (
          <div className="muted" style={{ fontSize: 13 }}>Select a project to manage its saved commands.</div>
        )}
      </div>
    </div>
  );
}
