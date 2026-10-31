# Finance v3 — funds, loans, charity obligation, reports

Status: approved 2026-10-31. Phases 0–5 built, reviewed (Opus, max 2 rounds each) and committed. Date: 2026-10-31. Reviewed twice against the code (round 1: 20 findings, round 2: 9 findings — all folded in below).

## Objective

Make the money model match how the owner actually uses money:

- Loans (borrowed / lent) move account balances but are never income or expense.
- Money can belong to different **funds** (Me, Charity, Investment, …) while sitting in the same physical **accounts** (Vodafone, Cash, QNB…).
- 20% of net earnings is owed to charity; the app always knows owed / paid / remaining, and per income whether its share is covered.
- Income gets the same search and report depth as expenses, plus a real monthly statement.
- Fix the bugs that today make balances and saves unreliable.

## Settled decisions (from the interview)

| # | Decision |
|---|----------|
| D1 | Loans: a loan record with a person, direction (lent/borrowed), partial repayments, "Settle up"; People page. Never income/expense. Borrowed money spent on things → those purchases are normal expenses; repaying → not an expense. |
| D2 | Old loans in history are left alone (no conversion tool for now). |
| D3 | Charity base = **net** earnings: `rate × (eligible income − work costs)`, running total. Rate 20%. |
| D4 | Eligible income categories default: Salary, Freelance, Business, Bonus, Commission, Investment. Editable in settings. |
| D5 | Every expense has a "Work cost" switch; each expense category has a default for it (e.g. Transportation off, Work tools on). |
| D6 | Optional **project/client** label on any income or expense; per-project net report. Charity math stays the running total (D3). |
| D7 | Charity counts as **paid** when: money moves into the Charity fund from another fund, **or** a Donations expense is paid from a non-charity fund, **or** an income is marked "Already paid" (paid outside the app, not logged). Spending *from* the Charity fund never counts again — that money is already God's. |
| D8 | Paying before the income arrives creates **credit**; the next income is covered automatically, no extra transaction. |
| D9 | Tracking starts fresh on **2026-11-01** (optional one-time opening balance: owed or credit). |
| D10 | **Funds** are a second dimension on top of accounts: every amount has a place (account) and an owner (fund). A fund transfer changes the owner, not the place. Each fund can be shown/hidden; the main screen focuses on chosen fund(s), which makes a fund behave like its own book. Default focus: Me. All existing money starts in Me. |
| D11 | Net worth (default) = focused funds' balances + owed to you − you owe. |
| D12 | Privacy: eye toggle in the header blurs every amount (finance pages + dashboard widget); remembered. |
| D13 | Reports: income report at expense parity; monthly statement; charity ledger; net worth trend; per-project net. |
| D14 | Extras in scope: unified search + filters; edit + confirm + undo; faster quick-add. (Recurring items out of scope.) |
| D15 | UI picks: **A1** (home with fund tabs + place list + charity strip), **B2** (add income with charity step: costs / 20% / credit used, buttons Already paid · Pay now · Later), **B3** (people cards), **B4** (charity ledger cards). Income feed shows a per-income charity badge (paid / partly / not paid). |
| D16 | Phase 0 bug fixes come first. |

## Defaults I chose (confirm or change)

- Records without a `fundId` belong to **Me** — no rewrite of the 600+ existing records.
- An account's `initialBalance` belongs to Me.
- Per-income charity status is derived FIFO: payments and credit cover the oldest unpaid incomes first; "Already paid" covers its own income first.
- If cumulative work costs exceed earnings, owed shows 0 but the excess carries forward against future earnings.
- Charity fund is created automatically when charity tracking is enabled ("Charity", id `fund_charity`, hidden from main focus).
- "Donations" category is the default charity-payment category (created if missing; editable list in settings).
- Cloud sync gets delete tombstones so deleted records don't come back after a merge.
- Privacy toggle is stored per device (localStorage), not synced — someone next to you on another device is a different situation.
- Loan "forgive / write-off" is out of scope for v3 (later: forgiven lent → expense, forgiven borrowed → income).
- Mixed currencies stay as today (summed as-is); not in scope.

## Phases

Each phase ends green (typecheck, lint, its tests) and is its own commit.

### Phase 0 — Foundations and bug fixes

