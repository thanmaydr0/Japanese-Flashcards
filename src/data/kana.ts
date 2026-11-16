export type Script = 'hiragana' | 'katakana';
export type KanaKind = 'basic' | 'dakuten' | 'yoon';

export type KanaCard = {
  id: string;
  script: Script;
  character: string;
  romaji: string;
  group: string;
  kind: KanaKind;
};

export type WordCard = {
  id: string;
  script: Script;
  text: string;
  romaji: string;
  meaning: string;
  level: 'warm-up' | 'everyday' | 'stretch';
};

type KanaRow = {
  group: string;
  h: string[];
  k: string[];
  r: string[];
};

const basicRows: KanaRow[] = [
  { group: 'vowels', h: ['あ', 'い', 'う', 'え', 'お'], k: ['ア', 'イ', 'ウ', 'エ', 'オ'], r: ['a', 'i', 'u', 'e', 'o'] },
  { group: 'k', h: ['か', 'き', 'く', 'け', 'こ'], k: ['カ', 'キ', 'ク', 'ケ', 'コ'], r: ['ka', 'ki', 'ku', 'ke', 'ko'] },
  { group: 's', h: ['さ', 'し', 'す', 'せ', 'そ'], k: ['サ', 'シ', 'ス', 'セ', 'ソ'], r: ['sa', 'shi', 'su', 'se', 'so'] },
  { group: 't', h: ['た', 'ち', 'つ', 'て', 'と'], k: ['タ', 'チ', 'ツ', 'テ', 'ト'], r: ['ta', 'chi', 'tsu', 'te', 'to'] },
  { group: 'n', h: ['な', 'に', 'ぬ', 'ね', 'の'], k: ['ナ', 'ニ', 'ヌ', 'ネ', 'ノ'], r: ['na', 'ni', 'nu', 'ne', 'no'] },
  { group: 'h', h: ['は', 'ひ', 'ふ', 'へ', 'ほ'], k: ['ハ', 'ヒ', 'フ', 'ヘ', 'ホ'], r: ['ha', 'hi', 'fu', 'he', 'ho'] },
  { group: 'm', h: ['ま', 'み', 'む', 'め', 'も'], k: ['マ', 'ミ', 'ム', 'メ', 'モ'], r: ['ma', 'mi', 'mu', 'me', 'mo'] },
  { group: 'y', h: ['や', 'ゆ', 'よ'], k: ['ヤ', 'ユ', 'ヨ'], r: ['ya', 'yu', 'yo'] },
  { group: 'r', h: ['ら', 'り', 'る', 'れ', 'ろ'], k: ['ラ', 'リ', 'ル', 'レ', 'ロ'], r: ['ra', 'ri', 'ru', 're', 'ro'] },
  { group: 'w', h: ['わ', 'を'], k: ['ワ', 'ヲ'], r: ['wa', 'wo'] },
  { group: 'n-final', h: ['ん'], k: ['ン'], r: ['n'] },
];

const voicedRows: KanaRow[] = [
  { group: 'dakuten', h: ['が', 'ぎ', 'ぐ', 'げ', 'ご'], k: ['ガ', 'ギ', 'グ', 'ゲ', 'ゴ'], r: ['ga', 'gi', 'gu', 'ge', 'go'] },
  { group: 'dakuten', h: ['ざ', 'じ', 'ず', 'ぜ', 'ぞ'], k: ['ザ', 'ジ', 'ズ', 'ゼ', 'ゾ'], r: ['za', 'ji', 'zu', 'ze', 'zo'] },
  { group: 'dakuten', h: ['だ', 'ぢ', 'づ', 'で', 'ど'], k: ['ダ', 'ヂ', 'ヅ', 'デ', 'ド'], r: ['da', 'ji (di)', 'zu (du)', 'de', 'do'] },
  { group: 'dakuten', h: ['ば', 'び', 'ぶ', 'べ', 'ぼ'], k: ['バ', 'ビ', 'ブ', 'ベ', 'ボ'], r: ['ba', 'bi', 'bu', 'be', 'bo'] },
  { group: 'dakuten', h: ['ぱ', 'ぴ', 'ぷ', 'ぺ', 'ぽ'], k: ['パ', 'ピ', 'プ', 'ペ', 'ポ'], r: ['pa', 'pi', 'pu', 'pe', 'po'] },
];

