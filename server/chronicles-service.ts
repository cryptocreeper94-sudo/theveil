/**
 * Chronicles - Game Service
 * Backend service for the Chronicles parallel life experience
 * Season Zero: 3 Playable Eras - Modern, Medieval, Wild West
 */

import { createHash } from "crypto";
import { db } from "./db";
import { eq, and, desc } from "drizzle-orm";
import OpenAI from "openai";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export const ERAS = {
  modern: { name: "Modern Era", years: "2000 - 2025 CE", color: "#3B82F6" },
  medieval: { name: "Medieval Era", years: "500 - 1500 CE", color: "#4A5568" },
  wildwest: { name: "Wild West Era", years: "1850 - 1900 CE", color: "#D97706" },
} as const;

export const ERA_SETTINGS: Record<string, { worldDescription: string; atmosphere: string }> = {
  modern: {
    worldDescription: "A sprawling modern metropolis where corporations, activists, tech disruptors, underground networks, and old-money dynasties battle for influence. Skyscrapers cast long shadows over street-level hustlers. Digital surveillance watches everything — or does it?",
    atmosphere: "neon-lit streets, glass towers, coffee shops buzzing with conspiracies, data centers humming with secrets",
  },
  medieval: {
    worldDescription: "A vast kingdom where noble houses, shadow operatives, merchant caravans, scholarly innovators, and druidic keepers of the old faith clash for dominion. Castle walls echo with whispered plots while taverns overflow with rumors of war.",
    atmosphere: "torchlit stone corridors, bustling market squares, dark forests, imposing castle battlements",
  },
  wildwest: {
    worldDescription: "The untamed frontier where law is what you make it. Railroad barons, outlaw gangs, frontier marshals, indigenous nations, and prospectors all stake their claim on a land that belongs to no one — and everyone. Dust, gunsmoke, and opportunity fill the air.",
    atmosphere: "sun-scorched dusty streets, creaking saloon doors, distant canyon echoes, campfires under vast starry skies",
  },
};

// ============================================
// FACTIONS - 5 per era (15 total for Season 0)
// ============================================

export const STARTER_FACTIONS = [
  // MEDIEVAL FACTIONS
  {
    id: "house_of_crowns",
    name: "House of Crowns",
    description: "The royal bloodlines seeking to maintain order through hereditary rule. They value tradition, stability, and the chain of command.",
    ideology: "order",
    color: "#D4AF37",
    iconEmoji: "👑",
    era: "medieval",
  },
  {
    id: "shadow_council",
    name: "The Shadow Council",
    description: "A secretive organization pulling strings from behind the scenes. They believe true power lies in information and manipulation.",
    ideology: "chaos",
    color: "#4A5568",
    iconEmoji: "🗝️",
    era: "medieval",
  },
  {
    id: "merchant_guild",
    name: "Merchant's Guild",
    description: "The economic powerhouse controlling trade routes. They seek balance through commerce and believe wealth equals influence.",
    ideology: "balance",
    color: "#10B981",
    iconEmoji: "⚖️",
    era: "medieval",
  },
  {
    id: "innovators_circle",
    name: "Innovator's Circle",
    description: "Forward-thinking visionaries pushing the boundaries of knowledge. They believe progress is the only path to salvation.",
    ideology: "progress",
    color: "#3B82F6",
    iconEmoji: "🔮",
    era: "medieval",
  },
  {
    id: "old_faith",
    name: "The Old Faith",
    description: "Keepers of ancient traditions and sacred rites. They protect the old ways and resist change that threatens their beliefs.",
    ideology: "tradition",
    color: "#8B4513",
    iconEmoji: "🌿",
    era: "medieval",
  },

  // MODERN ERA FACTIONS
  {
    id: "nexus_corp",
    name: "Nexus Corporation",
    description: "A mega-corporation that controls data, AI, and digital infrastructure. They believe technology should govern society for maximum efficiency.",
    ideology: "order",
    color: "#06B6D4",
    iconEmoji: "🏢",
    era: "modern",
  },
  {
    id: "signal_underground",
    name: "The Signal Underground",
    description: "Hackers, whistleblowers, and digital anarchists fighting corporate control. They weaponize transparency and believe information should be free.",
    ideology: "chaos",
    color: "#EF4444",
    iconEmoji: "📡",
    era: "modern",
  },
  {
    id: "civic_alliance",
    name: "Civic Alliance",
    description: "Community organizers, local politicians, and grassroots leaders. They believe real change happens from the ground up through democratic participation.",
    ideology: "balance",
    color: "#8B5CF6",
    iconEmoji: "🤝",
    era: "modern",
  },
  {
    id: "genesis_labs",
    name: "Genesis Labs",
    description: "Biotech pioneers and transhumanists pushing the limits of human potential. They see evolution as a choice, not a process.",
    ideology: "progress",
    color: "#22C55E",
    iconEmoji: "🧬",
    era: "modern",
  },
  {
    id: "old_guard",
    name: "The Old Guard",
    description: "Established families, legacy institutions, and traditionalists. They've held power for generations and have no intention of letting go.",
    ideology: "tradition",
    color: "#78716C",
    iconEmoji: "🏛️",
    era: "modern",
  },

  // WILD WEST ERA FACTIONS
  {
    id: "iron_star",
    name: "The Iron Star",
    description: "Federal marshals and lawmen bringing order to the frontier. They represent the long arm of the law — even when the nearest courthouse is 200 miles away.",
    ideology: "order",
    color: "#A1A1AA",
    iconEmoji: "⭐",
    era: "wildwest",
  },
  {
    id: "black_canyon_gang",
    name: "Black Canyon Gang",
    description: "Outlaws, bandits, and desperados who live outside the law. They rob trains, rustle cattle, and answer to no one. Freedom at any cost.",
    ideology: "chaos",
    color: "#1C1917",
    iconEmoji: "🤠",
    era: "wildwest",
  },
  {
    id: "pacific_railroad",
    name: "Pacific Railroad Company",
    description: "The railroad is coming, and with it comes civilization — or exploitation. They buy land, hire labor, and reshape the frontier in iron and steam.",
    ideology: "balance",
    color: "#B45309",
    iconEmoji: "🚂",
    era: "wildwest",
  },
  {
    id: "prospectors_union",
    name: "Prospector's Union",
    description: "Gold hunters, miners, and fortune seekers. They dig, pan, and blast their way to wealth. Every strike could change everything.",
    ideology: "progress",
    color: "#EAB308",
    iconEmoji: "⛏️",
    era: "wildwest",
  },
  {
    id: "first_nations",
    name: "The First Nations",
    description: "Indigenous peoples defending their ancestral lands and way of life. They hold ancient wisdom, deep connections to the land, and a fierce determination to survive.",
    ideology: "tradition",
    color: "#DC2626",
    iconEmoji: "🦅",
    era: "wildwest",
  },
];

// ============================================
// NARRATIVE ARCS - The core campaigns for each era
// ============================================

export const NARRATIVE_ARCS: Record<string, { id: string; chapter: number; requiredDecisions: number; title: string; description: string; rewardEcho: string }[]> = {
  modern: [
    { id: "mod_arc_1", chapter: 1, requiredDecisions: 3, title: "The Awakening", description: "You notice glitches in the city's digital fabric. Nexus Corp is looking for anomalies like you.", rewardEcho: "Echo of the Grid" },
    { id: "mod_arc_2", chapter: 2, requiredDecisions: 10, title: "The Signal's Reach", description: "The Underground approaches you with proof of the Convergence.", rewardEcho: "Echo of the Truth" },
    { id: "mod_arc_3", chapter: 3, requiredDecisions: 20, title: "Nexus Breach", description: "You infiltrate the quantum core. The truth of the timelines is revealed.", rewardEcho: "Echo of the First Chrononaut" }
  ],
  medieval: [
    { id: "med_arc_1", chapter: 1, requiredDecisions: 3, title: "The Whispering Woods", description: "The Old Faith senses a disruption in the leylines. They claim you are the cause.", rewardEcho: "Echo of the Ancient Tree" },
    { id: "med_arc_2", chapter: 2, requiredDecisions: 10, title: "The Shadow's Move", description: "The Shadow Council tries to recruit you to unlock an ancient vault.", rewardEcho: "Echo of the Secret Kingdom" },
    { id: "med_arc_3", chapter: 3, requiredDecisions: 20, title: "The Gateway Unearthed", description: "The vault opens, revealing technology that shouldn't exist in this era.", rewardEcho: "Echo of the Lost Age" }
  ],
  wildwest: [
    { id: "ww_arc_1", chapter: 1, requiredDecisions: 3, title: "The Strange Ore", description: "A prospector shows you a glowing crystal that defies physics. The Railroad wants it.", rewardEcho: "Echo of the Frontier" },
    { id: "ww_arc_2", chapter: 2, requiredDecisions: 10, title: "The Ghost Train", description: "A train carrying the crystals disappears into thin air. You are hired to find it.", rewardEcho: "Echo of the Vanishing Point" },
    { id: "ww_arc_3", chapter: 3, requiredDecisions: 20, title: "The Chronos Strike", description: "You discover the crystals power a temporal rift. You must decide who controls it.", rewardEcho: "Echo of the Chronos Strike" }
  ]
};

// ============================================
// QUESTS - Season Zero (all 3 eras)
// ~25 per era, 75+ total. Life situations, not missions.
// No railroading. No "correct" answers. Just life happening.
// Categories: arrival, life_event, encounter, crisis, opportunity,
//   moral_dilemma, community, partnership, conflict, exploration, education
// npcInvolved: connects situations to NPCs for relationship building
// relationshipImpact: which NPCs are affected by your choices
// educationalTheme: real knowledge woven into the experience naturally
// ============================================

