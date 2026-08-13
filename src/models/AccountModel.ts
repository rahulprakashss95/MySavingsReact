import type { Creatable, Owned, Portfolioed } from "./common";

/**
 * One record type for every place money sits — the balance layer of net worth.
 * A Fixed Deposit is just `accountType: "Fixed Deposit"`; normal money kept at a
 * bank/financier/institution ("Account Balance"), a recurring deposit, or cash
 * are the other types. This replaces the old standalone `fixed_deposits` table:
 * FD rows were migrated in as this type, so nothing about FDs is lost — they
 * simply became one kind of account.
 *
 * A bank, a finance company and any other institution are one category here:
 * each can hold both normal money and deposits, so the *money-kind* is what the
 * type distinguishes, not the institution. The list groups these types into
 * sections — Balances, Deposits, Cash in Hand and the two loan sections — via
 * `accountSection`.
 *
 * `balance` is the number net worth sums. For a balance or cash entry it's a
 * snapshot the user edits directly; for a loan it's derived on save from the
 * amount lent/borrowed and how much has come back (see the schema note). The
 * deposit-only fields (`principal`, interest, dates) stay blank for a balance
 * or cash and live in jsonb.
 *
 * "Lent" and "Borrowed" are the two directions money can be owed: owed *to* you
 * and owed *by* you. "Borrowed" reads as "Loan" in the UI — a bank loan and a
 * sum borrowed from a relative are the same record here, so one type covers
 * both. Rather than a hand-maintained outstanding figure, a loan records the
 * amount and a coarse repayment status (`paidBackStatus`/`paidBackAmount`),
 * and `balance` — what net worth actually sums — is derived from those on
 * save. "Borrowed" is the one type whose balance counts *against* net worth.
 * See `isLiability`; the stored number is always positive and the sign is
 * derived from the type, so nothing downstream can sum a negative into the
 * wrong place.
 */

export const ACCOUNT_TYPES = [
  "Account Balance",
  "Fixed Deposit",
  "Recurring Deposit",
  "Cash",
  "Lent",
  "Borrowed",
] as const;

export type AccountType = (typeof ACCOUNT_TYPES)[number];

/**
 * What each type is *called* in the UI, kept separate from the stored value so a
 * wording change never means migrating rows. "Cash" stores as before but reads
 * as "Cash in Hand" — the module it lives under is "Cash, Deposits & Dues", and
 * an umbrella sharing its name with one of its own tabs reads as a mistake.
 * "Borrowed" reads as "Loan": there is no separate loan type, because a bank
 * loan and money borrowed from a person are the same fields pointing the same
 * way, and "Loan" is the word people look for.
 */
const ACCOUNT_TYPE_LABELS: Record<AccountType, string> = {
  "Account Balance": "Account Balance",
  "Fixed Deposit": "Fixed Deposit",
  "Recurring Deposit": "Recurring Deposit",
  Cash: "Cash in Hand",
  Lent: "Lent Out",
  Borrowed: "Loan",
};

/** Display name for a stored type; unknown legacy types show as-is. */
export const accountTypeLabel = (accountType: string): string =>
  ACCOUNT_TYPE_LABELS[accountType as AccountType] ?? accountType;

/** The deposit-like types: they mature and carry interest. */
export const MATURING_ACCOUNT_TYPES: readonly string[] = [
  "Fixed Deposit",
  "Recurring Deposit",
];

/** True for account types whose maturity/interest fields are meaningful. */
export const isMaturingAccount = (accountType: string): boolean =>
  MATURING_ACCOUNT_TYPES.includes(accountType);

/** The lending types: they have a counterparty and a due date. */
export const LOAN_ACCOUNT_TYPES: readonly string[] = ["Lent", "Borrowed"];

/**
 * True for money lent out or borrowed. Deliberately separate from
 * `isMaturingAccount`: a loan reuses `maturityDate` for its due date, but none
 * of the deposit machinery (principal, interest payout, instalments) applies.
 */
export const isLoanAccount = (accountType: string): boolean =>
  LOAN_ACCOUNT_TYPES.includes(accountType);

/**
 * True for the one type whose balance is money *owed*, not held. Every place
 * that totals accounts must consult this: balances are stored positive
 * regardless of direction, so this is the only thing that carries the sign.
 */
export const isLiability = (accountType: string): boolean =>
  accountType === "Borrowed";

/**
 * How a Fixed Deposit pays its interest. Monthly/Quarterly pay a periodic
 * amount (derivable from principal × rate); "On Maturity" pays nothing until the
 * end, so its periodic interest is zero and the payout is the `maturityAmount`.
 */
export const INTEREST_FREQUENCIES = [
  "Monthly",
  "Quarterly",
  "On Maturity",
] as const;

export type InterestFrequency = (typeof INTEREST_FREQUENCIES)[number];

/** How much of a loan has come back. "Partial" pairs with `paidBackAmount`. */
export const PAID_BACK_STATUSES = ["None", "Partial", "Full"] as const;

export type PaidBackStatus = (typeof PAID_BACK_STATUSES)[number];

/**
 * How a Loan tracks repayment. "Simple" is the coarse `paidBackStatus`
 * toggle; "Schedule" is a list of dated entries (`entries`), covering a fixed
 * or variable EMI and milestone-based installments alike — the difference is
 * only in how the entries get there (generated vs added one at a time).
 */
export const LOAN_TRACKING_MODES = ["Simple", "Schedule"] as const;

export type LoanTracking = (typeof LOAN_TRACKING_MODES)[number];

/** One row in a Loan's Schedule-mode `entries` list. */
export type PaymentEntry = {
  /** Client-generated: these live inside the loan document, not their own. */
  id: string;
  /** Free label, e.g. "EMI 4" or "Floor finish". Optional. */
  label: string;
  /** Due date if unpaid, payment date once ticked. DATE_FORMAT. */
  date: string;
  amount: string;
  paid: boolean;
};

