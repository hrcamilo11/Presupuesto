export type IncomeType = "monthly" | "irregular" | "occasional";
export type ExpensePriority = "obligatory" | "necessary" | "optional";
export type SubscriptionFrequency = "monthly" | "yearly";
export type TaxPeriodType = "monthly" | "quarterly" | "yearly";
export type CategoryType = "income" | "expense";

export interface Category {
  id: string;
  user_id: string;
  shared_account_id: string | null;
  name: string;
  icon: string;
  color: string;
  type: CategoryType;
  created_at: string;
  updated_at: string;
}

export interface Profile {
  id: string;
  full_name: string | null;
  currency: string;
  timezone: string;
  created_at: string;
  updated_at: string;
}

export interface SharedAccount {
  id: string;
  name: string;
  created_by: string;
  created_at: string;
  invite_code: string;
  member_count?: number;
  members?: {
    user_id: string;
    role: "owner" | "member";
    profiles: { full_name: string | null };
  }[];
}

export interface SharedAccountMember {
  id: string;
  shared_account_id: string;
  user_id: string;
  role: "owner" | "member";
  joined_at: string;
}

export interface SharedAccountInvite {
  id: string;
  shared_account_id: string;
  token: string;
  invited_by: string;
  expires_at: string;
  created_at: string;
}

export type Income = {
  id: string;
  user_id: string;
  shared_account_id?: string | null;
  wallet_id?: string | null;
  amount: number;
  currency: string;
  income_type: IncomeType;
  description?: string;
  date: string;
  category_id?: string | null;
  created_at: string;
};

export interface Budget {
  id: string;
  user_id: string;
  category_id: string;
  amount: number;
  period: string;
  created_at: string;
  updated_at: string;
}

export type Expense = {
  id: string;
  user_id: string;
  shared_account_id?: string | null;
  wallet_id?: string | null;
  amount: number;
  currency: string;
  expense_priority: ExpensePriority;
  description?: string | null;
  date: string;
  category_id?: string | null;
  created_at: string;
  subscription_id?: string | null;
  loan_payment_id?: string | null;
};

export interface Subscription {
  id: string;
  user_id: string;
  shared_account_id: string | null;
  name: string;
  amount: number;
  currency: string;
  frequency: SubscriptionFrequency;
  next_due_date: string;
  description: string | null;
  created_at: string;
  updated_at: string;
}

export interface Loan {
  id: string;
  user_id: string;
  shared_account_id: string | null;
  name: string;
  principal: number;
  annual_interest_rate: number;
  term_months: number;
  start_date: string;
  currency: string;
  description: string | null;
  created_at: string;
}

export interface LoanPayment {
  id: string;
  loan_id: string;
  payment_number: number;
  paid_at: string;
  amount: number;
  principal_portion: number;
  interest_portion: number;
  balance_after: number;
  created_at: string;
}

export interface TaxObligation {
  id: string;
  user_id: string;
  shared_account_id: string | null;
  name: string;
  amount: number;
  currency: string;
  period_type: TaxPeriodType;
  due_date: string;
  paid_at: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: Profile;
        Insert: Omit<Profile, "created_at" | "updated_at"> & {
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Omit<Profile, "id">>;
      };
      incomes: {
        Row: Income;
        Insert: Omit<Income, "id" | "created_at"> & { id?: string; created_at?: string };
        Update: Partial<Omit<Income, "id" | "user_id">>;
      };
      expenses: {
        Row: Expense;
        Insert: Omit<Expense, "id" | "created_at"> & { id?: string; created_at?: string };
        Update: Partial<Omit<Expense, "id" | "user_id">>;
      };
    };
  };
}

export const INCOME_TYPE_LABELS: Record<IncomeType, string> = {
  monthly: "Mensual",
  irregular: "Irregular",
  occasional: "Ocasional",
};

export const EXPENSE_PRIORITY_LABELS: Record<ExpensePriority, string> = {
  obligatory: "Obligatorio",
  necessary: "Necesario",
  optional: "Opcional",
};

export const SUBSCRIPTION_FREQUENCY_LABELS: Record<SubscriptionFrequency, string> = {
  monthly: "Mensual",
  yearly: "Anual",
};

export const TAX_PERIOD_LABELS: Record<TaxPeriodType, string> = {
  monthly: "Mensual",
  quarterly: "Trimestral",
  yearly: "Anual",
};

export type WalletType = "cash" | "debit" | "credit" | "savings" | "investment";

export type Wallet = {
  id: string;
  user_id: string;
  name: string;
  type: WalletType;
  currency: string;
  balance: number;
  created_at: string;
  updated_at: string;
};

export type SavingsGoalType = "emergency" | "purchase" | "travel" | "investment" | "other";

export type SavingsGoal = {
  id: string;
  user_id: string;
  shared_account_id?: string | null;
  name: string;
  target_amount: number;
  current_amount: number;
  target_date?: string | null;
  type: SavingsGoalType;
  color: string;
  icon: string;
  created_at: string;
  updated_at: string;
};

export type SavingsTransaction = {
  id: string;
  savings_goal_id: string;
  amount: number;
  type: "deposit" | "withdrawal";
  date: string;
  notes?: string | null;
  created_at: string;
};

export type WalletTransfer = {
  id: string;
  user_id: string;
  from_wallet_id: string;
  to_wallet_id: string;
  amount: number;
  description?: string | null;
  date: string;
  category_id?: string | null;
  created_at: string;
};

export type SavingsFrequency = "weekly" | "monthly";

export type SavingsPlan = {
  id: string;
  user_id: string;
  savings_goal_id: string;
  wallet_id: string;
  amount: number;
  frequency: SavingsFrequency;
  day_of_period: number;
  last_executed?: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};
