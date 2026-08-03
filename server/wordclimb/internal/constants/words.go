package constants

// Word data for WordClimb levels.
//
// This replaces the country/continent tables the server inherited from
// earthunt: WordClimb levels are word ladders, so the only reference data
// the server needs is a dictionary and a set of begin/end word pairs.

// LevelSeed is a curated puzzle: a start word and an end word. The ladder
// between them is not stored, it is computed by utils.GenerateLevels so the
// dictionary stays the single source of truth.
type LevelSeed struct {
	ID        int
	BeginWord string
	EndWord   string
}

// LevelSeeds mirrors the curated puzzles bundled with the client in
// apps/wordclimb/lib/data/levels.ts. Every pair below is reachable in Words;
// unsolvable pairs would simply be skipped by utils.GenerateLevels.
var LevelSeeds = []LevelSeed{
	{ID: 1, BeginWord: "cold", EndWord: "warm"},
	{ID: 2, BeginWord: "love", EndWord: "hate"},
	{ID: 3, BeginWord: "four", EndWord: "five"},
	{ID: 4, BeginWord: "head", EndWord: "tail"},
	{ID: 5, BeginWord: "soft", EndWord: "hard"},
	{ID: 6, BeginWord: "mind", EndWord: "body"},
	{ID: 7, BeginWord: "lass", EndWord: "male"},
	{ID: 8, BeginWord: "milk", EndWord: "wine"},
	{ID: 9, BeginWord: "west", EndWord: "east"},
	{ID: 10, BeginWord: "slow", EndWord: "fast"},
	{ID: 11, BeginWord: "rise", EndWord: "fall"},
	{ID: 12, BeginWord: "dark", EndWord: "lamp"},
	{ID: 13, BeginWord: "cake", EndWord: "pine"},
	{ID: 14, BeginWord: "hire", EndWord: "fast"},
	{ID: 15, BeginWord: "game", EndWord: "play"},
}

// Words is the four-letter English dictionary used to build and validate
// ladders. It is the deduplicated four-letter subset of
// apps/wordclimb/lib/data/words-en.json, so client and server agree on
// which moves are legal.
var Words = []string{
	"able", "also", "area", "away", "back", "ball", "band", "bank", "bare",
	"barn", "base", "bast", "bear", "beat", "been", "bell", "belt", "bend",
	"best", "bill", "bind", "bird", "bite", "blue", "boat", "body", "bolt",
	"bond", "bone", "bony", "book", "bore", "born", "both", "bowl", "burn",
	"bury", "bush", "busy", "cage", "cake", "call", "calm", "came", "camp",
	"cane", "card", "care", "cart", "case", "cash", "cast", "cell", "cent",
	"chip", "city", "clam", "clan", "clay", "clip", "coat", "code", "coin",
	"cold", "come", "cook", "cool", "cope", "copy", "cord", "core", "corn",
	"cost", "crop", "crow", "cure", "dare", "dark", "darn", "data", "date",
	"dawn", "days", "dead", "deal", "dear", "debt", "deep", "deny", "desk",
	"dial", "diet", "dirt", "disc", "dish", "disk", "door", "down", "draw",
	"drop", "drum", "duck", "dull", "duty", "each", "earl", "earn", "ease",
	"east", "easy", "edge", "else", "even", "ever", "evil", "exit", "face",
	"fact", "fail", "fair", "fall", "farm", "fast", "fate", "fear", "feat",
	"feed", "feel", "feet", "fell", "felt", "file", "fill", "film", "find",
	"fine", "fire", "firm", "fish", "fist", "five", "flat", "flaw", "flay",
	"flow", "folk", "food", "foot", "ford", "fore", "form", "fort", "four",
	"free", "from", "fuel", "full", "gain", "game", "gate", "gave", "gear",
	"gene", "gift", "girl", "give", "glad", "goal", "goat", "gold", "golf",
	"gone", "good", "gray", "grew", "grey", "grow", "gulf", "hair", "half",
	"hall", "hand", "hang", "hard", "hare", "harm", "hate", "have", "head",
	"heal", "hear", "heat", "held", "help", "here", "hero", "high", "hill",
	"hire", "hold", "hole", "holy", "home", "hope", "horn", "host", "hour",
	"huge", "hunt", "idea", "inch", "into", "iron", "isle", "item", "jack",
	"jane", "john", "join", "jump", "jury", "just", "keep", "kept", "kick",
	"kill", "kind", "king", "knee", "knew", "know", "lack", "lady", "laid",
	"lain", "lake", "lamp", "land", "lane", "lass", "last", "late", "lead",
	"left", "lend", "less", "life", "lift", "like", "line", "link", "list",
	"live", "load", "loan", "lock", "lone", "long", "look", "lord", "lose",
	"loss", "lost", "love", "luck", "made", "mail", "main", "make", "male",
	"malt", "many", "mark", "mass", "mast", "mate", "math", "meal", "mean",
	"meat", "meet", "menu", "mere", "milk", "mill", "mind", "mine", "miss",
	"mode", "mood", "moon", "more", "most", "move", "much", "must", "myth",
	"name", "near", "neck", "need", "nest", "news", "next", "nice", "nine",
	"none", "nose", "note", "okay", "once", "only", "onto", "open", "oral",
	"over", "pace", "pack", "page", "pain", "pair", "pale", "palm", "pane",
	"park", "part", "pass", "past", "path", "peak", "pick", "pile", "pine",
	"pink", "pipe", "plan", "play", "plot", "plus", "pool", "poor", "port",
	"post", "pour", "pray", "prey", "pull", "pure", "push", "race", "rail",
	"rain", "rank", "rare", "rate", "read", "real", "rear", "rely", "rent",
	"rest", "rice", "rich", "ride", "rile", "ring", "rise", "risk", "road",
	"rock", "role", "roll", "roof", "room", "root", "rope", "rose", "rule",
	"rush", "safe", "sail", "sale", "same", "sand", "save", "seat", "seed",
	"seek", "seem", "seen", "self", "sell", "send", "ship", "shop", "shot",
	"show", "shut", "side", "sign", "site", "size", "skin", "slaw", "slip",
	"slow", "snow", "soft", "soil", "sold", "sole", "some", "song", "soon",
	"sore", "sort", "soul", "spot", "star", "stay", "step", "stop", "such",
	"suit", "sure", "tail", "take", "tale", "talk", "tall", "tank", "tape",
	"task", "teal", "team", "tear", "tell", "term", "test", "text", "than",
	"that", "thee", "them", "then", "they", "thin", "this", "thus", "tide",
	"tied", "time", "tiny", "told", "toll", "tone", "took", "tool", "tour",
	"town", "tree", "trip", "true", "turn", "twin", "type", "unit", "upon",
	"used", "user", "vary", "very", "view", "vote", "wage", "wait", "wake",
	"walk", "wall", "want", "ward", "warm", "wash", "wave", "ways", "weak",
	"wear", "week", "well", "went", "were", "west", "what", "when", "wide",
	"wife", "wild", "wile", "will", "wind", "wine", "wing", "wire", "wise",
	"wish", "with", "wood", "word", "work", "worn", "wrap", "yard", "year",
	"your", "zero",
}
