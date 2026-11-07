/**
 * Executa a rotina diária pela linha de comando (útil para hospedagem fora da Vercel ou depuração).
 *   npm run pipeline:run
 * Requer .env.local com as mesmas variáveis do servidor.
 */
import { runDaily } from "@/lib/pipeline/daily";

runDaily({ trigger: "manual" })
  .then((r) => {
    console.log(JSON.stringify(r, null, 2));
    process.exit(r.status === "falhou" ? 1 : 0);
  })
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