const yoonRows: KanaRow[] = [
  { group: 'yoon', h: ['きゃ', 'きゅ', 'きょ'], k: ['キャ', 'キュ', 'キョ'], r: ['kya', 'kyu', 'kyo'] },
  { group: 'yoon', h: ['しゃ', 'しゅ', 'しょ'], k: ['シャ', 'シュ', 'ショ'], r: ['sha', 'shu', 'sho'] },
  { group: 'yoon', h: ['ちゃ', 'ちゅ', 'ちょ'], k: ['チャ', 'チュ', 'チョ'], r: ['cha', 'chu', 'cho'] },
  { group: 'yoon', h: ['にゃ', 'にゅ', 'にょ'], k: ['ニャ', 'ニュ', 'ニョ'], r: ['nya', 'nyu', 'nyo'] },
  { group: 'yoon', h: ['ひゃ', 'ひゅ', 'ひょ'], k: ['ヒャ', 'ヒュ', 'ヒョ'], r: ['hya', 'hyu', 'hyo'] },
  { group: 'yoon', h: ['みゃ', 'みゅ', 'みょ'], k: ['ミャ', 'ミュ', 'ミョ'], r: ['mya', 'myu', 'myo'] },
  { group: 'yoon', h: ['りゃ', 'りゅ', 'りょ'], k: ['リャ', 'リュ', 'リョ'], r: ['rya', 'ryu', 'ryo'] },
  { group: 'yoon', h: ['ぎゃ', 'ぎゅ', 'ぎょ'], k: ['ギャ', 'ギュ', 'ギョ'], r: ['gya', 'gyu', 'gyo'] },
  { group: 'yoon', h: ['じゃ', 'じゅ', 'じょ'], k: ['ジャ', 'ジュ', 'ジョ'], r: ['ja', 'ju', 'jo'] },
  { group: 'yoon', h: ['びゃ', 'びゅ', 'びょ'], k: ['ビャ', 'ビュ', 'ビョ'], r: ['bya', 'byu', 'byo'] },
  { group: 'yoon', h: ['ぴゃ', 'ぴゅ', 'ぴょ'], k: ['ピャ', 'ピュ', 'ピョ'], r: ['pya', 'pyu', 'pyo'] },
];

function expandRows(rows: KanaRow[], kind: KanaKind): KanaCard[] {
  return rows.flatMap((row) => [
    ...row.h.map((character, index) => ({
      id: `h-${character}`,
      script: 'hiragana' as const,
      character,
      romaji: row.r[index],
      group: row.group,
      kind,
    })),
    ...row.k.map((character, index) => ({
      id: `k-${character}`,
      script: 'katakana' as const,
      character,
      romaji: row.r[index],
      group: row.group,
      kind,
    })),
  ]);
}

export const KANA_CARDS: KanaCard[] = [
  ...expandRows(basicRows, 'basic'),
  ...expandRows(voicedRows, 'dakuten'),
  ...expandRows(yoonRows, 'yoon'),
];