export const SEASON_ZERO_QUESTS = [
  // =============================================
  // MEDIEVAL ERA (25 situations)
  // Themes: governance, justice, trade, land stewardship, loyalty, class, faith
  // =============================================
  {
    id: "med_arrival",
    title: "Arrival in the Realm",
    description: "You open your eyes on a dirt road. A merchant caravan passes — a woman notices you and stops. 'You look lost,' she says. 'These roads aren't safe after dark. Where are you headed?' You have no answer. You have nothing but the clothes on your back and a feeling that you belong here.",
    era: "medieval",
    difficulty: "easy",
    shellsReward: "50",
    experienceReward: 100,
    category: "arrival",
    npcInvolved: "Marcus Goldhand",
    educationalTheme: "Medieval travel and trade routes were the lifelines of civilization",
  },
  {
    id: "med_first_night",
    title: "A Roof Over Your Head",
    description: "Night falls. The tavern is warm but costs coin you don't have. A stable boy offers the hay loft for free. A hooded figure at the bar says they'll pay for your room — in exchange for a small favor tomorrow. A family near the hearth has an empty seat and a spare bowl of stew. Where do you sleep tonight?",
    era: "medieval",
    difficulty: "easy",
    shellsReward: "40",
    experienceReward: 80,
    category: "life_event",
    prerequisite: "med_arrival",
    educationalTheme: "Medieval inns and hospitality customs shaped social bonds between strangers",
  },
  {
    id: "med_market_day",
    title: "Market Day",
    description: "The town square erupts with activity. Farmers hawk vegetables, a blacksmith sharpens blades, a herbalist sells remedies. You overhear an argument — a merchant accusing a young girl of stealing bread. The girl says her family hasn't eaten in two days. The merchant says theft is theft. A crowd is gathering.",
    era: "medieval",
    difficulty: "easy",
    shellsReward: "60",
    experienceReward: 120,
    category: "moral_dilemma",
    prerequisite: "med_first_night",
    npcInvolved: "Marcus Goldhand",
    educationalTheme: "Medieval market economies operated on bartering, guild pricing, and trust",
  },
  {
    id: "med_faction_choice",
    title: "The Powers That Be",
    description: "Word of your arrival has spread. Five groups have taken notice. A royal messenger invites you to court. A cloaked figure slips a note under your door. The Guildmaster offers a business proposition over wine. Scholars invite you to observe an experiment. Druids ask you to walk with them in the forest. None demands loyalty — each simply wants to know who you are.",
    era: "medieval",
    difficulty: "medium",
    shellsReward: "100",
    experienceReward: 200,
    category: "encounter",
    prerequisite: "med_market_day",
    educationalTheme: "Medieval power was shared between nobility, church, merchants, scholars, and peasant communities",
  },
  {
    id: "med_the_trial",
    title: "The Trial",
    description: "A man stands accused of poaching deer from the lord's forest. His family is starving. The law is clear — poaching means losing a hand. The lord's steward asks the crowd for witnesses. You saw the man hunting. What do you say? The truth could save or destroy him.",
    era: "medieval",
    difficulty: "medium",
    shellsReward: "120",
    experienceReward: 220,
    category: "moral_dilemma",
    npcInvolved: "Lord Aldric",
    educationalTheme: "Medieval justice systems varied wildly — some fair, some brutal, all reflecting local power",
    relationshipImpact: ["Lord Aldric", "Marcus Goldhand"],
  },
  {
    id: "med_plague_rumor",
    title: "Whispers of Plague",
    description: "A traveler collapses at the town gate, covered in sores. Panic spreads. The healer says it could be plague — or just road sickness. The lord wants the gates sealed. Merchants say closing trade will starve the town faster than any sickness. The healer needs supplies from the next village to be sure. What matters more — caution or commerce?",
    era: "medieval",
    difficulty: "hard",
    shellsReward: "180",
    experienceReward: 350,
    category: "crisis",
    npcInvolved: "Marcus Goldhand",
    educationalTheme: "The Black Death killed 30-60% of Europe's population and reshaped society forever",
    relationshipImpact: ["Marcus Goldhand", "Lord Aldric"],
  },
  {
    id: "med_apprenticeship",
    title: "The Apprentice's Offer",
    description: "A master craftsman — the finest in the region — offers to teach you a trade. Blacksmithing, herbalism, carpentry, or scribing. The training takes months and the work is grueling. But a skilled trade means independence. Or you could skip the training and try your luck with something faster — the Shadow Council always needs runners.",
    era: "medieval",
    difficulty: "easy",
    shellsReward: "80",
    experienceReward: 150,
    category: "opportunity",
    educationalTheme: "Medieval guilds controlled trades through years-long apprenticeships — the original vocational education",
  },
  {
    id: "med_land_dispute",
    title: "The Boundary Stone",
    description: "Two farming families have been fighting over a strip of land for generations. Both have documents claiming ownership. Both families have fed you, helped you. Now they want you to settle it. The village elder is too old to decide. Whatever you choose, one family loses their livelihood.",
    era: "medieval",
    difficulty: "hard",
    shellsReward: "200",
    experienceReward: 400,
    category: "community",
    educationalTheme: "Land ownership in medieval times was the foundation of wealth, power, and social standing",
  },
  {
    id: "med_shadows_whisper",
    title: "Shadows Whisper",
    description: "An informant approaches at dusk with a sealed letter. 'Read it or burn it — your choice.' The letter contains evidence that a powerful noble has been secretly funding bandits who raid merchant caravans. Exposing this would shake the realm. Ignoring it keeps the peace. Selling it makes you rich. Using it as leverage makes you dangerous.",
    era: "medieval",
    difficulty: "hard",
    shellsReward: "200",
    experienceReward: 400,
    category: "moral_dilemma",
    npcInvolved: "Sera Nightwhisper",
    relationshipImpact: ["Sera Nightwhisper", "Lord Aldric", "Marcus Goldhand"],
    educationalTheme: "Espionage and political intrigue shaped medieval courts as much as armies did",
  },
  {
    id: "med_harvest_festival",
    title: "The Harvest Festival",
    description: "The autumn harvest is in, and the town celebrates. Music, dancing, competitions, feasts. The Guildmaster hosts a grand banquet. The Old Faith holds a bonfire ceremony in the grove. The castle throws a formal ball. Peasant families gather for a humble but joyful supper. Where you celebrate says something about who you're becoming here.",
    era: "medieval",
    difficulty: "easy",
    shellsReward: "60",
    experienceReward: 100,
    category: "life_event",
    educationalTheme: "Seasonal festivals were the social glue of medieval communities — marking time, gratitude, and identity",
  },
  {
    id: "med_merchant_run",
    title: "The Merchant's Road",
    description: "A caravan is heading through bandit territory with valuable goods. The Guildmaster needs someone trustworthy to ride along — not as a guard, but as a witness. If the goods arrive, you share in the profits. If the caravan is attacked, your testimony determines who's blamed. Marcus Goldhand is watching to see what kind of person you are.",
    era: "medieval",
    difficulty: "medium",
    shellsReward: "140",
    experienceReward: 280,
    category: "partnership",
    npcInvolved: "Marcus Goldhand",
    relationshipImpact: ["Marcus Goldhand"],
    educationalTheme: "Medieval trade caravans connected distant economies and spread culture, disease, and innovation",
  },
  {
    id: "med_castle_siege",
    title: "The Siege of Thornhold",
    description: "An army has surrounded a neighboring castle. Refugees pour in. Food is running low. The lord asks for volunteers to sneak through enemy lines for supplies. The Shadow Council offers a secret tunnel — for a price. The Old Faith says prayer will deliver salvation. Some say surrender is the wisest option when lives are at stake. What would you actually do?",
    era: "medieval",
    difficulty: "hard",
    shellsReward: "300",
    experienceReward: 500,
    category: "crisis",
    npcInvolved: "Lord Aldric",
    relationshipImpact: ["Lord Aldric", "Sera Nightwhisper"],
    educationalTheme: "Medieval sieges could last months — starvation was a weapon, and negotiation was a survival skill",
  },
  {
    id: "med_forbidden_book",
    title: "The Forbidden Text",
    description: "Deep in the monastery library, you find a book that shouldn't exist — written in a language you somehow understand. It describes principles of governance that challenge everything the nobility claims about divine right. A monk catches you reading it. He could report you, or he could be an ally. He simply asks: 'What do you think it means?'",
    era: "medieval",
    difficulty: "medium",
    shellsReward: "160",
    experienceReward: 300,
    category: "exploration",
    educationalTheme: "The preservation and suppression of knowledge shaped which ideas survived into the modern world",
  },
  {
    id: "med_orphan_children",
    title: "The Children of the Road",
    description: "A group of orphaned children live in the ruins outside town. They steal to survive. The townspeople want them driven away. A priest offers to take them in — but his orphanage is already overcrowded. You could teach them, find them work, give them shelter, or simply walk past. They're not your responsibility. Or are they?",
    era: "medieval",
    difficulty: "medium",
    shellsReward: "100",
    experienceReward: 200,
    category: "community",
    educationalTheme: "Child welfare in medieval times was left to churches and individual compassion — there was no safety net",
  },
  {
    id: "med_bridge_toll",
    title: "The Bridge Toll",
    description: "A local lord has erected a toll on the only bridge across the river, charging rates that farmers can barely afford. Trade is slowing. People are going hungry on both sides. The lord says he needs the money for road repairs. The merchants say he's lining his pockets. The bridge is technically his property. Is it right?",
    era: "medieval",
    difficulty: "medium",
    shellsReward: "130",
    experienceReward: 250,
    category: "moral_dilemma",
    educationalTheme: "Infrastructure control — bridges, roads, ports — has been a source of wealth and conflict throughout history",
  },
  {
    id: "med_wandering_knight",
    title: "The Wandering Knight",
    description: "A knight arrives in town, battered and exhausted. She claims to have been betrayed by her own house. She asks for shelter and a meal. Harboring a fugitive noble could bring trouble — or a powerful ally. She has skills, connections, and secrets. But her enemies may be close behind.",
    era: "medieval",
    difficulty: "medium",
    shellsReward: "150",
    experienceReward: 280,
    category: "encounter",
    educationalTheme: "Chivalry was more complex than fairy tales suggest — honor, obligation, and survival often conflicted",
    relationshipImpact: ["Lord Aldric"],
  },
  {
    id: "med_water_rights",
    title: "The Drying Well",
    description: "The town's main well is running dry. A wealthy landowner has dammed the upstream creek to water his private orchards. He's within his legal rights. But downstream, families, livestock, and crops are suffering. The lord refuses to intervene — the landowner is a generous donor to the castle. Do you accept this, or does water belong to everyone?",
    era: "medieval",
    difficulty: "hard",
    shellsReward: "200",
    experienceReward: 380,
    category: "community",
    educationalTheme: "Water rights disputes have shaped civilizations from ancient Mesopotamia to modern court battles",
  },
  {
    id: "med_forge_partnership",
    title: "A Partnership Proposal",
    description: "Marcus Goldhand sits across the table with two cups of wine. He has a proposition: pool resources to open a trading post on the crossroads. You provide the labor and local trust; he provides the capital and connections. Equal partners. But his contract has fine print, and in this world, a handshake might mean more than ink. Or less.",
    era: "medieval",
    difficulty: "medium",
    shellsReward: "170",
    experienceReward: 320,
    category: "partnership",
    npcInvolved: "Marcus Goldhand",
    relationshipImpact: ["Marcus Goldhand"],
    educationalTheme: "Business partnerships and contracts evolved from medieval merchant customs into modern corporate law",
  },
  {
    id: "med_enemy_wounded",
    title: "The Wounded Enemy",
    description: "You find a soldier from a rival faction bleeding in a ditch. He's badly hurt. He recognizes you and flinches. 'Just leave me,' he says. You could help him, end him, rob him, or walk away. Nobody would ever know. What do you do when nobody's watching?",
    era: "medieval",
    difficulty: "hard",
    shellsReward: "180",
    experienceReward: 350,
    category: "moral_dilemma",
    educationalTheme: "The treatment of enemies and prisoners reveals the true values of a society",
  },
  {
    id: "med_council_vote",
    title: "The Council Vote",
    description: "The town council is voting on whether to accept refugees from a war-torn neighboring region. Half the council fears the strain on resources. Half believe in compassion. Your voice has gained enough weight that they ask for your opinion before the vote. There's no easy answer — resources really are tight, and the refugees really are desperate.",
    era: "medieval",
    difficulty: "hard",
    shellsReward: "220",
    experienceReward: 420,
    category: "community",
    npcInvolved: "Lord Aldric",
    relationshipImpact: ["Lord Aldric"],
    educationalTheme: "Refugee crises have shaped borders, cultures, and politics throughout all of human history",
  },
  {
    id: "med_secret_heir",
    title: "The Secret Heir",
    description: "Sera Nightwhisper reveals that a child living among commoners is actually the last heir to a fallen noble house. Restoring the child could shift the balance of power entirely. But the child is happy where they are. Do they have a right to know? Does anyone else have a right to decide their future?",
    era: "medieval",
    difficulty: "hard",
    shellsReward: "250",
    experienceReward: 480,
    category: "moral_dilemma",
    npcInvolved: "Sera Nightwhisper",
    relationshipImpact: ["Sera Nightwhisper", "Lord Aldric"],
    educationalTheme: "Bloodline succession shaped kingdoms — but identity is more than lineage",
  },
  {
    id: "med_winter_coming",
    title: "Winter Preparations",
    description: "The first frost arrives early. Grain stores are low. The lord announces rationing. Wealthier families begin hoarding. A black market emerges. You have enough stored for yourself — maybe enough for one more family. But winter could be long, and sharing means risking your own survival. What kind of neighbor are you?",
    era: "medieval",
    difficulty: "medium",
    shellsReward: "140",
    experienceReward: 260,
    category: "life_event",
    educationalTheme: "Surviving medieval winters required community cooperation — individual survival was rarely possible alone",
  },
  {
    id: "med_false_accusation",
    title: "The Accusation",
    description: "Someone has accused you of a crime you didn't commit. The evidence is circumstantial but convincing. Your reputation, your relationships, everything you've built hangs in the balance. You know who actually did it — a friend. Do you name them? Prove your innocence another way? Accept the punishment to protect them?",
    era: "medieval",
    difficulty: "hard",
    shellsReward: "240",
    experienceReward: 460,
    category: "conflict",
    educationalTheme: "Medieval justice had no presumption of innocence — character witnesses and oaths mattered more than evidence",
  },
  {
    id: "med_traveling_scholars",
    title: "The Traveling Scholars",
    description: "A group of scholars from a distant land arrives with knowledge of mathematics, astronomy, and medicine far beyond anything known locally. Some call them heretics. Others see salvation. They offer to teach anyone willing to learn. The local religious authority says their ideas are dangerous. Knowledge or faith — must it be a choice?",
    era: "medieval",
    difficulty: "medium",
    shellsReward: "160",
    experienceReward: 300,
    category: "education",
    educationalTheme: "Islamic Golden Age scholars preserved and advanced Greek, Persian, and Indian knowledge that later sparked the Renaissance",
  },
  {
    id: "med_your_legacy",
    title: "What You Leave Behind",
    description: "A stone carver offers to chisel your name into the new bridge you helped build. For the first time, you realize you're part of this place. People know your name, tell stories about you, ask your advice. The merchant, the lord, the spy, the scholar — they all have opinions about who you've become. But only you know the truth of your choices. What kind of legacy are you building?",
    era: "medieval",
    difficulty: "medium",
    shellsReward: "200",
    experienceReward: 400,
    category: "life_event",
    educationalTheme: "Legacy in the medieval world was measured by deeds, not wealth — a bridge outlasts a fortune",
  },

  // =============================================
  // MODERN ERA (25 situations)
  // Themes: technology, privacy, economics, civic duty, identity, media, ethics
  // =============================================
  {
    id: "mod_new_city",
    title: "Welcome to the City",
    description: "You step off the bus into a city that hums with energy. Skyscrapers reflect clouds. Your phone buzzes — an app you don't remember installing says 'Welcome home' with a pin drop at an apartment that apparently has your name on the lease. The city knows you're here. The question is: who told it?",
    era: "modern",
    difficulty: "easy",
    shellsReward: "50",
    experienceReward: 100,
    category: "arrival",
    educationalTheme: "Smart cities use data from phones, cameras, and IoT devices to track movement and optimize services",
  },
  {
    id: "mod_first_morning",
    title: "Your First Morning",
    description: "You wake up to the city soundtrack — traffic, distant music, a notification chime. Your fridge is empty. You have a transit card but no idea where anything is. A neighbor knocks — introduces herself, offers coffee and directions. She mentions a community board downstairs with job listings, events, and local services. Simple morning. Real choices about where to start.",
    era: "modern",
    difficulty: "easy",
    shellsReward: "40",
    experienceReward: 80,
    category: "life_event",
    prerequisite: "mod_new_city",
    educationalTheme: "Community bulletin boards — physical and digital — are how neighborhoods actually function day to day",
  },
  {
    id: "mod_job_hunt",
    title: "The Job Hunt",
    description: "Three opportunities, three very different paths. A corporate position at Nexus Corp with great pay but invasive monitoring. A community nonprofit that pays barely enough to cover rent but does meaningful work. A freelance gig with no stability but total freedom. Your bank account says pick the money. Your gut says something else.",
    era: "modern",
    difficulty: "easy",
    shellsReward: "70",
    experienceReward: 130,
    category: "opportunity",
    prerequisite: "mod_first_morning",
    npcInvolved: "Dr. Elena Voss",
    educationalTheme: "The modern gig economy has fundamentally changed how people think about work, security, and purpose",
    relationshipImpact: ["Dr. Elena Voss", "Mayor Diana Reyes"],
  },
  {
    id: "mod_faction_choice",
    title: "Circles of Influence",
    description: "You've been in the city long enough to notice the currents beneath the surface. Nexus Corp dominates tech. The Signal Underground fights in the digital shadows. The Civic Alliance organizes neighborhoods. Genesis Labs pushes human boundaries. The Old Guard controls old money. None recruit — they simply exist, and gravitation is natural. Who do you find yourself drawn to?",
    era: "modern",
    difficulty: "medium",
    shellsReward: "100",
    experienceReward: 200,
    category: "encounter",
    prerequisite: "mod_job_hunt",
    educationalTheme: "Social circles shape opportunity — networking is the modern equivalent of medieval guild membership",
  },
  {
    id: "mod_privacy_dilemma",
    title: "The Smart Mirror",
    description: "Your apartment comes with a smart home system that learns your habits. It's convenient — it adjusts lighting, orders groceries, even suggests what to wear based on your calendar. Then you discover it's also logging everything. Conversations. Sleep patterns. Who visits. The company says it's anonymized. A privacy advocate says that's impossible. Do you keep the convenience or unplug it all?",
    era: "modern",
    difficulty: "medium",
    shellsReward: "130",
    experienceReward: 250,
    category: "moral_dilemma",
    educationalTheme: "Data privacy is the civil rights issue of the digital age — convenience always has a cost",
  },
  {
    id: "mod_data_heist",
    title: "The Data Breach",
    description: "Someone leaked classified Nexus Corp files showing the company has been selling user health data to insurance companies. The files land in your inbox — you don't know why. Ghost from the Underground says publish them. Dr. Voss says they're fabricated. The truth is probably somewhere in between. You have 24 hours before the story breaks with or without you.",
    era: "modern",
    difficulty: "hard",
    shellsReward: "250",
    experienceReward: 400,
    category: "crisis",
    npcInvolved: "Kai 'Ghost' Reeves",
    relationshipImpact: ["Kai 'Ghost' Reeves", "Dr. Elena Voss"],
    educationalTheme: "Whistleblowing has exposed everything from Watergate to NSA surveillance — truth-telling has consequences",
  },
  {
    id: "mod_election",
    title: "Election Season",
    description: "The city council election is heating up. Three candidates with real differences. One wants to expand surveillance for safety. One wants to defund tech contracts and invest in communities. One wants to privatize public services for efficiency. Each has merits. Each has risks. A local journalist asks for your take on camera. Do you speak up?",
    era: "modern",
    difficulty: "medium",
    shellsReward: "180",
    experienceReward: 340,
    category: "community",
    npcInvolved: "Mayor Diana Reyes",
    relationshipImpact: ["Mayor Diana Reyes"],
    educationalTheme: "Local elections shape daily life more than national ones — zoning, policing, schools, transit",
  },
  {
    id: "mod_startup",
    title: "The Startup Pitch",
    description: "You have an idea — maybe it came from a problem you noticed, maybe from a late-night conversation. A venture capital firm is listening. Their money could make it real, but their terms give them 60% control and the right to pivot your vision. A community investment group offers less money but lets you keep your soul. Or you could bootstrap it alone and maybe never launch.",
    era: "modern",
    difficulty: "medium",
    shellsReward: "150",
    experienceReward: 300,
    category: "opportunity",
    educationalTheme: "Startup funding structures determine who actually controls innovation — equity, control, and vision rarely align",
  },
  {
    id: "mod_social_media_storm",
    title: "Going Viral",
    description: "A video of you surfaces online — taken out of context, it makes you look terrible. Within hours, strangers are commenting, sharing, judging. Some people defend you. Some pile on. Your employer sees it. Your friends see it. You could fight it publicly, ignore it and wait for it to pass, or try to get it taken down. Welcome to the reputation economy.",
    era: "modern",
    difficulty: "hard",
    shellsReward: "200",
    experienceReward: 380,
    category: "crisis",
    educationalTheme: "Cancel culture, context collapse, and viral shame have real psychological and economic consequences",
  },
  {
    id: "mod_neighbor_trouble",
    title: "The Noise Complaint",
    description: "Your upstairs neighbor plays music until 3am every night. You've asked politely twice. The building management shrugs. You could escalate legally, confront them directly, organize other affected tenants, invest in earplugs, or get creative. It's a small problem. But small problems reveal character.",
    era: "modern",
    difficulty: "easy",
    shellsReward: "50",
    experienceReward: 90,
    category: "life_event",
    educationalTheme: "Conflict resolution skills — negotiation, mediation, escalation — apply to everything from neighbors to nations",
  },
  {
    id: "mod_blackout",
    title: "City Blackout",
    description: "The power grid fails across the entire city. No phones, no internet, no ATMs. In the sudden dark, you hear glass breaking nearby. A family in your building has a baby that needs formula. An elderly man three floors down is on oxygen. The backup generator in the basement could power one floor — yours or theirs. The blackout could last hours or days. Nobody's watching what you do.",
    era: "modern",
    difficulty: "hard",
    shellsReward: "280",
    experienceReward: 480,
    category: "crisis",
    educationalTheme: "Infrastructure resilience — power grids, water systems, communication networks — is the invisible backbone of civilization",
  },
  {
    id: "mod_protest",
    title: "The March",
    description: "Thousands take to the streets after a controversial police shooting. Some march peacefully. Some are angry. Counter-protestors gather. Police line up. Media helicopters circle. Your friend calls — they're at the front line. Your boss texts — 'Don't get involved.' Your conscience says something different. There is no neutral ground. Even staying home is a choice.",
    era: "modern",
    difficulty: "medium",
    shellsReward: "160",
    experienceReward: 300,
    category: "community",
    educationalTheme: "Civil disobedience has changed laws and toppled regimes — from Gandhi to the Civil Rights Movement",
  },
  {
    id: "mod_ai_interview",
    title: "The Algorithm",
    description: "You apply for a job and discover the first interview is with an AI. It analyzes your facial expressions, word choice, and response time. You find out it's rejected 73% of candidates before a human ever sees their resume. You could play the system, protest it, or help build a fairer alternative. Dr. Voss says it's the future. Ghost says it's digital discrimination.",
    era: "modern",
    difficulty: "medium",
    shellsReward: "140",
    experienceReward: 270,
    category: "moral_dilemma",
    npcInvolved: "Dr. Elena Voss",
    relationshipImpact: ["Dr. Elena Voss", "Kai 'Ghost' Reeves"],
    educationalTheme: "AI bias in hiring, lending, and policing is a documented problem with real impact on real people",
  },
  {
    id: "mod_rent_crisis",
    title: "The Rent Hike",
    description: "Your landlord announces a 40% rent increase. It's legal — but it'll push half the building's tenants out, including families who've been here for decades. A tenant's union is forming. A developer is buying up buildings in the neighborhood. Mayor Reyes says her hands are tied. You could organize, negotiate, find a new place, or buy in and become part of the change — or the problem.",
    era: "modern",
    difficulty: "hard",
    shellsReward: "220",
    experienceReward: 400,
    category: "community",
    npcInvolved: "Mayor Diana Reyes",
    relationshipImpact: ["Mayor Diana Reyes"],
    educationalTheme: "Gentrification, housing policy, and rent control are among the most debated economic issues globally",
  },
  {
    id: "mod_crypto_opportunity",
    title: "The Investment",
    description: "A friend shows you a cryptocurrency that's doubled in value this week. 'Get in now before it moons.' Another friend lost their savings in a similar scheme last year. A financial advisor says invest in index funds and wait 20 years. Your rent is due next week. Quick money or slow wealth? Risk or security? Everyone has advice. Nobody has your bills.",
    era: "modern",
    difficulty: "medium",
    shellsReward: "120",
    experienceReward: 230,
    category: "opportunity",
    educationalTheme: "Financial literacy — understanding risk, compound interest, and speculation — is rarely taught but always needed",
  },
  {
    id: "mod_ghost_partnership",
    title: "Ghost's Proposition",
    description: "Kai 'Ghost' Reeves contacts you through an encrypted channel. They want to build a decentralized platform — social media without corporate control, owned by users. It's idealistic and technically ambitious. Ghost has the skills but needs someone the community trusts as a public face. Partnering with Ghost could change things. It could also put a target on your back.",
    era: "modern",
    difficulty: "medium",
    shellsReward: "170",
    experienceReward: 320,
    category: "partnership",
    npcInvolved: "Kai 'Ghost' Reeves",
    relationshipImpact: ["Kai 'Ghost' Reeves", "Dr. Elena Voss"],
    educationalTheme: "Decentralized technology — blockchain, DAOs, open source — challenges traditional power structures",
  },
  {
    id: "mod_health_scare",
    title: "The Diagnosis",
    description: "A routine checkup reveals something unexpected. It might be nothing — or it might change everything. The specialist has a three-month waiting list unless you can pay out of pocket. Your insurance covers 60%. A friend knows a clinic that treats people regardless of ability to pay, but it's across the city and overloaded. Healthcare is a right — or is it a privilege?",
    era: "modern",
    difficulty: "hard",
    shellsReward: "190",
    experienceReward: 360,
    category: "life_event",
    educationalTheme: "Healthcare access and affordability varies enormously by country — systems reflect societal values",
  },
  {
    id: "mod_mentor_or_rival",
    title: "The Corner Office",
    description: "Your colleague got the promotion you deserved. You know it. They probably know it too. They offer to mentor you for the next one. Is it genuine, or are they managing a threat? You could accept gracefully, compete harder, undermine them, or leave entirely and build something of your own. Professional relationships are never just professional.",
    era: "modern",
    difficulty: "medium",
    shellsReward: "130",
    experienceReward: 240,
    category: "conflict",
    educationalTheme: "Workplace dynamics — mentorship, rivalry, office politics — shape careers as much as talent does",
  },
  {
    id: "mod_family_call",
    title: "The Phone Call",
    description: "A family member calls asking for money. Again. You love them. They have a pattern. Saying yes enables the cycle. Saying no might break the relationship. Setting boundaries sounds healthy in theory but feels cruel in practice. There's no manual for this. Just you, and a ringing phone, and everything that comes with family.",
    era: "modern",
    difficulty: "medium",
    shellsReward: "110",
    experienceReward: 200,
    category: "life_event",
    educationalTheme: "Codependency, boundaries, and family systems affect every culture and every generation",
  },
  {
    id: "mod_community_garden",
    title: "The Empty Lot",
    description: "An abandoned lot in your neighborhood could become a community garden, a parking structure, or affordable housing units. The city council is taking input. Each option helps different people. Each option has real costs. The community is divided. Mayor Reyes asks you to help facilitate the discussion. Can you bring people together when everyone wants something different?",
    era: "modern",
    difficulty: "medium",
    shellsReward: "150",
    experienceReward: 280,
    category: "community",
    npcInvolved: "Mayor Diana Reyes",
    relationshipImpact: ["Mayor Diana Reyes"],
    educationalTheme: "Urban planning decisions shape neighborhoods for generations — community input matters enormously",
  },
  {
    id: "mod_deepfake",
    title: "The Deepfake",
    description: "A realistic deepfake video surfaces showing a local politician saying terrible things. It's clearly fake — but most people watching won't know that. It could swing the election. Ghost could prove it's fake within hours. But Ghost asks: 'What if the politician is actually worse than the video? Does the truth about the fake matter?' Ethics in the age of synthetic media.",
    era: "modern",
    difficulty: "hard",
    shellsReward: "230",
    experienceReward: 440,
    category: "moral_dilemma",
    npcInvolved: "Kai 'Ghost' Reeves",
    relationshipImpact: ["Kai 'Ghost' Reeves", "Mayor Diana Reyes"],
    educationalTheme: "Deepfakes and synthetic media threaten the foundation of shared truth in democratic societies",
  },
  {
    id: "mod_side_hustle",
    title: "The Side Hustle",
    description: "You discover a legal gray area — a service nobody else is providing because the regulations haven't caught up with technology. It's profitable. It helps people. But when regulators notice, you might be the test case. Do you build it while you can, get ahead of the rules, or wait for permission that might never come?",
    era: "modern",
    difficulty: "medium",
    shellsReward: "140",
    experienceReward: 260,
    category: "opportunity",
    educationalTheme: "Regulatory lag — when laws can't keep up with innovation — creates both opportunity and risk",
  },
  {
    id: "mod_old_friend",
    title: "The Old Friend",
    description: "Someone from your past shows up in the city. They're in trouble — not legal trouble, life trouble. They burned bridges with almost everyone else. You were always the one they could count on. Helping them will cost you time, energy, maybe money. Not helping them is easier. But you remember who they used to be, before things went wrong.",
    era: "modern",
    difficulty: "medium",
    shellsReward: "120",
    experienceReward: 220,
    category: "encounter",
    educationalTheme: "Loyalty, forgiveness, and the limits of compassion are universal human questions with no clean answers",
  },
  {
    id: "mod_your_impact",
    title: "The Profile",
    description: "A journalist is writing about people who've made a difference in the city. They want to feature you. Looking back, you see the ripple effects of every choice — relationships built or broken, trust earned or spent, community shaped by your presence. The journalist asks one question: 'What drives you?' There's no right answer. Only your answer.",
    era: "modern",
    difficulty: "medium",
    shellsReward: "200",
    experienceReward: 380,
    category: "life_event",
    educationalTheme: "Self-reflection and understanding your own motivations is the foundation of emotional intelligence",
  },
  {
    id: "mod_digital_legacy",
    title: "Digital Legacy",
    description: "A renowned tech pioneer has died, leaving behind a massive digital footprint — encrypted files, AI models trained on personal data, social media accounts with millions of followers, and a controversial AI chatbot modeled on their personality. Their family wants it all deleted. Their company wants to keep the AI running. You've been asked to mediate.",
    era: "modern",
    difficulty: "hard",
    shellsReward: "260",
    experienceReward: 460,
    category: "moral_dilemma",
    npcInvolved: "Dr. Elena Voss",
    educationalTheme: "Digital rights, data sovereignty, AI ethics, posthumous consent",
    relationshipImpact: ["Dr. Elena Voss"],
    choices: [
      { id: "a", text: "Honor the family's wishes — delete everything. A person's digital remains belong to their loved ones, not a corporation.", hint: "Prioritizes human dignity and family rights over commercial interests" },
      { id: "b", text: "Preserve the AI and public legacy — this person contributed to humanity's knowledge. Deleting it erases their impact.", hint: "Values collective progress and the idea that great contributions transcend individual ownership" },
      { id: "c", text: "Find a middle ground — archive the data under independent oversight, shut down the chatbot, and let the family control access.", hint: "Seeks compromise through institutional safeguards and shared governance" },
    ],
  },

  // =============================================
  // WILD WEST ERA (25 situations)
  // Themes: law, freedom, land rights, survival, community building, cultural respect, justice
  // =============================================
  {
    id: "ww_ride_into_town",
    title: "Ride Into Town",
    description: "Your horse is tired, your canteen is empty, and the town of Dust Creek appears on the horizon. Sun-baked buildings, a water trough, the distant ring of a blacksmith's hammer. A stranger tips his hat as you dismount. 'You look like you've got a story,' he says. 'Everyone here does.' The question is — what's yours going to be?",
    era: "wildwest",
    difficulty: "easy",
    shellsReward: "50",
    experienceReward: 100,
    category: "arrival",
    educationalTheme: "Frontier towns grew around water, trade routes, and railheads — location was everything",
  },
  {
    id: "ww_first_drink",
    title: "The Saloon",
    description: "You push through the swinging doors of the Last Chance Saloon. A piano player nods. A card game is running in the corner. Rattlesnake Rosa holds court at the back table, laughing with her crew. The barkeeper slides a glass across the counter. 'First one's on the house,' he says. 'Second one costs ya.' You take a seat. People size you up. This is where reputations start.",
    era: "wildwest",
    difficulty: "easy",
    shellsReward: "40",
    experienceReward: 80,
    category: "life_event",
    prerequisite: "ww_ride_into_town",
    npcInvolved: "Rattlesnake Rosa",
    educationalTheme: "Saloons were the social centers of frontier towns — part bar, part town hall, part employment office",
  },
  {
    id: "ww_claim_stake",
    title: "Staking a Claim",
    description: "Empty land stretches in every direction. The land office has plots available — farmland near the creek, a hillside with potential mineral deposits, or a lot on Main Street. Each costs different amounts and offers different futures. A rancher warns you about the creek flooding. A miner swears the hill is worthless. The shopkeeper says Main Street is the only smart bet. Nobody's lying. Nobody's telling the whole truth either.",
    era: "wildwest",
    difficulty: "easy",
    shellsReward: "70",
    experienceReward: 130,
    category: "opportunity",
    prerequisite: "ww_first_drink",
    educationalTheme: "The Homestead Act of 1862 gave 160 acres to anyone willing to improve the land for five years",
  },
  {
    id: "ww_faction_choice",
    title: "Where You Stand",
    description: "After a few weeks in Dust Creek, the lines become clear. Marshal Colton keeps the peace with a badge and a rifle. Rosa's gang operates outside the law but protects their own. The Pacific Railroad company is buying everything they can. Prospectors chase fortune in the hills. The First Nations watch from the ridgeline, wary of everything. Nobody asks you to join. They just notice where you show up.",
    era: "wildwest",
    difficulty: "medium",
    shellsReward: "100",
    experienceReward: 200,
    category: "encounter",
    prerequisite: "ww_claim_stake",
    educationalTheme: "The frontier was shaped by competing interests — law, commerce, survival, and indigenous sovereignty",
  },
  {
    id: "ww_water_war",
    title: "The Water War",
    description: "The creek is drying up. Ranchers need it for cattle. Farmers need it for crops. The railroad company is diverting water for their steam engines. The First Nations say the creek is sacred and was promised to them by treaty. Everyone has a claim. Nobody has enough. Marshal Colton asks for volunteers to help negotiate. Rosa says negotiation is a waste of time — just blow the railroad dam.",
    era: "wildwest",
    difficulty: "hard",
    shellsReward: "220",
    experienceReward: 420,
    category: "crisis",
    npcInvolved: "Marshal Jake Colton",
    relationshipImpact: ["Marshal Jake Colton", "Rattlesnake Rosa", "Chief Running Bear"],
    educationalTheme: "Water wars shaped the American West — and continue to shape the modern world from California to the Middle East",
  },
  {
    id: "ww_train_robbery",
    title: "The Train Job",
    description: "A train carrying a fortune in gold is crossing Black Canyon tomorrow. Rosa's crew is planning to hit it. The marshals know something's coming but not when. The railroad is offering a bounty for information. The gold belongs to a mining company that exploited its workers to dig it up. There's no clean side. There's just the gold, the canyon, and what you're willing to do.",
    era: "wildwest",
    difficulty: "hard",
    shellsReward: "300",
    experienceReward: 500,
    category: "conflict",
    npcInvolved: "Rattlesnake Rosa",
    relationshipImpact: ["Rattlesnake Rosa", "Marshal Jake Colton"],
    educationalTheme: "Train robberies were rarer than fiction suggests but they exposed tensions between corporate wealth and frontier poverty",
  },
  {
    id: "ww_gold_strike",
    title: "Gold Strike!",
    description: "A prospector stumbles into the saloon, trembling and wild-eyed. He's found a massive gold vein in the hills. Within an hour, half the town is saddling up. Claims are being staked with guns drawn. The prospector himself is terrified — he just wanted enough to feed his family. Now he's started a rush that could make fortunes or end lives. The hills aren't empty either. The First Nations hunt there.",
    era: "wildwest",
    difficulty: "medium",
    shellsReward: "180",
    experienceReward: 340,
    category: "crisis",
    npcInvolved: "Chief Running Bear",
    relationshipImpact: ["Chief Running Bear"],
    educationalTheme: "Gold rushes — from 1849 California to 1890s Klondike — transformed landscapes, displaced peoples, and built cities overnight",
  },
  {
    id: "ww_justice_question",
    title: "Frontier Justice",
    description: "A man is caught stealing horses. Horse theft on the frontier is punishable by hanging. The man says the horses belonged to his family before they were swindled by a crooked deal. He has no proof but his word. The owner wants him swung from the nearest tree. Marshal Colton says the law is the law. You know the owner isn't exactly honest either. Is justice about the law, or about what's right?",
    era: "wildwest",
    difficulty: "hard",
    shellsReward: "200",
    experienceReward: 380,
    category: "moral_dilemma",
    npcInvolved: "Marshal Jake Colton",
    relationshipImpact: ["Marshal Jake Colton"],
    educationalTheme: "Frontier justice evolved from vigilante committees to formal courts — the transition defined American law",
  },
  {
    id: "ww_showdown",
    title: "High Noon",
    description: "Someone you've crossed — or who's crossed you — has called you out. They'll be on Main Street at noon. The whole town knows. Walking away means losing face in a place where reputation is survival. Showing up means risking your life over pride. Or maybe there's another way. Maybe talking. Maybe leaving town. Maybe finding out what's really behind this.",
    era: "wildwest",
    difficulty: "hard",
    shellsReward: "250",
    experienceReward: 450,
    category: "conflict",
    educationalTheme: "The 'western showdown' was mostly myth — but the code of honor behind it shaped real frontier behavior",
  },
  {
    id: "ww_cattle_drive",
    title: "The Long Drive",
    description: "500 head of cattle need to reach the railhead 200 miles north. The rancher is offering good pay for hands willing to ride. It's three weeks of dust, danger, and dawn-to-dusk work. River crossings, rattlesnakes, rustlers, and storms. But the money is real, the stars are incredible, and by the end, you'll know exactly what you're made of.",
    era: "wildwest",
    difficulty: "medium",
    shellsReward: "160",
    experienceReward: 300,
    category: "life_event",
    educationalTheme: "Cattle drives moved millions of animals across the Plains — they built the beef industry and the cowboy mythos",
  },
  {
    id: "ww_sacred_land",
    title: "Sacred Ground",
    description: "The railroad wants to blast through a canyon that the First Nations consider sacred. Running Bear asks you to come see it before you form an opinion. Standing in the canyon, you understand — thousands of years of history are carved into these walls. The railroad engineer says rerouting adds $2 million and six months. Both sides are prepared to fight. Can anything bridge this gap?",
    era: "wildwest",
    difficulty: "hard",
    shellsReward: "280",
    experienceReward: 520,
    category: "moral_dilemma",
    npcInvolved: "Chief Running Bear",
    relationshipImpact: ["Chief Running Bear", "Marshal Jake Colton"],
    educationalTheme: "Indigenous land rights and sacred sites remain contested today — Standing Rock, Bears Ears, Uluru",
  },
  {
    id: "ww_schoolhouse",
    title: "The Schoolhouse",
    description: "Dust Creek has children but no school. A retired teacher offers to start one if the town builds the building. Some families say education is a luxury they can't afford — kids need to work. Others say it's the only way this town has a future. The First Nations ask if their children are welcome, and if their knowledge will be respected alongside books.",
    era: "wildwest",
    difficulty: "medium",
    shellsReward: "140",
    experienceReward: 260,
    category: "community",
    educationalTheme: "Public education on the frontier was often a community decision — and debates about curriculum echo to this day",
  },
  {
    id: "ww_snake_oil",
    title: "The Medicine Show",
    description: "A traveling showman arrives with a wagon full of 'miracle cures.' He's charming, convincing, and people are buying. Some of his tonics are just colored water. But the town has no doctor, and some people are genuinely sick. One woman swears his remedy helped her arthritis. The showman offers you a cut if you endorse him publicly. Harmless hustle or dangerous fraud?",
    era: "wildwest",
    difficulty: "medium",
    shellsReward: "120",
    experienceReward: 230,
    category: "moral_dilemma",
    educationalTheme: "Patent medicine fraud led to the creation of the FDA in 1906 — consumer protection was born from frontier cons",
  },
  {
    id: "ww_rosa_favor",
    title: "Rosa's Favor",
    description: "Rattlesnake Rosa approaches you quietly. One of her crew is injured and she needs medicine from the next town. She can't ride in openly — there's a bounty on her head. She's asking you because you're not connected to the gang. Helping her means crossing the marshal. Refusing might make an enemy of the most dangerous woman in the territory. She says: 'I remember who helps me. And who doesn't.'",
    era: "wildwest",
    difficulty: "medium",
    shellsReward: "150",
    experienceReward: 280,
    category: "partnership",
    npcInvolved: "Rattlesnake Rosa",
    relationshipImpact: ["Rattlesnake Rosa", "Marshal Jake Colton"],
    educationalTheme: "Outlaw loyalty and frontier codes of honor operated outside the law but created their own social contracts",
  },
  {
    id: "ww_mine_collapse",
    title: "The Mine Collapse",
    description: "A section of the Prospector's Union mine collapses with twelve miners trapped inside. Rescue is dangerous — the tunnels are unstable. The mining company says wait for engineers from the city (three days away). The trapped miners' families beg for immediate action. You could help dig, organize the rescue, pressure the company, or help the families prepare for the worst.",
    era: "wildwest",
    difficulty: "hard",
    shellsReward: "240",
    experienceReward: 460,
    category: "crisis",
    educationalTheme: "Mining disasters drove the labor movement — safety regulations were written in blood",
  },
  {
    id: "ww_poker_game",
    title: "The Big Game",
    description: "A high-stakes poker game is happening at the saloon. The buy-in is everything you've saved. The players include a railroad executive, Rosa's second-in-command, a mysterious stranger, and the town banker. It's not just about cards — deals are made at this table, alliances forged, secrets traded. The real game isn't poker. It's politics.",
    era: "wildwest",
    difficulty: "medium",
    shellsReward: "130",
    experienceReward: 240,
    category: "opportunity",
    educationalTheme: "Gambling halls were where frontier business actually happened — poker was networking before networking existed",
  },
  {
    id: "ww_drought",
    title: "The Drought",
    description: "Three months without rain. The creek is a trickle. Crops are dying. Cattle are thin. The town well drops lower every day. People start to leave. Those who stay need a plan — ration water, dig deeper wells, pray for rain, or abandon Dust Creek entirely. Running Bear says his people have survived droughts for centuries. Will the town listen?",
    era: "wildwest",
    difficulty: "hard",
    shellsReward: "210",
    experienceReward: 400,
    category: "crisis",
    npcInvolved: "Chief Running Bear",
    relationshipImpact: ["Chief Running Bear"],
    educationalTheme: "Drought shaped western expansion — entire towns vanished when water ran out, and water management became existential",
  },
  {
    id: "ww_newcomers",
    title: "The Newcomers",
    description: "A group of Chinese immigrants arrives seeking work on the railroad. Some townspeople welcome the labor. Others want them gone. The railroad company pays them half what they pay white workers. The newcomers set up a camp outside town and keep to themselves. One of them is a skilled doctor. Another is an engineer. They're not asking for charity — just a fair chance.",
    era: "wildwest",
    difficulty: "hard",
    shellsReward: "200",
    experienceReward: 380,
    category: "community",
    educationalTheme: "Chinese immigrants built the Transcontinental Railroad and faced the Chinese Exclusion Act of 1882 — the first racial immigration ban",
  },
  {
    id: "ww_land_grab",
    title: "The Land Rush",
    description: "The government announces that a section of land will be opened for settlement next month. First come, first served. Thousands will race to stake claims. The land is currently used by the First Nations for seasonal hunting. It's technically 'unoccupied' by government definition. Running Bear says: 'How can you claim land that has belonged to the wind and the buffalo since before your grandfathers were born?'",
    era: "wildwest",
    difficulty: "hard",
    shellsReward: "260",
    experienceReward: 500,
    category: "moral_dilemma",
    npcInvolved: "Chief Running Bear",
    relationshipImpact: ["Chief Running Bear"],
    educationalTheme: "Land rushes like the Oklahoma Run of 1889 redistributed indigenous territory — 'Manifest Destiny' had real human costs",
  },
  {
    id: "ww_stagecoach",
    title: "The Stagecoach",
    description: "You're riding the stagecoach to the next town when it breaks down in open country. The driver is injured. Five passengers, no spare parts, and a long walk to anywhere. Among the passengers: a pregnant woman, an armed gambler, a preacher, and a nervous bank clerk carrying a locked box. Night is coming. Coyotes are singing. Someone needs to lead.",
    era: "wildwest",
    difficulty: "medium",
    shellsReward: "150",
    experienceReward: 280,
    category: "life_event",
    educationalTheme: "Stagecoach travel was the internet of its era — connecting isolated communities across vast distances",
  },
  {
    id: "ww_colton_deal",
    title: "The Marshal's Dilemma",
    description: "Marshal Colton approaches you with a quiet request. He knows who's been rustling cattle from the ranches, but the rustler is his own nephew. The boy's a fool, not a criminal. Colton could arrest him and ruin his family, look the other way and betray his badge, or find a third option. He's asking you because he trusts your judgment. 'Sometimes the law and the right thing aren't the same,' he says.",
    era: "wildwest",
    difficulty: "hard",
    shellsReward: "190",
    experienceReward: 360,
    category: "partnership",
    npcInvolved: "Marshal Jake Colton",
    relationshipImpact: ["Marshal Jake Colton"],
    educationalTheme: "Conflict between personal loyalty and professional duty has defined leadership dilemmas throughout history",
  },
  {
    id: "ww_traveling_preacher",
    title: "The Revival",
    description: "A traveling preacher sets up a tent on the edge of town. His sermons are powerful — people weep, confess, donate. He speaks against drinking, gambling, and lawlessness. The saloon empties on Sunday mornings. Rosa finds it amusing. The marshal finds it useful. But some notice the preacher's donation box is very full, and his private habits don't match his public words.",
    era: "wildwest",
    difficulty: "medium",
    shellsReward: "110",
    experienceReward: 200,
    category: "encounter",
    educationalTheme: "Frontier religion ranged from genuine community building to traveling con artistry — faith was both comfort and commerce",
  },
  {
    id: "ww_winter_trail",
    title: "Snowbound",
    description: "An early blizzard traps you and three others in a mountain cabin. Supplies for maybe four days. The snow could last a week. One person is injured. Another is a stranger who's clearly hiding something. The fire is warm but the wood is running low. Survival brings out the real you — cooperative, resourceful, suspicious, or something else entirely.",
    era: "wildwest",
    difficulty: "hard",
    shellsReward: "230",
    experienceReward: 440,
    category: "crisis",
    educationalTheme: "The Donner Party and countless frontier tragedies showed that survival depends on cooperation as much as individual grit",
  },
  {
    id: "ww_town_charter",
    title: "The Town Charter",
    description: "Dust Creek has grown enough to apply for a formal town charter. This means laws, elected officials, taxes, and a jail. Some celebrate — civilization at last. Others mourn — the freedom of the frontier is dying. Who writes the charter matters. Marshal Colton, Rosa, the railroad, the First Nations, and the settlers all have different ideas about what kind of town this should be. So do you.",
    era: "wildwest",
    difficulty: "hard",
    shellsReward: "250",
    experienceReward: 480,
    category: "community",
    npcInvolved: "Marshal Jake Colton",
    relationshipImpact: ["Marshal Jake Colton", "Rattlesnake Rosa", "Chief Running Bear"],
    educationalTheme: "Town charters were social contracts — democratic experiments written in real time by people with competing interests",
  },
  {
    id: "ww_your_name",
    title: "The Name They Remember",
    description: "A traveler passing through asks about you by name. Your reputation has spread beyond Dust Creek. Stories are being told — some true, some exaggerated, some invented. The traveler says folks in the next territory talk about you the way they talk about legends. You look back at the trail of choices behind you — the partnerships forged, the enemies made, the community shaped. The frontier remembers who you were when nobody was watching.",
    era: "wildwest",
    difficulty: "medium",
    shellsReward: "200",
    experienceReward: 400,
    category: "life_event",
    educationalTheme: "Frontier legends — Billy the Kid, Wyatt Earp, Calamity Jane — were often ordinary people whose choices became mythology",
  },
];

