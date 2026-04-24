import { db } from "./db";
import { chronicleQuestTemplates, chronicleQuestProgress } from "@shared/schema";
import { eq, and, lt, gte } from "drizzle-orm";
import { shellsService, SHELL_EARN_RATES } from "./shells-service";

export type QuestAction = 'npc_conversation' | 'story_choice' | 'estate_upgrade' | 'mission_complete' | 'era_visit' | 'interior_interaction';

class QuestsService {
  
  async getActiveQuests(userId: string) {
    const templates = await db.select().from(chronicleQuestTemplates)
      .where(eq(chronicleQuestTemplates.isActive, true))
      .orderBy(chronicleQuestTemplates.sortOrder);
    
    const progress = await db.select().from(chronicleQuestProgress)
      .where(eq(chronicleQuestProgress.userId, userId));
    
    const now = new Date();
    
    const quests = await Promise.all(templates.map(async (template) => {
      let userProgress = progress.find(p => p.questTemplateId === template.id);
      
      // Check if quest needs reset
      if (userProgress) {
        const periodStart = new Date(userProgress.periodStartedAt);
        const resetTime = new Date(periodStart.getTime() + template.resetHours * 60 * 60 * 1000);
        
        if (now >= resetTime) {
          // Reset the quest for new period
          await db.update(chronicleQuestProgress)
            .set({
              currentProgress: 0,
              completed: false,
              completedAt: null,
              rewardClaimedAt: null,
              periodStartedAt: now
            })
            .where(eq(chronicleQuestProgress.id, userProgress.id));
          
          userProgress = {
            ...userProgress,
            currentProgress: 0,
            completed: false,
            completedAt: null,
            rewardClaimedAt: null,
            periodStartedAt: now
          };
        }
      }
      
      return {
        id: template.id,
        code: template.code,
        title: template.title,
        description: template.description,
        questType: template.questType,
        category: template.category,
        requiredCount: template.requiredCount,
        shellReward: template.shellReward,
        bonusShellReward: template.bonusShellReward || 0,
        resetHours: template.resetHours,
        
        // Progress
        currentProgress: userProgress?.currentProgress || 0,
        completed: userProgress?.completed || false,
        rewardClaimed: !!userProgress?.rewardClaimedAt,
        
        // Time until reset
        periodStartedAt: userProgress?.periodStartedAt || null,
        nextResetAt: userProgress ? 
          new Date(new Date(userProgress.periodStartedAt).getTime() + template.resetHours * 60 * 60 * 1000) : 
          null
      };
    }));
    
    return {
      daily: quests.filter(q => q.questType === 'daily'),
      weekly: quests.filter(q => q.questType === 'weekly'),
      seasonal: quests.filter(q => q.questType === 'seasonal')
    };
  }
  
  async trackProgress(userId: string, action: QuestAction, count: number = 1): Promise<{
    questsUpdated: string[];
    questsCompleted: string[];
  }> {
    const templates = await db.select().from(chronicleQuestTemplates)
      .where(and(
        eq(chronicleQuestTemplates.isActive, true),
        eq(chronicleQuestTemplates.requiredAction, action)
      ));
    
    if (templates.length === 0) {
      return { questsUpdated: [], questsCompleted: [] };
    }
    
    const now = new Date();
    const questsUpdated: string[] = [];
    const questsCompleted: string[] = [];
    
    for (const template of templates) {
      // Get or create progress
      let [progress] = await db.select().from(chronicleQuestProgress)
        .where(and(
          eq(chronicleQuestProgress.userId, userId),
          eq(chronicleQuestProgress.questTemplateId, template.id)
        ));
      
      if (!progress) {
        [progress] = await db.insert(chronicleQuestProgress).values({
          userId,
          questTemplateId: template.id,
          currentProgress: 0,
          periodStartedAt: now
        }).returning();
      }
      
      // Check if needs reset
      const periodStart = new Date(progress.periodStartedAt);
      const resetTime = new Date(periodStart.getTime() + template.resetHours * 60 * 60 * 1000);
      
      if (now >= resetTime) {
        // Reset and start fresh
        await db.update(chronicleQuestProgress)
          .set({
            currentProgress: count,
            completed: count >= template.requiredCount,
            completedAt: count >= template.requiredCount ? now : null,
            rewardClaimedAt: null,
            periodStartedAt: now
          })
          .where(eq(chronicleQuestProgress.id, progress.id));
        
        questsUpdated.push(template.title);
        if (count >= template.requiredCount) {
          questsCompleted.push(template.title);
        }
        continue;
      }
      
      // Already completed this period
      if (progress.completed) {
        continue;
      }
      
      // Update progress
      const newProgress = Math.min(progress.currentProgress + count, template.requiredCount);
      const nowCompleted = newProgress >= template.requiredCount;
      
      await db.update(chronicleQuestProgress)
        .set({
          currentProgress: newProgress,
          completed: nowCompleted,
          completedAt: nowCompleted ? now : null
        })
        .where(eq(chronicleQuestProgress.id, progress.id));
      
      questsUpdated.push(template.title);
      if (nowCompleted) {
        questsCompleted.push(template.title);
      }
    }
    
    return { questsUpdated, questsCompleted };
  }
  
