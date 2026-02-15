"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { IncomeForm } from "./income-form";
import type { SharedAccount, Wallet, Category } from "@/lib/database.types";

type Props = {
  sharedAccounts: SharedAccount[];
  wallets: Wallet[];
  categories: Category[];
};

export function IncomesAddButton({ sharedAccounts, wallets, categories }: Props) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button onClick={() => setOpen(true)}>Agregar ingreso</Button>
      <IncomeForm
        open={open}
        onOpenChange={setOpen}
        editIncome={null}
        sharedAccounts={sharedAccounts}
        wallets={wallets}
        categories={categories}
      />
    </>
  );
}
