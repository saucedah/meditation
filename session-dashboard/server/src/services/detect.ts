import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { isWindows } from './terminal.js';
import type { DetectedProcess } from '../types.js';

const execFileAsync = promisify(execFile);

/**
 * Enumerate processes relevant to terminal sessions via PowerShell + CIM.
 *
 * We deliberately do NOT try to read each process's working directory — that
 * requires undocumented native calls and is unreliable. We surface name,
 * command line, PID and parent PID so the user can *link* the right process to
 * a project manually (the hybrid model described in the README).
 */
export async function detectProcesses(): Promise<{
  supported: boolean;
  message: string;
  processes: DetectedProcess[];
}> {
  if (!isWindows) {
    return {
      supported: false,
      message:
        'Process detection runs on Windows only. On Windows this enumerates ' +
        'WindowsTerminal.exe, claude, node and shell processes.',
      processes: [],
    };
  }

  // Single CIM query, JSON out. Filter to the process families we care about.
  const ps = [
    "$names = 'WindowsTerminal.exe','wt.exe','pwsh.exe','powershell.exe','cmd.exe','node.exe','claude.exe','bash.exe','wsl.exe';",
    'Get-CimInstance Win32_Process |',
    'Where-Object { $names -contains $_.Name -or $_.CommandLine -match \'claude\' } |',
    'Select-Object ProcessId, ParentProcessId, Name, CommandLine, CreationDate |',
    'ConvertTo-Json -Depth 2 -Compress',
  ].join(' ');

  try {
    const { stdout } = await execFileAsync(
      'powershell.exe',
      ['-NoProfile', '-NonInteractive', '-Command', ps],
      { maxBuffer: 8 * 1024 * 1024, windowsHide: true }
    );
    const parsed = JSON.parse(stdout || '[]');
    const rows = Array.isArray(parsed) ? parsed : [parsed];
    const processes: DetectedProcess[] = rows
      .filter(Boolean)
      .map((r: any) => ({
        pid: Number(r.ProcessId),
        parentPid: r.ParentProcessId != null ? Number(r.ParentProcessId) : null,
        name: String(r.Name ?? ''),
        commandLine: String(r.CommandLine ?? ''),
        startTime: parseCimDate(r.CreationDate),
        kind: classify(String(r.Name ?? ''), String(r.CommandLine ?? '')),
      }));
    return { supported: true, message: `Found ${processes.length} processes.`, processes };
  } catch (err) {
    return {
      supported: true,
      message: `Detection failed: ${(err as Error).message}`,
      processes: [],
    };
  }
}

function classify(name: string, cmd: string): DetectedProcess['kind'] {
  const n = name.toLowerCase();
  if (n.includes('windowsterminal') || n === 'wt.exe') return 'terminal';
  if (n.includes('claude') || /\bclaude\b/i.test(cmd)) return 'claude';
  if (n.includes('node')) return 'node';
  if (['pwsh.exe', 'powershell.exe', 'cmd.exe', 'bash.exe', 'wsl.exe'].includes(n)) return 'shell';
  return 'other';
}

/** CIM dates arrive either as ISO-ish strings or /Date(ms)/ wrappers. */
function parseCimDate(v: unknown): string | null {
  if (!v) return null;
  if (typeof v === 'string') {
    const m = v.match(/\/Date\((\d+)\)\//);
    if (m) return new Date(Number(m[1])).toISOString();
    const d = new Date(v);
    return isNaN(d.getTime()) ? null : d.toISOString();
  }
  return null;
}
