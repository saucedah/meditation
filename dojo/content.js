// Claude Ninja Dojo — lessons & quiz content
// Each lesson is a focused topic; each quiz tests recall and conceptual understanding.

const LESSONS = [
  {
    id: 'slash-commands',
    icon: '⚡',
    title: 'Slash Commands',
    summary: 'Built-in shortcuts and user-defined commands for fast actions inside Claude Code.',
    sections: [
      {
        heading: 'What they are',
        body: 'Slash commands start with `/` and trigger either a built-in CLI behavior (like `/help`, `/clear`, `/config`) or a user-defined skill. Typing `/<name>` is the canonical way to invoke a skill from the prompt.'
      },
      {
        heading: 'Common built-ins',
        body: '`/help` shows help, `/clear` resets the conversation, `/config` opens settings UI, `/agents` lists subagents, `/init` generates a CLAUDE.md, `/review` reviews a PR, `/security-review` audits the current diff.'
      },
      {
        heading: 'Skills as commands',
        body: 'Skills you install become slash commands. The skill system loads documentation and tools on demand instead of bloating the system prompt. Invoke with `/skill-name` and pass arguments after the name.'
      },
      {
        heading: 'Custom commands',
        body: 'You can author your own slash commands as markdown files in `.claude/commands/` (project) or `~/.claude/commands/` (user). The body of the markdown becomes the prompt that Claude executes.'
      }
    ],
    takeaways: [
      'Slash commands are the fast lane for repeatable workflows.',
      'Skills load on demand — they keep the base prompt lean.',
      'Author custom commands in `.claude/commands/` to capture team conventions.'
    ]
  },
  {
    id: 'subagents',
    icon: '🥷',
    title: 'Subagents & Parallelization',
    summary: 'Delegate independent work to specialized agents and run them in parallel for speed.',
    sections: [
      {
        heading: 'Why subagents',
        body: 'A subagent runs in its own context window. Use them to (1) parallelize independent work, (2) protect the main context from large search results, and (3) get a specialist perspective (e.g. code review, planning).'
      },
      {
        heading: 'Agent types',
        body: 'Common types: `general-purpose` (catch-all), `Explore` (read-only code search), `Plan` (architecture planning), `code-review`, and any custom agents installed in the project.'
      },
      {
        heading: 'Parallel calls',
        body: 'When multiple agent or tool calls are independent, send them in **one assistant message** with multiple tool_use blocks. They execute concurrently — sequential calls would block on each other unnecessarily.'
      },
      {
        heading: 'Writing the prompt',
        body: 'The subagent has no memory of the conversation. Brief it like a new teammate: state the goal, what you already ruled out, the files involved, and the response format you want.'
      }
    ],
    takeaways: [
      'Independent calls go in a single message → they run in parallel.',
      'Subagents protect your context from noisy tool output.',
      'Self-contained prompts produce better subagent work.'
    ]
  },
  {
    id: 'hooks',
    icon: '🪝',
    title: 'Hooks',
    summary: 'Shell commands the harness runs around events — pre/post tool, session start, stop, prompt submit.',
    sections: [
      {
        heading: 'Event types',
        body: '`SessionStart` (once per session), `UserPromptSubmit` (every user message), `PreToolUse` / `PostToolUse` (around tools), `Stop` (turn ends), `Notification` (idle). Each can run any shell command.'
      },
      {
        heading: 'Config location',
        body: 'Hooks live in `settings.json` (`~/.claude/settings.json` for user, `.claude/settings.json` for project, `.claude/settings.local.json` for personal). They are run by the harness, not by Claude.'
      },
      {
        heading: 'Why hooks matter',
        body: 'Hooks are the only mechanism for **automatic** behaviors ("every time X happens, do Y"). Memory or preferences cannot enforce automation — the harness has to be wired up to do it.'
      },
      {
        heading: 'Blocking and feedback',
        body: 'A hook that exits non-zero can block the action. Output from a hook is treated as feedback from the user — Claude will see and react to it.'
      }
    ],
    takeaways: [
      'Hooks live in `settings.json` and are run by the harness.',
      'Use hooks for automation — memory alone cannot enforce it.',
      'Non-zero exit can block; stdout reaches Claude as user feedback.'
    ]
  },
  {
    id: 'mcp',
    icon: '🔌',
    title: 'MCP Servers',
    summary: 'Model Context Protocol — pluggable tool servers that extend Claude with new capabilities.',
    sections: [
      {
        heading: 'What MCP is',
        body: 'MCP is an open protocol for exposing tools, resources, and prompts to an AI agent. Servers can be local processes (stdio) or remote (HTTP). Claude connects and discovers their tools dynamically.'
      },
      {
        heading: 'Tool naming',
        body: 'MCP tools appear as `mcp__<server>__<tool>`. For example the GitHub server exposes `mcp__github__create_pull_request`, `mcp__github__list_issues`, etc.'
      },
      {
        heading: 'Configuring servers',
        body: 'Add servers under `mcpServers` in `settings.json` with a command, args, and env. Each server runs as a child process; Claude calls its tools just like built-ins.'
      },
      {
        heading: 'Permissions',
        body: 'MCP tools obey the same permission model as built-in tools. You can allowlist specific tools in `permissions.allow` to skip prompts.'
      }
    ],
    takeaways: [
      'MCP tools are namespaced `mcp__server__tool`.',
      'Configure under `mcpServers` in `settings.json`.',
      'Same permission model as built-in tools.'
    ]
  },
  {
    id: 'skills',
    icon: '📜',
    title: 'Skills',
    summary: 'On-demand bundles of knowledge and tools — Claude loads them only when relevant.',
    sections: [
      {
        heading: 'The point of skills',
        body: 'Skills keep the base system prompt small. Each skill has a name, a trigger description, and a body that loads when invoked. They scale: 100 skills cost nothing if you only use 3.'
      },
      {
        heading: 'Invoking',
        body: 'Type `/skill-name` to invoke explicitly, or Claude can pick a relevant skill automatically based on the trigger description.'
      },
      {
        heading: 'Built-in examples',
        body: '`/init` (create CLAUDE.md), `/review` (review a PR), `/security-review` (audit diff), `/verify` (run app to confirm fix), `/code-review`, `/run` (launch and drive the app).'
      },
      {
        heading: 'Authoring',
        body: 'Skills live as folders with a `SKILL.md` describing when to trigger. Keep triggers specific — vague triggers cause false positives and pollute future sessions.'
      }
    ],
    takeaways: [
      'Skills load on demand → cheap to have many.',
      'Specific trigger descriptions prevent false-positive activation.',
      '`/skill-name` invokes explicitly; trigger phrase invokes automatically.'
    ]
  },
  {
    id: 'permissions',
    icon: '🛡️',
    title: 'Permissions & Settings',
    summary: 'Control which tools run without asking, set env vars, and configure project behavior.',
    sections: [
      {
        heading: 'Settings layers',
        body: 'Three files merge in order: `~/.claude/settings.json` (user), `.claude/settings.json` (project, checked in), `.claude/settings.local.json` (personal, gitignored). Later layers override earlier ones.'
      },
      {
        heading: 'Permission rules',
        body: 'Under `permissions.allow` add patterns like `Bash(npm:*)` or `Read(./src/**)`. Under `permissions.deny` block dangerous ones. Patterns match tool name + arguments.'
      },
      {
        heading: 'Modes',
        body: '`acceptEdits` auto-allows file edits, `bypassPermissions` (dangerous) auto-allows everything, default mode prompts on each non-allowlisted action.'
      },
      {
        heading: 'Reducing prompts',
        body: 'After a session, run `/fewer-permission-prompts` — it scans your transcript and proposes a project allowlist for the read-only calls you used.'
      }
    ],
    takeaways: [
      'Three settings layers: user → project → local.',
      'Allowlist specific patterns to cut down prompts.',
      '`/fewer-permission-prompts` builds the allowlist for you.'
    ]
  },
  {
    id: 'tools',
    icon: '🛠️',
    title: 'Tool Mastery',
    summary: 'Use the right tool for the job — dedicated tools beat shell-wrapped equivalents.',
    sections: [
      {
        heading: 'Prefer dedicated tools',
        body: 'Use `Read` instead of `cat`, `Edit` instead of `sed`, `Write` instead of `echo >`. Dedicated tools give the user better diffs and clearer permissions.'
      },
      {
        heading: 'Parallel where independent',
        body: 'Multiple `Read`s, multiple `Bash` queries with no dependencies, multiple agent calls — pack them into one assistant message to run in parallel.'
      },
      {
        heading: 'Edit invariants',
        body: '`Edit` requires the file to have been read in the conversation. `old_string` must be unique (or use `replace_all`). Preserve exact whitespace from the Read output.'
      },
      {
        heading: 'Bash hygiene',
        body: 'Use absolute paths. Quote paths with spaces. Avoid `cd` chained with another command (triggers permission prompts). Use `run_in_background` for long-running tasks instead of `&`.'
      }
    ],
    takeaways: [
      'Read/Edit/Write over cat/sed/echo.',
      'Parallel calls go in a single message.',
      '`Edit` needs a prior `Read` and a unique `old_string`.'
    ]
  },
  {
    id: 'git',
    icon: '🌳',
    title: 'Git Workflows',
    summary: 'Commit, push, and PR practices that keep history clean and reviewers happy.',
    sections: [
      {
        heading: 'Commit only when asked',
        body: 'Claude does not commit automatically. When asked, it inspects `git status` + `git diff` + `git log` in parallel, then writes a focused message.'
      },
      {
        heading: 'New commits, not amends',
        body: 'Prefer `git commit` to `git commit --amend`. Amending after a failed pre-commit hook can rewrite the previous (real) commit and lose work.'
      },
      {
        heading: 'Stage specific files',
        body: 'Avoid `git add -A` / `git add .` — they can sweep in `.env` files or large binaries. Add by name.'
      },
      {
        heading: 'PRs',
        body: 'Create PRs only when explicitly asked. Use HEREDOC for the body to preserve formatting. Keep titles under 70 chars; put detail in the body.'
      }
    ],
    takeaways: [
      'Inspect with parallel git calls before writing the message.',
      'New commits over amends.',
      'Stage specific files, not `-A`.'
    ]
  },
  {
    id: 'prompting',
    icon: '🎯',
    title: 'Prompting Tips',
    summary: 'Get sharper results by giving Claude the same context you would give a teammate.',
    sections: [
      {
        heading: 'State the goal',
        body: 'Lead with what you are trying to accomplish, not just what you want done. The goal lets Claude make sensible judgment calls when details are ambiguous.'
      },
      {
        heading: 'Share what you ruled out',
        body: 'List what you tried and why it did not work. Otherwise Claude may re-walk the same dead end you already explored.'
      },
      {
        heading: 'Specify the shape of the answer',
        body: 'Ask for a punch list, a diff, a 200-word report, a single file change. Constraints prevent sprawl.'
      },
      {
        heading: 'Trust but verify',
        body: 'An agent\'s summary describes intent, not necessarily reality. After code changes, check the diff before reporting "done".'
      }
    ],
    takeaways: [
      'Lead with the goal, not the instruction.',
      'Mention dead ends to save iteration.',
      'Constrain the response shape.',
      'Verify diffs before trusting summaries.'
    ]
  }
];

