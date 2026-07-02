import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from './api';
import { useToast } from './toast';
import type { LaunchResult, Session } from './types';

type LaunchKind = { type: 'terminal' } | { type: 'claude' } | { type: 'command'; command_id?: string; command?: string; label?: string };

/** Shared launch handler: fires the right endpoint, toasts the result, refreshes sessions. */
export function useLaunch() {
  const qc = useQueryClient();
  const toast = useToast();

  const m = useMutation({
    mutationFn: ({ projectId, kind }: { projectId?: string; kind: LaunchKind }) => {
      if (kind.type === 'terminal') return api.launchTerminal({ project_id: projectId });
      if (kind.type === 'claude') return api.launchClaude({ project_id: projectId });
      return api.launchCommand({
        project_id: projectId,
        command_id: kind.command_id,
        command: kind.command,
        label: kind.label,
      });
    },
    onSuccess: (data: { session: Session; launch: LaunchResult }) => {
      qc.invalidateQueries({ queryKey: ['sessions'] });
      toast(data.launch.message, data.launch.ok ? 'ok' : 'info');
    },
    onError: (e: Error) => toast(e.message, 'err'),
  });

  return {
    launch: (projectId: string | undefined, kind: LaunchKind) => m.mutate({ projectId, kind }),
    isPending: m.isPending,
  };
}
