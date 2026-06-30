-- Per-tournament payment tracking
alter table tournaments add column if not exists price numeric(10, 2);
alter table tournament_players add column if not exists paid boolean not null default false;
alter table tournament_players add column if not exists paid_at timestamptz;
alter table tournament_players add column if not exists amount_paid numeric(10, 2);