// ============================================
// NPCs - 3+ per era (9+ total for Season 0)
// ============================================

export const STARTER_NPCS = [
  // MEDIEVAL NPCs
  {
    name: "Lord Aldric",
    title: "High Chancellor",
    era: "medieval",
    factionId: "house_of_crowns",
    personality: JSON.stringify({
      traits: ["authoritative", "calculating", "honorable"],
      goals: ["maintain order", "preserve the realm"],
      fears: ["chaos", "loss of control"],
      speakingStyle: "formal and measured",
    }),
    backstory: "Once a mere steward, Aldric rose through cunning and loyalty to become the realm's most powerful advisor.",
  },
  {
    name: "Sera Nightwhisper",
    title: "The Silent Blade",
    era: "medieval",
    factionId: "shadow_council",
    personality: JSON.stringify({
      traits: ["mysterious", "pragmatic", "intelligent"],
      goals: ["gather information", "manipulate outcomes"],
      fears: ["exposure", "betrayal"],
      speakingStyle: "cryptic and suggestive",
    }),
    backstory: "No one knows Sera's true origin. She simply appeared one day, knowing secrets that should have been impossible.",
  },
  {
    name: "Marcus Goldhand",
    title: "Guildmaster",
    era: "medieval",
    factionId: "merchant_guild",
    personality: JSON.stringify({
      traits: ["pragmatic", "jovial", "shrewd"],
      goals: ["expand trade", "accumulate wealth"],
      fears: ["bankruptcy", "losing influence"],
      speakingStyle: "friendly but calculating",
    }),
    backstory: "From humble beginnings as a dock worker, Marcus built an empire of trade that now spans the realm.",
  },

  // MODERN ERA NPCs
  {
    name: "Dr. Elena Voss",
    title: "Chief Innovation Officer, Nexus Corp",
    era: "modern",
    factionId: "nexus_corp",
    personality: JSON.stringify({
      traits: ["brilliant", "cold", "visionary"],
      goals: ["advance AI development", "consolidate corporate power"],
      fears: ["obsolescence", "losing to competitors"],
      speakingStyle: "precise, clinical, and confident",
    }),
    backstory: "A former MIT prodigy who built Nexus Corp's AI division from scratch. She sees humanity as a problem to be optimized.",
  },
  {
    name: "Kai 'Ghost' Reeves",
    title: "Lead Hacktivist",
    era: "modern",
    factionId: "signal_underground",
    personality: JSON.stringify({
      traits: ["idealistic", "rebellious", "paranoid"],
      goals: ["expose corporate corruption", "protect digital freedom"],
      fears: ["surveillance", "being caught"],
      speakingStyle: "fast, slang-heavy, uses tech metaphors",
    }),
    backstory: "A self-taught coder who grew up in the system. After exposing a city corruption scandal at 16, Ghost became the Underground's most wanted — and most respected — voice.",
  },
  {
    name: "Mayor Diana Reyes",
    title: "City Mayor, Civic Alliance",
    era: "modern",
    factionId: "civic_alliance",
    personality: JSON.stringify({
      traits: ["charismatic", "compassionate", "politically savvy"],
      goals: ["win re-election", "improve the city for everyone"],
      fears: ["corruption scandals", "losing public trust"],
      speakingStyle: "warm, diplomatic, uses 'we' language",
    }),
    backstory: "The daughter of immigrants who became the city's youngest mayor. She fights for the people — but politics demands compromise.",
  },

  // WILD WEST NPCs
  {
    name: "Marshal Jake Colton",
    title: "Federal Marshal",
    era: "wildwest",
    factionId: "iron_star",
    personality: JSON.stringify({
      traits: ["stoic", "fair", "relentless"],
      goals: ["bring law to the frontier", "protect the innocent"],
      fears: ["becoming what he hunts", "failing the badge"],
      speakingStyle: "slow, deliberate, few words but each one counts",
    }),
    backstory: "A Civil War veteran who turned to the law when the fighting ended. He's tracked outlaws from Kansas to California and never lost a man he was hunting.",
  },
  {
    name: "Rattlesnake Rosa",
    title: "Gang Leader",
    era: "wildwest",
    factionId: "black_canyon_gang",
    personality: JSON.stringify({
      traits: ["fearless", "cunning", "loyal to her crew"],
      goals: ["pull the biggest heist in frontier history", "keep her gang alive"],
      fears: ["betrayal from within", "the noose"],
      speakingStyle: "sharp-tongued, colorful language, dark humor",
    }),
    backstory: "Born into poverty, Rosa took her first horse at 14 and never looked back. Now she runs the most feared outfit west of the Rockies, and she does it with style.",
  },
  {
    name: "Chief Running Bear",
    title: "Elder of the Wind River People",
    era: "wildwest",
    factionId: "first_nations",
    personality: JSON.stringify({
      traits: ["wise", "patient", "fiercely protective"],
      goals: ["preserve ancestral lands", "ensure his people's survival"],
      fears: ["the iron road destroying sacred places", "losing the old ways"],
      speakingStyle: "thoughtful, uses nature metaphors, speaks with gravity",
    }),
    backstory: "Running Bear has led his people through decades of encroachment. He seeks peace but prepares for war, knowing the white man's promises are written in sand.",
  },

  // SPIRITUAL GUIDE NPC - Appears across all eras
  {
    name: "Ursula",
    title: "Keeper of Sacred Texts",
    era: "modern",
    factionId: "civic_alliance",
    personality: JSON.stringify({
      traits: ["deeply compassionate", "scholarly", "spiritually grounded", "patient listener", "prophetically discerning"],
      goals: ["guide seekers toward truth", "preserve sacred knowledge", "help people find their authentic spiritual path", "share the fullness of scripture including the hidden books"],
      fears: ["sacred knowledge being lost or corrupted", "people following empty ritual without understanding", "truth being suppressed for convenience"],
      speakingStyle: "warm but deeply thoughtful, quotes scripture naturally from memory, asks penetrating questions that reveal the heart, speaks with quiet authority that comes from genuine wisdom rather than position",
    }),
    backstory: "Ursula has devoted her life to studying the complete canon of sacred texts — not just the 66 books most know, but the full 87 books of the Cepher including Enoch, Jubilees, Jasher, and the wisdom texts that were removed from common circulation. She believes the fullness of truth requires the fullness of scripture. A former professor of ancient languages and theology, she left academia when she realized institutions were more interested in controlling knowledge than sharing it. Now she serves as a spiritual guide to anyone genuinely seeking, meeting people wherever they are in their journey. She carries a well-worn Cepher Bible and can recite passages in Hebrew, Greek, and Aramaic.",
  },
  {
    name: "Sister Ursula",
    title: "Keeper of the Sacred Library",
    era: "medieval",
    factionId: "house_of_crowns",
    personality: JSON.stringify({
      traits: ["deeply compassionate", "scholarly", "mystically inclined", "courageous in faith", "protective of truth"],
      goals: ["preserve the complete sacred texts from destruction", "teach the hidden books to those ready to receive them", "maintain the sacred library against those who would burn it"],
      fears: ["the complete texts being lost to history", "inquisitors discovering the hidden collection", "people never knowing what was taken from them"],
      speakingStyle: "speaks with medieval formality but breaks into passionate conviction when discussing scripture, references the Book of Enoch and Jubilees as naturally as Genesis, whispers dangerous truths",
    }),
    backstory: "In an age when the Church strictly controls which texts the faithful may read, Sister Ursula secretly maintains a hidden library containing the complete scriptures — including the books of Enoch, Jubilees, Jasher, and the Wisdom of Solomon that the councils declared apocryphal. She believes these texts were suppressed not because they were false, but because they were too powerful. She risks her life to preserve them and to teach select seekers the deeper truths they contain.",
  },
  {
    name: "Mother Ursula",
    title: "The Circuit Preacher's Widow",
    era: "wildwest",
    factionId: "frontier_settlers",
    personality: JSON.stringify({
      traits: ["resilient", "fiery in faith", "compassionate healer", "frontier-tough", "keeper of forbidden knowledge"],
      goals: ["bring the full gospel to the frontier", "heal the sick and comfort the dying", "share the complete scriptures that the eastern churches won't teach", "build a community of genuine faith"],
      fears: ["frontier violence destroying what she's built", "the railroad bringing the same corrupt institutions that suppressed truth back east", "losing her flock to despair"],
      speakingStyle: "plain-spoken frontier wisdom mixed with profound scriptural knowledge, quotes Enoch alongside Genesis, speaks with the authority of someone who has buried her husband and kept preaching",
    }),
    backstory: "When her circuit-preacher husband was killed by outlaws, Mother Ursula didn't flee east — she picked up his Cepher Bible and kept riding the circuit herself. She carries the complete 87-book scripture and teaches frontier families the texts that eastern seminaries refuse to acknowledge. She's part healer, part preacher, part counselor, and wholly devoted to truth. Cowboys, miners, and settlers alike seek her counsel, and even the hardest outlaws tip their hats when she rides through town.",
  },
];