const words: Omit<WordCard, 'id'>[] = [
  { script: 'hiragana', text: 'あさごはん', romaji: 'asagohan', meaning: 'breakfast', level: 'warm-up' },
  { script: 'hiragana', text: 'ひらがな', romaji: 'hiragana', meaning: 'hiragana', level: 'warm-up' },
  { script: 'hiragana', text: 'にほんご', romaji: 'nihongo', meaning: 'Japanese language', level: 'warm-up' },
  { script: 'hiragana', text: 'おいしい', romaji: 'oishii', meaning: 'delicious', level: 'everyday' },
  { script: 'hiragana', text: 'ともだち', romaji: 'tomodachi', meaning: 'friend', level: 'everyday' },
  { script: 'hiragana', text: 'がっこう', romaji: 'gakkou', meaning: 'school', level: 'everyday' },
  { script: 'hiragana', text: 'ゆうびんきょく', romaji: 'yuubinkyoku', meaning: 'post office', level: 'stretch' },
  { script: 'hiragana', text: 'べんきょう', romaji: 'benkyou', meaning: 'study', level: 'everyday' },
  { script: 'hiragana', text: 'ありがとう', romaji: 'arigatou', meaning: 'thank you', level: 'everyday' },
  { script: 'hiragana', text: 'おかあさん', romaji: 'okaasan', meaning: 'mother', level: 'everyday' },
  { script: 'hiragana', text: 'ねこがすきです', romaji: 'neko ga suki desu', meaning: 'I like cats', level: 'stretch' },
  { script: 'hiragana', text: 'にほんごをべんきょうしています', romaji: 'nihongo o benkyou shite imasu', meaning: 'I am studying Japanese', level: 'stretch' },
  { script: 'hiragana', text: 'ちいさないぬがはしっています', romaji: 'chiisana inu ga hashitte imasu', meaning: 'A little dog is running', level: 'stretch' },
  { script: 'hiragana', text: 'としょかんでほんをよみます', romaji: 'toshokan de hon o yomimasu', meaning: 'I read books at the library', level: 'stretch' },
  { script: 'katakana', text: 'コーヒー', romaji: 'koohii', meaning: 'coffee', level: 'warm-up' },
  { script: 'katakana', text: 'テレビ', romaji: 'terebi', meaning: 'television', level: 'warm-up' },
  { script: 'katakana', text: 'カメラ', romaji: 'kamera', meaning: 'camera', level: 'warm-up' },
  { script: 'katakana', text: 'タクシー', romaji: 'takushii', meaning: 'taxi', level: 'everyday' },
  { script: 'katakana', text: 'チョコレート', romaji: 'chokoreeto', meaning: 'chocolate', level: 'everyday' },
  { script: 'katakana', text: 'アイスクリーム', romaji: 'aisukuriimu', meaning: 'ice cream', level: 'everyday' },
  { script: 'katakana', text: 'コンピューター', romaji: 'konpyuutaa', meaning: 'computer', level: 'stretch' },
  { script: 'katakana', text: 'インターネット', romaji: 'intaanetto', meaning: 'internet', level: 'stretch' },
  { script: 'katakana', text: 'スーパーマーケット', romaji: 'suupaamaaketto', meaning: 'supermarket', level: 'stretch' },
  { script: 'katakana', text: 'スマートフォン', romaji: 'sumaato fon', meaning: 'smartphone', level: 'stretch' },
  { script: 'katakana', text: 'レストランでランチをたべます', romaji: 'resutoran de ranchi o tabemasu', meaning: 'I eat lunch at a restaurant', level: 'stretch' },
  { script: 'katakana', text: 'コンピューターゲームがすきです', romaji: 'konpyuutaa geemu ga suki desu', meaning: 'I like computer games', level: 'stretch' },
  { script: 'katakana', text: 'ホットコーヒーをおねがいします', romaji: 'hotto koohii o onegaishimasu', meaning: 'A hot coffee, please', level: 'stretch' },
  { script: 'katakana', text: 'キッチンにオレンジジュースがあります', romaji: 'kicchin ni orenji juusu ga arimasu', meaning: 'There is orange juice in the kitchen', level: 'stretch' },
];

export const WORD_CARDS: WordCard[] = words.map((word, index) => ({
  ...word,
  id: `word-${word.script === 'hiragana' ? 'h' : 'k'}-${index}`,
}));

export const GROUP_LABELS: Record<string, string> = {
  vowels: 'Vowels',
  k: 'K row',
  s: 'S row',
  t: 'T row',
  n: 'N row',
  h: 'H row',
  m: 'M row',
  y: 'Y row',
  r: 'R row',
  w: 'W row',
  'n-final': 'Final N',
  dakuten: 'Dakuten',
  yoon: 'Yōon blends',
};
