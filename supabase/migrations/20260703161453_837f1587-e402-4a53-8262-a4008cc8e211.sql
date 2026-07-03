
-- Enums
CREATE TYPE public.match_type AS ENUM ('VM', 'AM', 'MAM');
CREATE TYPE public.stats_version AS ENUM ('ALL', 'AM');

-- Players
CREATE TABLE public.players (
  player_id BIGSERIAL PRIMARY KEY,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  birth_date DATE,
  height_cm INTEGER,
  position TEXT,
  handedness TEXT,
  place_of_birth TEXT,
  birth_county TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.players TO anon, authenticated;
GRANT ALL ON public.players TO service_role;
ALTER TABLE public.players ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public read players" ON public.players FOR SELECT USING (true);

-- Matches
CREATE TABLE public.matches (
  match_id BIGSERIAL PRIMARY KEY,
  match_date DATE NOT NULL,
  opponent TEXT NOT NULL,
  competition TEXT,
  city TEXT,
  coach TEXT,
  estonia_sets INTEGER NOT NULL DEFAULT 0,
  opponent_sets INTEGER NOT NULL DEFAULT 0,
  match_type public.match_type NOT NULL,
  has_additional_sets BOOLEAN NOT NULL DEFAULT false,
  additional_sets_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX matches_date_idx ON public.matches (match_date DESC);
CREATE INDEX matches_opponent_idx ON public.matches (opponent);
GRANT SELECT ON public.matches TO anon, authenticated;
GRANT ALL ON public.matches TO service_role;
ALTER TABLE public.matches ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public read matches" ON public.matches FOR SELECT USING (true);

-- Match sets
CREATE TABLE public.match_sets (
  match_set_id BIGSERIAL PRIMARY KEY,
  match_id BIGINT NOT NULL REFERENCES public.matches(match_id) ON DELETE CASCADE,
  set_number INTEGER NOT NULL,
  estonia_points INTEGER NOT NULL,
  opponent_points INTEGER NOT NULL,
  UNIQUE (match_id, set_number)
);
CREATE INDEX match_sets_match_idx ON public.match_sets (match_id);
GRANT SELECT ON public.match_sets TO anon, authenticated;
GRANT ALL ON public.match_sets TO service_role;
ALTER TABLE public.match_sets ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public read match_sets" ON public.match_sets FOR SELECT USING (true);

-- Appearances
CREATE TABLE public.appearances (
  appearance_id BIGSERIAL PRIMARY KEY,
  player_id BIGINT NOT NULL REFERENCES public.players(player_id) ON DELETE CASCADE,
  match_id BIGINT NOT NULL REFERENCES public.matches(match_id) ON DELETE CASCADE,
  shirt_number INTEGER,
  player_position_in_match TEXT,
  captain BOOLEAN NOT NULL DEFAULT false,
  sets_started INTEGER NOT NULL DEFAULT 0,
  sets_played INTEGER NOT NULL DEFAULT 0,
  on_the_bench BOOLEAN NOT NULL DEFAULT false,
  UNIQUE (player_id, match_id)
);
CREATE INDEX appearances_player_idx ON public.appearances (player_id);
CREATE INDEX appearances_match_idx ON public.appearances (match_id);
GRANT SELECT ON public.appearances TO anon, authenticated;
GRANT ALL ON public.appearances TO service_role;
ALTER TABLE public.appearances ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public read appearances" ON public.appearances FOR SELECT USING (true);

-- Player match stats
CREATE TABLE public.player_match_stats (
  stat_id BIGSERIAL PRIMARY KEY,
  appearance_id BIGINT NOT NULL REFERENCES public.appearances(appearance_id) ON DELETE CASCADE,
  stats_version public.stats_version NOT NULL DEFAULT 'ALL',
  points INTEGER,
  break_points INTEGER,
  plus_minus INTEGER,
  serve_total INTEGER,
  serve_errors INTEGER,
  serve_aces INTEGER,
  reception_total INTEGER,
  reception_errors INTEGER,
  reception_positive_pct NUMERIC(5,2),
  reception_excellent_pct NUMERIC(5,2),
  attack_total INTEGER,
  attack_errors INTEGER,
  attack_blocked INTEGER,
  attack_kills INTEGER,
  attack_kill_pct NUMERIC(5,2),
  block_points INTEGER,
  attack_efficiency NUMERIC(5,2),
  UNIQUE (appearance_id, stats_version)
);
CREATE INDEX pms_appearance_idx ON public.player_match_stats (appearance_id);
GRANT SELECT ON public.player_match_stats TO anon, authenticated;
GRANT ALL ON public.player_match_stats TO service_role;
ALTER TABLE public.player_match_stats ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public read player_match_stats" ON public.player_match_stats FOR SELECT USING (true);
