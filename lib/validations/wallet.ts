```typescript
import { z } from "zod";

export const walletSchema = z.object({
    name: z.string().min(1, "El nombre es obligatorio"),
    type: z.enum(["cash", "debit", "credit", "savings", "investment"]),
    currency: z.string().min(3).max(3).default("COP"),
    balance: z.number().min(0, "El balance no puede ser negativo").optional(), // Balance can be set on creation
});

export type WalletSchema = z.infer<typeof walletSchema>;
```
