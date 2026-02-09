"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { LoanForm } from "./loan-form";

export function LoansAddButton() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button onClick={() => setOpen(true)}>Agregar préstamo</Button>
      <LoanForm open={open} onOpenChange={setOpen} editLoan={null} />
    </>
  );
}
