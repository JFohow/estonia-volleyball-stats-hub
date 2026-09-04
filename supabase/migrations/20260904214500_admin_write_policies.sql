-- Allow authenticated admin users to write match import data.
-- Admin check is email-based from JWT claims.

CREATE OR REPLACE FUNCTION public.is_admin_email()
RETURNS boolean
LANGUAGE sql
STABLE
AS $$
  SELECT lower(coalesce(auth.jwt() ->> 'email', '')) IN (
    'karl_juhkami@hotmail.com',
    'mjuhkami@gmail.com'
  );
$$;

GRANT INSERT, UPDATE, DELETE ON public.matches TO authenticated;
GRANT INSERT, UPDATE, DELETE ON public.match_sets TO authenticated;
GRANT INSERT, UPDATE, DELETE ON public.appearances TO authenticated;
GRANT INSERT, UPDATE, DELETE ON public.player_match_stats TO authenticated;

GRANT USAGE, SELECT ON SEQUENCE public.matches_match_id_seq TO authenticated;
GRANT USAGE, SELECT ON SEQUENCE public.match_sets_match_set_id_seq TO authenticated;
GRANT USAGE, SELECT ON SEQUENCE public.appearances_appearance_id_seq TO authenticated;
GRANT USAGE, SELECT ON SEQUENCE public.player_match_stats_stat_id_seq TO authenticated;

CREATE POLICY "admin write matches"
ON public.matches
FOR ALL
TO authenticated
USING (public.is_admin_email())
WITH CHECK (public.is_admin_email());

CREATE POLICY "admin write match_sets"
ON public.match_sets
FOR ALL
TO authenticated
USING (public.is_admin_email())
WITH CHECK (public.is_admin_email());

CREATE POLICY "admin write appearances"
ON public.appearances
FOR ALL
TO authenticated
USING (public.is_admin_email())
WITH CHECK (public.is_admin_email());

CREATE POLICY "admin write player_match_stats"
ON public.player_match_stats
FOR ALL
TO authenticated
USING (public.is_admin_email())
WITH CHECK (public.is_admin_email());
