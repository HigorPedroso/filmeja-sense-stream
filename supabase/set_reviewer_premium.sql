-- Marca a conta de revisor do Google Play como premium.
-- Funciona tanto se a linha em `profiles` já existe (trigger de signup)
-- quanto se não existe ainda (upsert por id).
insert into public.profiles (id, is_premium)
select id, true
from auth.users
where email = 'googleplay.revisor@filmeja.com'
on conflict (id) do update set is_premium = true;
