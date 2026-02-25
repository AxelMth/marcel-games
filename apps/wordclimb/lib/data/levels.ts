export interface Level {
  id: number
  beginWord: string
  endWord: string
  wordLadder: string[] // intermediate words in order (begin -> end)
}

export const levels: Level[] = [
  { id: 1, beginWord: "cold", endWord: "warm", wordLadder: ["cord", "card", "ward"] },
  { id: 2, beginWord: "head", endWord: "tail", wordLadder: ["heal", "teal", "tell", "tall"] },
  { id: 3, beginWord: "hide", endWord: "seek", wordLadder: ["side", "site", "site", "silk", "sill", "sell", "seel"] },
  { id: 4, beginWord: "lead", endWord: "gold", wordLadder: ["load", "goad", "goad", "gold"] },
  { id: 5, beginWord: "rise", endWord: "fall", wordLadder: ["rile", "file", "fill", "fill", "fall"] },
  { id: 6, beginWord: "slow", endWord: "fast", wordLadder: ["slot", "soot", "foot", "foot", "fist", "fast"] },
  { id: 7, beginWord: "love", endWord: "hate", wordLadder: ["lone", "lane", "late"] },
  { id: 8, beginWord: "rain", endWord: "snow", wordLadder: ["rein", "sein", "sewn", "sewn", "show", "snow"] },
  { id: 9, beginWord: "dark", endWord: "glow", wordLadder: ["dork", "dock", "gock", "glow"] },
  { id: 10, beginWord: "fish", endWord: "bird", wordLadder: ["fist", "firt", "fire", "hire", "hird", "bird"] },
  { id: 11, beginWord: "soft", endWord: "hard", wordLadder: ["sort", "sore", "hare", "hard"] },
  { id: 12, beginWord: "poor", endWord: "rich", wordLadder: ["pour", "pout", "rout", "rout", "rick", "rich"] },
  { id: 13, beginWord: "dawn", endWord: "dusk", wordLadder: ["down", "down", "dusk"] },
  { id: 14, beginWord: "play", endWord: "work", wordLadder: ["plan", "clan", "claw", "clow", "crow", "crow", "cork", "work"] },
  { id: 15, beginWord: "mind", endWord: "body", wordLadder: ["bind", "bond", "bony", "body"] },
  { id: 16, beginWord: "lass", endWord: "male", wordLadder: ["mass", "mast", "malt", "male"] },
  { id: 17, beginWord: "four", endWord: "five", wordLadder: ["fore", "fire", "five"] },
  { id: 18, beginWord: "west", endWord: "east", wordLadder: ["best", "beat", "beat", "east"] },
  { id: 19, beginWord: "milk", endWord: "wine", wordLadder: ["mill", "will", "wile", "wine"] },
  { id: 20, beginWord: "boat", endWord: "ship", wordLadder: ["bolt", "bolt", "silt", "sill", "shill", "ship"] },
]

// Curated valid puzzles (each word differs by exactly one letter)
export const validLevels: Level[] = [
  { id: 1, beginWord: "cold", endWord: "warm", wordLadder: ["cord", "card", "ward"] },
  { id: 2, beginWord: "love", endWord: "hate", wordLadder: ["lone", "lane", "late"] },
  { id: 3, beginWord: "four", endWord: "five", wordLadder: ["fore", "fire"] },
  { id: 4, beginWord: "head", endWord: "tail", wordLadder: ["heal", "teal", "tell", "tall"] },
  { id: 5, beginWord: "soft", endWord: "hard", wordLadder: ["sort", "sore", "hare"] },
  { id: 6, beginWord: "mind", endWord: "body", wordLadder: ["bind", "bond", "bony"] },
  { id: 7, beginWord: "lass", endWord: "male", wordLadder: ["mass", "mast", "malt"] },
  { id: 8, beginWord: "milk", endWord: "wine", wordLadder: ["mill", "will", "wile"] },
  { id: 9, beginWord: "west", endWord: "east", wordLadder: ["best", "bast"] },
  { id: 10, beginWord: "slow", endWord: "fast", wordLadder: ["slaw", "flaw", "flay", "flat"] },
  { id: 11, beginWord: "rise", endWord: "fall", wordLadder: ["rile", "file", "fill"] },
  { id: 12, beginWord: "dark", endWord: "lamp", wordLadder: ["darn", "darn", "lain", "lain", "lamp"] },
  { id: 13, beginWord: "cake", endWord: "pine", wordLadder: ["cane", "pane", "pine"] },
  { id: 14, beginWord: "hire", endWord: "fast", wordLadder: ["fire", "fir", "fist"] },
  { id: 15, beginWord: "game", endWord: "play", wordLadder: ["came", "clam", "clan", "plan"] },
]