const QUIZZES = {
  'slash-commands': [
    {
      q: 'Where do project-scoped custom slash commands live?',
      options: ['`.claude/commands/`', '`.vscode/commands/`', '`commands.json` at repo root', '`~/.claude/agents/`'],
      correct: 0,
      explain: 'Project commands live in `.claude/commands/`; user-level ones in `~/.claude/commands/`.'
    },
    {
      q: 'Which slash command generates a CLAUDE.md for the current repo?',
      options: ['`/help`', '`/init`', '`/config`', '`/review`'],
      correct: 1,
      explain: '`/init` walks the repo and produces a starter CLAUDE.md.'
    },
    {
      q: 'Why use skills instead of stuffing everything into the system prompt?',
      options: ['Skills run faster', 'Skills load on demand, keeping the base prompt small', 'Skills are required for tools', 'Skills bypass permissions'],
      correct: 1,
      explain: 'Skills are loaded only when relevant — the base prompt stays lean.'
    },
    {
      q: 'How is a custom slash command authored?',
      options: ['JSON file with a `prompt` field', 'A markdown file whose body becomes the prompt', 'A Python script', 'A YAML manifest in `package.json`'],
      correct: 1,
      explain: 'Custom commands are markdown files; the body becomes the prompt Claude executes.'
    }
  ],
  'subagents': [
    {
      q: 'What is the main reason to send multiple agent calls in a single message?',
      options: ['Reduces token cost', 'They run in parallel', 'Bypasses permissions', 'Avoids hooks'],
      correct: 1,
      explain: 'Independent tool/agent calls in one message execute concurrently.'
    },
    {
      q: 'Which agent type is best for read-only code search?',
      options: ['`Plan`', '`general-purpose`', '`Explore`', '`code-review`'],
      correct: 2,
      explain: '`Explore` is the read-only search specialist.'
    },
    {
      q: 'A subagent prompt should:',
      options: ['Reference the prior conversation by line number', 'Be a one-word command', 'Be fully self-contained — goal, context, constraints', 'Always be one sentence'],
      correct: 2,
      explain: 'The subagent has no memory of the parent conversation. Brief it like a new teammate.'
    },
    {
      q: 'After a subagent reports "done", what should you do?',
      options: ['Trust it and report success', 'Verify the actual changes', 'Re-run the same agent to double-check', 'Ask the user to verify'],
      correct: 1,
      explain: 'Summaries describe intent, not reality. Check the diff.'
    }
  ],
  'hooks': [
    {
      q: 'Which file holds hook definitions?',
      options: ['`CLAUDE.md`', '`settings.json`', '`.gitignore`', '`hooks.json`'],
      correct: 1,
      explain: 'Hooks live under `settings.json` in user, project, or local scope.'
    },
    {
      q: 'A hook fires when the user submits a new prompt. Which event is that?',
      options: ['`SessionStart`', '`PreToolUse`', '`UserPromptSubmit`', '`Stop`'],
      correct: 2,
      explain: '`UserPromptSubmit` runs on each user message before Claude processes it.'
    },
    {
      q: 'Why can\'t "memory" enforce automatic behaviors like "always run tests after edits"?',
      options: ['Memory has a size limit', 'Claude executes prompts, but the harness runs hooks', 'Hooks are read-only', 'Memory can — hooks are optional'],
      correct: 1,
      explain: 'Automation needs a harness-level mechanism. Memory only nudges Claude — it cannot force the harness to run anything.'
    },
    {
      q: 'A hook exits with code 1. What happens?',
      options: ['Silent failure', 'It can block the action; its stdout reaches Claude as user feedback', 'Session resets', 'Hook is disabled'],
      correct: 1,
      explain: 'Non-zero exit can block; output is surfaced to Claude as user feedback.'
    }
  ],
  'mcp': [
    {
      q: 'MCP tools appear in the tool list with what prefix?',
      options: ['`mcp.`', '`mcp__<server>__<tool>`', '`@mcp/`', '`tools__mcp__`'],
      correct: 1,
      explain: 'Format is `mcp__server__tool` — double underscores separate the parts.'
    },
    {
      q: 'Where do you register an MCP server?',
      options: ['`mcpServers` in `settings.json`', '`CLAUDE.md`', '`package.json`', '`.env`'],
      correct: 0,
      explain: 'The `mcpServers` block in settings holds command, args, and env.'
    },
    {
      q: 'MCP tools obey ___ as built-in tools.',
      options: ['a stricter permission model than', 'no permission model — they are always allowed', 'the same permission model', 'a different model defined in the server'],
      correct: 2,
      explain: 'Same model. You can allowlist `mcp__github__list_issues` just like `Bash(npm:*)`.'
    },
    {
      q: 'MCP servers can be:',
      options: ['Only local stdio processes', 'Only remote HTTP services', 'Either local (stdio) or remote (HTTP)', 'Only WebSocket'],
      correct: 2,
      explain: 'Both transports are supported by the protocol.'
    }
  ],
  'skills': [
    {
      q: 'Why do skills scale better than stuffing instructions into the system prompt?',
      options: ['They run on a faster model', 'They load on demand, so unused skills cost nothing', 'They bypass tools', 'They auto-update'],
      correct: 1,
      explain: 'Skills are pulled in only when their trigger matches. 100 unused skills cost zero tokens.'
    },
    {
      q: 'How do you invoke a skill explicitly?',
      options: ['`!skill-name`', '`/skill-name`', '`@skill-name`', '`#skill-name`'],
      correct: 1,
      explain: 'Slash + name. Skills can also auto-trigger via their description.'
    },
    {
      q: 'A skill\'s trigger description should be:',
      options: ['Very broad to maximize coverage', 'Specific so it does not false-positive', 'Empty', 'A regex'],
      correct: 1,
      explain: 'Vague triggers fire constantly and pollute future sessions. Be specific.'
    },
    {
      q: 'Which built-in skill audits the current diff for security issues?',
      options: ['`/review`', '`/init`', '`/security-review`', '`/run`'],
      correct: 2,
      explain: '`/security-review` is the security audit skill.'
    }
  ],
  'permissions': [
    {
      q: 'Settings merge order, lowest to highest precedence:',
      options: ['local → project → user', 'user → project → local', 'project → user → local', 'They do not merge'],
      correct: 1,
      explain: 'User is the base; project overrides it; local overrides both.'
    },
    {
      q: 'Which file should be gitignored?',
      options: ['`.claude/settings.json`', '`.claude/settings.local.json`', '`~/.claude/settings.json`', '`CLAUDE.md`'],
      correct: 1,
      explain: '`settings.local.json` holds personal preferences and should not be checked in.'
    },
    {
      q: 'To allow all `npm` invocations without a prompt, add:',
      options: ['`Bash(npm:*)` to `permissions.allow`', '`*` to `permissions.allow`', '`npm` to `tools`', 'Nothing — npm is default-allowed'],
      correct: 0,
      explain: '`Bash(npm:*)` matches `npm` followed by any args.'
    },
    {
      q: 'Which mode auto-accepts file edits without prompting?',
      options: ['`default`', '`acceptEdits`', '`readOnly`', '`bypassPermissions`'],
      correct: 1,
      explain: '`acceptEdits` skips prompts for Edit/Write. `bypassPermissions` (dangerous) skips everything.'
    }
  ],
  'tools': [
    {
      q: 'You need to view a known file path. Best tool?',
      options: ['`Bash` with `cat`', '`Read`', '`Edit`', '`Grep`'],
      correct: 1,
      explain: '`Read` is the dedicated file viewer — better UX and clearer permissions than `cat`.'
    },
    {
      q: 'Three independent `Read` calls on different files should be:',
      options: ['Sent sequentially', 'Sent in one message with three tool_use blocks', 'Combined into a single Bash `cat` chain', 'Skipped — use Grep instead'],
      correct: 1,
      explain: 'Pack independent calls into one message → they run in parallel.'
    },
    {
      q: 'An `Edit` fails because `old_string` matches twice. Best fix?',
      options: ['Give up', 'Expand `old_string` with surrounding context, or use `replace_all`', 'Use `Write` to rewrite the file', 'Delete the duplicate manually'],
      correct: 1,
      explain: 'Either grow the context until unique or set `replace_all: true`.'
    },
    {
      q: 'Long-running command in Bash — what should you use?',
      options: ['Append `&` yourself', '`run_in_background: true`', 'A second terminal', 'Hooks'],
      correct: 1,
      explain: '`run_in_background` lets the tool track output and notify on completion.'
    }
  ],
  'git': [
    {
      q: 'A pre-commit hook failed. What is the recommended next step?',
      options: ['`git commit --amend` to retry', 'Fix the issue, re-stage, and create a NEW commit', '`git reset --hard`', '`--no-verify` to skip'],
      correct: 1,
      explain: 'Amend would alter the previous (real) commit since the new one never landed. Always create a new commit.'
    },
    {
      q: 'Why avoid `git add -A`?',
      options: ['It is slow', 'It can sweep in `.env`, credentials, or large binaries', 'It does not stage anything', 'It is deprecated'],
      correct: 1,
      explain: 'Stage explicit files to avoid leaking secrets or bloating the repo.'
    },
    {
      q: 'Before writing a commit message, you should run in parallel:',
      options: ['`git status`, `git diff`, `git log`', 'Just `git status`', '`git push --dry-run`', '`git reflog`'],
      correct: 0,
      explain: 'These three together give the full picture: untracked, changes, and message style.'
    },
    {
      q: 'How should the PR body be passed on the CLI?',
      options: ['Inline string with `\\n`', 'A HEREDOC to preserve formatting', 'A JSON blob', 'You can only pass title'],
      correct: 1,
      explain: 'HEREDOC preserves newlines and markdown formatting.'
    }
  ],
  'prompting': [
    {
      q: 'A prompt should lead with:',
      options: ['The exact command to run', 'The goal you are trying to achieve', 'Apologies for the previous turn', 'The model you want'],
      correct: 1,
      explain: 'The goal lets Claude make sensible judgment calls when details are ambiguous.'
    },
    {
      q: 'Why mention what you have already ruled out?',
      options: ['It is required by the API', 'To save Claude from re-walking dead ends', 'It earns extra tokens', 'It triggers a hook'],
      correct: 1,
      explain: 'Otherwise Claude may try the same paths you already eliminated.'
    },
    {
      q: 'A subagent reports "fixed the bug." Best response?',
      options: ['Tell the user it is done', 'Open the diff and confirm', 'Re-run the agent', 'Commit immediately'],
      correct: 1,
      explain: 'Trust but verify. The summary describes intent, not reality.'
    },
    {
      q: 'Constraining response shape (e.g. "under 200 words, punch list") helps because:',
      options: ['It is faster to type', 'It prevents sprawl and keeps the answer usable', 'Token cost is lower', 'Required by the harness'],
      correct: 1,
      explain: 'Constraints focus the response on what is actionable.'
    }
  ]
};

const BELTS = [
  { name: 'White Belt',  color: '#f5f5f5', min: 0     },
  { name: 'Yellow Belt', color: '#ffd23f', min: 50    },
  { name: 'Orange Belt', color: '#ff9f1c', min: 150   },
  { name: 'Green Belt',  color: '#4caf50', min: 300   },
  { name: 'Blue Belt',   color: '#3a86ff', min: 500   },
  { name: 'Purple Belt', color: '#9d4edd', min: 800   },
  { name: 'Brown Belt',  color: '#8b5a2b', min: 1100  },
  { name: 'Red Belt',    color: '#ef233c', min: 1500  },
  { name: 'Black Belt',  color: '#111111', min: 2000  }
];
