"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { SubscriptionForm } from "./subscription-form";

export function SubscriptionsAddButton() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button onClick={() => setOpen(true)}>Agregar suscripción</Button>
      <SubscriptionForm open={open} onOpenChange={setOpen} editSubscription={null} />
    </>
  );
}
