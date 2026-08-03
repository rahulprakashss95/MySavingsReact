import moment from "moment";
import { LedgerClientModel } from "../models/LedgerModel";
import {
  AccountModel,
  ACCOUNT_SECTIONS,
  accountSection,
  isLiability,
  isMaturingAccount,
} from "../models/AccountModel";

export const DATE_FORMAT = "DD-MMM-YYYY";

/**
 * `maturityDate` is either "" (none set) or DD-MMM-YYYY: it comes from a real
 * `date` column via `dateToApp` in `database/query.ts`, which can't produce
 * anything else. The old "0"/0 shapes were Firestore-era and are gone.
 */
export const parseMaturity = (maturityDate: string) => {
  if (!maturityDate) {
    return null;
  }
  const parsed = moment(maturityDate, DATE_FORMAT, true);
  return parsed.isValid() ? parsed : null;
};

/**
 * The other party to an account, for display: the directory name for its
 * `contactId` — a bank for a balance, a person for a loan, one list either way —
 * else the free-text `institution` carried by older rows, else a dash.
 *
 * Resolving the name here rather than storing it means renaming a contact
 * updates every account at once, and a deleted one reads as its institution or
 * "—" rather than a stale name.
 */
export const accountInstitution = (
  account: AccountModel,
  contacts: LedgerClientModel[]
): string => {
  const contact = (contacts ?? []).find((c) => c.id === account.contactId);
  return contact?.name || account.institution || "—";
};

/**
 * Soonest maturity first; items with no maturity date sort to the end.
 * Partitioning first avoids comparing against unparseable dates. Generic so it
 * serves both the account list and any maturity-ordered view.
 */
export const sortByMaturity = <T extends { maturityDate: string }>(
  items: T[]
): T[] => {
  const dated: T[] = [];
  const undated: T[] = [];

  for (const item of items) {
    (parseMaturity(item.maturityDate) ? dated : undated).push(item);
  }

  dated.sort(
    (a, b) =>
      parseMaturity(a.maturityDate)!.valueOf() -
      parseMaturity(b.maturityDate)!.valueOf()
  );

  return [...dated, ...undated];
};

/* ------------------------------------------------------------------ *
 * Recurring Deposits
 *
 * An RD is a fixed monthly instalment paid over a set number of months. We
 * track it as a schedule of instalments the user marks paid one by one; the
 * balance net worth counts is the total paid so far.
 * ------------------------------------------------------------------ */

export type RdInstalment = {
  index: number;
  /** Due date (start + index months), DATE_FORMAT, or "" if no start set. */
  due: string;
  amount: number;
  paid: boolean;
};

/** The per-month instalment amount (`principal` doubles as this for RDs). */
export const rdMonthly = (account: AccountModel): number =>
  Number(account.principal) || 0;

/** Tenure in months, clamped to a non-negative integer. */
export const rdMonthCount = (account: AccountModel): number =>
  Math.max(0, Math.floor(Number(account.months) || 0));

/** How many instalments are marked paid. */
export const rdPaidCount = (account: AccountModel): number =>
  (account.payments ?? []).filter(Boolean).length;

/** Total paid so far — the figure net worth counts for an RD. */
export const rdPaidTotal = (account: AccountModel): number =>
  rdPaidCount(account) * rdMonthly(account);

/** The full instalment schedule, one row per month. */
export const rdSchedule = (account: AccountModel): RdInstalment[] => {
  const count = rdMonthCount(account);
  const amount = rdMonthly(account);
  const start = moment(account.startDate, DATE_FORMAT, true);
  const paid = account.payments ?? [];
  return Array.from({ length: count }, (_, index) => ({
    index,
    due: start.isValid()
      ? start.clone().add(index, "months").format(DATE_FORMAT)
      : "",
    amount,
    paid: !!paid[index],
  }));
};

/**
 * A fresh `payments` array with instalment `index` set to `paid`, sized to the
 * current tenure (padding/truncating any stale array). Callers persist this
 * alongside a recomputed balance.
 */
export const rdWithPayment = (
  account: AccountModel,
  index: number,
  paid: boolean
): boolean[] => {
  const count = rdMonthCount(account);
  const existing = account.payments ?? [];
  const next = Array.from({ length: count }, (_, i) => !!existing[i]);
  if (index >= 0 && index < count) {
    next[index] = paid;
  }
  return next;
};

