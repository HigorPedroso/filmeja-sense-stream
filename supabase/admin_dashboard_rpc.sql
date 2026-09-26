-- SuperDashboard data source. Run once in the Supabase SQL Editor (project
-- yynlzhfibeozrwrtrjbs).
--
-- The dashboard used to query tables directly from the browser (blocked by RLS
-- for other users' rows, and half the tables/columns it named don't exist) or
-- invent its numbers. These SECURITY DEFINER functions aggregate the real data
-- server-side and only answer to the admin e-mail, so the check is enforced in
-- the database and not just in the React route.

create or replace function public.admin_dashboard_metrics(p_from timestamptz, p_to timestamptz)
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  tz constant text := 'America/Sao_Paulo';
  result jsonb;
begin
  if coalesce(auth.jwt() ->> 'email', '') <> 'higor533@gmail.com' then
    raise exception 'forbidden' using errcode = '42501';
  end if;

  -- Keep the daily series bounded no matter what range the UI sends.
  if p_to - p_from > interval '400 days' then
    p_from := p_to - interval '400 days';
  end if;

  select jsonb_build_object(
    'users', jsonb_build_object(
      'total',   (select count(*) from profiles),
      'new',     (select count(*) from profiles where created_at between p_from and p_to),
      'premium', (select count(*) from profiles where is_premium),
      'active',  (select count(distinct user_id) from user_events where created_at between p_from and p_to),
      'dau',     (select count(distinct user_id) from user_events where created_at > now() - interval '1 day'),
      'wau',     (select count(distinct user_id) from user_events where created_at > now() - interval '7 days'),
      'mau',     (select count(distinct user_id) from user_events where created_at > now() - interval '30 days')
    ),

    'languages', (
      select coalesce(jsonb_agg(jsonb_build_object('name', language, 'value', n) order by n desc), '[]'::jsonb)
      from (select language, count(*) n from profiles group by language) l
    ),

    'devices', (
      select coalesce(jsonb_agg(jsonb_build_object('name', platform, 'value', n) order by n desc), '[]'::jsonb)
      from (select coalesce(platform, 'desconhecido') platform, count(distinct user_id) n
            from device_push_tokens group by 1) d
    ),

    'daily', (
      select coalesce(jsonb_agg(row_to_json(d) order by d.date), '[]'::jsonb)
      from (
        select
          to_char(g.day, 'YYYY-MM-DD') as date,
          (select count(*) from profiles p
            where (p.created_at at time zone tz)::date = g.day) as signups,
          (select count(distinct e.user_id) from user_events e
            where (e.created_at at time zone tz)::date = g.day) as active_users,
          (select count(*) from user_events e
            where e.event_type = 'recommendation_generated'
              and (e.created_at at time zone tz)::date = g.day) as recommendations,
          (select count(*) from user_events e
            where e.event_type = 'title_viewed'
              and (e.created_at at time zone tz)::date = g.day) as views
        from generate_series(
          (p_from at time zone tz)::date,
          (p_to at time zone tz)::date,
          interval '1 day'
        ) as gs(d)
        cross join lateral (select gs.d::date as day) g
      ) d
    ),

    'recommendations', jsonb_build_object(
      'total', (select count(*) from user_events
                 where event_type = 'recommendation_generated' and created_at between p_from and p_to),
      'users', (select count(distinct user_id) from user_events
                 where event_type = 'recommendation_generated' and created_at between p_from and p_to),
      'by_source', (
        select coalesce(jsonb_agg(jsonb_build_object('name', src, 'value', n) order by n desc), '[]'::jsonb)
        from (select coalesce(metadata->>'source', 'desconhecido') src, count(*) n
              from user_events
              where event_type = 'recommendation_generated' and created_at between p_from and p_to
              group by 1) s
      ),
      'top_titles', (
        select coalesce(jsonb_agg(jsonb_build_object('name', t, 'value', n) order by n desc), '[]'::jsonb)
        from (select metadata->>'title' t, count(*) n
              from user_events
              where event_type = 'recommendation_generated'
                and metadata->>'title' is not null
                and created_at between p_from and p_to
              group by 1 order by 2 desc limit 10) t
      ),
      'top_genres', (
        select coalesce(jsonb_agg(jsonb_build_object('name', g, 'value', n) order by n desc), '[]'::jsonb)
        from (select metadata->>'genreName' g, count(*) n
              from user_events
              where event_type = 'genre_selected'
                and metadata->>'genreName' is not null
                and created_at between p_from and p_to
              group by 1 order by 2 desc limit 8) g
      ),
      'top_moods', (
        select coalesce(jsonb_agg(jsonb_build_object('name', m, 'value', n) order by n desc), '[]'::jsonb)
        from (select metadata->>'moodName' m, count(*) n
              from user_events
              where event_type = 'mood_selected'
                and metadata->>'moodName' is not null
                and created_at between p_from and p_to
              group by 1 order by 2 desc limit 8) m
      )
    ),

    'engagement', jsonb_build_object(
      'views',    (select count(*) from user_events where event_type = 'title_viewed'  and created_at between p_from and p_to),
      'likes',    (select count(*) from user_events where event_type = 'title_liked'   and created_at between p_from and p_to),
      'dislikes', (select count(*) from user_events where event_type = 'title_disliked' and created_at between p_from and p_to),
      'saves',    (select count(*) from user_events where event_type = 'title_saved'   and created_at between p_from and p_to),
      'provider_clicks', (select count(*) from user_events
                           where event_type = 'streaming_provider_clicked' and created_at between p_from and p_to),
      'watched',  (select count(*) from watched_content where created_at between p_from and p_to),
      'providers', (
        select coalesce(jsonb_agg(jsonb_build_object('name', p, 'value', n) order by n desc), '[]'::jsonb)
        from (select metadata->>'provider' p, count(*) n
              from user_events
              where event_type = 'streaming_provider_clicked'
                and metadata->>'provider' is not null
                and created_at between p_from and p_to
              group by 1 order by 2 desc limit 8) p
      )
    ),

    -- Of the users who signed up in the range (and have had at least 7 days),
    -- how many came back between day 1 and day 7 after signing up.
    'retention', (
      select jsonb_build_object('eligible', count(*), 'returned', count(*) filter (where returned))
      from (
        select p.id,
          exists (
            select 1 from user_events e
            where e.user_id = p.id
              and e.created_at >= p.created_at + interval '1 day'
              and e.created_at <  p.created_at + interval '8 days'
          ) as returned
        from profiles p
        where p.created_at between p_from and p_to
          and p.created_at < now() - interval '7 days'
      ) r
    ),

    -- All-time funnel: signed up -> onboarded -> got a recommendation -> premium.
    'funnel', jsonb_build_object(
      'signed_up',   (select count(*) from profiles),
      'onboarded',   (select count(distinct user_id) from user_preferences),
      'recommended', (select count(distinct user_id) from user_events where event_type = 'recommendation_generated'),
      'premium',     (select count(*) from profiles where is_premium)
    ),

    'notifications', jsonb_build_object(
      'sent',     (select count(*) from user_events where event_type = 'notification_sent'     and created_at between p_from and p_to),
      'received', (select count(*) from user_events where event_type = 'notification_received' and created_at between p_from and p_to),
      'opened',   (select count(*) from user_events where event_type = 'notification_opened'   and created_at between p_from and p_to),
      'by_reason', (
        select coalesce(jsonb_agg(jsonb_build_object('name', r, 'value', n) order by n desc), '[]'::jsonb)
        from (select coalesce(metadata->>'reason', 'desconhecido') r, count(*) n
              from user_events
              where event_type = 'notification_sent' and created_at between p_from and p_to
              group by 1) r
      )
    )
  ) into result;

  return result;
