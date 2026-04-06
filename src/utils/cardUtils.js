export const SUIT_SYMBOLS = { S: '♠', H: '♥', D: '♦', C: '♣', JK: '🃏' };
export const SUIT_COLORS = { S: 'black', H: 'red', D: 'red', C: 'black', JK: 'joker' };

export function suitSymbol(suit) { return SUIT_SYMBOLS[suit] || suit; }
export function cardColor(card) { return SUIT_COLORS[card.suit] || 'black'; }
export function isWildJoker(card, wildJoker) {
  if (!wildJoker) return false;
  if (card.rank === 'JK') return true;
  return card.rank === wildJoker.rank && card.suit !== 'JK';
}

export function validateMeldClient(cards, wildJoker) {
  if (!cards || cards.length < 3) return { valid: false, type: null };
  const isJoker = c => c.rank === 'JK' || (wildJoker && c.rank === wildJoker.rank);
  const nonJokers = cards.filter(c => !isJoker(c));
  const jokerCount = cards.length - nonJokers.length;
  const RANKS = ['A','2','3','4','5','6','7','8','9','10','J','Q','K'];

  if (nonJokers.length > 0) {
    const rank = nonJokers[0].rank;
    const suits = new Set(nonJokers.map(c => c.suit));
    if (nonJokers.every(c => c.rank === rank) && suits.size === nonJokers.length && cards.length <= 4)
      return { valid: true, type: 'set' };
  }
  if (nonJokers.length > 0) {
    const suits = new Set(nonJokers.map(c => c.suit));
    if (suits.size === 1) {
      const indices = nonJokers.map(c => RANKS.indexOf(c.rank)).sort((a,b)=>a-b);
      let gaps = 0;
      for (let i = 1; i < indices.length; i++) gaps += indices[i] - indices[i-1] - 1;
      if (gaps <= jokerCount) return { valid: true, type: jokerCount === 0 ? 'pure_sequence' : 'impure_sequence' };
    }
  }
  if (nonJokers.length === 0) return { valid: true, type: 'impure_sequence' };
  return { valid: false, type: null };
}

export function getMeldLabel(type) {
  if (type === 'pure_sequence') return 'Pure Seq';
  if (type === 'impure_sequence') return 'Seq';
  if (type === 'set') return 'Set';
  return 'Invalid';
}

export function getCardPoints(card, wildJoker) {
  if (card.rank === 'JK') return 0;
  if (wildJoker && card.rank === wildJoker.rank) return 0;
  if (['J','Q','K','A'].includes(card.rank)) return 10;
  return parseInt(card.rank);
}
