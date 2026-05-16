# GitHub Finance Apps for a Dave Ramsey-Style Workflow

Dave Ramsey's core money rules map to a few specific app features:

- **Zero-based budgeting** — every dollar of income gets assigned a job before the month starts (income − allocations = 0).
- **Envelope system** — money is divided into category "envelopes" you can't overspend.
- **Debt snowball** — list debts smallest → largest, attack the smallest while paying minimums on the rest.
- **Baby Steps tracking** — emergency fund, debt payoff, retirement %, college, mortgage.
- **No bank-linking required** — Ramsey emphasizes manual entry so you *feel* the money leave.

Below are the strongest open-source options on GitHub, ranked by how closely they match this mentality.

## Top Recommendation: Actual Budget

- **Repo:** https://github.com/actualbudget/actual
- **Why it fits:** Pure zero-based / envelope budgeting (the "give every dollar a job" model Ramsey teaches). Local-first, free, self-hostable, active community.
- **Pros:** Mature, polished UI, mobile/web/desktop, optional bank sync (you can ignore it and enter manually like Ramsey suggests), strong import from YNAB.
- **Cons:** No built-in debt-snowball calculator — you'd track payoff via a category goal.
- **Companion projects:** `actual-ai` (auto-categorize), `actual-budget-app` (native iOS), `actual-http-api` (REST wrapper).

## Strong Alternative: BudgetZero

- **Repo:** https://github.com/budgetzero/budgetzero
- **Why it fits:** Explicitly built around **zero-based, envelope** budgeting. Self-hosted, offline-capable, cloud-sync optional.
- **Pros:** Smaller and simpler than Actual — closer in spirit to "envelope cash on the kitchen table". YNAB-style mental model baked in.
- **Cons:** Smaller community, fewer integrations.

## For Debt Snowball Specifically

- **DebtFree iOS app:** https://github.com/nimansu-fernando/debtfree-ios-app — Swift app explicitly implementing the snowball method (small project, but the algorithm/UI is a useful reference or starting point).
- Most budgeting apps above don't ship a snowball calculator, so you may want to pair the main budget app with a small snowball tracker — or fork one.

## Mint/YNAB-Style All-in-One

- **Firefly III:** https://github.com/firefly-iii/firefly-iii — 23k★, mature, PHP/Docker. Has budgets, bills, rules, piggy banks (good for emergency fund / baby step 1). More accountant-feeling than envelope-feeling.
- **Financial Freedom (serversideup):** https://github.com/serversideup/financial-freedom — Laravel/Vue, markets itself as a privacy-respecting Mint/YNAB alternative.

## My Recommendation for You

Start with **Actual Budget**, self-hosted via Docker. It's the closest to Ramsey's "every dollar" envelope mentality of any actively-maintained OSS app, and you can lay out categories matching the Baby Steps directly:

```
Baby Step 1 — $1,000 emergency fund   (category w/ goal)
Baby Step 2 — Debt snowball            (one category per debt, smallest first)
Baby Step 3 — 3–6 months expenses      (category w/ goal)
Baby Step 4 — Retirement 15%           (off-budget tracking account)
Baby Step 5 — Kids' college            (off-budget)
Baby Step 6 — Pay off house early      (extra-principal category)
Baby Step 7 — Give / build wealth      (giving category)
```

If you'd rather not host anything, the hosted version at actualbudget.org is also open source under the hood.

## Quick Start (Actual Budget via Docker)

```bash
docker run --pull=always -p 5006:5006 \
  -v ~/actual-data:/data \
  --name actual_server \
  actualbudget/actual-server:latest
```

Then open http://localhost:5006 and create your file. Don't link a bank — enter transactions manually for the first month so you actually *feel* the budget, which is the Ramsey way.
