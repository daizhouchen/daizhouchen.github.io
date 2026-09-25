import { STORAGE_KEY,GAMES,modeLabel,emptyState,readState,todaySessions,completedIds,addSession,resultFacts,leafBoard,orderBoard,dayKey } from './model.js';

const $ = selector => document.querySelector(selector);
const main = $('#main'), dialog = $('#game-dialog'), announcer = $('#announcer');
const DURATION = 20000;
let state=emptyState(), persistent=true, run=null, frame=0, lastDay=dayKey(), storageWarning='';
try { state=readState(localStorage.getItem(STORAGE_KEY)); } catch { persistent=false; }
const esc = value => String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const arrow = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 12h15m-6-6 6 6-6 6"/></svg>';
const closeIcon = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m6 6 12 12M6 18 18 6"/></svg>';
const pauseIcon = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5v14M16 5v14"/></svg>';
function art(kind) {
  const paths={leaf:'<path d="M34 48C9 43 15 14 20 10c24-1 42 21 14 38Z" fill="#92AD78"/><path d="m29 54 9-28M59 39c-6-17 7-28 20-26 4 17-4 26-20 26Z" fill="#B1C293"/><path d="m55 51 15-28"/>',sun:'<circle cx="48" cy="32" r="17" fill="#EAC76C"/><path d="M48 6V1M48 63v-5M21 32h-6m66 0h-6M28 12l-4-4m48 48-4-4M28 52l-4 4m48-48-4 4"/>',path:'<path d="M17 48c0-33 23-9 31-27 12-28 45-6 24 22" stroke-dasharray="4 5"/><circle cx="17" cy="48" r="9" fill="#fffaf0"/><circle cx="49" cy="20" r="9" fill="#EAC76C"/><circle cx="74" cy="44" r="9" fill="#9EB886"/><path d="M17 45v6m30-34h4l-4 6h4m21 19h4l-3 2 3 2h-4" stroke-width="1.3"/>'};
  return `<svg class="game-art-icon" viewBox="0 0 96 64" aria-hidden="true">${paths[kind]||paths.leaf}</svg>`;
}
function tile(type){
  const shapes={leaf:'<path d="M9 37C3 19 17 8 36 7c2 20-7 34-27 30Z" fill="#739064"/><path d="m10 37 19-21" stroke="#36513A" stroke-width="2"/>',seed:'<ellipse cx="24" cy="24" rx="11" ry="16" transform="rotate(26 24 24)" fill="#C29C65"/><path d="m21 34 7-21" stroke="#856F4C" stroke-width="2"/>',flower:'<path d="M24 20c-22-22-23 15-4 7-10 26 23 25 9 1 28 5 10-29-5-8Z" fill="#DAB779"/><circle cx="25" cy="26" r="5" fill="#8E8157"/>'};
  return `<svg viewBox="0 0 48 48" aria-hidden="true">${shapes[type]}</svg>`;
}
function announce(message){announcer.textContent=message;}
function persist(){
  try { localStorage.setItem(STORAGE_KEY,JSON.stringify(state));persistent=true;storageWarning=''; }
  catch { persistent=false; }
  updateStorageNotice();
}
function updateStorageNotice(){const banner=$('#storage-banner');banner.hidden=persistent&&!storageWarning;banner.textContent=storageWarning||'浏览器未允许保存记录。本次仍可体验，关闭或刷新页面后记录可能丢失。';}
function dateLabel(at, includeTime=false){return new Date(at).toLocaleString('zh-CN',{month:'numeric',day:'numeric',...(includeTime?{hour:'2-digit',minute:'2-digit'}:{weekday:'long'})});}
function factsText(s){return resultFacts(s).map(f=>`${f.label} ${f.value}`).join(' · ');}
function render(focus=false){
  const page=['today','records','guide'].includes(location.hash.slice(1))?location.hash.slice(1):'today';
  document.querySelectorAll('[data-nav]').forEach(a=>{if(a.dataset.nav===page)a.setAttribute('aria-current','page');else a.removeAttribute('aria-current');});
  document.querySelectorAll('[data-mode]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.mode===state.mode)));
  $('#page-label').textContent={today:'今日练习',records:'练习记录',guide:'陪玩手册'}[page];
  main.innerHTML=page==='today'?todayView():page==='records'?recordsView():guideView();
  updateStorageNotice();
  if(focus&&!dialog.open)main.focus({preventScroll:true});
}
function todayView(){
  const done=completedIds(state), next=GAMES.find(g=>!done.has(g.id)), latest=state.sessions.at(-1);
  return `<div class="page-heading"><p class="eyebrow">YOUR LITTLE FOREST</p><span class="day-label">${dateLabel(new Date())}</span></div>
    <section class="welcome" aria-labelledby="welcome-title"><div class="welcome-copy"><h1 id="welcome-title">${done.size===3?'今天的小森林，<br>又多了一点绿。':'一起玩一小会儿，<br>让小小尝试发芽。'}</h1><p>${done.size===3?'三种玩法都留下了记录。可以就停在这里，也可以回看看今天的尝试。':state.mode==='family'?'为陪伴留出一点时间。和孩子一起读懂玩法，再把小小的探索交给孩子。':'给自己留一点轻松的时间。选一项短练习，专心完成，再看看这一次的表现。'}</p>${next?`<button class="button" data-start="${next.id}">${done.size?`继续下一项 · ${next.short}`:'从第一片叶子开始'} ${arrow}</button>`:'<a class="button" href="#records">看看今天的记录 '+arrow+'</a>'}</div><img class="hero-art" src="assets/forest.svg" alt="叶片、阳光和蜿蜒小径组成的小森林插画"></section>
    <div class="progress-strip"><div class="progress-count">今日已体验 <strong>${done.size}</strong> / 3 项</div><div class="progress-trail" aria-hidden="true">${GAMES.map(g=>`<i class="${done.has(g.id)?'done':''}"></i>`).join('')}</div><p class="progress-copy">${done.size===3?'今日已完成，明天再来看看。':'每项 20 秒。完成一项也很好，不必一次做完。'}</p></div>
    <section aria-labelledby="tasks-title"><div class="section-heading"><h2 id="tasks-title">今天，想先玩哪一个？</h2><p>三个小练习 · 随时可以停</p></div><div class="task-grid">${GAMES.map((g,i)=>`<article class="task-card ${g.color}"><div class="task-art">${art(g.icon)}</div><div class="task-meta"><span>0${i+1} / ${g.category}</span>${done.has(g.id)?'<span class="completed">✓ 今日已体验</span>':'<span>20 秒</span>'}</div><h3>${g.name}</h3><p>${g.description}</p><button class="button ${done.has(g.id)?'secondary':''}" data-start="${g.id}" aria-label="${done.has(g.id)?'再玩一次':'开始'}${g.name}">${done.has(g.id)?'再玩一次':'看看玩法'} ${arrow}</button></article>`).join('')}</div></section>
    <div class="below-grid"><aside class="companion-note"><div><h3>${state.mode==='family'?'给陪玩的你':'给此刻的你'}</h3><p>${state.mode==='family'?'可以先问一句「你想从哪个开始？」。把选择留给孩子，把关注留给这一次尝试。':'练习不是考试。分心了就暂停，准备好再继续，今天的尝试会留在这里。'}</p></div></aside><div class="recent-preview"><div class="recent-title"><span>最近一次</span><a class="inline-link" href="#records">全部记录 →</a></div><p>${latest?`${GAMES.find(g=>g.id===latest.game).short} · ${esc(factsText(latest))}`:'还没有练习记录。完成一轮后，这里会留下你的第一次尝试。'}</p></div></div>`;
}
function recordsView(){
  const sessions=[...state.sessions].reverse(), today=todaySessions(state), days=new Set(state.sessions.map(s=>dayKey(new Date(s.at))));
  return `<div class="records-intro"><p class="eyebrow">LITTLE STEPS, REAL MOMENTS</p><h1>每一次尝试，都有迹可循。</h1><p>回看实际完成的小游戏，不给孩子贴标签。这里只记录操作表现，不评定身体或心理能力。</p></div><div class="summary-grid"><div class="summary-card"><strong>${today.length}</strong><span>今日完成轮数</span></div><div class="summary-card"><strong>${sessions.length}</strong><span>本机保留轮数</span></div><div class="summary-card"><strong>${days.size}</strong><span>有记录的天数</span></div></div>
    <section aria-labelledby="records-title"><div class="section-heading"><h2 id="records-title">练习小记</h2>${sessions.length?'<button class="button secondary" data-action="export">导出记录</button>':''}</div>${sessions.length?`<div class="record-list">${sessions.map(s=>`<article class="record-row"><div><h3>${GAMES.find(g=>g.id===s.game).name}</h3><p>${modeLabel(s.mode)} · 实际操作 20 秒</p></div><div class="record-detail">${esc(factsText(s))}</div><time class="record-time" datetime="${s.at}">${dateLabel(s.at,true)}</time></article>`).join('')}</div>`:`<div class="empty-state">${art('leaf')}<h2>第一片叶子，等你来种。</h2><p>完成任意一轮，实际点击和本次表现就会出现在这里。不会预先生成分数。</p><a href="#today" class="button">去选一个小游戏 ${arrow}</a></div>`}</section>
    <div class="records-bottom"><span>保留最近 120 轮；记录仅在此浏览器中，不与微信同步。</span>${sessions.length?'<button class="button text-button" data-action="clear">清空本机记录</button>':''}</div>`;
}
function guideView(){
  return `<div class="guide-intro"><p class="eyebrow">A FIELD GUIDE FOR SMALL EXPLORERS</p><h1>陪伴，从一小会儿开始。</h1><p>先一起看懂规则，再给一次独立尝试的空间。没有排名，也不用赶着完成。</p></div><div class="guide-lead"><section class="guide-box"><h2>一轮练习，四个小步骤</h2><ol><li><strong>选择一项。</strong>三个小游戏都可以直接开始。</li><li><strong>一起读规则。</strong>准备好后再开始 20 秒计时。</li><li><strong>按自己的节奏玩。</strong>可以暂停；切换标签页也会自动暂停。</li><li><strong>看看本次记录。</strong>用具体的尝试开启交流，比如「你是怎么找到的？」。</li></ol></section><aside class="guide-box guide-mode"><h2>选一个舒服的模式</h2><p><strong>亲子模式</strong><br>叶子更多、数字 1–6、信号等待更从容。建议家长陪同，先确认孩子理解规则。</p><p><strong>自主模式</strong><br>叶子更少、数字 1–9、信号节奏更紧凑。适合熟悉操作后自行体验。</p><p>模式是操作难度选择，不按年龄判断能力。每条记录会保留当时的模式。</p></aside></div><section class="guide-box"><h2>我们具体记录什么？</h2>${GAMES.map(g=>`<div class="guide-game">${art(g.icon)}<div><h3>${g.name}</h3><p>${g.instruction}</p><p>${g.id==='signal'?'记录接住次数、提前点击和有效响应时间的中位数。设备与操作方式也会影响时间。':g.id==='leaves'?'记录找到叶子、找齐组数和点错次数；颜色与形状同时用于辨认。':'记录按顺序点中的数量、走完的小径和点错次数。'}</p></div></div>`).join('')}</section><div class="guide-bottom"><p><strong>关于这个版本</strong>　这是能力森林的浏览器交互体验，包含三种触屏／鼠标小游戏。所有记录保存在本机，不连接微信账户、云端档案或机构服务。</p><p>小游戏表现不等于儿童发展水平或医学评估，也不能据此推断训练效果。不同模式、设备和输入方式的记录不宜直接比较。</p><p>中途退出不生成完成记录；刷新会结束当前一轮。完整玩到 20 秒且有操作才会留存记录。可在记录页导出或清空；浏览器清理数据也会删除记录。</p><p>键盘可用 Tab 选择按钮、Enter 操作；游戏中按 Esc 暂停。<a class="inline-link" href="../nengli-senlin.html">查看这次的产品设计 →</a></p></div>`;
}
function openGame(id){
  const game=GAMES.find(g=>g.id===id);if(!game)return;
  cancelAnimationFrame(frame);
  run={ game,mode:state.mode,stage:'preview',elapsed:0,stats:{correct:0,mistakes:0,rounds:0,reactionTimes:[]},id:globalThis.crypto?.randomUUID?.()||`${Date.now()}-${Math.random().toString(36).slice(2)}` };
  renderDialog();if(!dialog.open)dialog.showModal();
  dialog.querySelector('[data-action="begin"]').focus();
}
function header(label, action='close'){return `<div class="dialog-header"><p class="eyebrow">${label} · ${modeLabel(run.mode)}</p><button class="icon-button" data-action="${action}" aria-label="${action==='pause'?'暂停练习':'关闭练习'}">${action==='pause'?pauseIcon:closeIcon}</button></div>`;}
function renderDialog(){
  if(!run)return;
  const g=run.game;
  if(run.stage==='preview')dialog.innerHTML=`${header('准备开始')}<div class="dialog-body"><div class="preview-art art-${g.color}">${art(g.icon)}</div><p class="eyebrow">${g.category} / 20 秒</p><h2 id="dialog-title">${g.name}</h2><div class="rule-box"><h3>怎么玩</h3><p>${g.instruction}</p></div><p>${g.tip}</p><p class="preview-hint">${run.mode==='family'?'亲子模式：叶子 3 片 / 数字 1–6 / 信号间隔 1.4–2.6 秒。':'自主模式：叶子 2 片 / 数字 1–9 / 信号间隔 0.8–1.9 秒。'}<br>按下开始才计时，随时可以暂停。</p><button class="button" data-action="begin" style="width:100%">准备好了，开始 20 秒 ${arrow}</button></div>`;
  else if(run.stage==='playing'){
    dialog.innerHTML=`${header('正在练习','pause')}<div class="dialog-body"><div class="play-header"><h2 id="dialog-title">${g.name}</h2><div class="timer"><span id="seconds">${Math.ceil((DURATION-run.elapsed)/1000)}</span><small>秒</small></div></div><div class="time-track" aria-hidden="true"><span id="time-fill"></span></div><p class="play-instruction" id="play-instruction">${g.id==='leaves'?'找出所有叶子，小花和种子不用点。':g.id==='order'?`下一步：点 ${run.nextNumber}`:'等提示变成「现在点击」，再点一下。'}</p><div id="game-canvas" tabindex="-1"></div><div class="play-foot"><span id="play-feedback" role="status" aria-live="polite"></span><span>Esc 或右上角可暂停</span></div></div>`;
    renderBoard();
  }else if(run.stage==='paused'){
    dialog.innerHTML=`${header('休息一下')}<div class="dialog-body"><div class="pause-scene">${art('leaf')}<h2 id="dialog-title">暂停一下，也没关系。</h2><p>还剩 ${Math.ceil((DURATION-run.elapsed)/1000)} 秒，计时已经停下。</p></div><p class="pause-note">继续会从刚才的地方开始。退出这一轮不会新增完成记录，已保存的记录会保留。</p><div class="button-row"><button class="button secondary" data-action="close">退出这一轮</button><button class="button" data-action="resume">继续练习 ${arrow}</button></div></div>`;
    dialog.querySelector('[data-action="resume"]').focus();
  }else if(run.stage==='result'){
    const hadInput=run.stats.correct+run.stats.mistakes>0, done=completedIds(state),next=GAMES.find(g=>!done.has(g.id));
    const session={game:g.id,stats:run.stats};
    dialog.innerHTML=`${header('本次小记')}<div class="dialog-body"><span class="result-tag">${hadInput?'20 秒练习已结束':'这次还没有操作'}</span><h2 id="dialog-title">${hadInput?'又完成了一次小小尝试。':'先熟悉玩法，再试一次。'}</h2><p>${g.name} · ${modeLabel(run.mode)}</p><div class="fact-grid">${resultFacts(session).map(f=>`<div class="fact"><strong>${f.value}</strong><span>${f.label}</span></div>`).join('')}</div><div class="result-note">${!hadInput?'开始后需要点击游戏区域。这轮没有操作，不计入今日完成，也不会生成记录。':run.stats.mistakes>run.stats.correct?'下次可以放慢一点，先看清目标再点。点错只是这轮的操作记录，不代表能力好坏。':g.id==='signal'?'能等提示再行动，就是这轮值得留意的过程。响应时间也受设备影响，不用和别人比较。':'可以回想一下，哪一小步最容易？这份记录只描述本轮操作，不给能力打分。'}</div><p class="result-status">${hadInput?(persistent?'已保存到本机 · 今日体验 '+done.size+' / 3 项':'已保留在当前页面 · 浏览器不允许持久保存，刷新后可能丢失'):'未生成完成记录'}</p><div class="button-row"><button class="button secondary" data-action="retry">再玩一次</button>${next&&next.id!==g.id&&hadInput?`<button class="button" data-start="${next.id}">下一项 · ${next.short} ${arrow}</button>`:'<button class="button" data-action="close">回到练习页 '+arrow+'</button>'}</div></div>`;
    announce(hadInput?'练习结束，本次记录已生成。':'练习结束，没有操作，未生成记录。');
    dialog.querySelector('[data-action="retry"]').focus();
  }
}
function renderBoard(){
  const canvas=$('#game-canvas');if(!canvas)return;
  const hadFocus=canvas.contains(document.activeElement),focusedIndex=document.activeElement?.dataset?.cell;
  if(run.game.id==='leaves')canvas.innerHTML=`<div class="game-grid">${run.board.map((c,i)=>`<button class="cell ${c.hit?'hit':''} ${c.wrong?'wrong':''}" data-cell="${i}" ${c.hit||c.wrong?'disabled':''} aria-label="${{leaf:'叶子',seed:'种子',flower:'小花'}[c.type]} ${i+1}">${tile(c.type)}</button>`).join('')}</div>`;
  else if(run.game.id==='order')canvas.innerHTML=`<div class="game-grid">${run.board.map((n,i)=>`<button class="cell ${n<run.nextNumber?'hit':''}" data-cell="${i}" ${n<run.nextNumber?'disabled':''} aria-label="数字 ${n}">${n}</button>`).join('')}</div>`;
  else canvas.innerHTML=`<button class="signal-button ${run.ready?'ready':''}" data-action="signal"><svg viewBox="0 0 64 64" aria-hidden="true"><circle cx="32" cy="32" r="16"/><path d="M32 2v6m0 48v6M2 32h6m48 0h6M10 10l5 5m34 34 5 5m0-44-5 5M15 49l-5 5"/></svg><span class="signal-label">${run.ready?'现在点击':'等一等'}</span><small>${run.ready?'接住这束光':'光亮起后，再点这里'}</small></button>`;
  if(hadFocus){const target=canvas.querySelector(`[data-cell="${focusedIndex}"]:not(:disabled)`)||canvas.querySelector('button:not(:disabled)');target?.focus({preventScroll:true});}
  updateFeedback();
}
function updateFeedback(message){
  const node=$('#play-feedback');if(node)node.textContent=message||`${run.game.id==='leaves'?'找到':run.game.id==='order'?'顺序点中':'接住'} ${run.stats.correct} 次${run.stats.mistakes?' · 点错 '+run.stats.mistakes+' 次':''}`;
}
function waitForSignal(){run.ready=false;run.readyAt=run.elapsed+(run.mode==='family'?1400+Math.random()*1200:800+Math.random()*1100);}
function begin(){
  if(!run||run.stage!=='preview')return;
  run.stage='playing';run.elapsed=0;run.nextNumber=1;
  run.board=run.game.id==='leaves'?leafBoard(run.mode):orderBoard(run.mode);
  if(run.game.id==='signal')waitForSignal();
  run.lastFrame=performance.now();renderDialog();$('#game-canvas').querySelector('button')?.focus();frame=requestAnimationFrame(tick);
}
function elapsedNow(){return Math.min(DURATION,run.elapsed+(run.stage==='playing'?performance.now()-run.lastFrame:0));}
function tick(now){
  if(!run||run.stage!=='playing')return;
  run.elapsed=Math.min(DURATION,run.elapsed+Math.max(0,now-run.lastFrame));run.lastFrame=now;
  if(run.elapsed>=DURATION){finish();return;}
  if(run.game.id==='signal'&&!run.ready&&run.elapsed>=run.readyAt){run.ready=true;run.signalAt=run.elapsed;const b=dialog.querySelector('.signal-button');b.classList.add('ready');b.querySelector('.signal-label').textContent='现在点击';b.querySelector('small').textContent='接住这束光';updateFeedback('现在点击');}
  $('#seconds').textContent=Math.ceil((DURATION-run.elapsed)/1000);$('#time-fill').style.width=`${100*(1-run.elapsed/DURATION)}%`;
  frame=requestAnimationFrame(tick);
}
function pause(){if(!run||run.stage!=='playing')return;run.elapsed=elapsedNow();cancelAnimationFrame(frame);if(run.elapsed>=DURATION){finish();return;}run.stage='paused';renderDialog();announce('已暂停，计时停止。');}
function resume(){if(!run||run.stage!=='paused')return;run.stage='playing';run.lastFrame=performance.now();renderDialog();$('#game-canvas').querySelector('button:not(:disabled)')?.focus();frame=requestAnimationFrame(tick);}
function finish(){
  if(!run||run.stage==='result')return;cancelAnimationFrame(frame);run.stage='result';run.elapsed=DURATION;
  if(run.stats.correct+run.stats.mistakes>0){
    // Read the latest shared snapshot so another tab's new rounds or deletions survive.
    try { if(persistent)state=readState(localStorage.getItem(STORAGE_KEY)); } catch { persistent=false; }
    state=addSession(state,{id:run.id,game:run.game.id,mode:run.mode,at:new Date().toISOString(),durationMs:DURATION,stats:run.stats});persist();
  }
  render();renderDialog();
}
function closeGame(){
  if(run?.stage==='playing'){pause();return;}
  cancelAnimationFrame(frame);const id=run?.game.id;run=null;dialog.close();render();
  (main.querySelector(`[data-start="${id}"]`)||main).focus({preventScroll:true});
}
function hitCell(index){
  if(!run||run.stage!=='playing')return;if(elapsedNow()>=DURATION){finish();return;}
  if(run.game.id==='leaves'){
    const c=run.board[index];if(!c||c.hit||c.wrong)return;
    if(c.type==='leaf'){c.hit=true;run.stats.correct++;if(run.board.filter(c=>c.type==='leaf').every(c=>c.hit)){run.stats.rounds++;run.board=leafBoard(run.mode);}}
    else {c.wrong=true;run.stats.mistakes++;}
    renderBoard();
  }else if(run.game.id==='order'){
    const n=run.board[index];if(!n||n<run.nextNumber)return;
    if(n===run.nextNumber){run.stats.correct++;run.nextNumber++;if(run.nextNumber>run.board.length){run.stats.rounds++;run.nextNumber=1;run.board=orderBoard(run.mode);}}
    else run.stats.mistakes++;
    $('#play-instruction').textContent=`下一步：点 ${run.nextNumber}`;renderBoard();
  }
}
function hitSignal(){
  if(!run||run.stage!=='playing')return;const elapsed=elapsedNow();if(elapsed>=DURATION){finish();return;}
  if(run.ready){run.stats.correct++;run.stats.reactionTimes.push(Math.max(0,Math.round(elapsed-run.signalAt)));run.elapsed=elapsed;run.lastFrame=performance.now();waitForSignal();renderBoard();updateFeedback(`接住了 · 本次 ${run.stats.reactionTimes.at(-1)} ms`);}
  else {run.stats.mistakes++;updateFeedback('早了一点，等「现在点击」再点。');}
}
function exportRecords(){const blob=new Blob([JSON.stringify({product:'能力森林 · 浏览器体验',exportedAt:new Date().toISOString(),...state},null,2)],{type:'application/json'});const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=`能力森林-练习记录-${dayKey()}.json`;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);announce('练习记录已导出。');}
document.addEventListener('click',e=>{
  const el=e.target.closest('button,a');if(!el)return;
  if(el.dataset.mode){state.mode=el.dataset.mode;persist();render();announce(`已切换为${modeLabel(state.mode)}。`);return;}
  if(el.dataset.start){openGame(el.dataset.start);return;}
  if(el.dataset.cell!==undefined){hitCell(Number(el.dataset.cell));return;}
  const actions={begin,pause,resume,close:closeGame,retry:()=>openGame(run.game.id),signal:hitSignal,export:exportRecords,clear:()=>$('#clear-dialog').showModal()};
  actions[el.dataset.action]?.();
});
dialog.addEventListener('cancel',e=>{e.preventDefault();if(run?.stage==='playing')pause();else closeGame();});
dialog.addEventListener('keydown',e=>{if(e.repeat&&(e.key===' '||e.key==='Enter'))e.preventDefault();});
document.addEventListener('visibilitychange',()=>{if(document.hidden)pause();else if(dayKey()!==lastDay){lastDay=dayKey();render();}});
window.addEventListener('blur',()=>pause());
window.addEventListener('hashchange',()=>{if(run?.stage==='playing')pause();render(true);window.scrollTo(0,0);});
window.addEventListener('storage',e=>{if(e.key===STORAGE_KEY&&!dialog.open){state=readState(e.newValue);render();}});
$('#cancel-clear').addEventListener('click',()=>$('#clear-dialog').close());
$('#confirm-clear').addEventListener('click',()=>{state={...emptyState(),mode:state.mode};persist();$('#clear-dialog').close();render(true);announce('本机练习记录已清空。');});
setInterval(()=>{if(dayKey()!==lastDay){lastDay=dayKey();render();}},30000);
render();
