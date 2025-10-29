import * as XLSX from "xlsx";
import { InsertEquipment } from "../drizzle/schema";

/**
 * Mapeia cabeçalhos de Excel para nomes de campos normalizados
 */
function normalizeHeader(header: string): string {
  if (!header) return "";
  
  const normalized = String(header).toLowerCase().trim();
  
  // Mapeamento de variações de nomes de colunas
  const mappings: Record<string, string> = {
    "marca": "marca",
    "brand": "marca",
    
    "modelo": "modelo",
    "model": "modelo",
    
    "cor": "cor",
    "color": "cor",
    "colour": "cor",
    
    "categoria": "categoria",
    "category": "categoria",
    
    "subcategoria": "subcategoria",
    "subcategory": "subcategoria",
    
    "sap": "codSap",
    "código sap": "codSap",
    "codigo sap": "codSap",
    "cod sap": "codSap",
    "codsap": "codSap",
    
    "pvp s/iva": "pvpSemIva",
    "pvp sem iva": "pvpSemIva",
    "preço sem iva": "pvpSemIva",
    "preco sem iva": "pvpSemIva",
    
    "pvp c/iva": "pvpComIva",
    "pvp com iva": "pvpComIva",
    "preço com iva": "pvpComIva",
    "preco com iva": "pvpComIva",
    
    "garantia": "garantia",
    "warranty": "garantia",
    
    "observações": "observacoes",
    "observacoes": "observacoes",
    "obs": "observacoes",
    "ciclo de vida": "observacoes",
    "novidade": "novidade",
    "observações / ciclo de vida": "observacoes",
    
    "compatibilidades": "compatibilidades",
    "compatibilidade": "compatibilidades",
    "caracteristica distintiva": "compatibilidades",
    
    "assistência técnica": "assistenciaTecnica",
    "assistencia tecnica": "assistenciaTecnica",
    
    "fichas produto": "fichasProduto",
    "ficha produto": "fichasProduto",
  };
  
  return mappings[normalized] || "";
}

/**
 * Encontra a linha de cabeçalho numa sheet
 */
function findHeaderRow(data: any[][]): number {
  for (let i = 0; i < Math.min(15, data.length); i++) {
    const row = data[i];
    if (!row) continue;
    
    const rowStr = row.join(" ").toLowerCase();
    
    // Procurar por palavras-chave que indicam cabeçalho
    if ((rowStr.includes("marca") && rowStr.includes("modelo")) || 
        (rowStr.includes("pvp") && rowStr.includes("iva"))) {
      return i;
    }
  }
  
  return -1;
}

/**
 * Cria mapeamento de colunas baseado em DUAS linhas de cabeçalho
 */
function createColumnMapping(headerRow1: any[], headerRow2: any[]): Map<string, number> {
  const mapping = new Map<string, number>();
  
  // Processar ambas as linhas
  for (let colIndex = 0; colIndex < Math.max(headerRow1.length, headerRow2.length); colIndex++) {
    const header1 = headerRow1[colIndex] ? String(headerRow1[colIndex]).trim() : "";
    const header2 = headerRow2[colIndex] ? String(headerRow2[colIndex]).trim() : "";
    
    // Combinar ambos os cabeçalhos
    const combinedHeader = `${header1} ${header2}`.trim();
    
    // Tentar normalizar o cabeçalho combinado
    let normalizedField = normalizeHeader(combinedHeader);
    
    // Se não funcionou, tentar cada um individualmente
    if (!normalizedField) {
      normalizedField = normalizeHeader(header1) || normalizeHeader(header2);
    }
    
    if (normalizedField) {
      mapping.set(normalizedField, colIndex);
    }
  }
  
  return mapping;
}

/**
 * Extrai valor de uma célula e converte para string, arredondando números se necessário
 */
function getCellValue(row: any[], colIndex: number | undefined, isPrice: boolean = false): string | null {
  if (colIndex === undefined || colIndex < 0 || colIndex >= row.length) {
    return null;
  }
  
  const value = row[colIndex];
  if (value === null || value === undefined || value === "") {
    return null;
  }
  
  // Se for preço, arredondar para 2 casas decimais
  if (isPrice && typeof value === 'number') {
    return value.toFixed(2);
  }
  
  // Se for número, converter para string
  if (typeof value === 'number') {
    return value.toString();
  }
  
  return String(value).trim();
}

/**
 * Processa uma sheet do Excel e retorna lista de equipamentos
 */