| Fix | Where | Notes |
|---|---|---|
| Atomic writes: functional updater applied to *latest* state | `src/context/AppContext.tsx` (add `updateModule(key, updater, { replace? })`), `src/hooks/useFinance.ts:438` `setData`, migration write `useFinance.ts:427` | `updateModule` normalises the module (defaults + migration) before calling the updater, so a cloud-loaded module missing new arrays can't throw. `replace: true` (import, reset) replaces the module instead of shallow-merging (`AppContext.tsx:127-149`), so an older backup doesn't keep today's funds/loans. Fixes category reorder losing writes (`FinanceV2.tsx:1075`), first budget save wiped (`:1413`), recurring effects racing (`useFinance.ts:581`, `:686`). |
| `Account.balance` becomes optional and unused (`finance.ts:17`); its only reader `FinanceWidget.tsx:28` is rewritten | `finance.ts`, `useFinance.ts:1035`, `:1209-1216`, `migration.ts:217` | |
| One balance source: pure `computeBalances(data, asOf?)` | new `src/utils/finance/balances.ts`; `calculateAccountBalance` delegates to it and keeps meaning "account total across all funds" for its 7+ callers (`TransferModal.tsx:99`, `PaymentModal.tsx:122`, `AccountList.tsx:36`, `FinanceHeader.tsx:37`, `FinanceV2.tsx:301`, …) | Installment double deduction: **never subtract `paidAmount`** — every real payment already creates an expense (all callers pass `expenseInfo`: `FinanceV2.tsx:958`, `FinanceInstallments.tsx:331`), and the only payments without one are synthetic "transferred from deleted installment" rows (`useFinance.ts:1316`) that move no cash. Refunds likewise only via their income (`:1531`). Stop writing the stored `account.balance` (`:1035`, `:1209-1216`). |
| Installment ↔ expense consistency | `useFinance.ts` installments (`:1247`, `:1350-1355`, `:1426-1441`), `InstallmentModal.tsx:324-330,464`, `FinanceV2.tsx:776-791`, `FinanceInstallments.tsx:303`, `TransactionRow` delete | Before the balance change lands: a check compares, per installment, `paidAmount` vs Σ linked expenses − Σ linked refund incomes, and diffs old vs new account totals on the owner's backup (the 2026-10-31 backup has 0 installments, so no change expected); any mismatch goes to the owner (e.g. an adjustment expense). The edit form stops sending `payments`, `categoryId`, `status`, `endDate`, `paidAmount`, `paidInstallments` (it currently wipes history). New installment expenses carry `linkedPaymentId`; add `deleteInstallmentPayment` (removes payment + its expense). Deleting an expense whose payment still exists is blocked with "Delete this payment from the installment"; if the installment/payment no longer exists, delete is allowed with a warning. |
| Pending income dates | `IncomeModal.tsx:104`, `FinanceV2.tsx:754` | Pending/expected incomes save no `actualDate`, and `actualDate` is ignored whenever status isn't received (existing pending rows carry the creation date). In the new edit flow, pending → received always sets `actualDate` (default today). All totals and the charity ledger use `actualDate`. |
| Recurring generator: deterministic ids, dedupe on latest state | `useFinance.ts:514`, `:524` | Generated occurrence id = `${templateId}_${date}`; the dedupe runs inside the `updateModule` updater, so two devices or two mounts can't create the same occurrence twice. |
| Migration on the write path only, fixed default ids | `useFinance.ts:413-427`, `migration.ts:11,151,292` | One `updateModule` on mount runs migration/normalisation; the read memo only fills missing arrays with empty defaults. Default account and categories get fixed ids, like `fund_me`. |
| Dashboard net worth uses derived balances, active accounts only | `src/components/finance/FinanceWidget.tsx:28` | |
| Cloud merge keeps every finance array and respects deletes | `src/services/StorageService.ts:529-551`, `:625-658`, `:735` | Merge all object-array keys of `finance` generically by id. Tombstones: `finance.deleted: {id, deletedAt}[]`, merged as a union keyed by id (not via `mergeArraysById` on strings); after merging, every array drops records whose tombstone is newer than the record's `updatedAt` — so an undo (which re-saves the record with a fresh `updatedAt`) wins over an older tombstone. Replace mode (import/reset) sets `finance.replacedAt`; a merge takes the side with the newer `replacedAt` wholesale instead of unioning. |
| Stop explicit field lists from stripping new fields | `src/utils/finance/migration.ts:220-244` (`migrateToV2` hard-coded shape, `transfers: []`), `:334-354`, export/import `useFinance.ts:2273-2321` | Spread the record / module, override only migrated fields. Delete unused `src/services/DataTransformer.ts` (hard-coded lists at `:134-170`). |
| Transfers: date passed through; edit, delete, undo | `FinanceV2.tsx:936-941`, `useFinance.ts:1197`; new `updateTransfer` / `deleteTransfer` | Also pass income `expectedDate` (`FinanceV2.tsx:745-758`). |
| Account delete checks transfers | `useFinance.ts:1069-1072` | Block delete if any transfer references it. |
| One income definition: only `received` counts in totals; pending shown as "Expected" | `FinanceReports.tsx:162`, `CashFlowChart.tsx:45`, `FinanceV2.tsx:226` → shared helper | |
| Edit income/expense, confirm delete, undo toast | `TransactionDrawer.tsx`, `TransactionRow.tsx:166`, `IncomeModal.tsx`, `ExpenseModal.tsx` (edit mode), wire `updateIncome`/`updateExpense` | Undo = restore the deleted record (and drop its tombstone) from a short-lived in-memory snapshot. |
| Extract pure aggregation helpers | new `src/utils/finance/aggregations.ts` (filter by range/type/fund, group by category/account/project, monthly series) | Used by reports, cash-flow chart, feed, stats — replaces 4 near-duplicate implementations. |

