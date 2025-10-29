import { drizzle } from "drizzle-orm/mysql2";
import { equipments } from "./drizzle/schema";
import { like, or } from "drizzle-orm";

const db = drizzle(process.env.DATABASE_URL!);

async function searchLenovoTablets() {
  console.log("=== Pesquisando por tablets Lenovo ===\n");
  
  // Pesquisar por "lenovo" e "tablet"
  const results = await db.select().from(equipments).where(
    or(
      like(equipments.marca, '%lenovo%'),
      like(equipments.modelo, '%lenovo%'),
      like(equipments.modelo, '%ideatab%'),
      like(equipments.modelo, '%idea tab%'),
      like(equipments.subcategoria, '%tablet%')
    )
  );
  
  console.log(`Encontrados ${results.length} equipamentos:\n`);
  
  results.forEach((eq, idx) => {
    console.log(`${idx + 1}. Marca: ${eq.marca} | Modelo: ${eq.modelo}`);
    console.log(`   Categoria: ${eq.categoria} | Subcategoria: ${eq.subcategoria}`);
    console.log(`   SAP: ${eq.codSap} | Preço: ${eq.pvpSemIva}\n`);
  });
}

searchLenovoTablets().then(() => process.exit(0)).catch(console.error);
