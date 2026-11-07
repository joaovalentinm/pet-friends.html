-- Asserções de integridade do schema
do $$
declare n int; vid uuid; ok boolean;
begin
  select count(*) into n from creators;
  if n <> 29 then raise exception 'esperado 29 criadores, obtido %', n; end if;

  select count(*) into n from creators where followers_count is not null;
  if n <> 0 then raise exception 'seed não pode conter seguidores inventados'; end if;

  select count(*) into n from creators where status <> 'pendente_validacao';
  if n <> 0 then raise exception 'todos devem iniciar pendentes de validação'; end if;

  -- deduplicação de vídeos
  insert into videos (platform, external_id, url, source_id) values ('youtube', 'abc', 'https://youtu.be/abc', 'youtube') returning id into vid;
  begin
    insert into videos (platform, external_id, url, source_id) values ('youtube', 'abc', 'https://youtu.be/abc', 'youtube');
    raise exception 'duplicado aceito';
  exception when unique_violation then null; end;

  -- métricas append-only
  insert into video_metrics (video_id, source_id, views) values (vid, 'youtube', 100);
  ok := false;
  begin
    update video_metrics set views = 1 where video_id = vid;
  exception when raise_exception then ok := true; end;
  if not ok then raise exception 'métricas deveriam ser imutáveis'; end if;

  -- exclusão em cascata a partir do vídeo continua permitida
  delete from videos where id = vid;
  select count(*) into n from video_metrics;
  if n <> 0 then raise exception 'cascade falhou'; end if;

  -- trava de execução única
  insert into daily_runs (run_date, trigger) values (current_date, 'manual');
  begin
    insert into daily_runs (run_date, trigger) values (current_date, 'manual');
    raise exception 'duas execuções ativas aceitas';
  exception when unique_violation then null; end;

  -- instagram_url gerada
  select instagram_url = 'https://www.instagram.com/dieguinhodiloreto/' into ok from creators where instagram_handle = 'dieguinhodiloreto';
  if not ok then raise exception 'instagram_url incorreta'; end if;
end $$;