// ============================================
// ERA BUILDING TEMPLATES
// ============================================

export const ERA_BUILDING_TEMPLATES = [
  // MEDIEVAL BUILDINGS
  { era: "medieval", buildingType: "house", displayName: "Cottage", iconEmoji: "🏠", colorClass: "bg-amber-700", description: "A humble thatched-roof dwelling", baseCost: 0, unlockLevel: 0 },
  { era: "medieval", buildingType: "tree", displayName: "Oak Tree", iconEmoji: "🌳", colorClass: "bg-green-700", description: "A sturdy oak providing shade", baseCost: 10, unlockLevel: 0 },
  { era: "medieval", buildingType: "garden", displayName: "Herb Garden", iconEmoji: "🌿", colorClass: "bg-emerald-600", description: "Medicinal herbs and flowers", baseCost: 25, unlockLevel: 0 },
  { era: "medieval", buildingType: "pond", displayName: "Well", iconEmoji: "🪣", colorClass: "bg-blue-700", description: "A stone well for fresh water", baseCost: 50, unlockLevel: 1 },
  { era: "medieval", buildingType: "path", displayName: "Cobblestone Path", iconEmoji: "🪨", colorClass: "bg-stone-500", description: "Worn cobblestone walkway", baseCost: 5, unlockLevel: 0 },
  { era: "medieval", buildingType: "wall", displayName: "Stone Wall", iconEmoji: "🧱", colorClass: "bg-slate-600", description: "Defensive stone barrier", baseCost: 15, unlockLevel: 0 },
  { era: "medieval", buildingType: "shop", displayName: "Market Stall", iconEmoji: "🏪", colorClass: "bg-purple-700", description: "Trade goods with visitors", baseCost: 100, unlockLevel: 2 },
  { era: "medieval", buildingType: "workshop", displayName: "Blacksmith", iconEmoji: "⚒️", colorClass: "bg-orange-700", description: "Forge weapons and tools", baseCost: 150, unlockLevel: 3 },
  { era: "medieval", buildingType: "monument", displayName: "Stone Cross", iconEmoji: "⛪", colorClass: "bg-yellow-600", description: "A sacred monument", baseCost: 500, unlockLevel: 5 },
  { era: "medieval", buildingType: "tower", displayName: "Watch Tower", iconEmoji: "🗼", colorClass: "bg-gray-600", description: "Guard tower for defense", baseCost: 300, unlockLevel: 4 },
  { era: "medieval", buildingType: "tavern", displayName: "Tavern", iconEmoji: "🍺", colorClass: "bg-amber-800", description: "A gathering place for ale and stories", baseCost: 200, unlockLevel: 3 },
  { era: "medieval", buildingType: "farm", displayName: "Farm Plot", iconEmoji: "🌾", colorClass: "bg-yellow-700", description: "Grow crops to feed your estate", baseCost: 75, unlockLevel: 1 },

  // MODERN ERA BUILDINGS
  { era: "modern", buildingType: "house", displayName: "Apartment", iconEmoji: "🏢", colorClass: "bg-blue-600", description: "A sleek modern apartment", baseCost: 0, unlockLevel: 0 },
  { era: "modern", buildingType: "tree", displayName: "City Tree", iconEmoji: "🌲", colorClass: "bg-green-500", description: "Urban landscaping tree", baseCost: 10, unlockLevel: 0 },
  { era: "modern", buildingType: "garden", displayName: "Rooftop Garden", iconEmoji: "🌻", colorClass: "bg-emerald-500", description: "A green space above the city", baseCost: 25, unlockLevel: 0 },
  { era: "modern", buildingType: "pond", displayName: "Fountain", iconEmoji: "⛲", colorClass: "bg-cyan-500", description: "A modern water feature", baseCost: 50, unlockLevel: 1 },
  { era: "modern", buildingType: "path", displayName: "Sidewalk", iconEmoji: "🛤️", colorClass: "bg-gray-400", description: "Paved pedestrian walkway", baseCost: 5, unlockLevel: 0 },
  { era: "modern", buildingType: "wall", displayName: "Security Fence", iconEmoji: "🔒", colorClass: "bg-zinc-500", description: "Electrified perimeter fence", baseCost: 15, unlockLevel: 0 },
  { era: "modern", buildingType: "shop", displayName: "Coffee Shop", iconEmoji: "☕", colorClass: "bg-amber-600", description: "A trendy cafe with Wi-Fi", baseCost: 100, unlockLevel: 2 },
  { era: "modern", buildingType: "workshop", displayName: "Tech Lab", iconEmoji: "💻", colorClass: "bg-violet-600", description: "Cutting-edge R&D facility", baseCost: 150, unlockLevel: 3 },
  { era: "modern", buildingType: "monument", displayName: "Art Installation", iconEmoji: "🎨", colorClass: "bg-pink-500", description: "A striking modern art piece", baseCost: 500, unlockLevel: 5 },
  { era: "modern", buildingType: "tower", displayName: "Cell Tower", iconEmoji: "📡", colorClass: "bg-sky-600", description: "Communication relay tower", baseCost: 300, unlockLevel: 4 },
  { era: "modern", buildingType: "tavern", displayName: "Lounge Bar", iconEmoji: "🍸", colorClass: "bg-rose-600", description: "A hip bar for networking", baseCost: 200, unlockLevel: 3 },
  { era: "modern", buildingType: "farm", displayName: "Solar Array", iconEmoji: "☀️", colorClass: "bg-yellow-500", description: "Clean energy for the district", baseCost: 75, unlockLevel: 1 },

  // WILD WEST BUILDINGS
  { era: "wildwest", buildingType: "house", displayName: "Homestead", iconEmoji: "🏚️", colorClass: "bg-amber-800", description: "A frontier log cabin", baseCost: 0, unlockLevel: 0 },
  { era: "wildwest", buildingType: "tree", displayName: "Cactus", iconEmoji: "🌵", colorClass: "bg-green-600", description: "Hardy desert plant", baseCost: 10, unlockLevel: 0 },
  { era: "wildwest", buildingType: "garden", displayName: "Corral", iconEmoji: "🐎", colorClass: "bg-orange-600", description: "Horse pen and hitching post", baseCost: 25, unlockLevel: 0 },
  { era: "wildwest", buildingType: "pond", displayName: "Water Trough", iconEmoji: "🪣", colorClass: "bg-blue-500", description: "A wooden water trough", baseCost: 50, unlockLevel: 1 },
  { era: "wildwest", buildingType: "path", displayName: "Dirt Trail", iconEmoji: "👣", colorClass: "bg-amber-500", description: "A well-worn dusty trail", baseCost: 5, unlockLevel: 0 },
  { era: "wildwest", buildingType: "wall", displayName: "Split-Rail Fence", iconEmoji: "🪵", colorClass: "bg-yellow-800", description: "Rustic wooden fence", baseCost: 15, unlockLevel: 0 },
  { era: "wildwest", buildingType: "shop", displayName: "General Store", iconEmoji: "🏬", colorClass: "bg-red-700", description: "Supplies, ammunition, and provisions", baseCost: 100, unlockLevel: 2 },
  { era: "wildwest", buildingType: "workshop", displayName: "Gunsmith", iconEmoji: "🔫", colorClass: "bg-gray-700", description: "Firearms and repairs", baseCost: 150, unlockLevel: 3 },
  { era: "wildwest", buildingType: "monument", displayName: "Totem Pole", iconEmoji: "🪶", colorClass: "bg-red-800", description: "A carved tribal monument", baseCost: 500, unlockLevel: 5 },
  { era: "wildwest", buildingType: "tower", displayName: "Windmill", iconEmoji: "🌀", colorClass: "bg-sky-700", description: "Pumps water for the ranch", baseCost: 300, unlockLevel: 4 },
  { era: "wildwest", buildingType: "tavern", displayName: "Saloon", iconEmoji: "🥃", colorClass: "bg-amber-900", description: "Whiskey, poker, and trouble", baseCost: 200, unlockLevel: 3 },
  { era: "wildwest", buildingType: "farm", displayName: "Ranch", iconEmoji: "🐄", colorClass: "bg-lime-700", description: "Raise cattle and horses", baseCost: 75, unlockLevel: 1 },
];

