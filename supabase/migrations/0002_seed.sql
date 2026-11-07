-- =====================================================================
-- Dados iniciais: categorias, fontes, base oficial de criadores, configurações.
-- REGRA: nenhum número de seguidores é inserido aqui. Todos os criadores
-- entram como 'pendente_validacao' até uma fonte verificável confirmar
-- o mínimo de 40 mil seguidores no Instagram.
-- =====================================================================

insert into categories (id, name, description, sort_order) values
  ('internacional_ia_tech', 'Internacionais — IA e Tecnologia', 'Criadores internacionais de IA, tecnologia e negócios', 1),
  ('br_ia_tech', 'Brasileiros — IA e Tecnologia', 'Criadores brasileiros de inteligência artificial e tecnologia', 2),
  ('br_marketing_viral', 'Brasileiros — Marketing, Social Media e Viralização', 'Estratégia de conteúdo, social media e viralização', 3),
  ('institucional', 'Referências institucionais', 'Empresas e marcas observadas pelos conteúdos públicos', 4),
  ('descobertos', 'Descobertos pela IA', 'Criadores sugeridos pelo radar e aprovados', 5);

insert into sources (id, name, kind, notes) values
  ('youtube', 'YouTube Data API v3', 'video', 'Busca de Shorts por tema, estatísticas públicas (views, likes, comentários) e inscritos do canal.'),
  ('instagram_discovery', 'Instagram Graph API — Business Discovery', 'perfil', 'Seguidores e mídias públicas de contas profissionais (curtidas e comentários). Não fornece alcance, retenção, salvamentos ou compartilhamentos de terceiros.'),
  ('instagram_insights', 'Instagram Graph API — Insights da conta própria', 'metricas_proprias', 'Métricas da conta profissional autorizada de João.'),
  ('tiktok_research', 'TikTok Research API', 'video', 'Requer aprovação do programa de pesquisa do TikTok.'),
  ('hacker_news', 'Hacker News (Algolia API pública)', 'noticias', 'Sinal de notícias de tecnologia/IA ganhando atenção.'),
  ('metricool', 'Metricool API', 'metricas_proprias', 'Disponível apenas em planos com acesso à API.'),
  ('vidiq', 'vidIQ', 'video', 'Não há API pública documentada; adaptador reservado.'),
  ('assemblyai', 'AssemblyAI (transcrição)', 'transcricao', 'Transcreve áudio/vídeo com URL autorizada.'),
  ('manual', 'Entrada manual', 'perfil', 'Dados inseridos manualmente por um usuário autenticado.'),
  ('anthropic', 'Claude (Anthropic)', 'ia', 'Análise, tendências, adaptação e roteiros.'),
  ('resend', 'Resend (e-mail)', 'notificacao', 'Envio opcional do resumo diário por e-mail.'),
  ('whatsapp', 'WhatsApp Cloud API', 'notificacao', 'Envio opcional do resumo diário por WhatsApp.');

