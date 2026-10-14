-- Preserve the existing 10-digit integer range while allowing 0.0001 MON.
alter table public.expenses
  alter column amount type numeric(14, 4);
