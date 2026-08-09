-- Respaldo de actividad: no modifica datos y no sustituye la política de pausing de Supabase.
create extension if not exists pg_cron with schema pg_catalog;

grant usage on schema cron to postgres;
grant all privileges on all tables in schema cron to postgres;

select cron.unschedule(jobid)
from cron.job
where jobname = 'sahlo-folina-keepalive';

select cron.schedule(
  'sahlo-folina-keepalive',
  '0 4 * * *',
  $$select count(*) from public.reader_profiles;$$
);
