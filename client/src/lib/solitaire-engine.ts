// Klondike Solitaire Game Engine

export type Suit = "spades" | "hearts" | "diamonds" | "clubs";
export type Rank = "A" | "2" | "3" | "4" | "5" | "6" | "7" | "8" | "9" | "10" | "J" | "Q" | "K";

export interface Card {
  suit: Suit;
  rank: Rank;
  faceUp: boolean;
  id: string;
}

export interface GameState {
  stock: Card[];
  waste: Card[];
  foundations: Card[][]; // 4 piles, one per suit
  tableau: Card[][]; // 7 piles
  moves: number;
  startTime: number;
  status: "playing" | "won" | "paused";
  history: GameState[];
}

const SUITS: Suit[] = ["spades", "hearts", "diamonds", "clubs"];
const RANKS: Rank[] = ["A", "2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K"];

export const RANK_VALUES: Record<Rank, number> = {
  "A": 1, "2": 2, "3": 3, "4": 4, "5": 5, "6": 6, "7": 7,
  "8": 8, "9": 9, "10": 10, "J": 11, "Q": 12, "K": 13
};

export function isRed(suit: Suit): boolean {
  return suit === "hearts" || suit === "diamonds";
}

export function isBlack(suit: Suit): boolean {
  return suit === "spades" || suit === "clubs";
}

export function oppositeColor(suit1: Suit, suit2: Suit): boolean {
  return isRed(suit1) !== isRed(suit2);
}