Tests: `balances.test.ts` (income/expense/transfer/installment cases, double-count regression, synthetic payment, refund, `asOf`), `aggregations.test.ts`, `updateModule` (two writes in one tick both survive; replace mode), `merge.test.ts` (tombstone removes record; undo after sync survives; newer `replacedAt` wins; recurring occurrence with same id not duplicated).

Commit: `fix(finance): atomic writes, single derived balance, safe cloud merge`.

### Phase 1 — Funds and privacy

Types (`src/types/modules/finance.ts`):

```ts
interface Fund { id; name; icon; color; kind: "personal" | "charity" | "custom"; isVisible: boolean; order: number; createdAt; updatedAt }
// FinanceData.funds: Fund[]; settings.focusedFundIds: string[]
// Income, Expense, Loan, LoanPayment: fundId?: string   (missing = Me)
// AccountTransfer gains fromFundId?, toFundId?           (missing = Me)
```

- `AccountTransfer` becomes the single "move money" record: change place, owner, or both. A fund transfer = same account, different fund.
- `computeBalances` returns balance per `(accountId, fundId)`; helpers `balanceOfAccount` (all funds — what `calculateAccountBalance` returns), `balanceOf(accountId, fundId)` (used by transfer/spend warnings), `balanceOfFund`, `focusedTotal`.
- "Me" fund (fixed id `fund_me`) is ensured in the read/normalise step, not in the first-run-only migration (`useFinance.ts:413-420` only runs when accounts or income categories are empty). Charity fund also gets a fixed id, `fund_charity`, so two devices can't create two.
- Fund delete is blocked while any record references the fund or its balance isn't zero. Me and Charity can't be deleted.
- Goals stay virtual (they never moved money and still don't); moving goals onto funds is a later step.
- UI: A1 — fund tabs (Me / Charity / Investment / All / manage), place list showing "focused of total", eye toggle. Fund picker in income/expense/transfer forms (default Me, hidden funds listed last under "Set aside"). Fund manager in Settings (create, rename, hide, reorder).
- Privacy (as built): `usePrivacyMode` (`src/hooks/usePrivacyMode.ts`, per-device localStorage) masks amounts as `••••` inside `useFinance`'s `formatCurrency` / `formatAmount` — one choke point, so every amount formatted through them is covered with no per-screen code. Later phases must format amounts through these (or `maskAmount` / the hook's `mask` for anything else, e.g. chart axis ticks). There is no `<Money>` blur component.
- Warn when a spend or transfer would make a fund's balance in that account negative (warning, not a block — transfers no longer block on insufficient balance either).
- Pure balance helpers in `balances.ts` take precomputed `FundBalances` (`fundBalanceIn`, `focusedAccountBalance`, `sumActiveAccounts`); `useFinance` only wires them. Empty `focusedFundIds` means All.

