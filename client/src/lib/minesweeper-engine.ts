// Minesweeper Game Engine

export interface Cell {
  isMine: boolean;
  isRevealed: boolean;
  isFlagged: boolean;
  adjacentMines: number;
}

export interface GameState {
  grid: Cell[][];
  rows: number;
  cols: number;
  mines: number;
  status: "playing" | "won" | "lost";
  flagsUsed: number;
  revealedCount: number;
  startTime: number | null;
  firstClick: boolean;
}

export type Difficulty = "easy" | "medium" | "hard";

export const DIFFICULTY_SETTINGS: Record<Difficulty, { rows: number; cols: number; mines: number }> = {
  easy: { rows: 9, cols: 9, mines: 10 },
  medium: { rows: 16, cols: 16, mines: 40 },
  hard: { rows: 16, cols: 30, mines: 99 },
};

function createEmptyGrid(rows: number, cols: number): Cell[][] {
  return Array.from({ length: rows }, () =>
    Array.from({ length: cols }, () => ({
      isMine: false,
      isRevealed: false,
      isFlagged: false,
      adjacentMines: 0,
    }))
  );
}

function placeMines(grid: Cell[][], mines: number, excludeRow: number, excludeCol: number): void {
  const rows = grid.length;
  const cols = grid[0].length;
  let placed = 0;
  
  while (placed < mines) {
    const row = Math.floor(Math.random() * rows);
    const col = Math.floor(Math.random() * cols);
    
    // Don't place mine on first click or adjacent to it
    const isExcluded = Math.abs(row - excludeRow) <= 1 && Math.abs(col - excludeCol) <= 1;
    
    if (!grid[row][col].isMine && !isExcluded) {
      grid[row][col].isMine = true;
      placed++;
    }
  }
}

function calculateAdjacentMines(grid: Cell[][]): void {
  const rows = grid.length;
  const cols = grid[0].length;
  
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      if (grid[row][col].isMine) continue;
      
      let count = 0;
      for (let dr = -1; dr <= 1; dr++) {
        for (let dc = -1; dc <= 1; dc++) {
          if (dr === 0 && dc === 0) continue;
          const nr = row + dr;
          const nc = col + dc;
          if (nr >= 0 && nr < rows && nc >= 0 && nc < cols && grid[nr][nc].isMine) {
            count++;
          }
        }
      }
      grid[row][col].adjacentMines = count;
    }
  }
}

export function createGame(difficulty: Difficulty): GameState {
  const { rows, cols, mines } = DIFFICULTY_SETTINGS[difficulty];
  return {
    grid: createEmptyGrid(rows, cols),
    rows,
    cols,
    mines,
    status: "playing",
    flagsUsed: 0,
    revealedCount: 0,
    startTime: null,
    firstClick: true,
  };
}

export function revealCell(state: GameState, row: number, col: number): GameState {
  if (state.status !== "playing") return state;
  
  const newGrid = state.grid.map(r => r.map(c => ({ ...c })));
  let newState = { ...state, grid: newGrid };
  
  // First click - place mines avoiding this cell
  if (newState.firstClick) {
    placeMines(newGrid, newState.mines, row, col);
    calculateAdjacentMines(newGrid);
    newState.firstClick = false;
    newState.startTime = Date.now();
  }
  
  const cell = newGrid[row][col];
  
  if (cell.isRevealed || cell.isFlagged) return newState;
  
  // Hit a mine
  if (cell.isMine) {
    cell.isRevealed = true;
    // Reveal all mines
    for (let r = 0; r < newState.rows; r++) {
      for (let c = 0; c < newState.cols; c++) {
        if (newGrid[r][c].isMine) {
          newGrid[r][c].isRevealed = true;
        }
      }
    }
    newState.status = "lost";
    return newState;
  }
  
  // Reveal this cell and cascade if empty
  const toReveal: [number, number][] = [[row, col]];
  
  while (toReveal.length > 0) {
    const [r, c] = toReveal.pop()!;
    const currentCell = newGrid[r][c];
    
    if (currentCell.isRevealed || currentCell.isFlagged || currentCell.isMine) continue;
    
    currentCell.isRevealed = true;
    newState.revealedCount++;
    
    // If cell has no adjacent mines, reveal neighbors
    if (currentCell.adjacentMines === 0) {
      for (let dr = -1; dr <= 1; dr++) {
        for (let dc = -1; dc <= 1; dc++) {
          if (dr === 0 && dc === 0) continue;
          const nr = r + dr;
          const nc = c + dc;
          if (nr >= 0 && nr < newState.rows && nc >= 0 && nc < newState.cols) {
            if (!newGrid[nr][nc].isRevealed) {
              toReveal.push([nr, nc]);
            }
          }
        }
      }
    }
  }
  
  // Check for win
  const totalSafeCells = newState.rows * newState.cols - newState.mines;
  if (newState.revealedCount === totalSafeCells) {
    newState.status = "won";
    // Auto-flag remaining mines
    for (let r = 0; r < newState.rows; r++) {
      for (let c = 0; c < newState.cols; c++) {
        if (newGrid[r][c].isMine && !newGrid[r][c].isFlagged) {
          newGrid[r][c].isFlagged = true;
        }
      }
    }
  }
  
  return newState;
}

export function toggleFlag(state: GameState, row: number, col: number): GameState {
  if (state.status !== "playing") return state;
  
  const cell = state.grid[row][col];
  if (cell.isRevealed) return state;
  
  const newGrid = state.grid.map(r => r.map(c => ({ ...c })));
  newGrid[row][col].isFlagged = !newGrid[row][col].isFlagged;
  
  return {
    ...state,
    grid: newGrid,
    flagsUsed: state.flagsUsed + (newGrid[row][col].isFlagged ? 1 : -1),
  };
}

export function chordReveal(state: GameState, row: number, col: number): GameState {
  if (state.status !== "playing") return state;
  
  const cell = state.grid[row][col];
  if (!cell.isRevealed || cell.adjacentMines === 0) return state;
  
  // Count adjacent flags
  let flagCount = 0;
  for (let dr = -1; dr <= 1; dr++) {
    for (let dc = -1; dc <= 1; dc++) {
      if (dr === 0 && dc === 0) continue;
      const nr = row + dr;
      const nc = col + dc;
      if (nr >= 0 && nr < state.rows && nc >= 0 && nc < state.cols) {
        if (state.grid[nr][nc].isFlagged) flagCount++;
      }
    }
  }
  
  // If flags match adjacent mines, reveal all unflagged neighbors
  if (flagCount === cell.adjacentMines) {
    let newState = state;
    for (let dr = -1; dr <= 1; dr++) {
      for (let dc = -1; dc <= 1; dc++) {
        if (dr === 0 && dc === 0) continue;
        const nr = row + dr;
        const nc = col + dc;
        if (nr >= 0 && nr < state.rows && nc >= 0 && nc < state.cols) {
          if (!newState.grid[nr][nc].isFlagged && !newState.grid[nr][nc].isRevealed) {
            newState = revealCell(newState, nr, nc);
            if (newState.status === "lost") break;
          }
        }
      }
      if (newState.status === "lost") break;
    }
    return newState;
  }
  
  return state;
}

export function getNumberColor(num: number): string {
  const colors: Record<number, string> = {
    1: "text-blue-600",
    2: "text-green-600",
    3: "text-red-600",
    4: "text-purple-700",
    5: "text-teal-700",
    6: "text-cyan-600",
    7: "text-gray-800",
    8: "text-gray-600",
  };
  return colors[num] || "text-gray-800";
}

export function formatTime(ms: number): string {
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
}
