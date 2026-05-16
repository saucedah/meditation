# Firefly III + Data Importer — Home Setup

Self-hosted personal finance manager with seamless **bank account** sync.
No credit cards — Ramsey-style.

## What this gives you

- **Firefly III** on http://localhost:8080 — budgets, bills, accounts, reports.
- **Data Importer** on http://localhost:8081 — pulls transactions from your checking / savings accounts.
- **MariaDB** for storage, **cron** for recurring transactions & reminders.

## One-time setup

1. **Install Docker Desktop** (Mac/Windows) or Docker Engine + Compose (Linux).
2. Copy the env template and fill in secrets:
   ```bash
   cp .env.example .env
   ```
   Generate random strings for `APP_KEY`, `DB_PASSWORD`, and `STATIC_CRON_TOKEN` / `CRON_TOKEN` (same value in both):
   ```bash
   openssl rand -base64 32          # APP_KEY
   openssl rand -base64 24          # DB_PASSWORD
   openssl rand -hex 16             # CRON_TOKEN (use same value for STATIC_CRON_TOKEN)
   ```
3. Start the stack:
   ```bash
   docker compose up -d
   ```
4. Open http://localhost:8080, register your account (first user is admin), and create your asset accounts — **checking and savings only**. Do not add credit-card accounts (Ramsey rule: cash, debit, or cut up).
5. In Firefly UI → **Options → Profile → OAuth → Personal Access Tokens**, create a token.
   Paste it into `.env` as `FIREFLY_III_ACCESS_TOKEN`, then restart the importer:
   ```bash
   docker compose restart firefly_iii_importer
   ```

## Connecting your bank account(s)

The data importer supports three providers. Pick the one for your region.
**Only link checking and savings — skip credit cards on purpose.**

### U.S. — use SimpleFIN  *(recommended for U.S. users)*
- ~$15/year. Works with Chase, BofA, Wells Fargo, Capital One, USAA, Ally, most U.S. banks + credit unions.
- Sign up: https://beta.bridge.simplefin.org/
- Generate a Setup Token, paste it into `.env` as `SIMPLEFIN_TOKEN`.
- In the importer (http://localhost:8081), choose **SimpleFIN**, map **only your checking/savings accounts** to your Firefly accounts (leave any credit-card accounts unmapped), save the config as a JSON file, and re-run it later to fetch new transactions.

### EU / UK — use GoCardless (Nordigen)
- Free.
- Sign up: https://gocardless.com/bank-account-data/
- Create a Secret ID + Secret Key, paste into `.env` as `NORDIGEN_ID` / `NORDIGEN_KEY`.

### Anywhere — CSV / OFX import
- If your bank doesn't work with either provider, export CSV/OFX from your bank's site and import via the same UI. Save the mapping config — subsequent imports take one click.

## Recurring sync (set & forget)

Save your import config from the data importer UI, then add a cron entry on your host to run it on a schedule:

```bash
# Pull new transactions every morning at 6am
0 6 * * * docker run --rm \
  -v /path/to/configs:/import \
  --network firefly_default \
  -e FIREFLY_III_URL=http://firefly_iii_core:8080 \
  -e FIREFLY_III_ACCESS_TOKEN=YOUR_TOKEN \
  -e IMPORT_DIR_ALLOWLIST=/import \
  fireflyiii/data-importer:latest
```

## Set up budgets the Ramsey way

Firefly's "Budgets" feature does monthly envelope-style limits. Suggested layout:

| Budget | Notes |
|---|---|
| Giving | Ramsey teaches first 10% |
| Housing (rent/mortgage) | |
| Utilities | |
| Groceries | Cash-stuffed envelope candidate |
| Transportation / Gas | |
| Insurance | |
| Personal / Clothing | Cash envelope candidate |
| Recreation | Cash envelope candidate |
| Debt Snowball | One sub-tag per debt, smallest balance first |

Use **Piggy Banks** for the savings goals:

- `BS1 — $1,000 starter emergency fund`
- `BS3 — 3–6 months expenses`
- `BS3b — Sinking funds (car, Christmas, etc.)`
- `BS4 — Retirement (15%)` (off-budget tracking)
- `BS6 — Extra mortgage principal`

## Updating

```bash
docker compose pull && docker compose up -d
```

## Backups

The DB volume is `firefly_iii_db`. Back it up nightly:

```bash
docker exec firefly_iii_db sh -c \
  'exec mysqldump -ufirefly -p"$MYSQL_PASSWORD" firefly' \
  | gzip > firefly-$(date +%F).sql.gz
```

Keep these off-machine (S3, external drive, etc.) — they're your entire financial history.

## Troubleshooting

- **Importer can't reach core:** make sure both containers are on the same Compose network (they are by default in this file). The importer talks to `http://firefly_iii_core:8080` *inside* the Docker network, not `localhost`.
- **First login redirects to https:** set `APP_URL=http://localhost:8080` (no trailing slash) and `TRUSTED_PROXIES=**` in `.env`.
- **Cron never runs:** `CRON_TOKEN` must be exactly 32 alphanumeric chars and match `STATIC_CRON_TOKEN`.
