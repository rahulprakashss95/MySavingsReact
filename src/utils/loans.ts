import moment from "moment";
import { AccountModel, LinkedAssetType, PaymentEntry } from "../models/AccountModel";
import { DATE_FORMAT } from "./deposits";

export type PaymentTotals = {
  total: number;
  paid: number;
  /** Never negative: overpaying shows as zero left, not a refund. */
  remaining: number;
  paidCount: number;
  entryCount: number;
  /** 0–1, for the progress bar. Zero when there is no total to divide by. */
  progress: number;
};

const sumOf = (entries: PaymentEntry[]) =>
  entries.reduce((total, entry) => total + (Number(entry.amount) || 0), 0);

/** A Loan's Schedule-mode totals — `remaining` is what `balance` is derived from. */
export const loanTotals = (loan: {
  principal: string;
  entries?: PaymentEntry[];
}): PaymentTotals => {
  const entries = loan.entries ?? [];
  const total = Number(loan.principal) || 0;
  const paidEntries = entries.filter((entry) => entry.paid);
  const paid = sumOf(paidEntries);

  return {
    total,
    paid,
    remaining: Math.max(total - paid, 0),
    paidCount: paidEntries.length,
    entryCount: entries.length,
    progress: total > 0 ? Math.min(paid / total, 1) : 0,
  };
};

/**
 * Dates are stored as DD-MMM-YYYY display strings, so they have to be parsed
 * before comparing — "02-Apr-2026" sorts before "01-Dec-2025" as plain text.
 * Undated entries sink to the bottom of their group.
 */
const dateValue = (date: string) => {
  const parsed = moment(date, DATE_FORMAT, true);
  return parsed.isValid() ? parsed.valueOf() : Number.POSITIVE_INFINITY;
};

/** Unpaid entries first, then by date — what you owe next, at the top. */
export const sortEntries = (entries: PaymentEntry[]) =>
  [...entries].sort((a, b) => {
    if (a.paid !== b.paid) {
      return a.paid ? 1 : -1;
    }
    return dateValue(a.date) - dateValue(b.date);
  });

/** Entries live inside the loan document, so ids are generated here. */
export const newEntryId = () =>
  `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;

/**
 * Bulk-creates a starting schedule for a known (or roughly known) monthly
 * amount — the convenience that replaces typing N entries by hand. Every row
 * is still just a normal entry afterward: free to edit, retitle, or delete,
 * which is how a fixed schedule doubles as a starting point for a variable one.
 */
export const generateMonthlySchedule = ({
  amount,
  months,
  startDate,
}: {
  amount: string;
  months: number;
  startDate: string;
}): PaymentEntry[] => {
  const start = moment(startDate, DATE_FORMAT, true);
  const count = Math.max(0, Math.floor(months) || 0);
  return Array.from({ length: count }, (_, index) => ({
    id: newEntryId(),
    label: `EMI ${index + 1}`,
    date: start.isValid()
      ? start.clone().add(index, "months").format(DATE_FORMAT)
      : "",
    amount,
    paid: false,
  }));
};

/** True once a loan needs no further attention — Simple or Schedule alike. */
export const isLoanSettled = (account: AccountModel): boolean => {
  if (account.loanTracking === "Schedule") {
    return loanTotals(account).remaining <= 0;
  }
  return account.paidBackStatus === "Full";
};

/**
 * Every Loan pointing at a given Property/Vehicle. The link is stored only on
 * the loan (`linkedAssetType`/`linkedAssetId`), so Property/Vehicle screens
 * reverse-look-up rather than following a pointer of their own — that's the
 * single source of truth for the relationship, see AccountModel's schema note.
 */
export const linkedLoansFor = (
  accounts: AccountModel[],
  assetType: LinkedAssetType,
  assetId: string
): AccountModel[] =>
  assetId
    ? accounts.filter(
        (account) =>
          account.accountType === "Borrowed" &&
          account.linkedAssetType === assetType &&
          account.linkedAssetId === assetId
      )
    : [];
