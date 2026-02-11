-- Extiende handle_new_user para crear categorías, tags y cuenta de efectivo por defecto al registrarse.

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- 1. Perfil (como antes)
  INSERT INTO public.profiles (id, full_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email));

  -- 2. Categorías por defecto (gastos e ingresos)
  INSERT INTO public.categories (user_id, name, icon, color, type) VALUES
    (NEW.id, 'Comida', 'Utensils', '#ef4444', 'expense'),
    (NEW.id, 'Transporte', 'Car', '#3b82f6', 'expense'),
    (NEW.id, 'Vivienda', 'Home', '#10b981', 'expense'),
    (NEW.id, 'Entretenimiento', 'Gamepad2', '#8b5cf6', 'expense'),
    (NEW.id, 'Salud', 'HeartPulse', '#f43f5e', 'expense'),
    (NEW.id, 'Otros', 'DashedIcon', '#64748b', 'expense'),
    (NEW.id, 'Salario', 'Banknote', '#22c55e', 'income'),
    (NEW.id, 'Ventas', 'ShoppingBag', '#eab308', 'income'),
    (NEW.id, 'Regalos', 'Gift', '#ec4899', 'income'),
    (NEW.id, 'Inversiones', 'TrendingUp', '#06b6d4', 'income');

  -- 3. Tags por defecto
  INSERT INTO public.tags (user_id, name, color) VALUES
    (NEW.id, 'Urgente', '#ef4444'),
    (NEW.id, 'Reembolsable', '#22c55e'),
    (NEW.id, 'Trabajo', '#3b82f6'),
    (NEW.id, 'Personal', '#8b5cf6'),
    (NEW.id, 'Hogar', '#f97316'),
    (NEW.id, 'Ocio', '#ec4899');

  -- 4. Cuenta de efectivo por defecto en cero
  INSERT INTO public.wallets (user_id, name, type, currency, balance)
  VALUES (NEW.id, 'Efectivo', 'cash', 'COP', 0);

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
