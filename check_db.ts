import { drizzle } from "drizzle-orm/mysql2";
import { equipments } from "./drizzle/schema";
import { like, sql } from "drizzle-orm";

const db = drizzle(process.env.DATABASE_URL!);

async function checkData() {
  console.log("=== Verificando dados na base de dados ===\n");
  
  // Count total
  const all = await db.select().from(equipments);
  console.log(`Total de equipamentos: ${all.length}\n`);
  
  // Show first 5
  console.log("Primeiros 5 equipamentos:");
  all.slice(0, 5).forEach((eq, idx) => {
    console.log(`\n${idx + 1}. ${eq.marca} ${eq.modelo}`);
    console.log(`   Categoria: ${eq.categoria}`);
    console.log(`   Código SAP: ${eq.codSap}`);
    console.log(`   Preço s/ IVA: ${eq.pvpSemIva}`);
  });
  
  // Search for Dell monitors
  console.log("\n\n=== Pesquisando por 'Dell' ===");
  const searchTerm = '%Dell%';
  const dellResults = await db.select().from(equipments).where(
    sql`${equipments.marca} LIKE ${searchTerm} OR ${equipments.modelo} LIKE ${searchTerm}`
  );
  console.log(`Encontrados ${dellResults.length} resultados para 'Dell'\n`);
  
  dellResults.slice(0, 5).forEach((eq, idx) => {
    console.log(`${idx + 1}. ${eq.marca} ${eq.modelo}`);
    console.log(`   Código SAP: ${eq.codSap}`);
    console.log(`   Preço s/ IVA: ${eq.pvpSemIva} €\n`);
  });
}

checkData().then(() => process.exit(0)).catch(err => {
  console.error(err);
  process.exit(1);
});
