import { drizzle } from "drizzle-orm/mysql2";
import { equipments } from "./drizzle/schema";
import { sql } from "drizzle-orm";

const db = drizzle(process.env.DATABASE_URL!);

async function testSearch() {
  const searchTerm = "Dell";
  const term = `%${searchTerm}%`;
  
  console.log("Termo de pesquisa:", searchTerm);
  console.log("Pattern LIKE:", term);
  
  const results = await db.select().from(equipments).where(
    sql`LOWER(${equipments.categoria}) LIKE LOWER(${term}) OR LOWER(${equipments.subcategoria}) LIKE LOWER(${term}) OR LOWER(${equipments.marca}) LIKE LOWER(${term}) OR LOWER(${equipments.modelo}) LIKE LOWER(${term})`
  );
  
  console.log(`\nResultados encontrados: ${results.length}\n`);
  
  results.slice(0, 5).forEach((eq, idx) => {
    console.log(`${idx + 1}. ${eq.marca} ${eq.modelo}`);
    console.log(`   Código SAP: ${eq.codSap}`);
    console.log(`   Preço s/ IVA: ${eq.pvpSemIva} €\n`);
  });
}

testSearch().then(() => process.exit(0)).catch(err => {
  console.error(err);
  process.exit(1);
});