/* ------------------------------------------------------------------ *
 * Deposit interest
 *
 * A deposit's `interest` field is a *per-payout* amount, and the payout period
 * differs per account — ₹3,000 on a quarterly FD and ₹3,000 on a monthly one are
 * four times apart in what they actually earn. Nothing may sum that field
 * directly. Everything annualises through `depositInterest` first, which is the
 * one place that knows how each frequency converts.
 * ------------------------------------------------------------------ */

/**
 * Payouts a year for an FD's frequency. "On Maturity" pays nothing along the
 * way, so it has no payout period at all — zero, not one. A blank frequency is a
 * legacy row from before the field existed and reads as Monthly, matching the
 * form's own default.
 */
export const payoutsPerYear = (interestFrequency: string): number => {
  if (interestFrequency === "Quarterly") return 4;
  if (interestFrequency === "On Maturity") return 0;
  return 12;
};

/** The word for one payout period, for labels like "Interest per quarter". */
export const payoutPeriodWord = (interestFrequency: string): string =>
  interestFrequency === "Quarterly" ? "quarter" : "month";

/** Term between two DATE_FORMAT dates, in years. Zero when it can't be read. */
const yearsBetween = (from: string, to: string): number => {
  const start = moment(from, DATE_FORMAT, true);
  const end = moment(to, DATE_FORMAT, true);
  if (!start.isValid() || !end.isValid()) {
    return 0;
  }
  // A maturity date before the deposit date is bad data, not a negative term.
  return Math.max(end.diff(start, "months", true) / 12, 0);
};

export type DepositInterest = {
  /** The amount landing each payout, as entered. Zero for "On Maturity". */
  perPayout: number;
  /** How many times a year `perPayout` lands. Zero for "On Maturity". */
  payouts: number;
  /** Annualised — the only interest figure that may be summed across accounts. */
  perYear: number;
  /** `perYear / 12`. A monthly reading of the same annual figure. */
  perMonth: number;
  /** Interest over the whole term, where both dates are known; else zero. */
  overTerm: number;
  /** True when the figure was derived from the rate rather than entered amounts. */
  estimated: boolean;
};

const NO_INTEREST: DepositInterest = {
  perPayout: 0,
  payouts: 0,
  perYear: 0,
  perMonth: 0,
  overTerm: 0,
  estimated: false,
};

/**
 * One deposit's interest, resolved into comparable figures.
 *
 * Only a Fixed Deposit carries interest data: the form clears
 * `interestPercentage` for a Recurring Deposit, so an RD stores no rate at all
 * and there is nothing to annualise. Reporting zero for it is honest — inventing
 * a rate would not be.
 */
export const depositInterest = (account: AccountModel): DepositInterest => {
  if (account.accountType !== "Fixed Deposit") {
    return NO_INTEREST;
  }

  const principal = Number(account.principal) || 0;
  const rate = Number(account.interestPercentage) || 0;
  // The fallback whenever no amount was entered: simple interest at the rate,
  // which is exactly what the form's Calculate button divides into payouts.
  const fromRate = (principal * rate) / 100;
  const years = yearsBetween(account.depositedDate, account.maturityDate);
  const payouts = payoutsPerYear(account.interestFrequency);

  if (payouts === 0) {
    // Paid in full at the end. The maturity amount is the agreed figure, so its
    // gain over the principal is the real total interest; spreading it across
    // the term makes it comparable with a deposit that pays as it goes.
    const gain = (Number(account.maturityAmount) || 0) - principal;
    if (gain > 0) {
      const perYear = years > 0 ? gain / years : gain;
      return {
        perPayout: 0,
        payouts: 0,
        perYear,
        perMonth: perYear / 12,
        overTerm: gain,
        // Without both dates the gain can't be spread, so it stands in for a
        // year — right for a one-year deposit and a guess for anything else.
        estimated: years <= 0,
      };
    }
    return {
      perPayout: 0,
      payouts: 0,
      perYear: fromRate,
      perMonth: fromRate / 12,
      overTerm: fromRate * years,
      estimated: true,
    };
  }

  const entered = Number(account.interest) || 0;
  const perYear = entered > 0 ? entered * payouts : fromRate;

  return {
    perPayout: entered > 0 ? entered : perYear / payouts,
    payouts,
    perYear,
    perMonth: perYear / 12,
    overTerm: perYear * years,
    estimated: entered <= 0,
  };
};

