"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ExpenseForm } from "./expense-form";
import type { SharedAccount, Wallet, Category } from "@/lib/database.types";

type Props = {
  sharedAccounts: SharedAccount[];
  wallets: Wallet[];
  categories: Category[];
};

export function ExpensesAddButton({ sharedAccounts, wallets, categories }: Props) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button onClick={() => setOpen(true)}>Agregar gasto</Button>
      <ExpenseForm
        open={open}
        onOpenChange={setOpen}
        editExpense={null}
        sharedAccounts={sharedAccounts}
        wallets={wallets}
        categories={categories}
      />
    </>
  );
}
