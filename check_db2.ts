import { drizzle } from "drizzle-orm/mysql2";
import { equipments } from "./drizzle/schema";
import { sql } from "drizzle-orm";

const db = drizzle(process.env.DATABASE_URL!);

async function checkData() {
  // Search for DELL (uppercase)
  console.log("=== Pesquisando por 'DELL' (maiúsculas) ===");
  const searchTerm = '%DELL%';
  const dellResults = await db.select().from(equipments).where(
    sql`${equipments.marca} LIKE ${searchTerm} OR ${equipments.modelo} LIKE ${searchTerm}`
  );
  console.log(`Encontrados ${dellResults.length} resultados para 'DELL'\n`);
  
  dellResults.slice(0, 10).forEach((eq, idx) => {
    console.log(`${idx + 1}. Marca: "${eq.marca}" | Modelo: "${eq.modelo}"`);
    console.log(`   Código SAP: ${eq.codSap}`);
    console.log(`   Preço s/ IVA: ${eq.pvpSemIva} €\n`);
  });
  
  // Show all unique brands
  console.log("\n=== Marcas únicas (primeiras 20) ===");
  const allEquip = await db.select().from(equipments);
  const brands = new Set(allEquip.map(e => e.marca).filter(Boolean));
  Array.from(brands).slice(0, 20).forEach(brand => {
    console.log(`- ${brand}`);
  });
}

checkData().then(() => process.exit(0)).catch(err => {
  console.error(err);
  process.exit(1);
});