/**
 * The per-payout amount for a principal at a rate — what Calculate fills in.
 * Returns 0 for "On Maturity", which has no periodic payout to compute.
 */
export const payoutFromRate = (
  principal: number,
  ratePercent: number,
  interestFrequency: string
): number => {
  const payouts = payoutsPerYear(interestFrequency);
  if (payouts === 0) {
    return 0;
  }
  return Math.round((principal * ratePercent) / 100 / payouts);
};

export type LabelledTotal = { label: string; value: number };

export type AccountTotals = {
  /**
   * `assets - liabilities` — the net figure net worth counts. Named `balance`
   * because that is what it was before borrowing existed and every consumer
   * wants the net number; for the gross figure use `assets`.
   */
  balance: number;
  /** Everything held or owed *to* you: balances, deposits, cash, money lent. */
  assets: number;
  /** Money owed by you, as a positive magnitude. */
  liabilities: number;
  /**
   * Interest across the deposits, annualised. Per-payout amounts are *not*
   * summable — a quarterly ₹3,000 and a monthly ₹3,000 are four times apart —
   * so every account converts through `depositInterest` before landing here.
   */
  interestPerYear: number;
  /** `interestPerYear / 12`. A monthly reading, not a sum of monthly payouts. */
  interestPerMonth: number;
  /** Total sitting in deposits: an FD's principal, an RD's instalments paid. */
  depositValue: number;
  /** `interestPerYear` over the deposits actually earning it, 0–1. */
  effectiveYield: number;
  /** True when any deposit's annual figure was derived rather than entered. */
  interestEstimated: boolean;
  /** Deposits carrying no interest data — every RD, plus any FD missing a rate. */
  depositsWithoutInterest: number;
  accountCount: number;
  /** Largest single asset balance; liabilities are not candidates. */
  largest: number;
  /**
   * Balance grouped by section for the overview. Values stay positive in every
   * section — a "Borrowed ₹50,000" row means you owe fifty thousand, and the
   * section name is what says which way it points.
   */
  balanceBySection: LabelledTotal[];
};

/** Roll a list of accounts up into the totals the Assets overview shows. */
export const buildAccountTotals = (accounts: AccountModel[]): AccountTotals => {
  const bySection: Record<string, number> = {};
  let assets = 0;
  let liabilities = 0;
  let interestPerYear = 0;
  let depositValue = 0;
  // Only the deposits actually earning something back the yield — an RD, which
  // stores no rate, would otherwise drag the percentage down as dead weight.
  let earningValue = 0;
  let depositsWithoutInterest = 0;
  let interestEstimated = false;
  let largest = 0;

  for (const account of accounts) {
    const value = Number(account.balance) || 0;
    // Balances are stored positive whichever way they point; the type decides
    // which side of the sheet the number lands on.
    if (isLiability(account.accountType)) {
      liabilities += value;
    } else {
      assets += value;
      largest = Math.max(largest, value);
    }
    if (isMaturingAccount(account.accountType)) {
      depositValue += value;
      const detail = depositInterest(account);
      interestPerYear += detail.perYear;
      if (detail.perYear > 0) {
        earningValue += value;
        interestEstimated = interestEstimated || detail.estimated;
      } else {
        depositsWithoutInterest += 1;
      }
    }
    const section = accountSection(account.accountType);
    bySection[section] = (bySection[section] ?? 0) + value;
  }

  return {
    balance: assets - liabilities,
    assets,
    liabilities,
    interestPerYear,
    interestPerMonth: interestPerYear / 12,
    depositValue,
    effectiveYield: earningValue > 0 ? interestPerYear / earningValue : 0,
    interestEstimated,
    depositsWithoutInterest,
    accountCount: accounts.length,
    largest,
    // Fixed section order, empty sections dropped.
    balanceBySection: ACCOUNT_SECTIONS.filter(
      (section) => bySection[section] !== undefined
    ).map((section) => ({ label: section, value: bySection[section] })),
  };
};
