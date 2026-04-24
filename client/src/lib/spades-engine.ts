// Complete Spades Game Engine with AI

export type Suit = "spades" | "hearts" | "diamonds" | "clubs";
export type Rank = "2" | "3" | "4" | "5" | "6" | "7" | "8" | "9" | "10" | "J" | "Q" | "K" | "A";

export interface Card {
  suit: Suit;
  rank: Rank;
}

export interface Player {
  id: string;
  name: string;
  isAI: boolean;
  hand: Card[];
  bid: number | null;
  tricksWon: number;
  seatPosition: number; // 0=South (you), 1=West, 2=North (partner), 3=East
  teamNumber: 1 | 2; // positions 0,2 = team1, positions 1,3 = team2
}

export interface Trick {
  cards: { playerId: string; card: Card }[];
  leadSuit: Suit | null;
  winnerId: string | null;
}

export interface GameState {
  status: "waiting" | "bidding" | "playing" | "roundEnd" | "gameOver";
  players: Player[];
  currentPlayerIndex: number;
  currentRound: number;
  currentTrick: Trick;
  trickNumber: number;
  spadeBroken: boolean;
  team1Score: number;
  team2Score: number;
  team1Bags: number;
  team2Bags: number;
  team1RoundTricks: number;
  team2RoundTricks: number;
  targetScore: number;
  lastTrick: Trick | null;
  roundHistory: RoundResult[];
  winner: 1 | 2 | null;
  difficulty: "easy" | "medium" | "hard";
}

export interface RoundResult {
  round: number;
  team1Bid: number;
  team2Bid: number;
  team1Tricks: number;
  team2Tricks: number;
  team1Points: number;
  team2Points: number;
}

const SUITS: Suit[] = ["spades", "hearts", "diamonds", "clubs"];
const RANKS: Rank[] = ["2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K", "A"];
const RANK_VALUES: Record<Rank, number> = {
  "2": 2, "3": 3, "4": 4, "5": 5, "6": 6, "7": 7, "8": 8,
  "9": 9, "10": 10, "J": 11, "Q": 12, "K": 13, "A": 14
};

export function createDeck(): Card[] {
  const deck: Card[] = [];
  for (const suit of SUITS) {
    for (const rank of RANKS) {
      deck.push({ suit, rank });
    }
  }
  return deck;
}

