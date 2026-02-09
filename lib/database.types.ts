export type IncomeType = "monthly" | "irregular" | "occasional";
export type ExpensePriority = "obligatory" | "necessary" | "optional";

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
