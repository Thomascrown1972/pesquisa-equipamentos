import { readFile } from 'xlsx';
import { db } from './server/db';
import { equipments } from './drizzle/schema';

const filePath = '/home/ubuntu/upload/B2B_PORTFOLIO_EQUIPAMENTOS_EMPRESARIAIS_PlugPlay.xlsm';

async function importExcel() {
  console.log('Reading Excel file...');
  const workbook = readFile(filePath);
  
  const sheetsToProcess = [
    'Telemoveis e Smartphones',
    'Tablets-Individual',
    'PCs',
    'Smartwatches',
    'Gaming',
    'Impressoras',
    'TV',
    'Acess-Telemoveis',
    'Acess-Tablets',
    'Acess-PCs',
    'Acess-Smartwatches',
    'Acess-Gaming',
    'Acess-Impressoras',
    'Acess-TV',
    'Plug&Play',
    'Outros'
  ];
  
  let allEquipments: any[] = [];
  
  for (const sheetName of sheetsToProcess) {
    if (!workbook.Sheets[sheetName]) {
      console.log(`Sheet "${sheetName}" not found, skipping...`);
      continue;
    }
    
    console.log(`Processing sheet: ${sheetName}`);
    const worksheet = workbook.Sheets[sheetName];
    const data = utils.sheet_to_json(worksheet, { header: 1 });
    
    if (data.length < 2) continue;
    
    const headers = data[0] as string[];
    const rows = data.slice(1);
    
    for (const row of rows) {
      const rowData: any = {};
      headers.forEach((header, index) => {
        rowData[header] = row[index];
      });
      
      if (!rowData['Marca'] && !rowData['Modelo']) continue;
      
      allEquipments.push({
        categoria: sheetName,
        subcategoria: rowData['Subcategoria'] || rowData['Sub-categoria'] || null,
        marca: rowData['Marca'] || null,
        modelo: rowData['Modelo'] || null,
        cor: rowData['Cor'] || null,
        compatibilidades: rowData['Compatibilidades'] || null,
        cicloVida: rowData['Ciclo de Vida'] || null,
        observacoes: rowData['Observações'] || rowData['Observacoes'] || null,
        codSap: rowData['Código SAP'] || rowData['Codigo SAP'] || null,
        pvpSemIva: rowData['PVP sem IVA'] || rowData['Preço sem IVA'] || null,
        pvpComIva: rowData['PVP com IVA'] || rowData['Preço com IVA'] || null,
        garantia: rowData['Garantia'] || null,
        assistenciaTecnica: rowData['Assistência Técnica'] || null,
        fichasProduto: rowData['Fichas de Produto'] || null,
      });
    }
  }
  
  console.log(`Total equipments to import: ${allEquipments.length}`);
  
  // Clear existing data
  await db.delete(equipments);
  console.log('Cleared existing equipments');
  
  // Insert in batches
  const batchSize = 1000;
  for (let i = 0; i < allEquipments.length; i += batchSize) {
    const batch = allEquipments.slice(i, i + batchSize);
    await db.insert(equipments).values(batch);
    console.log(`Inserted batch ${Math.floor(i / batchSize) + 1}`);
  }
  
  console.log('Import completed!');
}

importExcel().catch(console.error);