/** What kind of asset a Loan can be linked to. */
export const LINKED_ASSET_TYPES = ["Property", "Vehicle"] as const;

export type LinkedAssetType = (typeof LINKED_ASSET_TYPES)[number];

/** The groups the list and overview organise accounts into. */
export const ACCOUNT_SECTIONS = [
  "Balances",
  "Deposits",
  "Cash in Hand",
  "Lent Out",
  "Loans",
] as const;

export type AccountSection = (typeof ACCOUNT_SECTIONS)[number];

/**
 * Which section an account belongs to. Deposits mature; cash is cash; loans go
 * to their own two sections so an amount owed is never shown next to one held;
 * anything else is normal money held at an institution. Written to tolerate
 * legacy rows: the retired "Savings Account" and "Financier / Non-FD" types both
 * fall through to Balances, so old data groups correctly without a migration.
 */
export const accountSection = (accountType: string): AccountSection => {
  if (isMaturingAccount(accountType)) return "Deposits";
  if (accountType === "Cash") return "Cash in Hand";
  if (accountType === "Lent") return "Lent Out";
  if (accountType === "Borrowed") return "Loans";
  return "Balances";
};

/**
 * Map any stored type onto one of the current ACCOUNT_TYPES so the add/edit
 * form can highlight the right chip. Legacy balance types ("Savings Account",
 * "Financier / Non-FD") collapse to "Account Balance"; the rest already match.
 */
export const normalizeAccountType = (accountType: string): AccountType => {
  if ((ACCOUNT_TYPES as readonly string[]).includes(accountType)) {
    return accountType as AccountType;
  }
  return accountType === "Cash" ? "Cash" : "Account Balance";
};

export type AccountModel = Owned & Portfolioed & {
  id: string;
  /** One of ACCOUNT_TYPES; typed loosely so older rows still read. */
  accountType: string;
  /** What to call it, e.g. "HDFC Savings" or "Muthoot Deposit". */
  name: string;
  /**
   * The other party to this record — the bank a balance sits with, or the
   * person a loan is with. One directory serves both (`ledger_clients`, see
   * `LedgerClientModel`): asking which of two lists to look in was the whole
   * problem. Blank for cash, which has no counterparty.
   *
   * Stored in the `bank_id` column, which keeps its name: it is data, and
   * renaming it would cost a migration to say something the model already says.
   */
  contactId: string;
  /**
   * Free-text institution — a financier, or a bank not worth adding to the
   * directory. Shown when there is no `contactId`.
   */
  institution: string;
  /**
   * The current balance — the figure net worth sums. Hand-maintained for a
   * balance or cash entry; for a loan it's derived on save from `principal`
   * minus `paidBackAmount` (or zero once `paidBackStatus` is "Full").
   */
  balance: string;
  /** When `balance` was last set. DATE_FORMAT. */
  balanceAsOf: string;
  /**
   * Free-text note — the account number's last digits, where the passbook is
   * kept, what a loan was for. Applies to every type, so it isn't in any of the
   * type-specific blocks below. Stored in jsonb.
   */
  notes: string;

  // Deposit-only (Fixed / Recurring). Blank for an account balance, cash, etc.
  /** Amount originally deposited — also mirrored into `balance` for net worth. */
  principal: string;
  /** Periodic interest payout (per month/quarter). Zero for "On Maturity". */
  interest: string;
  interestPercentage: string;
  /** FD only: one of INTEREST_FREQUENCIES. Blank for RD/others. Stored in jsonb. */
  interestFrequency: string;
  /** FD "On Maturity" only: the amount received at maturity. Stored in jsonb. */
  maturityAmount: string;
  depositedDate: string;
  maturityDate: string;

  // Recurring Deposit only. An RD is tracked as N monthly instalments rather
  // than by maturity: `principal` is the per-month amount, and `payments`
  // records which instalments have been paid. All live in jsonb.
  /** When the RD started. DATE_FORMAT. */
  startDate: string;
  /** Tenure — the number of monthly instalments. Stored as a string. */
  months: string;
  /** Paid flag per instalment (index 0 = first month); length tracks `months`. */
  payments?: boolean[];

  // Lent / Borrowed reuse the deposit columns rather than adding new ones:
  // `principal` is the amount lent/borrowed, `depositedDate` is when the money
  // changed hands, `maturityDate` when it is due back (so the existing
  // `accounts_family_matures_idx` orders loans by due date for free), and
  // `interestPercentage` the rate where one was agreed. `balance` is then
  // derived from `principal` and the fields below rather than hand-edited.
  /** Loan only: one of PAID_BACK_STATUSES. Blank for other types. Stored in jsonb. */
  paidBackStatus: string;
  /** Loan only, when `paidBackStatus` is "Partial": how much has come back so far. */
  paidBackAmount: string;

  // Loan only. `loanTracking` picks which of the pair above (Simple) or the
  // pair below (Schedule) is live; the other is left stale rather than
  // cleared, so switching back and forth doesn't lose data. All in jsonb.
  /** One of LOAN_TRACKING_MODES. Blank/legacy reads as "Simple". */
  loanTracking: string;
  /** Schedule mode only: the dated entries the balance is derived from. */
  entries?: PaymentEntry[];

  // Loan only, either tracking mode. Points at the Property/Vehicle this loan
  // financed, if any — the loan is the only side that stores the pointer;
  // Property/Vehicle screens reverse-look-up loans that link to them.
  /** One of LINKED_ASSET_TYPES, or blank for no link. */
  linkedAssetType: string;
  linkedAssetId: string;
};

export type AccountInput = Creatable<AccountModel>;