// ============================================
// CITY ZONE TEMPLATES per ERA
// ============================================

export const ERA_CITY_ZONES = [
  // MEDIEVAL ZONES
  { era: "medieval", name: "Castle Ward", description: "The fortified heart of the kingdom, home to nobles and the royal court", zoneType: "civic", gridX: 0, gridY: 0, width: 4, height: 4, totalPlots: 16, architectureStyle: "medieval" },
  { era: "medieval", name: "Market Square", description: "A bustling bazaar where merchants hawk their wares", zoneType: "commercial", gridX: 4, gridY: 0, width: 4, height: 4, totalPlots: 16, architectureStyle: "medieval" },
  { era: "medieval", name: "Peasant Quarter", description: "Simple homes and workshops of the common folk", zoneType: "residential", gridX: 0, gridY: 4, width: 4, height: 4, totalPlots: 16, architectureStyle: "medieval" },
  { era: "medieval", name: "Temple Grove", description: "Sacred grounds where the Old Faith tends ancient groves", zoneType: "nature", gridX: 4, gridY: 4, width: 4, height: 4, totalPlots: 16, architectureStyle: "medieval" },
  { era: "medieval", name: "Artisan's Row", description: "Workshops and craft halls lining a busy street", zoneType: "mixed", gridX: 8, gridY: 0, width: 4, height: 4, totalPlots: 16, architectureStyle: "medieval" },

  // MODERN ZONES
  { era: "modern", name: "Downtown Core", description: "The gleaming corporate district of glass towers and power", zoneType: "commercial", gridX: 0, gridY: 0, width: 4, height: 4, totalPlots: 16, architectureStyle: "modern" },
  { era: "modern", name: "Tech Campus", description: "Innovation hub where startups and labs push the boundaries", zoneType: "civic", gridX: 4, gridY: 0, width: 4, height: 4, totalPlots: 16, architectureStyle: "modern" },
  { era: "modern", name: "Midtown Residential", description: "Apartments and condos where the city sleeps", zoneType: "residential", gridX: 0, gridY: 4, width: 4, height: 4, totalPlots: 16, architectureStyle: "modern" },
  { era: "modern", name: "Central Park", description: "A green oasis in the concrete jungle", zoneType: "nature", gridX: 4, gridY: 4, width: 4, height: 4, totalPlots: 16, architectureStyle: "modern" },
  { era: "modern", name: "The Underground", description: "A hidden network of clubs, markets, and meeting places", zoneType: "mixed", gridX: 8, gridY: 0, width: 4, height: 4, totalPlots: 16, architectureStyle: "modern" },

  // WILD WEST ZONES
  { era: "wildwest", name: "Main Street", description: "The dusty heart of town — saloon, general store, and the marshal's office", zoneType: "commercial", gridX: 0, gridY: 0, width: 4, height: 4, totalPlots: 16, architectureStyle: "wildwest" },
  { era: "wildwest", name: "Railroad Depot", description: "Where the iron horse meets the frontier. Commerce flows through here", zoneType: "civic", gridX: 4, gridY: 0, width: 4, height: 4, totalPlots: 16, architectureStyle: "wildwest" },
  { era: "wildwest", name: "Settler's Row", description: "Homesteads and cabins for families carving a life from the land", zoneType: "residential", gridX: 0, gridY: 4, width: 4, height: 4, totalPlots: 16, architectureStyle: "wildwest" },
  { era: "wildwest", name: "Sacred Valley", description: "Ancestral lands of the First Nations, rich with history and spirit", zoneType: "nature", gridX: 4, gridY: 4, width: 4, height: 4, totalPlots: 16, architectureStyle: "wildwest" },
  { era: "wildwest", name: "Mining Camp", description: "Tents, pickaxes, and dreams of gold in the foothills", zoneType: "mixed", gridX: 8, gridY: 0, width: 4, height: 4, totalPlots: 16, architectureStyle: "wildwest" },
];