  async claimReward(userId: string, username: string, questTemplateId: string): Promise<{
    success: boolean;
    shellsAwarded?: number;
    message: string;
  }> {
    const [template] = await db.select().from(chronicleQuestTemplates)
      .where(eq(chronicleQuestTemplates.id, questTemplateId));
    
    if (!template) {
      return { success: false, message: "Quest not found" };
    }
    
    const [progress] = await db.select().from(chronicleQuestProgress)
      .where(and(
        eq(chronicleQuestProgress.userId, userId),
        eq(chronicleQuestProgress.questTemplateId, questTemplateId)
      ));
    
    if (!progress) {
      return { success: false, message: "Quest not started" };
    }
    
    if (!progress.completed) {
      return { success: false, message: "Quest not completed yet" };
    }
    
    if (progress.rewardClaimedAt) {
      return { success: false, message: "Reward already claimed" };
    }
    
    // Award shells
    const shellsAwarded = template.shellReward + (template.bonusShellReward || 0);
    
    await shellsService.addShells(
      userId,
      username,
      shellsAwarded,
      "earn",
      `Quest completed: ${template.title}`,
      `quest_${template.code}_${Date.now()}`,
      template.questType === 'daily' ? 'daily_quest_complete' : 'weekly_quest_complete'
    );
    
    // Mark as claimed
    await db.update(chronicleQuestProgress)
      .set({ rewardClaimedAt: new Date() })
      .where(eq(chronicleQuestProgress.id, progress.id));
    
    return {
      success: true,
      shellsAwarded,
      message: `Claimed ${shellsAwarded} Shells for completing ${template.title}!`
    };
  }
}

export const questsService = new QuestsService();

// Default quest templates - seeded on startup
const DEFAULT_QUESTS = [
  { code: 'daily_npc_chat_3', title: 'Social Butterfly', description: 'Have 3 conversations with NPCs', questType: 'daily', category: 'social', requiredAction: 'npc_conversation', requiredCount: 3, shellReward: 30, resetHours: 24, sortOrder: 1 },
  { code: 'daily_story_choice_2', title: 'Pathfinder', description: 'Make 2 story choices', questType: 'daily', category: 'story', requiredAction: 'story_choice', requiredCount: 2, shellReward: 25, resetHours: 24, sortOrder: 2 },
  { code: 'daily_build_1', title: 'Constructor', description: 'Build 1 structure on your estate', questType: 'daily', category: 'building', requiredAction: 'estate_upgrade', requiredCount: 1, shellReward: 35, resetHours: 24, sortOrder: 3 },
  { code: 'daily_interior_5', title: 'Homemaker', description: 'Interact with 5 objects in your home', questType: 'daily', category: 'lifestyle', requiredAction: 'interior_interaction', requiredCount: 5, shellReward: 40, resetHours: 24, sortOrder: 4 },
  { code: 'weekly_npc_chat_20', title: 'Community Pillar', description: 'Have 20 NPC conversations this week', questType: 'weekly', category: 'social', requiredAction: 'npc_conversation', requiredCount: 20, shellReward: 150, resetHours: 168, sortOrder: 10 },
  { code: 'weekly_story_10', title: 'Chronicle Weaver', description: 'Make 10 story choices this week', questType: 'weekly', category: 'story', requiredAction: 'story_choice', requiredCount: 10, shellReward: 120, resetHours: 168, sortOrder: 11 },
  { code: 'weekly_build_5', title: 'Master Builder', description: 'Build 5 structures this week', questType: 'weekly', category: 'building', requiredAction: 'estate_upgrade', requiredCount: 5, shellReward: 200, resetHours: 168, sortOrder: 12 },
  { code: 'weekly_interior_25', title: 'Domestic Champion', description: 'Interact with 25 objects in your home this week', questType: 'weekly', category: 'lifestyle', requiredAction: 'interior_interaction', requiredCount: 25, shellReward: 175, resetHours: 168, sortOrder: 13 },
];

// Auto-seed on startup - always add missing templates
(async () => {
  try {
    const existing = await db.select().from(chronicleQuestTemplates);
    const existingCodes = existing.map(q => q.code);
    
    let seeded = 0;
    for (const quest of DEFAULT_QUESTS) {
      if (!existingCodes.includes(quest.code)) {
        await db.insert(chronicleQuestTemplates).values(quest as any).onConflictDoNothing();
        seeded++;
      }
    }
    
    if (seeded > 0) {
      console.log("[Quests] Seeded", seeded, "new quest templates");
    }
    console.log("[Quests]", existing.length + seeded, "quest templates total");
  } catch (err) {
    console.warn("[Quests] Failed to seed quests:", err);
  }
})();
