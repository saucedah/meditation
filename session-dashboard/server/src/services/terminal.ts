import { spawn } from 'node:child_process';
import { platform } from 'node:os';

export const isWindows = platform() === 'win32';

export interface LaunchOptions {
  cwd: string;
  title: string;
  /** Command to run inside the new tab (omit for a plain shell). */
  command?: string;
  /** Shell to host the command. */
  shell?: 'pwsh' | 'powershell' | 'cmd';
}

export interface LaunchResult {
  ok: boolean;
  pid: number | null;
  argv: string[];
  message: string;
}

/**
 * Open a new Windows Terminal tab in `cwd`, optionally running `command`.
 *
 * We build a `wt.exe` invocation:
 *   wt -w 0 nt -d "<cwd>" --title "<title>" <shell> -NoExit -Command "<command>"
 *
 * `-w 0` targets the most-recently-used window (so tabs group together).
 * The returned PID belongs to the short-lived `wt.exe` launcher, not the tab's
 * shell — see README "auto-detection" for why deeper tracking isn't reliable.
 */
export function launchWindowsTerminal(opts: LaunchOptions): LaunchResult {
  const { cwd, title, command, shell = 'pwsh' } = opts;

  const args: string[] = ['-w', '0', 'nt'];
  if (cwd) args.push('-d', cwd);
  if (title) args.push('--title', title);

  if (command) {
    if (shell === 'cmd') {
      args.push('cmd', '/k', command);
    } else {
      // pwsh/powershell: keep the tab open after the command finishes.
      args.push(shell, '-NoExit', '-Command', command);
    }
  } else {
    args.push(shell);
  }

  const argv = ['wt.exe', ...args];

  if (!isWindows) {
    return {
      ok: false,
      pid: null,
      argv,
      message:
        'Launching is only supported on Windows. This server is not running on Windows, ' +
        'so the command was not executed. On your Windows machine this would run: ' +
        argv.join(' '),
    };
  }

  try {
    const child = spawn('wt.exe', args, {
      detached: true,
      stdio: 'ignore',
      windowsVerbatimArguments: false,
    });
    child.unref();
    return {
      ok: true,
      pid: child.pid ?? null,
      argv,
      message: 'Launched Windows Terminal.',
    };
  } catch (err) {
    return {
      ok: false,
      pid: null,
      argv,
      message: `Failed to launch wt.exe: ${(err as Error).message}`,
    };
  }
}