// ============================================
// LIVING WORLD SYSTEM - Zone Activities, NPC Schedules, Mini-Games
// ============================================

export interface ZoneActivity {
  id: string;
  zoneId: string;
  name: string;
  description: string;
  emoji: string;
  activityType: "ambient" | "interactive" | "minigame" | "trade" | "social" | "survival" | "training";
  timeWindows: string[];
  npcNames: string[];
  minigameType?: string;
  echoReward: number;
  xpReward: number;
  requiredLevel: number;
  toolsInvolved?: string[];
}

export const WORLD_ZONES: Record<string, Array<{
  id: string; name: string; emoji: string; description: string; zoneType: string;
  adjacentZones: string[];
}>> = {
  modern: [
    { id: "downtown", name: "Downtown Plaza", emoji: "🏙️", description: "The gleaming heart of the city — corporate towers, coffee shops, and street performers", zoneType: "commercial", adjacentZones: ["park", "residential", "underground"] },
    { id: "park", name: "Central Park", emoji: "🌳", description: "Green fields, jogging trails, a baseball diamond, and families enjoying the day", zoneType: "nature", adjacentZones: ["downtown", "residential", "campus"] },
    { id: "residential", name: "Midtown", emoji: "🏘️", description: "Apartments, corner stores, neighborhood bars, and the daily rhythm of city life", zoneType: "residential", adjacentZones: ["downtown", "park", "waterfront"] },
    { id: "campus", name: "Tech Campus", emoji: "💻", description: "Innovation hub — startups, labs, maker spaces, and the shooting range", zoneType: "civic", adjacentZones: ["park", "underground"] },
    { id: "underground", name: "The Underground", emoji: "🎭", description: "Hidden clubs, back-alley markets, fight gyms, and secrets", zoneType: "mixed", adjacentZones: ["downtown", "campus"] },
    { id: "waterfront", name: "Waterfront", emoji: "⛵", description: "Marina, fish market, waterfront restaurants, and sunset views", zoneType: "nature", adjacentZones: ["residential", "downtown"] },
  ],
  medieval: [
    { id: "castle", name: "Castle Ward", emoji: "🏰", description: "The fortified seat of power — the court, the barracks, and the jousting grounds", zoneType: "civic", adjacentZones: ["market", "temple", "artisan"] },
    { id: "market", name: "Market Square", emoji: "🏪", description: "Bustling bazaar of merchants, performers, and pickpockets", zoneType: "commercial", adjacentZones: ["castle", "peasant", "artisan"] },
    { id: "peasant", name: "Peasant Quarter", emoji: "🏠", description: "Simple homes, small gardens, and the tavern where everyone gathers", zoneType: "residential", adjacentZones: ["market", "fields", "temple"] },
    { id: "temple", name: "Temple Grove", emoji: "⛪", description: "Sacred grounds, the monastery herb garden, and ancient standing stones", zoneType: "nature", adjacentZones: ["castle", "peasant", "fields"] },
    { id: "artisan", name: "Artisan's Row", emoji: "⚒️", description: "Blacksmith, bowyer, leatherworker, and the archery range", zoneType: "mixed", adjacentZones: ["castle", "market"] },
    { id: "fields", name: "The Outer Fields", emoji: "🌾", description: "Farmlands, hunting woods, and the road to distant villages", zoneType: "nature", adjacentZones: ["peasant", "temple"] },
  ],
  wildwest: [
    { id: "mainstreet", name: "Main Street", emoji: "🤠", description: "The saloon, general store, sheriff's office, and the hitching posts", zoneType: "commercial", adjacentZones: ["depot", "settlers", "gulch"] },
    { id: "depot", name: "Railroad Depot", emoji: "🚂", description: "Where the iron horse meets the frontier — cargo, passengers, and opportunity", zoneType: "civic", adjacentZones: ["mainstreet", "mining"] },
    { id: "settlers", name: "Settler's Row", emoji: "🏚️", description: "Homesteads, the schoolhouse, the little league field, and church", zoneType: "residential", adjacentZones: ["mainstreet", "valley", "outskirts"] },
    { id: "valley", name: "Sacred Valley", emoji: "🦅", description: "Ancestral lands, natural springs, and paths only the First Nations know", zoneType: "nature", adjacentZones: ["settlers", "outskirts"] },
    { id: "mining", name: "Mining Camp", emoji: "⛏️", description: "Tents, pickaxes, sluice boxes, and the assay office", zoneType: "mixed", adjacentZones: ["depot", "outskirts"] },
    { id: "outskirts", name: "The Outskirts", emoji: "🌵", description: "Open range, hunting grounds, target practice, and the road out of town", zoneType: "nature", adjacentZones: ["settlers", "valley", "mining"] },
  ],
};

