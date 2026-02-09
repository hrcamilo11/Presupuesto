export type IncomeType = "monthly" | "irregular" | "occasional";
export type ExpensePriority = "obligatory" | "necessary" | "optional";
export type SubscriptionFrequency = "monthly" | "yearly";
export type TaxPeriodType = "monthly" | "quarterly" | "yearly";

export interface Profile {
  id: string;
  full_name: string | null;
  currency: string;
  timezone: string;
  created_at: string;
  updated_at: string;
}

export interface Income {
  id: string;
  user_id: string;
  amount: number;
  currency: string;
  income_type: IncomeType;
  description: string | null;
  date: string;
  created_at: string;
}

export interface Expense {
  id: string;
  user_id: string;
  amount: number;
  currency: string;
  expense_priority: ExpensePriority;
  description: string | null;
  date: string;
  created_at: string;
  subscription_id?: string | null;
  loan_payment_id?: string | null;
}

export interface Subscription {
  id: string;
  user_id: string;
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
