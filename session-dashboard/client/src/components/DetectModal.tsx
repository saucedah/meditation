import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { RefreshCw, Link2 } from 'lucide-react';
import { api } from '../lib/api';
import { useToast } from '../lib/toast';
import type { DetectedProcess } from '../lib/types';
import { Modal } from './Modal';

export function DetectModal({ onClose }: { onClose: () => void }) {
  const qc = useQueryClient();
  const toast = useToast();
  const [projectId, setProjectId] = useState('');

  const detect = useQuery({ queryKey: ['detect'], queryFn: () => api.detect(), refetchOnWindowFocus: false });
  const projects = useQuery({ queryKey: ['projects'], queryFn: () => api.listProjects() });

  const link = useMutation({
    mutationFn: (p: DetectedProcess) =>
      api.createSession({
        project_id: projectId || null,
        name: `${p.name} · ${p.pid}`,
        source: 'imported',
        pid: p.pid,
        command: p.commandLine,
        status: 'active',
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['sessions'] });
      toast('Session linked', 'ok');
    },
    onError: (e: Error) => toast(e.message, 'err'),
  });

  const procs = detect.data?.processes ?? [];

  return (
    <Modal title="Detect & import external sessions" onClose={onClose} wide>
      <div className="banner info" style={{ marginBottom: 16 }}>
        Detection lists running terminal-related processes so you can link the right one to a
        project. Working directories aren't read automatically — see the README for why.
      </div>

      <div className="flex" style={{ marginBottom: 14 }}>
        <select className="select" style={{ maxWidth: 280 }} value={projectId} onChange={(e) => setProjectId(e.target.value)}>
          <option value="">Link to… (no project)</option>
          {(projects.data ?? []).map((p) => (
            <option key={p.id} value={p.id}>{p.name}</option>
          ))}
        </select>
        <button className="btn sm ghost right" onClick={() => detect.refetch()} disabled={detect.isFetching}>
          <RefreshCw size={14} className={detect.isFetching ? 'spin' : ''} /> Refresh
        </button>
      </div>

      {detect.data && !detect.data.supported && (
        <div className="banner warn">{detect.data.message}</div>
      )}

      {procs.length ? (
        <table className="proc-table">
          <thead>
            <tr>
              <th>PID</th>
              <th>Kind</th>
              <th>Name</th>
              <th>Command line</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {procs.map((p) => (
              <tr key={p.pid}>
                <td className="mono">{p.pid}</td>
                <td><span className={`chip ${p.kind}`}>{p.kind}</span></td>
                <td>{p.name}</td>
                <td className="proc-cmd" title={p.commandLine}>{p.commandLine || '—'}</td>
                <td>
                  <button className="btn sm" onClick={() => link.mutate(p)} disabled={link.isPending}>
                    <Link2 size={13} /> Link
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <div className="empty" style={{ padding: 32 }}>
          <h3>{detect.isFetching ? 'Scanning…' : 'No processes found'}</h3>
          <p>{detect.data?.supported === false ? 'Run on Windows to enumerate processes.' : 'Nothing terminal-related is running.'}</p>
        </div>
      )}
    </Modal>
  );
}