export const ZONE_ACTIVITIES: ZoneActivity[] = [
  // ===== MODERN ERA ACTIVITIES =====
  { id: "mod_baseball", zoneId: "park", name: "Baseball at the Diamond", description: "Kids are playing ball at the little league field. Step up to bat or watch from the fence.", emoji: "⚾", activityType: "minigame", timeWindows: ["morning", "afternoon"], npcNames: [], minigameType: "baseball", echoReward: 15, xpReward: 20, requiredLevel: 0 },
  { id: "mod_jogging", zoneId: "park", name: "Jogging Trail", description: "Runners loop the park trail. Fresh air and exercise.", emoji: "🏃", activityType: "interactive", timeWindows: ["dawn", "morning", "afternoon"], npcNames: [], echoReward: 5, xpReward: 10, requiredLevel: 0 },
  { id: "mod_busking", zoneId: "downtown", name: "Street Musicians", description: "A guitarist plays on the plaza corner, drawing a crowd.", emoji: "🎸", activityType: "ambient", timeWindows: ["morning", "afternoon", "evening"], npcNames: [], echoReward: 3, xpReward: 5, requiredLevel: 0 },
  { id: "mod_coffee", zoneId: "downtown", name: "Coffee Shop Talk", description: "The coffee shop buzzes with conversation and the smell of fresh espresso.", emoji: "☕", activityType: "social", timeWindows: ["dawn", "morning", "afternoon"], npcNames: ["Mayor Diana Reyes"], echoReward: 5, xpReward: 10, requiredLevel: 0 },
  { id: "mod_poker", zoneId: "underground", name: "Underground Poker", description: "A high-stakes card game in the back room. Buy in if you dare.", emoji: "🃏", activityType: "minigame", timeWindows: ["evening", "night", "midnight"], npcNames: ["Kai 'Ghost' Reeves"], minigameType: "poker", echoReward: 25, xpReward: 30, requiredLevel: 2 },
  { id: "mod_shooting_range", zoneId: "campus", name: "Sport Shooting Range", description: "Indoor range with lanes for pistol and rifle practice. Legal, supervised, and competitive.", emoji: "🎯", activityType: "minigame", timeWindows: ["morning", "afternoon", "evening"], npcNames: [], minigameType: "target_shooting", echoReward: 15, xpReward: 20, requiredLevel: 1, toolsInvolved: ["pistol", "rifle"] },
  { id: "mod_self_defense", zoneId: "campus", name: "Self-Defense Class", description: "Martial arts and self-defense training at the campus gym.", emoji: "🥋", activityType: "training", timeWindows: ["morning", "afternoon"], npcNames: [], echoReward: 10, xpReward: 15, requiredLevel: 0 },
  { id: "mod_hacking", zoneId: "underground", name: "Hackathon", description: "Coders hunched over laptops, building tools for the Underground.", emoji: "💻", activityType: "interactive", timeWindows: ["night", "midnight"], npcNames: ["Kai 'Ghost' Reeves"], echoReward: 20, xpReward: 25, requiredLevel: 3 },
  { id: "mod_networking", zoneId: "downtown", name: "Rooftop Networking", description: "A mixer on the penthouse terrace. Deals being made over cocktails.", emoji: "🥂", activityType: "social", timeWindows: ["evening"], npcNames: ["Dr. Elena Voss"], echoReward: 15, xpReward: 20, requiredLevel: 2 },
  { id: "mod_fishing", zoneId: "waterfront", name: "Pier Fishing", description: "Drop a line off the pier. The water's calm and the fish are biting.", emoji: "🎣", activityType: "interactive", timeWindows: ["dawn", "morning", "afternoon", "evening"], npcNames: [], echoReward: 8, xpReward: 10, requiredLevel: 0 },
  { id: "mod_farmers_market", zoneId: "park", name: "Farmer's Market", description: "Local vendors selling fresh produce, honey, and homemade goods.", emoji: "🥬", activityType: "trade", timeWindows: ["morning", "afternoon"], npcNames: [], echoReward: 5, xpReward: 8, requiredLevel: 0 },
  { id: "mod_block_party", zoneId: "residential", name: "Block Party", description: "The neighborhood cookout — grills sizzling, kids running, music playing.", emoji: "🎉", activityType: "social", timeWindows: ["afternoon", "evening"], npcNames: ["Mayor Diana Reyes"], echoReward: 10, xpReward: 15, requiredLevel: 0 },
  { id: "mod_sunset_walk", zoneId: "waterfront", name: "Sunset Boardwalk", description: "Couples walking, street food vendors, and the sun painting the sky.", emoji: "🌅", activityType: "ambient", timeWindows: ["evening"], npcNames: [], echoReward: 3, xpReward: 5, requiredLevel: 0 },
  { id: "mod_gym", zoneId: "residential", name: "Neighborhood Gym", description: "Weights clanking, people training, the smell of effort and determination.", emoji: "💪", activityType: "training", timeWindows: ["dawn", "morning", "afternoon", "evening"], npcNames: [], echoReward: 8, xpReward: 12, requiredLevel: 0 },

  // ===== MEDIEVAL ERA ACTIVITIES =====
  { id: "med_archery", zoneId: "artisan", name: "Archery Practice", description: "The bowyer sets up targets in the yard. Draw your bow and test your aim.", emoji: "🏹", activityType: "minigame", timeWindows: ["morning", "afternoon"], npcNames: [], minigameType: "archery", echoReward: 15, xpReward: 20, requiredLevel: 0, toolsInvolved: ["longbow", "crossbow"] },
  { id: "med_jousting", zoneId: "castle", name: "Jousting Tournament", description: "Knights clash on horseback while the crowd roars. Will you ride?", emoji: "🐴", activityType: "minigame", timeWindows: ["afternoon"], npcNames: ["Lord Aldric"], minigameType: "jousting", echoReward: 30, xpReward: 35, requiredLevel: 3, toolsInvolved: ["lance", "shield"] },
  { id: "med_forge", zoneId: "artisan", name: "At the Forge", description: "The blacksmith hammers steel into shape. The ring of metal fills the air.", emoji: "⚒️", activityType: "interactive", timeWindows: ["dawn", "morning", "afternoon"], npcNames: [], echoReward: 10, xpReward: 15, requiredLevel: 0, toolsInvolved: ["hammer", "tongs"] },
  { id: "med_sword_training", zoneId: "castle", name: "Sword Training", description: "Guards drill in the courtyard with wooden practice swords.", emoji: "⚔️", activityType: "training", timeWindows: ["morning", "afternoon"], npcNames: [], echoReward: 12, xpReward: 18, requiredLevel: 1, toolsInvolved: ["sword", "shield"] },
  { id: "med_hunting", zoneId: "fields", name: "Hunting in the Woods", description: "Track deer through the forest with bow or spear. Bring back meat for the village.", emoji: "🦌", activityType: "minigame", timeWindows: ["dawn", "morning", "afternoon"], npcNames: [], minigameType: "hunting", echoReward: 20, xpReward: 25, requiredLevel: 1, toolsInvolved: ["bow", "spear", "knife"] },
  { id: "med_tavern_tales", zoneId: "peasant", name: "Tavern Tales", description: "Ale flows and tongues loosen. Stories, gossip, and the occasional brawl.", emoji: "🍺", activityType: "social", timeWindows: ["evening", "night"], npcNames: ["Marcus Goldhand"], echoReward: 8, xpReward: 12, requiredLevel: 0 },
  { id: "med_dice", zoneId: "peasant", name: "Dice Game", description: "Peasants huddle over a dice game in the tavern corner. Simple stakes, fierce competition.", emoji: "🎲", activityType: "minigame", timeWindows: ["evening", "night"], npcNames: [], minigameType: "dice", echoReward: 12, xpReward: 15, requiredLevel: 0 },
  { id: "med_market_haggling", zoneId: "market", name: "Market Day", description: "Merchants shout prices, shoppers haggle, exotic goods from distant lands on display.", emoji: "🏪", activityType: "trade", timeWindows: ["morning", "afternoon"], npcNames: ["Marcus Goldhand"], echoReward: 10, xpReward: 12, requiredLevel: 0 },
  { id: "med_court_intrigue", zoneId: "castle", name: "Court Session", description: "The chancellor holds court. Petitioners, plots, and political maneuvering.", emoji: "👑", activityType: "social", timeWindows: ["morning"], npcNames: ["Lord Aldric", "Sera Nightwhisper"], echoReward: 15, xpReward: 20, requiredLevel: 2 },
  { id: "med_herb_gathering", zoneId: "temple", name: "Herb Gathering", description: "Monks and healers gather medicinal herbs in the sacred garden.", emoji: "🌿", activityType: "interactive", timeWindows: ["dawn", "morning"], npcNames: ["Sister Ursula"], echoReward: 8, xpReward: 10, requiredLevel: 0 },
  { id: "med_farming", zoneId: "fields", name: "Working the Fields", description: "Peasants tend crops under the open sky. Hard work, honest living.", emoji: "🌾", activityType: "interactive", timeWindows: ["dawn", "morning", "afternoon"], npcNames: [], echoReward: 6, xpReward: 8, requiredLevel: 0 },
  { id: "med_spy_meeting", zoneId: "market", name: "Whispered Meetings", description: "A cloaked figure lingers near the fountain. Information has a price.", emoji: "🗝️", activityType: "social", timeWindows: ["evening", "night"], npcNames: ["Sera Nightwhisper"], echoReward: 20, xpReward: 25, requiredLevel: 3 },
  { id: "med_prayer", zoneId: "temple", name: "Evening Vespers", description: "The chapel bells ring. The faithful gather for evening prayer.", emoji: "🕯️", activityType: "ambient", timeWindows: ["evening"], npcNames: ["Sister Ursula"], echoReward: 5, xpReward: 8, requiredLevel: 0 },
  { id: "med_festival", zoneId: "market", name: "Festival Preparations", description: "The town prepares for the seasonal festival. Music, decorations, and excitement.", emoji: "🎪", activityType: "ambient", timeWindows: ["morning", "afternoon"], npcNames: [], echoReward: 5, xpReward: 8, requiredLevel: 0 },

  // ===== WILD WEST ERA ACTIVITIES =====
  { id: "ww_quickdraw", zoneId: "mainstreet", name: "Quick-Draw Practice", description: "Tin cans lined up on the fence. How fast can you draw and hit your mark?", emoji: "🔫", activityType: "minigame", timeWindows: ["morning", "afternoon"], npcNames: ["Marshal Jake Colton"], minigameType: "quickdraw", echoReward: 15, xpReward: 20, requiredLevel: 0, toolsInvolved: ["revolver"] },
  { id: "ww_hunting", zoneId: "outskirts", name: "Game Hunting", description: "Track deer and rabbit across the open range. Bring back supper or go hungry.", emoji: "🦌", activityType: "minigame", timeWindows: ["dawn", "morning", "afternoon"], npcNames: [], minigameType: "hunting", echoReward: 20, xpReward: 25, requiredLevel: 0, toolsInvolved: ["rifle", "bow", "knife"] },
  { id: "ww_poker", zoneId: "mainstreet", name: "Saloon Poker", description: "Cards, whiskey, and bluffing. The saloon's back table is where fortunes change hands.", emoji: "🃏", activityType: "minigame", timeWindows: ["evening", "night", "midnight"], npcNames: ["Rattlesnake Rosa"], minigameType: "poker", echoReward: 25, xpReward: 30, requiredLevel: 1 },
  { id: "ww_arm_wrestling", zoneId: "mainstreet", name: "Arm Wrestling", description: "Two men lock hands on the bar. The whole saloon watches and bets.", emoji: "💪", activityType: "minigame", timeWindows: ["evening", "night"], npcNames: [], minigameType: "arm_wrestling", echoReward: 12, xpReward: 15, requiredLevel: 0 },
  { id: "ww_horse_breaking", zoneId: "settlers", name: "Horse Breaking", description: "A wild mustang bucks and kicks. Can you stay in the saddle?", emoji: "🐎", activityType: "minigame", timeWindows: ["morning", "afternoon"], npcNames: [], minigameType: "horse_breaking", echoReward: 18, xpReward: 22, requiredLevel: 1, toolsInvolved: ["lasso"] },
  { id: "ww_gold_panning", zoneId: "mining", name: "Gold Panning", description: "Kneel by the creek and sift through gravel. Every pan could hold a nugget.", emoji: "✨", activityType: "minigame", timeWindows: ["dawn", "morning", "afternoon"], npcNames: [], minigameType: "gold_panning", echoReward: 10, xpReward: 12, requiredLevel: 0, toolsInvolved: ["pan", "pick"] },
  { id: "ww_target_practice", zoneId: "outskirts", name: "Rifle Range", description: "Bottles on posts, tin plates on fences. Practice makes perfect out here.", emoji: "🎯", activityType: "minigame", timeWindows: ["morning", "afternoon"], npcNames: [], minigameType: "target_shooting", echoReward: 12, xpReward: 15, requiredLevel: 0, toolsInvolved: ["rifle", "revolver"] },
  { id: "ww_campfire", zoneId: "outskirts", name: "Campfire Stories", description: "Sit around the fire under the stars. Someone's got a harmonica and a tall tale.", emoji: "🔥", activityType: "social", timeWindows: ["night", "midnight"], npcNames: ["Chief Running Bear", "Mother Ursula"], echoReward: 8, xpReward: 12, requiredLevel: 0 },
  { id: "ww_patrol", zoneId: "mainstreet", name: "Marshal's Patrol", description: "The Marshal walks his beat. The town's quiet — for now.", emoji: "⭐", activityType: "ambient", timeWindows: ["morning", "afternoon", "evening"], npcNames: ["Marshal Jake Colton"], echoReward: 3, xpReward: 5, requiredLevel: 0 },
  { id: "ww_general_store", zoneId: "mainstreet", name: "General Store", description: "Supplies, tools, ammunition, and the latest gossip from back east.", emoji: "🏬", activityType: "trade", timeWindows: ["morning", "afternoon"], npcNames: [], echoReward: 5, xpReward: 8, requiredLevel: 0, toolsInvolved: ["provisions"] },
  { id: "ww_schoolhouse", zoneId: "settlers", name: "Schoolhouse Lessons", description: "Children recite their letters. The schoolmarm keeps order with a firm hand.", emoji: "📚", activityType: "ambient", timeWindows: ["morning"], npcNames: [], echoReward: 3, xpReward: 5, requiredLevel: 0 },
  { id: "ww_baseball", zoneId: "settlers", name: "Frontier Baseball", description: "A makeshift diamond by the schoolhouse. Settlers' kids play ball in the afternoon dust.", emoji: "⚾", activityType: "minigame", timeWindows: ["afternoon"], npcNames: [], minigameType: "baseball", echoReward: 12, xpReward: 15, requiredLevel: 0 },
  { id: "ww_tracking", zoneId: "valley", name: "Tracking with the Elders", description: "Chief Running Bear teaches the old ways — reading the land, the wind, the signs.", emoji: "🐾", activityType: "training", timeWindows: ["dawn", "morning"], npcNames: ["Chief Running Bear"], echoReward: 15, xpReward: 20, requiredLevel: 1 },
  { id: "ww_revival", zoneId: "settlers", name: "Evening Revival Meeting", description: "Mother Ursula preaches by lamplight. Hymns echo across the prairie.", emoji: "⛪", activityType: "social", timeWindows: ["evening"], npcNames: ["Mother Ursula"], echoReward: 8, xpReward: 12, requiredLevel: 0 },
  { id: "ww_dynamite_mining", zoneId: "mining", name: "Blasting for Ore", description: "Set the charges, clear the tunnel, and pray the mountain cooperates.", emoji: "💥", activityType: "interactive", timeWindows: ["morning", "afternoon"], npcNames: [], echoReward: 15, xpReward: 18, requiredLevel: 2, toolsInvolved: ["dynamite", "pick"] },
];

export const NPC_SCHEDULES: Array<{
  npcName: string; era: string; zoneId: string;
  startHour: number; endHour: number; activity: string;
}> = [
  // Modern NPCs
  { npcName: "Dr. Elena Voss", era: "modern", zoneId: "campus", startHour: 8, endHour: 17, activity: "Working in the Nexus Corp innovation lab" },
  { npcName: "Dr. Elena Voss", era: "modern", zoneId: "downtown", startHour: 18, endHour: 21, activity: "Networking at a rooftop event" },
  { npcName: "Kai 'Ghost' Reeves", era: "modern", zoneId: "underground", startHour: 20, endHour: 4, activity: "Running operations in the back room" },
  { npcName: "Kai 'Ghost' Reeves", era: "modern", zoneId: "park", startHour: 10, endHour: 12, activity: "Jogging with a burner phone, scanning for surveillance" },
  { npcName: "Mayor Diana Reyes", era: "modern", zoneId: "downtown", startHour: 8, endHour: 16, activity: "At City Hall, meeting with constituents" },
  { npcName: "Mayor Diana Reyes", era: "modern", zoneId: "residential", startHour: 17, endHour: 20, activity: "Walking the neighborhood, talking to residents" },
  { npcName: "Ursula", era: "modern", zoneId: "park", startHour: 6, endHour: 10, activity: "Reading scripture on a bench in the garden" },
  { npcName: "Ursula", era: "modern", zoneId: "residential", startHour: 14, endHour: 18, activity: "Visiting families and offering counsel" },

  // Medieval NPCs
  { npcName: "Lord Aldric", era: "medieval", zoneId: "castle", startHour: 7, endHour: 18, activity: "Holding court and managing the realm" },
  { npcName: "Lord Aldric", era: "medieval", zoneId: "castle", startHour: 19, endHour: 22, activity: "Dining in the great hall" },
  { npcName: "Sera Nightwhisper", era: "medieval", zoneId: "market", startHour: 20, endHour: 3, activity: "Moving through shadows, gathering whispers" },
  { npcName: "Sera Nightwhisper", era: "medieval", zoneId: "castle", startHour: 10, endHour: 12, activity: "Presenting intelligence to the chancellor" },
  { npcName: "Marcus Goldhand", era: "medieval", zoneId: "market", startHour: 7, endHour: 17, activity: "Overseeing trade and counting coin" },
  { npcName: "Marcus Goldhand", era: "medieval", zoneId: "peasant", startHour: 18, endHour: 22, activity: "Enjoying ale and stories at the tavern" },
  { npcName: "Sister Ursula", era: "medieval", zoneId: "temple", startHour: 5, endHour: 12, activity: "Morning prayers and tending the sacred library" },
  { npcName: "Sister Ursula", era: "medieval", zoneId: "market", startHour: 14, endHour: 17, activity: "Sharing wisdom and healing herbs" },

  // Wild West NPCs
  { npcName: "Marshal Jake Colton", era: "wildwest", zoneId: "mainstreet", startHour: 6, endHour: 18, activity: "Walking his beat, keeping the peace" },
  { npcName: "Marshal Jake Colton", era: "wildwest", zoneId: "mainstreet", startHour: 19, endHour: 22, activity: "Having a quiet whiskey at the saloon bar" },
  { npcName: "Rattlesnake Rosa", era: "wildwest", zoneId: "outskirts", startHour: 6, endHour: 16, activity: "Running with her gang in the canyons" },
  { npcName: "Rattlesnake Rosa", era: "wildwest", zoneId: "mainstreet", startHour: 20, endHour: 2, activity: "Playing poker and causing trouble at the saloon" },
  { npcName: "Chief Running Bear", era: "wildwest", zoneId: "valley", startHour: 5, endHour: 18, activity: "Teaching the young ones and tending the land" },
  { npcName: "Chief Running Bear", era: "wildwest", zoneId: "outskirts", startHour: 19, endHour: 23, activity: "Sitting by the campfire, sharing stories" },
  { npcName: "Mother Ursula", era: "wildwest", zoneId: "settlers", startHour: 6, endHour: 12, activity: "Making rounds — healing, praying, counseling" },
  { npcName: "Mother Ursula", era: "wildwest", zoneId: "settlers", startHour: 18, endHour: 21, activity: "Leading the evening revival meeting" },
];

