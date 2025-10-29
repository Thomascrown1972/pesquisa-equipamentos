import { eq, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { InsertUser, users, equipments, InsertEquipment, chatMessages, InsertChatMessage } from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

// Lazily create the drizzle instance so local tooling can run without a DB.
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

// Funções de gestão de equipamentos
export async function insertEquipments(equipmentList: InsertEquipment[]) {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }
  
  // Insert in batches of 500 to avoid MySQL query size limits
  const batchSize = 500;
  for (let i = 0; i < equipmentList.length; i += batchSize) {
    const batch = equipmentList.slice(i, i + batchSize);
    await db.insert(equipments).values(batch);
    console.log(`Inserted batch ${Math.floor(i / batchSize) + 1}: ${batch.length} equipments`);
  }
  
  console.log(`Total inserted: ${equipmentList.length} equipments`);
}

export async function deleteAllEquipments() {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }
  return await db.delete(equipments);
}

export async function getAllEquipments() {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }
  return await db.select().from(equipments);
}

export async function searchEquipments(searchTerm: string) {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }
  
  // Dividir o termo de pesquisa em palavras individuais
  const keywords = searchTerm
    .toLowerCase()
    .split(/\s+/) // Dividir por espaços
    .filter(word => word.length > 1); // Remover palavras de 1 letra
  
  if (keywords.length === 0) {
    return [];
  }
  
  // Construir condições SQL para cada palavra-chave
  const buildConditions = (keyword: string) => {
    const term = `%${keyword}%`;
    return sql`(
      LOWER(${equipments.categoria}) LIKE ${term} OR 
      LOWER(${equipments.subcategoria}) LIKE ${term} OR 
      LOWER(${equipments.marca}) LIKE ${term} OR 
      LOWER(${equipments.modelo}) LIKE ${term} OR
      LOWER(${equipments.cor}) LIKE ${term} OR
      LOWER(${equipments.compatibilidades}) LIKE ${term} OR
      LOWER(${equipments.observacoes}) LIKE ${term}
    )`;
  };
  
  // Tentar primeiro com AND (todas as palavras devem estar presentes)
  const andConditions = keywords.map(buildConditions);
  const andCondition = andConditions.reduce((acc, condition) => 
    sql`${acc} AND ${condition}`
  );
  
  let results = await db.select().from(equipments).where(andCondition);
  
  // Se não encontrar nada com AND, tentar com OR (qualquer palavra)
  if (results.length === 0 && keywords.length > 1) {
    const orConditions = keywords.map(buildConditions);
    const orCondition = orConditions.reduce((acc, condition) => 
      sql`${acc} OR ${condition}`
    );
    
    results = await db.select().from(equipments).where(orCondition);
    
    // Ordenar por relevância (quantas palavras-chave correspondem)
    results.sort((a, b) => {
      const scoreA = keywords.filter(keyword => 
        [a.categoria, a.subcategoria, a.marca, a.modelo, a.cor, a.compatibilidades, a.observacoes]
          .some(field => field?.toLowerCase().includes(keyword))
      ).length;
      
      const scoreB = keywords.filter(keyword => 
        [b.categoria, b.subcategoria, b.marca, b.modelo, b.cor, b.compatibilidades, b.observacoes]
          .some(field => field?.toLowerCase().includes(keyword))
      ).length;
      
      return scoreB - scoreA; // Ordem decrescente
    });
  }
  
  return results;
}

// Funções de gestão de mensagens do chatbot
export async function insertChatMessage(message: InsertChatMessage) {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }
  return await db.insert(chatMessages).values(message);
}

export async function getUserChatHistory(userId: number, limit: number = 50) {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }
  return await db.select().from(chatMessages)
    .where(eq(chatMessages.userId, userId))
    .orderBy(chatMessages.createdAt)
    .limit(limit);
}
