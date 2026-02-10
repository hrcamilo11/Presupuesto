-- Add user dashboard settings + defaults to profiles
-- This powers Settings > Perfil / Personalización and Dashboard defaults.

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS dashboard_settings jsonb NOT NULL DEFAULT jsonb_build_object(
    'show_summary_cards', true,
    'show_budget_summary', true,
    'show_accounts_preview', true,
    'show_savings_goals', true,
    'show_trend_chart', true,
    'show_pie_charts', true,
    'show_quick_access', true
  );

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS default_dashboard_context text NOT NULL DEFAULT 'global';

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS default_wallet_id uuid REFERENCES public.wallets(id) ON DELETE SET NULL;

