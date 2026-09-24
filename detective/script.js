const clues = {
  board: { name: '뒤엉킨 실', icon: '✦', text: '누군가 쿠키가 사라진 시각을 빨간 실로 표시해 두었다. 그런데 그 시각, 이 방에 있던 건 탐정과… 탐정뿐이었다.', thought: '이 실은 누가 묶었지?' },
  desk: { name: '수상한 메모', icon: '✎', text: '책상 위 메모에는 이렇게 적혀 있다. “마지막 한 개는 절대로 먹지 말 것.” 잉크가 아직 마르지 않았다. 글씨체는 어쩐지 익숙하다.', thought: '내 글씨랑 닮았는데?' },
  safe: { name: '잠긴 금고', icon: '▣', text: '금고 안에서 달콤한 냄새가 난다. 손잡이에는 작은 발자국이 찍혀 있다. 열쇠는 아직 찾지 못했다.', thought: '발자국 크기가… 음.' },
  window: { name: '비 오는 창가', icon: '☂', text: '창문은 안에서 잠겨 있다. 빗물 위에는 침입자의 흔적도 없다. 범인은 처음부터 방 안에 있었다.', thought: '완전한 밀실이군!' },
  fireplace: { name: '벽난로 앞의 부스러기', icon: '♨', text: '카펫 아래에 쿠키 부스러기 세 개. 옆에는 누군가 황급히 숨긴 우유잔 자국이 남아 있다.', thought: '냄새가 여기서 났어!' },
  watch: { name: '멈춘 회중시계', icon: '◷', text: '시계는 밤 11시 47분에 멈췄다. 뒷면에 아주 작은 글씨가 새겨져 있다. “잊어버렸다면 모자를 확인할 것.”', thought: '이건 내 시계잖아?' }
};
const $ = id => document.getElementById(id);
const stage = $('stage'), scene = $('scene'), detective = $('detective'), thought = $('thought');
const overlay = $('overlay'), dialog = overlay.querySelector('.dialog');
let found = new Set(), paused = false, current = {x:55,y:74}, walkTimer, thoughtTimer, toastTimer, boardClicks = 0, hatClicks = 0, completed = false;
let audioCtx, musicTimer, musicOn = false, noteIndex = 0;
const route = [{x:55,y:74},{x:35,y:70},{x:28,y:64},{x:44,y:74},{x:66,y:72},{x:78,y:65},{x:60,y:76}];
let routeIndex = 0;