export function processExcelSheet(
  sheetName: string,
  worksheet: XLSX.WorkSheet
): InsertEquipment[] {
  const equipmentList: InsertEquipment[] = [];
  
  try {
    // Converter sheet para array 2D
    const data = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as any[][];
    
    if (data.length < 10) {
      console.log(`Sheet "${sheetName}" has insufficient data, skipping...`);
      return [];
    }
    
    // Encontrar linha de cabeçalho
    const headerRowIndex = findHeaderRow(data);
    if (headerRowIndex === -1) {
      console.log(`Sheet "${sheetName}" has no recognizable header, skipping...`);
      return [];
    }
    
    // Assumir que a próxima linha também é cabeçalho
    const headerRow1 = data[headerRowIndex];
    const headerRow2 = data[headerRowIndex + 1] || [];
    
    // Criar mapeamento de colunas usando AMBAS as linhas
    const columnMapping = createColumnMapping(headerRow1, headerRow2);
    
    console.log(`Sheet "${sheetName}" column mapping:`, Object.fromEntries(columnMapping));
    
    // Verificar se tem campos obrigatórios
    if (!columnMapping.has("marca") && !columnMapping.has("modelo")) {
      console.log(`Sheet "${sheetName}" missing required columns, skipping...`);
      return [];
    }
    
    // Dados começam 2 linhas após o primeiro cabeçalho
    const dataStartRow = headerRowIndex + 2;
    
    // Processar linhas de dados
    for (let i = dataStartRow; i < data.length; i++) {
      const row = data[i];
      if (!row || row.length === 0) continue;
      
      // Pular linhas vazias
      const hasData = row.some(cell => cell !== null && cell !== undefined && cell !== "");
      if (!hasData) continue;
      
      const equipment: InsertEquipment = {
        marca: getCellValue(row, columnMapping.get("marca")),
        modelo: getCellValue(row, columnMapping.get("modelo")),
        cor: getCellValue(row, columnMapping.get("cor")),
        categoria: getCellValue(row, columnMapping.get("categoria")),
        subcategoria: getCellValue(row, columnMapping.get("subcategoria")),
        codSap: getCellValue(row, columnMapping.get("codSap")),
        pvpSemIva: getCellValue(row, columnMapping.get("pvpSemIva"), true),
        pvpComIva: getCellValue(row, columnMapping.get("pvpComIva"), true),
        garantia: getCellValue(row, columnMapping.get("garantia")),
        compatibilidades: getCellValue(row, columnMapping.get("compatibilidades")),
        observacoes: getCellValue(row, columnMapping.get("observacoes")) || getCellValue(row, columnMapping.get("novidade")),
        cicloVida: getCellValue(row, columnMapping.get("cicloVida")),
        assistenciaTecnica: getCellValue(row, columnMapping.get("assistenciaTecnica")),
        fichasProduto: getCellValue(row, columnMapping.get("fichasProduto")),
        dataLancamento: null,
        dataDescontinuacao: null,
      };
      
      // Só adicionar se tiver pelo menos marca OU modelo
      if (equipment.marca || equipment.modelo) {
        equipmentList.push(equipment);
      }
    }
    
    console.log(`Processed sheet "${sheetName}": ${equipmentList.length} equipments`);
    
  } catch (error) {
    console.error(`Error processing sheet "${sheetName}":`, error);
  }
  
  return equipmentList;
}

/**
 * Processa todas as sheets relevantes de um workbook Excel
 */
export function processExcelWorkbook(workbook: XLSX.WorkBook): InsertEquipment[] {
  const allEquipment: InsertEquipment[] = [];
  
  // Processar TODAS as sheets (exceto as que são claramente metadados)
  const sheetsToSkip = [
    "Campanha",
    "Entrada",
    "Stocks",
    "Stocks_Açores",
    "Menu MIEs",
    "Apresentações",
    "Sheet2",
    "Lista_VEP_MIE_new",
    "dados_que_interessa_new",
    "Dados_proposta",
    "Dados-Seguros",
    "Codigos_VEP",
    "dados_que_interessa",
    "dados_que_interessa_VEP",
    "dados_que_interessa_cc1",
    "dados_que_interessa_Mxo1",
    "dados_que_interessa_MxO_cc1",
  ];
  
  for (const sheetName of workbook.SheetNames) {
    // Skip metadata sheets
    if (sheetsToSkip.includes(sheetName)) {
      console.log(`Skipping metadata sheet: ${sheetName}`);
      continue;
    }
    
    const worksheet = workbook.Sheets[sheetName];
    const equipment = processExcelSheet(sheetName, worksheet);
    allEquipment.push(...equipment);
  }
  
  console.log(`Total equipment processed before deduplication: ${allEquipment.length}`);
  
  // Deduplicação por código SAP
  // Priorizar equipamentos COM preço sobre equipamentos SEM preço
  const uniqueMap = new Map<string, InsertEquipment>();
  
  for (const equipment of allEquipment) {
    const key = `${equipment.marca}_${equipment.modelo}_${equipment.cor}_${equipment.codSap}`;
    const existing = uniqueMap.get(key);
    
    // Se não existe, adicionar
    if (!existing) {
      uniqueMap.set(key, equipment);
      continue;
    }
    
    // Se já existe, manter o que tem preço
    const hasPrice = equipment.pvpSemIva && equipment.pvpSemIva !== "N/A";
    const existingHasPrice = existing.pvpSemIva && existing.pvpSemIva !== "N/A";
    
    if (hasPrice && !existingHasPrice) {
      uniqueMap.set(key, equipment);
    }
  }
  
  const deduplicated = Array.from(uniqueMap.values());
  console.log(`Total equipment after deduplication: ${deduplicated.length}`);
  
  return deduplicated;
}
