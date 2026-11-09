# Publicação do site (Hostinger)

- **Endereço:** https://petfriends.wearefield.io
- **Hospedagem:** Hostinger, conta `u702147711`, pedido `1010187851`, site estático (subdomínio de `wearefield.io`).
- **Segurança:** SSL vitalício ativo, redirecionamento para HTTPS e CDN da Hostinger ligados.
- **Não mexer:** `wearefield.io` (WordPress) e `bio.wearefield.io` (bio do Instagram) são outros sites da mesma conta.

## Como publicar uma nova versão

> Publicar substitui o conteúdo do site. Faça isso só com autorização do responsável.

1. `npm run typecheck && npm run lint && npm test && npm run build`
2. Compactar o **conteúdo** de `dist/` (não a pasta em si): `cd dist && zip -qr ../petfriends-site.zip .`
3. Pela API da Hostinger:
   1. `hosting_files_generate-upload-url` (username `u702147711`, domínio `petfriends.wearefield.io`);
   2. enviar o zip por TUS (`POST` e depois `PATCH`) para `{url}/petfriends-site.zip?override=true`. O host `srv1446-files.hstgr.io` está liberado no ambiente `pet-friends.html`;
   3. `hosting_websites_deploy-static-site-archive` com `archive_path: petfriends-site.zip`.
4. Conferir com `hosting_files_list-website-and-directories` e `hosting_websites_get-settings` (SSL `active`).
5. Os celulares recebem a versão nova sozinhos: o service worker atualiza na próxima vez que o app for aberto.

## Domínio próprio (opcional, futuro)
Livres em 09/11/2026: `meupetfriends.com.br`, `petfriendsapp.com.br` (exigem CPF/CNPJ), `meupetfriends.com`, `meupetfriends.app`, `petfriendsapp.app`. `petfriends.com.br` e `.com` estão ocupados.