Tests: balances per fund; fund transfer moves owner not place.

Commit: `feat(finance): funds on top of accounts with focus and privacy mode`.

### Phase 2 — Loans and people

```ts
interface Person { id; name; notes?; createdAt; updatedAt }
interface Loan { id; personId; direction: "lent" | "borrowed"; amount; accountId; fundId?; date; dueDate?; notes?; createdAt; updatedAt }
interface LoanPayment { id; loanId; amount; accountId; fundId?; date; notes?; createdAt }
```

- Outstanding, status (open / partial / settled) derived — never stored.
- `computeBalances`: borrowed +, lent −, payments reverse.
- Loans and payments are excluded from income/expense, budgets, charity base.
- UI: B3 People page (`/finance/people`, route in `App.tsx`), person detail with loan history, "New loan" and "Settle up" (prefills the remainder, partial allowed). Loans appear in the feed with their own type and color.
- `deleteAccount` / delete fund / delete person checks include loans and loan payments.
- Net worth adds receivables − payables (D11).

Tests: `loans.test.ts` — partial repayment, overpayment blocked, deleting a payment restores outstanding, balance effects.

Commit: `feat(finance): loans and people, kept out of income and expense`.

### Phase 3 — Charity obligation, work costs, projects

```ts
// settings.charity
{ enabled: boolean; rate: number /*0.2*/; startDate: "2026-11-01"; fundId: string;
  eligibleIncomeCategoryIds: string[]; donationCategoryIds: string[];
  openingBalance: number /* + owed, − credit */ }
// ExpenseCategory.isWorkCostDefault?: boolean
// Expense.isWorkCost?: boolean
// Income.charityPaidOutsideAmount?: number  ("Already paid" — the amount shown in B2 at the time, stored, not recomputed)
// Income.projectId?, Expense.projectId?
interface Project { id; name; client?; status: "active" | "done"; createdAt; updatedAt }
```

- First step of the phase — category setup: when charity is enabled, create a "Donations" expense category if none exists; pre-select eligible income categories and donation categories **by name** (ids are random per install); deep-merge `settings.charity` defaults (the settings memo only merges one level, `useFinance.ts:409-412`). A donation category can't be marked as a work cost (one expense would both lower the base and count as paid).
- Pure `src/utils/finance/charity.ts` builds the ledger from data dated on/after `startDate` and returns `{ owed, paid, remaining /* <0 = credit */, monthly[], perIncome: Map<incomeId, {share, covered, status}> }`. Derived on read, so add/edit/delete/recurring income stay correct with no hooks. Rules:
  - Accrual: eligible income with status received, by `actualDate`, × rate. Installment refund incomes (`linkedInstallmentId` or tag `refund`) never accrue — the refund generator falls back to `incomeCategories[0]` (`useFinance.ts:1530-1534`), which may be Salary; Phase 3 also creates a "Refund" income category if missing and uses it there.
  - Reduction: expenses with `isWorkCost` × rate. Carry-forward: if cumulative reductions exceed accruals, owed shows 0 and the excess carries; `monthly[]` has a "carried" column so the months add up to `remaining`.
  - Payments: a transfer counts **+amount** when `toFundId` is Charity and `fromFundId` isn't; **−amount** when `fromFundId` is Charity and `toFundId` isn't (taking money back un-pays it); Charity→Charity (place change only) counts 0. Donations-category expenses from non-charity funds count +amount. Spending from the Charity fund counts 0.
  - "Already paid": `charityPaidOutsideAmount` is earmarked to its own income first (covers that income, up to its share), then any excess joins the credit pool. Editing the income amount doesn't change what was paid.
  - Per-income status: remaining credit pool (payments + opening credit) covers the oldest unpaid incomes first (FIFO).
  - Transfers into Charity dated before `startDate` are ignored (the opening balance covers history).
