import { drizzle } from "drizzle-orm/mysql2";
import { equipments } from "./drizzle/schema";
import { like, or, sql } from "drizzle-orm";

const db = drizzle(process.env.DATABASE_URL!);

async function searchTB373() {
  console.log("=== Pesquisando por TB373FU ===\n");
  
  const results = await db.select().from(equipments).where(
    or(
      like(equipments.modelo, '%TB373%'),
      like(equipments.modelo, '%tb373%'),
      like(equipments.codSap, '%TB373%')
    )
  );
  
  console.log(`Encontrados ${results.length} equipamentos:\n`);
  
  results.forEach((eq, idx) => {
    console.log(`${idx + 1}. Marca: ${eq.marca} | Modelo: ${eq.modelo}`);
    console.log(`   Categoria: ${eq.categoria} | Subcategoria: ${eq.subcategoria}`);
    console.log(`   SAP: ${eq.codSap} | Preço: ${eq.pvpSemIva}\n`);
  });
  
  // Pesquisar todos os tablets
  console.log("\n=== Todos os tablets na base de dados ===\n");
  const tablets = await db.select().from(equipments).where(
    sql`LOWER(${equipments.subcategoria}) LIKE '%tablet%'`
  );
  
  console.log(`Total de tablets: ${tablets.length}\n`);
  tablets.slice(0, 10).forEach((eq, idx) => {
    console.log(`${idx + 1}. ${eq.marca} ${eq.modelo} - SAP: ${eq.codSap}`);
  });
}

searchTB373().then(() => process.exit(0)).catch(console.error);