export function shuffleDeck(deck: Card[]): Card[] {
  const shuffled = [...deck];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

export function dealCards(players: Player[]): Player[] {
  const deck = shuffleDeck(createDeck());
  return players.map((player, index) => ({
    ...player,
    hand: sortHand(deck.slice(index * 13, (index + 1) * 13)),
    bid: null,
    tricksWon: 0,
  }));
}

export function sortHand(hand: Card[]): Card[] {
  const suitOrder: Record<Suit, number> = { spades: 0, hearts: 1, diamonds: 2, clubs: 3 };
  return [...hand].sort((a, b) => {
    if (suitOrder[a.suit] !== suitOrder[b.suit]) {
      return suitOrder[a.suit] - suitOrder[b.suit];
    }
    return RANK_VALUES[b.rank] - RANK_VALUES[a.rank];
  });
}

export function getCardValue(card: Card): number {
  return RANK_VALUES[card.rank];
}

export function getValidPlays(hand: Card[], trick: Trick, spadeBroken: boolean): Card[] {
  if (trick.cards.length === 0) {
    // Leading the trick
    if (spadeBroken) {
      return hand;
    }
    // Can't lead spades unless broken or only have spades
    const nonSpades = hand.filter(c => c.suit !== "spades");
    return nonSpades.length > 0 ? nonSpades : hand;
  }
  
  // Must follow lead suit if possible
  const leadSuit = trick.leadSuit!;
  const suitCards = hand.filter(c => c.suit === leadSuit);
  if (suitCards.length > 0) {
    return suitCards;
  }
  
  // Can play any card (including spades - this breaks spades)
  return hand;
}

export function determineTrickWinner(trick: Trick): string {
  let winningPlay = trick.cards[0];
  const leadSuit = trick.leadSuit!;
  
  for (let i = 1; i < trick.cards.length; i++) {
    const play = trick.cards[i];
    const currentCard = play.card;
    const winningCard = winningPlay.card;
    
    // Spades trump everything
    if (currentCard.suit === "spades" && winningCard.suit !== "spades") {
      winningPlay = play;
    } else if (currentCard.suit === winningCard.suit) {
      // Same suit - higher rank wins
      if (getCardValue(currentCard) > getCardValue(winningCard)) {
        winningPlay = play;
      }
    }
    // If different suit and not spades, doesn't beat current winner
  }
  
  return winningPlay.playerId;
}

export function calculateRoundScore(
  teamBid: number,
  teamTricks: number,
  currentBags: number
): { points: number; newBags: number; bagPenalty: boolean } {
  if (teamBid === 0) {
    // Nil bid
    if (teamTricks === 0) {
      return { points: 100, newBags: 0, bagPenalty: false };
    } else {
      return { points: -100, newBags: teamTricks, bagPenalty: false };
    }
  }
  
  if (teamTricks >= teamBid) {
    const bags = teamTricks - teamBid;
    const totalBags = currentBags + bags;
    const bagPenalty = totalBags >= 10;
    return {
      points: teamBid * 10 + bags,
      newBags: bagPenalty ? totalBags - 10 : totalBags,
      bagPenalty,
    };
  } else {
    // Failed to make bid
    return { points: -teamBid * 10, newBags: currentBags, bagPenalty: false };
  }
}

// AI Logic
export function getAIBid(player: Player, difficulty: "easy" | "medium" | "hard"): number {
  const hand = player.hand;
  let bid = 0;
  
  // Count spades
  const spades = hand.filter(c => c.suit === "spades");
  bid += Math.min(spades.length, difficulty === "hard" ? 4 : 3);
  
  // Count high cards in other suits
  const highCards = hand.filter(c => 
    c.suit !== "spades" && 
    (c.rank === "A" || (c.rank === "K" && difficulty !== "easy"))
  );
  bid += highCards.length;
  
  // Adjust based on difficulty
  if (difficulty === "easy") {
    bid = Math.max(1, bid - 1);
  } else if (difficulty === "hard") {
    bid = Math.min(13, bid + (Math.random() > 0.7 ? 1 : 0));
  }
  
  return Math.max(1, Math.min(13, bid));
}

export function getAIPlay(
  player: Player,
  trick: Trick,
  gameState: GameState,
  difficulty: "easy" | "medium" | "hard"
): Card {
  const validPlays = getValidPlays(player.hand, trick, gameState.spadeBroken);
  
  if (validPlays.length === 1) {
    return validPlays[0];
  }
  
  if (difficulty === "easy") {
    // Random valid play
    return validPlays[Math.floor(Math.random() * validPlays.length)];
  }
  
  // Medium/Hard: More strategic
  if (trick.cards.length === 0) {
    // Leading - play high cards first
    if (difficulty === "hard") {
      // Lead with winners or short suits
      const aces = validPlays.filter(c => c.rank === "A" && c.suit !== "spades");
      if (aces.length > 0) return aces[0];
    }
    // Play lowest card from longest suit
    const suitCounts = new Map<Suit, number>();
    for (const card of validPlays) {
      suitCounts.set(card.suit, (suitCounts.get(card.suit) || 0) + 1);
    }
    let longestSuit: Suit = validPlays[0].suit;
    let maxCount = 0;
    suitCounts.forEach((count, suit) => {
      if (count > maxCount) {
        maxCount = count;
        longestSuit = suit;
      }
    });
    const suitCards = validPlays.filter(c => c.suit === longestSuit);
    return suitCards[suitCards.length - 1]; // Lowest of longest suit
  }
  
  // Following
  const leadSuit = trick.leadSuit!;
  const partnerIndex = (player.seatPosition + 2) % 4;
  const partnerPlayed = trick.cards.find(p => 
    gameState.players.find(pl => pl.id === p.playerId)?.seatPosition === partnerIndex
  );
  
  // Check if partner is winning
  if (partnerPlayed && trick.cards.length >= 2) {
    const currentWinner = determineTrickWinner(trick);
    if (currentWinner === partnerPlayed.playerId) {
      // Partner winning - play low
      return validPlays[validPlays.length - 1];
    }
  }
  
  // Try to win
  const leadCards = validPlays.filter(c => c.suit === leadSuit);
  if (leadCards.length > 0) {
    // Can follow suit
    const highestPlayed = Math.max(
      ...trick.cards
        .filter(p => p.card.suit === leadSuit)
        .map(p => getCardValue(p.card))
    );
    const winners = leadCards.filter(c => getCardValue(c) > highestPlayed);
    if (winners.length > 0) {
      return winners[winners.length - 1]; // Lowest winning card
    }
    return leadCards[leadCards.length - 1]; // Lowest card if can't win
  }
  
  // Can't follow suit - consider trumping
  const spades = validPlays.filter(c => c.suit === "spades");
  const highestSpade = trick.cards
    .filter(p => p.card.suit === "spades")
    .reduce((max, p) => Math.max(max, getCardValue(p.card)), 0);
  
  if (spades.length > 0 && difficulty === "hard") {
    const winningSpades = spades.filter(c => getCardValue(c) > highestSpade);
    if (winningSpades.length > 0) {
      return winningSpades[winningSpades.length - 1]; // Lowest winning spade
    }
  }
  
  // Discard lowest
  return validPlays[validPlays.length - 1];
}

export function createInitialGameState(
  playerName: string,
  difficulty: "easy" | "medium" | "hard" = "medium"
): GameState {
  const players: Player[] = [
    { id: "player", name: playerName, isAI: false, hand: [], bid: null, tricksWon: 0, seatPosition: 0, teamNumber: 1 },
    { id: "ai_west", name: "West", isAI: true, hand: [], bid: null, tricksWon: 0, seatPosition: 1, teamNumber: 2 },
    { id: "ai_north", name: "Partner", isAI: true, hand: [], bid: null, tricksWon: 0, seatPosition: 2, teamNumber: 1 },
    { id: "ai_east", name: "East", isAI: true, hand: [], bid: null, tricksWon: 0, seatPosition: 3, teamNumber: 2 },
  ];
  
  const dealtPlayers = dealCards(players);
  
  return {
    status: "bidding",
    players: dealtPlayers,
    currentPlayerIndex: 0, // South (player) bids first
    currentRound: 1,
    currentTrick: { cards: [], leadSuit: null, winnerId: null },
    trickNumber: 1,
    spadeBroken: false,
    team1Score: 0,
    team2Score: 0,
    team1Bags: 0,
    team2Bags: 0,
    team1RoundTricks: 0,
    team2RoundTricks: 0,
    targetScore: 500,
    lastTrick: null,
    roundHistory: [],
    winner: null,
    difficulty,
  };
}

export function getTeamBid(players: Player[], teamNumber: 1 | 2): number {
  return players
    .filter(p => p.teamNumber === teamNumber)
    .reduce((sum, p) => sum + (p.bid || 0), 0);
}