- Recurring generator (`useFinance.ts:524` copies the template with `...income`) must strip `charityPaidOutsideAmount` from generated copies.
- Guards: `settings.charity.fundId` is locked once any payment exists. When an income has `charityPaidOutsideAmount` and a Donations expense from a non-charity fund falls in the same week, show a hint "This may already be counted as paid".
- UI: B2 charity step in the income form (work costs on the project, 20% of net, credit used, buttons Already paid · Pay now · Later; "Pay now" creates a fund transfer Me → Charity in the same account). Charity strip on home (A1). Per-income badge in the feed. Work-cost switch in the expense form, default from category. Project picker on income/expense; project manager.
- Settings: enable, rate, start date, eligible categories, donation categories, opening balance.

Tests: `charity.test.ts` — net base, credit before income (D8), Already paid earmarking + edit of amount, Charity→Me un-pays, Charity→Charity ignored, charity-fund spending not counted twice, costs carry-forward and monthly sum, pending income received after start date accrues, recurring copy doesn't inherit Already paid, start date respected.

Commit: `feat(finance): 20% charity obligation on net earnings with ledger`.

### Phase 4 — Reports

On `FinanceReports.tsx`, built on `aggregations.ts`:

- Income tab at parity with expenses: by category, by project, monthly trend, top sources, drill-down list.
- Monthly statement: opening → + income by category → − expenses by category = net; loans in/out and transfers listed separately; closing reconciles with balances (`computeBalances(asOf)`). Compare with previous month.
- Charity ledger (B4 cards + monthly table + running balance).
- Net worth trend (month-end snapshots computed from history) and project report (paid, costs, net, charity share).
- Replace the `Math.random()` forecast (`FinanceReports.tsx:376`) with an average-based one.
- Delete dead `ReportsModal.tsx`.

Commit: `feat(finance): income, statement, charity and net worth reports`.

### Phase 5 — Search and quick-add

- Unified search in the feed: text (title, notes, person, project), type (income / expense / transfer / loan), account, fund, category, project, amount range, date range, work-cost only; live total + count. Fix account filter missing incoming transfers (`TransactionFeed.tsx:50`).
- Quick-add: one button, tabs Expense · Income · Transfer · Loan, amount first, last-used account and fund remembered, recent categories first.

Commit: `feat(finance): unified search and quick-add`.

## Reuse

- Modals reuse `BottomSheet`, `GlassCard`, `SmartDatePicker`; People cards reuse `GoalsGrid` layout patterns.
- `TransferModal` is extended for fund transfers instead of a new modal.
- All money math lives in `src/utils/finance/*` pure modules; `useFinance` only wires them to state.

## Schema / data safety

- All changes are additive optional fields + new arrays; existing backups load unchanged (missing `fundId` = Me).
- Storage version stays `2.x`; normalisation adds `funds` with "Me", `deletedIds: []` and default `settings.charity` (disabled until the owner enables it).
- Export/import and cloud merge include every new array (Phase 0 makes this generic); import replaces the module rather than merging.
- Known limit: cloud merge stays union-by-id plus tombstones — no per-field conflict resolution.

## Risks

- `useFinance.ts` is 2420 lines; this plan adds to it only thin wiring. Splitting it fully is out of scope.
- Every amount display changes for privacy mode — broad but mechanical.
- Fund balances per account can go negative if the owner spends Charity money from the "wrong" fund; mitigated by warning + fund picker default.

## Proposed user-facing copy (English UI)

| Where | Text |
|---|---|
| Fund tabs | Me · Charity · Investment · All |
| Place row | "3,089 of 3,589" |
| Charity strip | "Charity: 1,500 of 2,000 paid · 500 left · Pay" |
| Income form | "Charity 20% of net" · "Work costs on this project" · "Credit used" · buttons "Already paid", "Pay 3,500 now", "Later" |
| Income badge | "Charity paid" · "Partly paid 500/1,000" · "Not paid 3,500" |
| Expense form | "Work cost" switch, helper "Lowers the charity you owe" |
| People | "You owe 610" · "Owes you 3,000" · "Settle up" · "New loan" |
| Loan hint | "Loans never count as income or expense." |
| Privacy | eye button, tooltip "Hide amounts" / "Show amounts" |
| Delete | "Delete this expense?" · toast "Expense deleted · Undo" |

## How it's verified

- `npx tsc -b` (the typecheck step of `npm run build`), `npm run lint`.
- `npm run test:run` for the new tests: `src/utils/finance/{balances,aggregations,loans,charity}.test.ts`.
- Manual pass in the browser with the owner's backup imported into a local dev instance (never the real data store).