export function createDeck(): Card[] {
  const deck: Card[] = [];
  for (const suit of SUITS) {
    for (const rank of RANKS) {
      deck.push({
        suit,
        rank,
        faceUp: false,
        id: `${suit}-${rank}`,
      });
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

export function createInitialState(): GameState {
  const deck = shuffleDeck(createDeck());
  
  // Deal to tableau
  const tableau: Card[][] = [[], [], [], [], [], [], []];
  let cardIndex = 0;
  
  for (let col = 0; col < 7; col++) {
    for (let row = col; row < 7; row++) {
      const card = { ...deck[cardIndex] };
      // Only the top card of each pile is face up
      card.faceUp = row === col;
      tableau[row].push(card);
      cardIndex++;
    }
  }
  
  // Remaining cards go to stock
  const stock = deck.slice(cardIndex).map(c => ({ ...c, faceUp: false }));
  
  return {
    stock,
    waste: [],
    foundations: [[], [], [], []],
    tableau,
    moves: 0,
    startTime: Date.now(),
    status: "playing",
    history: [],
  };
}

export function cloneState(state: GameState): GameState {
  return {
    stock: state.stock.map(c => ({ ...c })),
    waste: state.waste.map(c => ({ ...c })),
    foundations: state.foundations.map(pile => pile.map(c => ({ ...c }))),
    tableau: state.tableau.map(pile => pile.map(c => ({ ...c }))),
    moves: state.moves,
    startTime: state.startTime,
    status: state.status,
    history: [], // Don't clone history to avoid memory issues
  };
}

export function saveHistory(state: GameState): GameState {
  const historyEntry = cloneState(state);
  return {
    ...state,
    history: [...state.history.slice(-50), historyEntry], // Keep last 50 moves
  };
}

export function undo(state: GameState): GameState | null {
  if (state.history.length === 0) return null;
  const previous = state.history[state.history.length - 1];
  return {
    ...previous,
    history: state.history.slice(0, -1),
  };
}

// Draw from stock to waste
export function drawFromStock(state: GameState): GameState {
  const newState = saveHistory(state);
  
  if (newState.stock.length === 0) {
    // Flip waste back to stock
    newState.stock = newState.waste.reverse().map(c => ({ ...c, faceUp: false }));
    newState.waste = [];
  } else {
    // Draw 1 card (standard Klondike)
    const card = newState.stock.pop()!;
    card.faceUp = true;
    newState.waste.push(card);
  }
  
  newState.moves++;
  return newState;
}

// Check if card can be placed on foundation
export function canMoveToFoundation(card: Card, foundation: Card[]): boolean {
  if (foundation.length === 0) {
    return card.rank === "A";
  }
  const topCard = foundation[foundation.length - 1];
  return card.suit === topCard.suit && RANK_VALUES[card.rank] === RANK_VALUES[topCard.rank] + 1;
}

// Check if card can be placed on tableau pile
export function canMoveToTableau(card: Card, pile: Card[]): boolean {
  if (pile.length === 0) {
    return card.rank === "K";
  }
  const topCard = pile[pile.length - 1];
  if (!topCard.faceUp) return false;
  return oppositeColor(card.suit, topCard.suit) && RANK_VALUES[card.rank] === RANK_VALUES[topCard.rank] - 1;
}

// Move cards from one location to another
export function moveCards(
  state: GameState,
  from: { type: "waste" | "tableau" | "foundation"; index?: number; cardIndex?: number },
  to: { type: "tableau" | "foundation"; index: number }
): GameState | null {
  const newState = saveHistory(state);
  
  let cardsToMove: Card[] = [];
  
  // Get cards from source
  if (from.type === "waste") {
    if (newState.waste.length === 0) return null;
    cardsToMove = [newState.waste.pop()!];
  } else if (from.type === "tableau") {
    const pile = newState.tableau[from.index!];
    const startIdx = from.cardIndex ?? pile.length - 1;
    if (startIdx < 0 || startIdx >= pile.length) return null;
    if (!pile[startIdx].faceUp) return null;
    cardsToMove = pile.splice(startIdx);
    // Flip the new top card
    if (pile.length > 0 && !pile[pile.length - 1].faceUp) {
      pile[pile.length - 1].faceUp = true;
    }
  } else if (from.type === "foundation") {
    const foundation = newState.foundations[from.index!];
    if (foundation.length === 0) return null;
    cardsToMove = [foundation.pop()!];
  }
  
  if (cardsToMove.length === 0) return null;
  
  // Validate and place cards at destination
  if (to.type === "foundation") {
    if (cardsToMove.length !== 1) return null; // Can only move 1 card to foundation
    if (!canMoveToFoundation(cardsToMove[0], newState.foundations[to.index])) {
      // Revert
      return null;
    }
    newState.foundations[to.index].push(cardsToMove[0]);
  } else if (to.type === "tableau") {
    if (!canMoveToTableau(cardsToMove[0], newState.tableau[to.index])) {
      return null;
    }
    newState.tableau[to.index].push(...cardsToMove);
  }
  
  newState.moves++;
  
  // Check for win
  if (checkWin(newState)) {
    newState.status = "won";
  }
  
  return newState;
}

// Auto-move card to foundation if possible
export function autoMoveToFoundation(state: GameState, card: Card, from: { type: "waste" | "tableau"; index?: number }): GameState | null {
  for (let i = 0; i < 4; i++) {
    if (canMoveToFoundation(card, state.foundations[i])) {
      return moveCards(state, from, { type: "foundation", index: i });
    }
  }
  return null;
}

// Check if game is won
export function checkWin(state: GameState): boolean {
  return state.foundations.every(pile => pile.length === 13);
}

// Get valid moves for hints
export function getHints(state: GameState): Array<{ from: any; to: any; description: string }> {
  const hints: Array<{ from: any; to: any; description: string }> = [];
  
  // Check waste card
  if (state.waste.length > 0) {
    const card = state.waste[state.waste.length - 1];
    
    // To foundations
    for (let i = 0; i < 4; i++) {
      if (canMoveToFoundation(card, state.foundations[i])) {
        hints.push({
          from: { type: "waste" },
          to: { type: "foundation", index: i },
          description: `Move ${card.rank}${getSuitSymbol(card.suit)} to foundation`,
        });
      }
    }
    
    // To tableau
    for (let i = 0; i < 7; i++) {
      if (canMoveToTableau(card, state.tableau[i])) {
        hints.push({
          from: { type: "waste" },
          to: { type: "tableau", index: i },
          description: `Move ${card.rank}${getSuitSymbol(card.suit)} to tableau ${i + 1}`,
        });
      }
    }
  }
  
  // Check tableau cards
  for (let fromPile = 0; fromPile < 7; fromPile++) {
    const pile = state.tableau[fromPile];
    
    for (let cardIdx = 0; cardIdx < pile.length; cardIdx++) {
      const card = pile[cardIdx];
      if (!card.faceUp) continue;
      
      // Top card to foundation
      if (cardIdx === pile.length - 1) {
        for (let i = 0; i < 4; i++) {
          if (canMoveToFoundation(card, state.foundations[i])) {
            hints.push({
              from: { type: "tableau", index: fromPile, cardIndex: cardIdx },
              to: { type: "foundation", index: i },
              description: `Move ${card.rank}${getSuitSymbol(card.suit)} to foundation`,
            });
          }
        }
      }
      
      // To other tableau piles
      for (let toPile = 0; toPile < 7; toPile++) {
        if (toPile === fromPile) continue;
        if (canMoveToTableau(card, state.tableau[toPile])) {
          // Only suggest moves that expose new cards or to empty pile with King
          const wouldExposeCard = cardIdx > 0 && !pile[cardIdx - 1].faceUp;
          const isKingToEmpty = card.rank === "K" && state.tableau[toPile].length === 0;
          
          if (wouldExposeCard || isKingToEmpty) {
            hints.push({
              from: { type: "tableau", index: fromPile, cardIndex: cardIdx },
              to: { type: "tableau", index: toPile },
              description: `Move ${card.rank}${getSuitSymbol(card.suit)} to tableau ${toPile + 1}`,
            });
          }
        }
      }
    }
  }
  
  return hints;
}

export function getSuitSymbol(suit: Suit): string {
  const symbols = { spades: "♠", hearts: "♥", diamonds: "♦", clubs: "♣" };
  return symbols[suit];
}

export function getSuitColor(suit: Suit): string {
  return isRed(suit) ? "text-red-500" : "text-gray-900";
}

// Auto-complete: automatically move all possible cards to foundations
export function autoComplete(state: GameState): GameState {
  let current = { ...state };
  let moved = true;
  
  while (moved && current.status === "playing") {
    moved = false;
    
    // Try to move from tableau tops
    for (let i = 0; i < 7; i++) {
      const pile = current.tableau[i];
      if (pile.length > 0) {
        const topCard = pile[pile.length - 1];
        if (topCard.faceUp) {
          const result = autoMoveToFoundation(current, topCard, { type: "tableau", index: i });
          if (result) {
            current = result;
            moved = true;
            break;
          }
        }
      }
    }
    
    // Try from waste
    if (!moved && current.waste.length > 0) {
      const topCard = current.waste[current.waste.length - 1];
      const result = autoMoveToFoundation(current, topCard, { type: "waste" });
      if (result) {
        current = result;
        moved = true;
      }
    }
  }
  
  return current;
}
