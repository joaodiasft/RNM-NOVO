/**
 * Gera o PDF do tutorial do aluno com imagens ilustrativas.
 * Uso: npx tsx scripts/gerar-tutorial-aluno.ts
 */
import { salvarPdfTutorialAluno } from "../lib/services/pdf-tutorial-aluno";

async function main() {
  const caminho = await salvarPdfTutorialAluno();
  console.log("✅ Tutorial gerado com sucesso!");
  console.log(`   Arquivo: ${caminho}`);
  console.log(`   URL: https://redacaonotamil.site/docs/tutorial-aluno.pdf`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
