-- O Painel de métricas é exclusivo do dono do app (João, conta jpvalentinmmind7@gmail.com).
-- Mesmo que alguém tente incluir outra conta na lista de administradores, o banco recusa.
alter table private.admins
  add constraint admins_somente_dono check (user_id = '5d861d3f-529d-4027-825d-0ceeb5bf388d');