end;
$$;

create or replace function public.admin_recent_activity()
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
begin
  if coalesce(auth.jwt() ->> 'email', '') <> 'higor533@gmail.com' then
    raise exception 'forbidden' using errcode = '42501';
  end if;

  return jsonb_build_object(
    'users', (
      select coalesce(jsonb_agg(row_to_json(u)), '[]'::jsonb) from (
        select id, coalesce(nullif(full_name, ''), 'Sem nome') as full_name, is_premium, created_at
        from profiles order by created_at desc limit 8
      ) u
    ),
    'recommendations', (
      select coalesce(jsonb_agg(row_to_json(r)), '[]'::jsonb) from (
        select e.metadata->>'title' as title,
               e.metadata->>'source' as source,
               coalesce(nullif(p.full_name, ''), 'Sem nome') as user_name,
               e.created_at
        from user_events e left join profiles p on p.id = e.user_id
        where e.event_type = 'recommendation_generated'
        order by e.created_at desc limit 8
      ) r
    ),
    'reactions', (
      select coalesce(jsonb_agg(row_to_json(x)), '[]'::jsonb) from (
        select e.event_type,
               e.metadata->>'title' as title,
               coalesce(nullif(p.full_name, ''), 'Sem nome') as user_name,
               e.created_at
        from user_events e left join profiles p on p.id = e.user_id
        where e.event_type in ('title_liked', 'title_disliked', 'title_saved')
        order by e.created_at desc limit 8
      ) x
    )
  );
end;
$$;

revoke execute on function public.admin_dashboard_metrics(timestamptz, timestamptz) from public, anon;
revoke execute on function public.admin_recent_activity() from public, anon;
grant execute on function public.admin_dashboard_metrics(timestamptz, timestamptz) to authenticated;
grant execute on function public.admin_recent_activity() to authenticated;
