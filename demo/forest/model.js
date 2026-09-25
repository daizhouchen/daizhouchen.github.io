export const STORAGE_KEY = 'forest-practice-v1';
export const GAMES = [
  { id:'leaves', name:'找找小叶子', short:'找叶子', category:'目标寻找', description:'在种子和小花里，找出所有叶子。', instruction:'点击所有叶子。找齐这一组，下一组就会出现。种子和小花留在原地就好。', tip:'先一起认一认叶子的形状，再让孩子自己找。', color:'sage', icon:'leaf' },
  { id:'signal', name:'等一等，接住光', short:'等信号', category:'信号响应', description:'看见「现在点击」，再接住亮起的光。', instruction:'看到「等一等」先不点，出现「现在点击」再点。每次亮起只需点一下。', tip:'不用催快，让孩子分清「等待」和「可以点了」。', color:'yellow', icon:'sun' },
  { id:'order', name:'小径顺序走', short:'顺序连点', category:'顺序点击', description:'从 1 出发，按顺序走过数字小径。', instruction:'从 1 开始，依次点击数字。走完一条小径后，会出现新的一组。', tip:'可以先一起读一遍数字，再把操作交给孩子。', color:'peach', icon:'path' }
];
export const modeLabel = mode => mode === 'solo' ? '自主模式' : '亲子模式';
export function dayKey(date = new Date()) { return `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`; }
export const emptyState = () => ({ version:1, mode:'family', sessions:[] });
const count = n => Number.isFinite(n) && n >= 0 && n <= 100000 ? Math.floor(n) : 0;
export function readState(raw) {
  try {
    const input = JSON.parse(raw);
    if (!input || input.version !== 1 || !Array.isArray(input.sessions)) return emptyState();
    const seen = new Set();
    const sessions = input.sessions.filter(s => s && typeof s.id === 'string' && /^[a-zA-Z0-9-]{1,90}$/.test(s.id) && GAMES.some(g => g.id===s.game) && typeof s.at==='string' && Number.isFinite(Date.parse(s.at)) && Number.isFinite(s.durationMs) && s.durationMs >= 19000 && s.durationMs <= 21000 && s.stats && !seen.has(s.id) && seen.add(s.id)).map(s => ({
      id:s.id, game:s.game, at:new Date(s.at).toISOString(), mode:s.mode === 'solo'?'solo':'family', durationMs:s.durationMs,
      stats:{ correct:count(s.stats.correct), mistakes:count(s.stats.mistakes), rounds:count(s.stats.rounds), reactionTimes:Array.isArray(s.stats.reactionTimes)?s.stats.reactionTimes.filter(n=>Number.isFinite(n)&&n>=0&&n<=20000).slice(0,100):[] }
    })).filter(s=>s.stats.correct+s.stats.mistakes>0).slice(-120);
    return { version:1, mode:input.mode==='solo'?'solo':'family', sessions };
  } catch { return emptyState(); }
}
export function todaySessions(state, now=new Date()) { const day=dayKey(now); return state.sessions.filter(s=>dayKey(new Date(s.at))===day); }
export function completedIds(state, now=new Date()) { return new Set(todaySessions(state,now).map(s=>s.game)); }
export function addSession(state, session) { if(state.sessions.some(s=>s.id===session.id))return state; return readState(JSON.stringify({...state,sessions:[...state.sessions,session]})); }
export function median(values) { if(!values.length)return null; const a=[...values].sort((x,y)=>x-y), m=Math.floor(a.length/2); return Math.round(a.length%2?a[m]:(a[m-1]+a[m])/2); }
export function resultFacts(session) {
  const s=session.stats;
  if(session.game==='signal')return [{value:s.correct,label:'接住信号'},{value:median(s.reactionTimes)===null?'—':`${median(s.reactionTimes)} ms`,label:'本次响应中位数'},{value:s.mistakes,label:'提前点击'}];
  return [{value:s.correct,label:session.game==='leaves'?'找到叶子':'顺序点中'},{value:s.rounds,label:session.game==='leaves'?'找齐组数':'走完小径'},{value:s.mistakes,label:'点错次数'}];
}
export function shuffle(items, random=Math.random) { const a=[...items];for(let i=a.length-1;i>0;i--){const j=Math.floor(random()*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a; }
export function leafBoard(mode, random=Math.random) { return shuffle(mode==='solo'?['leaf','leaf','seed','seed','seed','flower','flower','flower','flower']:['leaf','leaf','leaf','seed','seed','flower','flower','seed','flower'],random).map((type,id)=>({id,type,hit:false})); }
export function orderBoard(mode, random=Math.random) { return shuffle(Array.from({length:mode==='solo'?9:6},(_,i)=>i+1),random); }
