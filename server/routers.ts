import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { z } from "zod";
import * as XLSX from "xlsx";
import { insertEquipments, deleteAllEquipments, getAllEquipments, searchEquipments, insertChatMessage, getUserChatHistory } from "./db";
import { processExcelWorkbook } from "./excel-processor";
import { InsertEquipment } from "../drizzle/schema";
import { invokeLLM } from "./_core/llm";

export const appRouter = router({
    // if you need to use socket.io, read and register route in server/_core/index.ts, all api should start with '/api/' so that the gateway can route correctly
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),

  equipment: router({
    uploadExcel: protectedProcedure
      .input(z.object({
        fileContent: z.string(), // Base64 encoded file
        replaceExisting: z.boolean().default(true),
      }))
      .mutation(async ({ input }) => {
        try {
          // Decode base64 to buffer
          const buffer = Buffer.from(input.fileContent, 'base64');
          
          // Parse Excel file
          const workbook = XLSX.read(buffer, { type: 'buffer' });
          
          // Process all sheets dynamically
          const equipmentList = processExcelWorkbook(workbook);
          
          // Replace existing data if requested
          if (input.replaceExisting) {
            await deleteAllEquipments();
          }
          
          // Insert new equipment
          if (equipmentList.length > 0) {
            await insertEquipments(equipmentList);
          }
          
          return {
            success: true,
            count: equipmentList.length,
          };
        } catch (error: any) {
          console.error('Error processing Excel file:', error);
          throw new Error(`Failed to process Excel file: ${error.message}`);
        }
      }),
    
    list: protectedProcedure.query(async () => {
      return await getAllEquipments();
    }),
    
    search: protectedProcedure
      .input(z.object({
        query: z.string(),
      }))
      .query(async ({ input }) => {
        return await searchEquipments(input.query);
      }),
  }),
  
  chat: router({
    sendMessage: protectedProcedure
      .input(z.object({
        message: z.string(),
      }))
      .mutation(async ({ ctx, input }) => {
        // Save user message
        await insertChatMessage({
          userId: ctx.user.id,
          role: 'user',
          content: input.message,
        });
        
        // Search for relevant equipment
        const equipments = await searchEquipments(input.message);
        console.log(`[Chat] User message: "${input.message}"`);
        console.log(`[Chat] Found ${equipments.length} equipments`);
        
        // Debug: Log first equipment to verify data
        if (equipments.length > 0) {
          console.log('[Chat] First equipment sample:', {
            marca: equipments[0].marca,
            modelo: equipments[0].modelo,
            cor: equipments[0].cor,
            codSap: equipments[0].codSap,
            pvpSemIva: equipments[0].pvpSemIva
          });
        }
        
        // Limit to avoid rate limits
        const MAX_EQUIPMENTS = 30;
        const totalFound = equipments.length;
        const equipmentsToShow = equipments.slice(0, MAX_EQUIPMENTS);
        
        let assistantMessage = '';
        
        if (equipments.length === 0) {
          assistantMessage = 'Não encontrei equipamentos que correspondam à sua pesquisa. Por favor, tente com outros termos.';
        } else {
          // Build response directly in the backend to ensure SAP codes are shown
          assistantMessage = `Encontrei **${totalFound} equipamento${totalFound > 1 ? 's' : ''}** para a sua pesquisa.\n\n`;
          
          if (totalFound > MAX_EQUIPMENTS) {
            assistantMessage += `⚠️ A apresentar os primeiros ${MAX_EQUIPMENTS} resultados. Para ver resultados mais específicos, refine a sua pesquisa (ex: especifique capacidade, cor ou modelo).\n\n`;
          }
          
          assistantMessage += `---\n\n`;
          
          // Group by model for better organization
          const groupedByModel: { [key: string]: typeof equipmentsToShow } = {};
          equipmentsToShow.forEach(eq => {
            const modelKey = `${eq.marca} ${eq.modelo}`.trim();
            if (!groupedByModel[modelKey]) {
              groupedByModel[modelKey] = [];
            }
            groupedByModel[modelKey].push(eq);
          });
          
          // Present each group
          Object.entries(groupedByModel).forEach(([modelName, items]) => {
            assistantMessage += `## ${modelName}\n\n`;
            
            items.forEach((eq, idx) => {
              if (eq.cor && eq.cor !== 'N/A') {
                assistantMessage += `### ${eq.cor}\n\n`;
              }
              
              assistantMessage += `- **Código SAP:** ${eq.codSap || 'Não disponível'}\n`;
              assistantMessage += `- **Preço sem IVA:** ${eq.pvpSemIva || 'N/A'}€\n`;
              
              if (eq.pvpComIva && eq.pvpComIva !== 'N/A') {
                assistantMessage += `- **Preço com IVA:** ${eq.pvpComIva}€\n`;
              }
              
              if (eq.garantia && eq.garantia !== 'N/A') {
                assistantMessage += `- **Garantia:** ${eq.garantia}\n`;
              }
              
              assistantMessage += `\n`;
            });
            
            assistantMessage += `---\n\n`;
          });
          
          if (totalFound > MAX_EQUIPMENTS) {
            assistantMessage += `\n💡 **Sugestão:** Refine a sua pesquisa para ver resultados mais específicos. Por exemplo:\n`;
            assistantMessage += `- Especifique a capacidade (ex: "256GB", "512GB")\n`;
            assistantMessage += `- Especifique a cor (ex: "Preto", "Branco")\n`;
            assistantMessage += `- Especifique o modelo exato\n`;
          }
        }
        
        // Save assistant message
        await insertChatMessage({
          userId: ctx.user.id,
          role: 'assistant',
          content: assistantMessage,
        });
        
        return {
          message: assistantMessage,
        };
      }),
    
    getHistory: protectedProcedure.query(async ({ ctx }) => {
      return await getUserChatHistory(ctx.user.id);
    }),
    
    clearHistory: protectedProcedure.mutation(async ({ ctx }) => {
      const db = await (await import('./db')).getDb();
      if (!db) {
        throw new Error('Database not available');
      }
      const { chatMessages } = await import('../drizzle/schema');
      const { eq } = await import('drizzle-orm');
      await db.delete(chatMessages).where(eq(chatMessages.userId, ctx.user.id));
      return { success: true };
    }),
  }),
});

export type AppRouter = typeof appRouter;