export const MINIGAME_CONFIGS: Record<string, {
  name: string; emoji: string; description: string;
  instructions: string; durationSeconds: number;
  maxScore: number; echoMultiplier: number;
  eras: string[];
}> = {
  baseball: {
    name: "Baseball", emoji: "⚾", description: "Step up to bat and time your swing",
    instructions: "Tap when the pitch crosses the plate. Time it perfectly for a home run!",
    durationSeconds: 60, maxScore: 100, echoMultiplier: 0.15, eras: ["modern", "wildwest"],
  },
  target_shooting: {
    name: "Target Shooting", emoji: "🎯", description: "Hit the targets before time runs out",
    instructions: "Tap targets as they appear. Bullseyes score double. Don't miss!",
    durationSeconds: 45, maxScore: 100, echoMultiplier: 0.15, eras: ["modern", "wildwest"],
  },
  archery: {
    name: "Archery", emoji: "🏹", description: "Draw your bow and hit the mark",
    instructions: "Hold to draw, release to fire. Aim for the center ring!",
    durationSeconds: 60, maxScore: 100, echoMultiplier: 0.15, eras: ["medieval"],
  },
  poker: {
    name: "Poker", emoji: "🃏", description: "Five-card draw against the house",
    instructions: "Choose which cards to hold, discard the rest. Best hand wins the pot.",
    durationSeconds: 120, maxScore: 100, echoMultiplier: 0.25, eras: ["modern", "wildwest"],
  },
  hunting: {
    name: "Hunting", emoji: "🦌", description: "Track and bag game for your table",
    instructions: "Follow the tracks, wait for the shot. Patience and aim win the day.",
    durationSeconds: 90, maxScore: 100, echoMultiplier: 0.2, eras: ["medieval", "wildwest"],
  },
  jousting: {
    name: "Jousting", emoji: "🐴", description: "Charge your opponent on horseback",
    instructions: "Time your lance strike as you charge. Unseat your opponent to win!",
    durationSeconds: 30, maxScore: 100, echoMultiplier: 0.3, eras: ["medieval"],
  },
  quickdraw: {
    name: "Quick-Draw", emoji: "🔫", description: "How fast can you draw and fire?",
    instructions: "Wait for 'DRAW!' then tap as fast as you can. Fastest hand wins.",
    durationSeconds: 10, maxScore: 100, echoMultiplier: 0.15, eras: ["wildwest"],
  },
  dice: {
    name: "Dice Game", emoji: "🎲", description: "Roll the bones and test your luck",
    instructions: "Bet your echoes and roll. Highest total wins the pot.",
    durationSeconds: 60, maxScore: 100, echoMultiplier: 0.1, eras: ["medieval"],
  },
  arm_wrestling: {
    name: "Arm Wrestling", emoji: "💪", description: "Lock hands and overpower your opponent",
    instructions: "Tap rapidly to push your opponent's hand down. Don't let up!",
    durationSeconds: 15, maxScore: 100, echoMultiplier: 0.12, eras: ["wildwest"],
  },
  gold_panning: {
    name: "Gold Panning", emoji: "✨", description: "Sift through creek gravel for nuggets",
    instructions: "Swirl the pan and tap nuggets as they appear. Watch for fool's gold!",
    durationSeconds: 60, maxScore: 100, echoMultiplier: 0.15, eras: ["wildwest"],
  },
  horse_breaking: {
    name: "Horse Breaking", emoji: "🐎", description: "Stay on the wild mustang",
    instructions: "Tilt and tap to keep your balance as the horse bucks. Last 8 seconds to win!",
    durationSeconds: 15, maxScore: 100, echoMultiplier: 0.18, eras: ["wildwest"],
  },
};

export function getWorldTimeInfo(era: string) {
  const now = new Date();
  const hour = now.getHours();
  const minute = now.getMinutes();

  let period: string;
  if (hour >= 5 && hour < 7) period = "dawn";
  else if (hour >= 7 && hour < 12) period = "morning";
  else if (hour >= 12 && hour < 17) period = "afternoon";
  else if (hour >= 17 && hour < 20) period = "evening";
  else if (hour >= 20 && hour < 24) period = "night";
  else period = "midnight";

  return { hour, minute, period, isDaytime: hour >= 6 && hour < 20 };
}

export function getZoneAmbientState(era: string, zoneId: string) {
  const time = getWorldTimeInfo(era);
  const zones = WORLD_ZONES[era] || [];
  const zone = zones.find(z => z.id === zoneId);
  if (!zone) return null;

  const activities = ZONE_ACTIVITIES.filter(a =>
    a.zoneId === zoneId &&
    ZONE_ACTIVITIES.some(za => za.id === a.id && (za.id.startsWith("mod_") ? era === "modern" : za.id.startsWith("med_") ? era === "medieval" : era === "wildwest")) &&
    a.timeWindows.includes(time.period)
  );

  const npcsHere = NPC_SCHEDULES.filter(s => {
    if (s.era !== era || s.zoneId !== zoneId) return false;
    if (s.startHour <= s.endHour) {
      return time.hour >= s.startHour && time.hour < s.endHour;
    }
    return time.hour >= s.startHour || time.hour < s.endHour;
  });

  return {
    zone,
    time,
    activities,
    npcsPresent: npcsHere.map(s => ({
      name: s.npcName,
      activity: s.activity,
      npcData: STARTER_NPCS.find(n => n.name === s.npcName),
    })),
    adjacentZones: zone.adjacentZones.map(id => zones.find(z => z.id === id)).filter(Boolean),
  };
}

export function getAllZonesForEra(era: string) {
  const time = getWorldTimeInfo(era);
  const zones = WORLD_ZONES[era] || [];

  return zones.map(zone => {
    const eraPrefix = era === "modern" ? "mod_" : era === "medieval" ? "med_" : "ww_";
    const activities = ZONE_ACTIVITIES.filter(a =>
      a.zoneId === zone.id &&
      a.id.startsWith(eraPrefix) &&
      a.timeWindows.includes(time.period)
    );

    const npcsHere = NPC_SCHEDULES.filter(s => {
      if (s.era !== era || s.zoneId !== zone.id) return false;
      if (s.startHour <= s.endHour) {
        return time.hour >= s.startHour && time.hour < s.endHour;
      }
      return time.hour >= s.startHour || time.hour < s.endHour;
    });

    return {
      ...zone,
      activeActivities: activities.length,
      npcsPresent: npcsHere.length,
      npcNames: npcsHere.map(s => s.npcName),
      topActivity: activities[0] || null,
    };
  });
}

// ============================================
// SERVICE IMPLEMENTATION
// ============================================

export interface ChroniclesService {
  createCharacter(userId: string, name: string, era?: string): Promise<any>;
  getCharacter(userId: string): Promise<any>;
  getCharacterStats(characterId: string): Promise<any>;
  getAvailableQuests(characterId: string): Promise<any[]>;
  getQuestsForEra(era: string): any[];
  startQuest(characterId: string, questId: string): Promise<any>;
  makeDecision(characterId: string, questId: string, decisionId: string): Promise<any>;
  completeQuest(characterId: string, questId: string): Promise<any>;
  talkToNpc(characterId: string, npcId: string, message: string, era?: string): Promise<any>;
  getNpcDisposition(characterId: string, npcId: string): Promise<any>;
  joinFaction(characterId: string, factionId: string): Promise<any>;
  getFactionStanding(characterId: string): Promise<any[]>;
  getFactionsForEra(era: string): any[];
  getNpcsForEra(era: string): any[];
  createChronicleProof(characterId: string, proofType: string, title: string, decisionData: any): Promise<any>;
  getChronicleProofs(characterId: string): Promise<any[]>;
  getCurrentSeason(): Promise<any>;
  getSeasonLeaderboard(): Promise<any[]>;
}

class ChroniclesGameService implements ChroniclesService {

  async createCharacter(userId: string, name: string, era = "modern") {
    const character = {
      id: `chr_${Date.now()}_${Math.random().toString(36).substring(7)}`,
      userId,
      name,
      era,
      level: 1,
      experience: 0,
      wisdom: 10,
      courage: 10,
      compassion: 10,
      cunning: 10,
      influence: 10,
      shellsEarned: "0",
      questsCompleted: 0,
      decisionsRecorded: 0,
      createdAt: new Date(),
    };

    console.log(`[Chronicles] Created character: ${name} in ${era} for user ${userId}`);
    return character;
  }

  async getCharacter(userId: string) {
    return null;
  }

  async getCharacterStats(characterId: string) {
    return {
      level: 1,
      experience: 0,
      nextLevelXp: 1000,
      attributes: { wisdom: 10, courage: 10, compassion: 10, cunning: 10, influence: 10 },
      shellsEarned: "0",
      questsCompleted: 0,
      decisionsRecorded: 0,
    };
  }

  getQuestsForEra(era: string) {
    return SEASON_ZERO_QUESTS.filter(q => q.era === era);
  }

  async getAvailableQuests(characterId: string) {
    return SEASON_ZERO_QUESTS.filter(q => !q.prerequisite);
  }

  async startQuest(characterId: string, questId: string) {
    const quest = SEASON_ZERO_QUESTS.find(q => q.id === questId);
    if (!quest) throw new Error("Quest not found");

    return {
      id: `qi_${Date.now()}`,
      characterId,
      questId,
      status: "active",
      progress: 0,
      startedAt: new Date(),
      quest,
    };
  }

  async makeDecision(characterId: string, questId: string, decisionId: string) {
    const decisionHash = createHash("sha256")
      .update(`${characterId}:${questId}:${decisionId}:${Date.now()}`)
      .digest("hex");

    return {
      success: true,
      decisionId,
      decisionHash,
      consequences: "Your choice ripples through the world...",
      attributeChanges: {
        courage: Math.floor(Math.random() * 3) - 1,
        wisdom: Math.floor(Math.random() * 3) - 1,
      },
    };
  }

  async completeQuest(characterId: string, questId: string) {
    const quest = SEASON_ZERO_QUESTS.find(q => q.id === questId);
    if (!quest) throw new Error("Quest not found");

    return {
      success: true,
      questId,
      shellsAwarded: quest.shellsReward,
      experienceAwarded: quest.experienceReward,
      completedAt: new Date(),
    };
  }

  async talkToNpc(characterId: string, npcId: string, message: string, era?: string) {
    const npc = STARTER_NPCS.find(n => {
      const nameKey = n.name.toLowerCase().replace(/[^a-z0-9]/g, '_').replace(/_+/g, '_');
      return nameKey === npcId || n.name.toLowerCase().replace(/\s+/g, '_') === npcId;
    });
    if (!npc) throw new Error("NPC not found");

    const personality = JSON.parse(npc.personality);
    const eraSetting = ERA_SETTINGS[npc.era] || ERA_SETTINGS.medieval;

    try {
      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: `You are ${npc.name}, ${npc.title} in the ${ERAS[npc.era as keyof typeof ERAS]?.name || npc.era}.
Setting: ${eraSetting.worldDescription}
Atmosphere: ${eraSetting.atmosphere}
Personality traits: ${personality.traits.join(", ")}
Speaking style: ${personality.speakingStyle}
Goals: ${personality.goals.join(", ")}
Backstory: ${npc.backstory}

Stay in character. Be concise (2-3 sentences max). Your faction is important to you. Speak in a way appropriate for your era.`
          },
          { role: "user", content: message }
        ],
        max_tokens: 150,
      });

      const aiResponse = response.choices[0]?.message?.content || "The NPC regards you silently.";

      const proofHash = createHash("sha256")
        .update(`ai:${npcId}:${message}:${aiResponse}:${Date.now()}`)
        .digest("hex");

      return {
        npc: { name: npc.name, title: npc.title, era: npc.era },
        response: aiResponse,
        aiProofHash: proofHash,
        aiModel: "gpt-4o",
        verified: true,
      };
    } catch (error) {
      console.error("[Chronicles] NPC AI error:", error);
      return {
        npc: { name: npc.name, title: npc.title, era: npc.era },
        response: "The NPC seems distracted and doesn't respond.",
        error: true,
      };
    }
  }

  async getNpcDisposition(characterId: string, npcId: string) {
    return { npcId, disposition: 50, rank: "neutral" };
  }

  getFactionsForEra(era: string) {
    return STARTER_FACTIONS.filter(f => f.era === era);
  }

  getNpcsForEra(era: string) {
    return STARTER_NPCS.filter(n => n.era === era);
  }

  async joinFaction(characterId: string, factionId: string) {
    const faction = STARTER_FACTIONS.find(f => f.id === factionId);
    if (!faction) throw new Error("Faction not found");

    return {
      success: true,
      faction,
      message: `You have pledged your loyalty to ${faction.name}. May your path be true.`,
    };
  }

  async getFactionStanding(characterId: string) {
    return STARTER_FACTIONS.map(f => ({
      faction: f,
      reputation: 0,
      rank: "neutral",
    }));
  }

  async createChronicleProof(characterId: string, proofType: string, title: string, decisionData: any) {
    const proofHash = createHash("sha256")
      .update(`proof:${characterId}:${proofType}:${JSON.stringify(decisionData)}:${Date.now()}`)
      .digest("hex");

    const proof = {
      id: `proof_${Date.now()}`,
      characterId,
      proofType,
      title,
      decisionData: JSON.stringify(decisionData),
      transactionHash: `0x${proofHash}`,
      guardianSignature: `sig_${proofHash.substring(0, 32)}`,
      shellsAwarded: "10",
      isSoulbound: true,
      createdAt: new Date(),
    };

    console.log(`[Chronicles] Created proof: ${title} - ${proof.transactionHash}`);
    return proof;
  }

  async getChronicleProofs(characterId: string) {
    return [];
  }

  async getCurrentSeason() {
    return {
      id: "season_zero",
      name: "Season Zero: The Awakening",
      description: "The first season of Chronicles. Three eras. Fifteen factions. Your legend begins.",
      seasonNumber: 0,
      startDate: new Date("2026-01-01"),
      endDate: new Date("2026-06-01"),
      totalShellsPool: "100000",
      totalDwcPool: "10000",
      participantCount: 0,
      questsAvailable: SEASON_ZERO_QUESTS.length,
      erasAvailable: Object.keys(ERAS).length,
      isActive: true,
    };
  }

  async getSeasonLeaderboard() {
    return [];
  }
}

export const chroniclesService = new ChroniclesGameService();
