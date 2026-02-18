export type IncomeType = "monthly" | "irregular" | "occasional";
export type ExpensePriority = "obligatory" | "necessary" | "optional";
export type SubscriptionFrequency = "monthly" | "yearly";
export type TaxPeriodType = "monthly" | "quarterly" | "yearly";
export type CategoryType = "income" | "expense";
export type FriendStatus = "pending" | "accepted" | "rejected";
export type CollectionStatus = "pending_approval" | "active" | "rejected" | "paid" | "cancelled";

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

export type NotificationType = "info" | "reminder" | "loan" | "shared" | "budget" | "alert";

export interface Notification {
  id: string;
  user_id: string;
  title: string;
  body: string | null;
  type: NotificationType;
  link: string | null;
  read_at: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
}

export interface NotificationPreferences {
  user_id: string;
  email_enabled: boolean;
  sms_enabled: boolean;
  push_enabled: boolean;
  created_at: string;
  updated_at: string;
}

export interface PushSubscriptionRow {
  id: string;
  user_id: string;
  endpoint: string;
  p256dh_key: string;
  auth_key: string;
  user_agent: string | null;
  created_at: string;
}

export interface Profile {
  id: string;
  full_name: string | null;
  username?: string | null;
  currency: string;
  timezone: string;
  phone?: string | null;
  dashboard_settings?: {
    show_summary_cards?: boolean;
    show_budget_summary?: boolean;
    show_accounts_preview?: boolean;
    show_savings_goals?: boolean;
    show_trend_chart?: boolean;
    show_pie_charts?: boolean;
    show_quick_access?: boolean;
    show_distribution_section?: boolean;
    show_debts_section?: boolean;
    sections_order?: string[];
  } | null;
  default_dashboard_context?: string;
  default_wallet_id?: string | null;
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
  tags?: Tag[];
};

export interface Budget {
  id: string;
  user_id: string;
  category_id: string;
  amount: number;
  period: string;
  shared_account_id?: string | null;
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
  tags?: Tag[];
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

export type WalletType = "cash" | "debit" | "credit" | "investment";

export type Wallet = {
  id: string;
  user_id: string;
  name: string;
  type: WalletType;
  currency: string;
  balance: number;
  color?: string | null;
  bank?: string | null;
  debit_card_brand?: string | null;
  last_four_digits?: string | null;
  // Campos opcionales para tarjetas / cuentas de crédito
  credit_mode?: "account" | "card" | null;
  card_brand?: string | null;
  cut_off_day?: number | null;
  payment_due_day?: number | null;
  credit_limit?: number | null;
  cash_advance_limit?: number | null;
  purchase_interest_rate?: number | null;
  cash_advance_interest_rate?: number | null;
  // Campos para inversión
  investment_yield_rate?: number | null;
  investment_term?: string | null;
  investment_start_date?: string | null;
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

export interface Tag {
  id: string;
  user_id: string;
  name: string;
  color: string;
  created_at: string;
}

export interface SharedSavingsGoal {
  id: string;
  shared_account_id: string;
  name: string;
  target_amount: number;
  current_amount: number;
  status: "active" | "completed" | "cancelled";
  deadline: string | null;
  created_at: string;
  updated_at: string;
}
export interface Friend {
  id: string;
  user_id: string;
  friend_id: string;
  status: FriendStatus;
  created_at: string;
  updated_at: string;
  profiles?: Profile; // Para joins
}

export interface Collection {
  id: string;
  creditor_id: string;
  debtor_id: string;
  amount: number;
  currency: string;
  description: string | null;
  status: CollectionStatus;
  created_at: string;
  updated_at: string;
  paid_at: string | null;
  creditor?: Profile;
  debtor?: Profile;
}
