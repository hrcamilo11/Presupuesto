"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { TaxForm } from "./tax-form";

export function TaxesAddButton() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button onClick={() => setOpen(true)}>Agregar obligación</Button>
      <TaxForm open={open} onOpenChange={setOpen} editTax={null} />
    </>
  );
}
