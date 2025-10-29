import { searchEquipments } from "./server/db";

async function testRouterLogic() {
  const userMessage = "DELL";
  
  console.log("=== Testando lógica do router ===");
  console.log(`Mensagem do utilizador: "${userMessage}"\n`);
  
  // Search for relevant equipment
  const equipments = await searchEquipments(userMessage);
  
  console.log(`Equipamentos encontrados: ${equipments.length}\n`);
  
  // Build context for LLM
  let contextText = '';
  if (equipments.length > 0) {
    contextText = 'Equipamentos encontrados:\n\n';
    equipments.slice(0, 10).forEach((eq, idx) => {
      contextText += `${idx + 1}. **${eq.marca || ''} ${eq.modelo || ''}**\n`;
      contextText += `   - Categoria: ${eq.categoria || 'N/A'}\n`;
      contextText += `   - Subcategoria: ${eq.subcategoria || 'N/A'}\n`;
      contextText += `   - Código SAP: ${eq.codSap || 'N/A'}\n`;
      contextText += `   - Preço sem IVA: ${eq.pvpSemIva || 'N/A'} €\n`;
      contextText += `   - Preço com IVA: ${eq.pvpComIva || 'N/A'} €\n`;
      if (eq.compatibilidades) {
        contextText += `   - Compatibilidades: ${eq.compatibilidades}\n`;
      }
      if (eq.garantia) {
        contextText += `   - Garantia: ${eq.garantia}\n`;
      }
      contextText += '\n';
    });
  } else {
    contextText = 'Nenhum equipamento encontrado para esta pesquisa.';
  }
  
  console.log("=== Contexto para o LLM ===");
  console.log(contextText);
  console.log("\n=== System prompt ===");
  const systemPrompt = `Você é um assistente especializado em equipamentos empresariais. Sua tarefa é ajudar o utilizador a encontrar equipamentos com base na sua pergunta. Sempre apresente as informações de forma clara e organizada, incluindo o nome completo do equipamento, preço sem IVA e código SAP. Use markdown para formatar a resposta de forma legível. Se houver múltiplas opções, liste-as todas. Se não encontrar equipamentos, sugira ao utilizador tentar com outros termos de pesquisa.\n\n${contextText}`;
  console.log(systemPrompt);
}

testRouterLogic().then(() => process.exit(0)).catch(err => {
  console.error(err);
  process.exit(1);
});