-- Base oficial de criadores -------------------------------------------
insert into creators (name, kind, category_id, instagram_handle, priority, study_focus, classification_note, notes) values
  -- A. Internacionais
  ('Cleo Abram', 'pessoa', 'internacional_ia_tech', 'cleoabram', 0, '{}', null, null),
  ('Dan Martell', 'pessoa', 'internacional_ia_tech', 'danmartell', 0, '{}', null, null),
  ('Matt Wolfe', 'pessoa', 'internacional_ia_tech', 'mreflow', 0, '{}', null, null),
  ('Varun Mayya', 'pessoa', 'internacional_ia_tech', 'thevarunmayya', 0, '{}', null, null),
  ('Rowan Cheung', 'pessoa', 'internacional_ia_tech', 'rowancheung', 0, '{}', null, null),
  ('Allie K. Miller', 'pessoa', 'internacional_ia_tech', 'alliekmiller', 0, '{}', null, null),
  ('Liam Ottley', 'pessoa', 'internacional_ia_tech', 'liamottley', 0, '{}', null, null),
  ('Greg Isenberg', 'pessoa', 'internacional_ia_tech', 'gregisenberg', 0, '{}', null, null),
  ('Kallaway', 'pessoa', 'internacional_ia_tech', 'kallaway', 0, '{}', null, null),
  ('Deepak Sharma', 'pessoa', 'internacional_ia_tech', 'yourchatgptguide', 0, '{}', null, null),
  -- B. Brasileiros — IA e Tecnologia
  ('João Vitor Chaves', 'pessoa', 'br_ia_tech', null, 0, '{}', null, 'Referência do G4. Perfil do Instagram pendente de confirmação.'),
  ('Bruno Belissimo', 'pessoa', 'br_ia_tech', 'brunobelissimo.ai', 0, '{}', null, null),
  ('Lucas Miranda', 'pessoa', 'br_ia_tech', 'lucasflame.ai', 0, '{}', null, null),
  ('Pedro Daniel', 'pessoa', 'br_ia_tech', 'pedrodaniel.ia', 0, '{}', null, null),
  ('Danilo Gato', 'pessoa', 'br_ia_tech', 'odanilogato', 0, '{}', null, null),
  ('Tony Ventura', 'pessoa', 'br_ia_tech', null, 0, '{}', null, 'Perfil do Instagram pendente de confirmação.'),
  ('Antonio Louback', 'pessoa', 'br_ia_tech', 'closertech1', 0, '{}', null, null),
  ('Bruno Lobato', 'pessoa', 'br_ia_tech', 'quebakana', 0, '{}', null, null),
  ('Gustavo Mee', 'pessoa', 'br_ia_tech', 'gustavomee.news', 0, '{}', null, null),
  ('Marcela Lúzio', 'pessoa', 'br_ia_tech', null, 0, '{}', null, 'Perfil do Instagram pendente de confirmação.'),
  ('Rafael Milagre', 'pessoa', 'br_ia_tech', 'rafaelmilagre', 1, '{"IA aplicada a negócios","tecnologia","empreendedorismo"}',
     'IA aplicada a negócios, tecnologia e empreendedorismo', null),
  ('Viver de IA', 'empresa', 'institucional', null, 0, '{"conteúdos públicos institucionais"}', null, 'Referência institucional. Perfil oficial pendente de confirmação.'),
  -- C. Brasileiros — Marketing, Social Media e Viralização
  ('Diego Di Loreto', 'pessoa', 'br_marketing_viral', 'dieguinhodiloreto', 10,
     '{"identificação de trends","timing de publicação","conteúdo espontâneo","humanização de empresários","pessoas como personagens digitais","formatos de vídeos curtos","storytelling","aproveitamento de assuntos em alta","estratégias de viralização","construção de audiência","criatividade e retenção"}',
     'Referência prioritária — estratégia de conteúdo do João Adibe (CEO da Cimed)', null),
  ('Rafael Kiso', 'pessoa', 'br_marketing_viral', 'rafaelkiso', 5,
     '{"estratégia de social media","dados e algoritmos","distribuição de conteúdo","métricas","planejamento editorial","estratégias de crescimento"}', null, null),
  ('Julia Becker', 'pessoa', 'br_marketing_viral', null, 0, '{"comunicação","construção de conteúdo"}', null, 'Perfil a validar. Não confundir com Giullia Becker (@giubeckers).'),
  ('Thay Dantas', 'pessoa', 'br_marketing_viral', null, 0, '{"comunicação","construção de conteúdo"}', null, 'Perfil a validar.'),
  ('Ramon Campos', 'pessoa', 'br_marketing_viral', 'ramoncampos', 0, '{}', null, null),
  ('Camila Porto', 'pessoa', 'br_marketing_viral', 'camilaporto.com.br', 0, '{}', null, null),
  ('Giullia Becker', 'pessoa', 'br_marketing_viral', 'giubeckers', 0, '{}', null, 'Perfil adicional a validar. Pessoa diferente de Julia Becker.');

-- Configurações iniciais ----------------------------------------------
insert into settings (key, value, description) values
  ('min_followers', '40000', 'Mínimo de seguidores no Instagram para inclusão definitiva de um criador'),
  ('timezone', '"America/Sao_Paulo"', 'Fuso horário da rotina diária'),
  ('daily_run_hour', '7', 'Hora local da rotina diária (agendada no Vercel Cron às 10:00 UTC)'),
  ('radar_topics', '[
      {"topic":"inteligência artificial","queries":["inteligência artificial","IA para empresas","AI tools","ChatGPT","agentes de IA","AI agents"]},
      {"topic":"tecnologia","queries":["tecnologia novidades","tech news","nova tecnologia"]},
      {"topic":"marketing digital","queries":["marketing digital","tráfego pago","marketing com IA"]},
      {"topic":"social media","queries":["social media dicas","viralizar no instagram","estratégia de conteúdo"]},
      {"topic":"automação","queries":["automação com IA","automation n8n","automação empresarial"]},
      {"topic":"negócios digitais","queries":["negócios digitais","empreendedorismo digital","AI business"]},
      {"topic":"ferramentas digitais","queries":["ferramentas de IA","AI tool review","melhores ferramentas IA"]},
      {"topic":"produtividade","queries":["produtividade com IA","productivity AI"]},
      {"topic":"inovação","queries":["inovação","startup inovação"]},
      {"topic":"transformação digital","queries":["transformação digital","digital transformation"]}
    ]', 'Temas e consultas do Radar Viral'),
  ('radar_window_hours', '96', 'Janela de busca de conteúdos recentes, em horas'),
  ('radar_regions', '["BR","US"]', 'Regiões de busca do YouTube'),
  ('ai_daily_budget_usd', '15', 'Teto diário de gasto com IA (USD). A rotina interrompe chamadas de IA ao atingir o teto.'),
  ('editorial_pillars', '[
      "IA aplicada a negócios",
      "Ferramenta ou demonstração prática de IA",
      "Tecnologia ou tendência",
      "Marketing, dados ou produtividade",
      "Oportunidade viral livre"
    ]', 'Distribuição editorial orientativa dos 5 roteiros'),
  ('notifications', '{"email":false,"whatsapp":false}', 'Envio opcional do resumo diário');