function say(message, duration=2700){
  thought.textContent=message; thought.classList.add('show'); clearTimeout(thoughtTimer);
  thoughtTimer=setTimeout(()=>thought.classList.remove('show'),duration);
}
function toast(message){const el=$('toast');el.textContent=message;el.classList.add('show');clearTimeout(toastTimer);toastTimer=setTimeout(()=>el.classList.remove('show'),2800)}
function moveTo(x,y){
  if(paused)return;
  x=Math.max(16,Math.min(84,x)); y=Math.max(61,Math.min(82,y));
  detective.style.setProperty('--flip',x<current.x?'-1':'1');
  detective.style.setProperty('--cat-x',x+'%');detective.style.setProperty('--cat-y',y+'%');
  detective.style.setProperty('--depth',(0.83+(y-61)*.012).toFixed(2));
  current={x,y};
}
function startWalk(){clearInterval(walkTimer);walkTimer=setInterval(()=>{if(paused||!overlay.hidden)return;routeIndex=(routeIndex+1)%route.length;moveTo(route[routeIndex].x,route[routeIndex].y);if(Math.random()<.25)say(['킁킁…','사건은 늘 작은 흔적에서 시작되지.','잠깐, 저건 뭐지?'][Math.floor(Math.random()*3)],2000)},3600)}
function setPause(value){paused=value;detective.classList.toggle('paused',value);$('pauseButton').setAttribute('aria-pressed',String(value));$('pauseButton').innerHTML=value?'▶ <span>산책 계속하기</span>':'Ⅱ <span>산책 멈추기</span>';detective.setAttribute('aria-label',value?'고양이 탐정. 누르면 산책을 계속합니다.':'고양이 탐정. 누르면 산책을 멈춥니다.');say(value?'잠깐 쉬어 볼까?':'다시 수사 시작!',1700)}
function openDialog(title,body,icon='⌕',eyebrow='CASE 001 · 단서 기록',foot='셜록의 수첩'){
  $('dialogTitle').textContent=title;$('dialogBody').textContent=body;$('dialogIcon').textContent=icon;
  $('dialogEyebrow').textContent=eyebrow;$('dialogFoot').textContent=foot;
  overlay.hidden=false;dialog.focus();
}
function closeDialog(){overlay.hidden=true}
function updateProgress(){
  $('progressCount').textContent=`${Math.min(found.size,5)} / 5`;
  $('progressFill').style.width=(Math.min(found.size,5)*20)+'%';
  if(found.size>=5&&!completed){completed=true;setTimeout(()=>openDialog('범인은 이 안에 있다','모든 단서를 모았다. 창문은 잠겨 있었고, 금고엔 작은 발자국이 남았다.\n\n그리고 탐정의 코트 주머니에서 쿠키 포장지가 바스락거린다.\n\n“아… 내가 어젯밤 먹었구나.”\n\n명탐정은 자기 자신을 체포하는 대신 따뜻한 차를 끓였다.','♜','CASE CLOSED · 사라진 쿠키의 행방','사건 해결 · 숨겨진 장난은 더 남아 있어요'),550)}
}
function investigate(key){
  const clue=clues[key]; if(!clue)return;
  if(key==='board'){boardClicks++;if(boardClicks===4)toast('비밀 발견: 빨간 실이 사실은 고양이 장난감이었다!')}
  if(key==='watch'){toast('이스터에그 발견: 멈춘 시간 11:47');say(clue.thought)}
  else if(!found.has(key)){found.add(key);document.querySelector(`[data-clue="${key}"]`).classList.add('found');$('statusText').textContent=`${clue.name} 발견! 다른 곳도 살펴보세요.`;say(clue.thought);updateProgress()}
  openDialog(clue.name,clue.text,clue.icon,key==='watch'?'숨겨진 기록 · 01':'CASE 001 · 단서 기록');
}
document.querySelectorAll('.hotspot').forEach(button=>button.addEventListener('click',e=>{e.stopPropagation();investigate(button.dataset.clue)}));
scene.addEventListener('click',e=>{
  if(e.target.closest('.hotspot,.detective'))return;
  const rect=scene.getBoundingClientRect(),x=(e.clientX-rect.left)/rect.width*100,y=(e.clientY-rect.top)/rect.height*100;
  if(y<58){toast('바닥을 눌러 탐정을 이동시켜 보세요.');return}
  $('floorHint').classList.add('hidden'); if(paused)setPause(false);moveTo(x,y);say('거기로 가볼게!',1300);
});
function tapDetective(){setPause(!paused);hatClicks++;if(hatClicks===3)toast('이스터에그 발견: 모자 속에서 쿠키 부스러기가 나왔다!')}
detective.addEventListener('click',e=>{e.stopPropagation();tapDetective()});
detective.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();tapDetective()}});
$('pauseButton').addEventListener('click',()=>setPause(!paused));
$('resetButton').addEventListener('click',()=>{found.clear();completed=false;boardClicks=0;hatClicks=0;document.querySelectorAll('.hotspot').forEach(b=>b.classList.remove('found'));updateProgress();$('statusText').textContent='반짝이는 물건을 눌러 조사해 보세요.';setPause(false);moveTo(55,74);toast('새로운 수사를 시작합니다.')});
$('notebookButton').addEventListener('click',()=>{let entries=[...found].map(k=>'• '+clues[k].name).join('\n');openDialog('탐정의 수첩',entries||'아직 기록한 단서가 없다. 방 안의 반짝이는 물건을 조사해 보자.', '☷','CASE 001 · 수사 기록',`${found.size}개의 단서 기록됨`)});
$('helpButton').addEventListener('click',()=>openDialog('이 방에서 노는 법','반짝이는 곳을 눌러 단서를 찾아보세요. 바닥을 누르면 탐정이 그곳으로 걸어갑니다. 탐정을 누르면 산책을 멈추거나 계속합니다.\n\n단서 다섯 개를 모으면 사건의 결말을 볼 수 있어요. 숨은 물건도 찾아보세요.','✧','221B · 이용 방법','음악은 오른쪽 위에서 켤 수 있어요'));
$('closeButton').addEventListener('click',closeDialog);$('dialogAction').addEventListener('click',closeDialog);overlay.addEventListener('click',e=>{if(e.target===overlay)closeDialog()});document.addEventListener('keydown',e=>{if(e.key==='Escape'&&!overlay.hidden)closeDialog()});

function playNote(freq,when,length,volume=.018){
  const osc=audioCtx.createOscillator(),gain=audioCtx.createGain();osc.type='sine';osc.frequency.setValueAtTime(freq,when);gain.gain.setValueAtTime(.0001,when);gain.gain.exponentialRampToValueAtTime(volume,when+.05);gain.gain.exponentialRampToValueAtTime(.0001,when+length);osc.connect(gain).connect(audioCtx.destination);osc.start(when);osc.stop(when+length+.05);
}
function musicTick(){if(!audioCtx)return;const melody=[293.66,349.23,392,349.23,293.66,261.63,220,261.63,293.66,329.63,349.23,293.66,261.63,220,196,220];const now=audioCtx.currentTime;playNote(melody[noteIndex%melody.length],now,.82,.016);if(noteIndex%4===0)playNote([146.83,130.81,110,98][Math.floor(noteIndex/4)%4],now,2.8,.012);noteIndex++}
$('musicButton').addEventListener('click',async()=>{
  const button=$('musicButton');musicOn=!musicOn;button.setAttribute('aria-pressed',String(musicOn));button.innerHTML=musicOn?'♫ <span>음악 끄기</span>':'♫ <span>음악 켜기</span>';
  if(musicOn){try{audioCtx ||=new (window.AudioContext||window.webkitAudioContext)();await audioCtx.resume();musicTick();musicTimer=setInterval(musicTick,760)}catch{musicOn=false;button.setAttribute('aria-pressed','false');button.innerHTML='♫ <span>음악 켜기</span>';toast('이 브라우저에서는 음악을 재생할 수 없어요.')}}
  else{clearInterval(musicTimer);await audioCtx?.suspend()}
});
startWalk();setTimeout(()=>say('쿠키가 사라졌다고?',3000),650);
