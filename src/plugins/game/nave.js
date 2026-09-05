/**
 * Minigame De Nave (HTML Interativo) — Nave Alienígena Subindo No Céu.
 *
 * 🛸 COMO FUNCIONA: Uma nave alienígena voa PARA CIMA por um céu cheio de
 * obstáculos (asteroides/meteoros) que vêm descendo na direção dela. O
 * jogador desvia usando os botões ◀ Esquerda ▶ Direita (ou arrastando/toque
 * na tela). A cada obstáculo que passa, a pontuação aumenta e o jogo fica
 * um pouco mais rápido. Se a nave bate, é Game Over.
 *
 * ⚠️ AVISO (RECURSO DE TESTE): Assim Como O Protótipo Antigo, Este Comando
 * Usa O Recurso INTERNO do WhatsApp (`sendRichHtml` / __typename
 * `GenAIaeacdsnwHtmlPrimitive`), O Mesmo "Truque" Da Meta AI. É Instável:
 * pode NÃO funcionar na sua versão do WhatsApp, pode não renderizar direito
 * no iOS/Desktop e pode parar de funcionar a qualquer momento. O HTML do
 * jogo é 100% autocontido (canvas + JS + botões), então a jogada acontece
 * TODA dentro da mensagem — não precisa digitar comandos durante o jogo.
 *
 * Referência De Estilo: Os jogos "dino", "pong" Etc. Do takeshi-bot-9-beta
 * (src/commands/member/games/*.js).
 */

/** @type {import("../../handler.js").PluginRun} */
export const run = {
    usage: ["nave", "espaconave", "spaceship"],
    use: "",
    category: "game",
    help: [
        // Ambas As Ajudas Veem O Mesmo Jogo — Nada De Flag, Só Disparar.
    ],
    run: async (m, { client, config }) => {
        const botName = config.botName || "Incomplete Bot";

        try {
            await client.sendRichHtml(m.chat, {
                id: "minigame-nave",
                title: "🛸 Nave Alienígena",
                html: NAVE_HTML(botName),
                source: "testsource",
            });
        } catch (e) {
            // Se O Recurso De Teste Falhar, Avisa Com Calma O Que Aconteceu.
            return m.reply(
                "⚠️ O Minigame De Nave (Html Rico) Falhou.\n" +
                "É Esperado: Esse É Um *Recurso De Teste* Instável.\n\n" +
                `Erro: ${e.message}`
            );
        }
    }
}

/**
 * Monta O HTML Completo E Autocontido Do Jogo (Canvas + JS + Botões).
 * Não Precisa De Nada Externo — Tudo Roda Dentro Da Própria Mensagem.
 * @param {string} botName - Nome Do Bot Pra Mostrar No Cabeçalho
 * @returns {string} HTML Pronto Pro `sendRichHtml` Renderizar
 */
function NAVE_HTML(botName) {
    return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<style>
*{-webkit-tap-highlight-color:transparent;-webkit-user-select:none;user-select:none;-webkit-touch-callout:none;box-sizing:border-box}
body{margin:0;background:transparent;font-family:Arial,sans-serif;color:#e8edf0;touch-action:manipulation}
.wrap{width:100%;max-width:420px;margin:auto;padding:14px}
.card{background:rgba(10,14,24,.97);border:1px solid rgba(255,255,255,.14);border-radius:16px;overflow:hidden;box-shadow:0 8px 32px rgba(0,0,0,.45)}
.head{padding:12px 16px;border-bottom:1px solid rgba(255,255,255,.12);display:flex;justify-content:space-between;align-items:center;gap:12px;background:rgba(20,26,42,.6)}
.brand{font-size:9px;letter-spacing:1.5px;color:rgba(255,255,255,.45)}
.title{font-size:14px;font-weight:bold;color:#fff}
.stats{display:flex;gap:14px;text-align:right}
.value{font:700 16px monospace;color:#fff}
.label{font-size:8px;color:rgba(255,255,255,.4);letter-spacing:1px}
.main{padding:14px}
.board{position:relative;background:rgba(2,6,16,.5);border:1px solid rgba(255,255,255,.1);border-radius:12px;overflow:hidden}
.board canvas{display:block;width:100%;height:auto}
.overlay{position:absolute;inset:0;background:rgba(4,8,20,.82);display:flex;align-items:center;justify-content:center;flex-direction:column;text-align:center;z-index:5}
.overlay.hidden{display:none}
.overlay-title{font-size:24px;font-weight:bold;letter-spacing:1px;color:#fff}
.overlay-sub{font-size:11px;color:rgba(255,255,255,.55);margin-top:8px;padding:0 14px}
.start{margin-top:16px;padding:11px 24px;border:1px solid rgba(88,214,255,.6);border-radius:9px;background:linear-gradient(135deg,rgba(90,120,255,.65),rgba(60,200,255,.55));color:#fff;font-weight:bold;font-size:12px}
.controls{display:flex;gap:10px;margin-top:12px;justify-content:center}
.button{flex:1;max-width:150px;min-height:52px;border:1px solid rgba(255,255,255,.16);border-radius:11px;color:#fff;font-weight:bold;font-size:15px;background:rgba(255,255,255,.07);padding:0 12px}
.button:active{background:rgba(255,255,255,.18);transform:translateY(1px)}
.status{text-align:center;font:10px monospace;color:rgba(255,255,255,.5);margin-top:10px;min-height:12px}
</style>
</head>
<body>
<div class="wrap"><div class="card"><div class="head">
<div><div class="brand">${esc(botName)}</div><div class="title">🛸 NAVE ALIENÍGENA</div></div>
<div class="stats"><div><div class="label">PONTOS</div><div class="value" id="score">000</div></div><div><div class="label">RECORDE</div><div class="value" id="best">000</div></div></div>
</div>
<div class="main">
<div class="board" id="board">
<canvas id="game" width="380" height="520"></canvas>
<div id="overlay" class="overlay"><div id="overTitle" class="overlay-title">NAVE ALIENÍGENA</div><div id="overSub" class="overlay-sub">DESVIE DOS OBSTÁCULOS • MOVA PRA ESQUERDA OU DIREITA</div><button id="start" class="start">COMEÇAR</button></div>
</div>
<div class="controls">
<button class="button" id="leftBtn">◀ ESQUERDA</button>
<button class="button" id="rightBtn">DIREITA ▶</button>
</div>
<div id="status" class="status">RECORDE 000 • VELOCIDADE 1.0x</div>
</div></div></div>
<script>
const c=document.getElementById('game');
const x=c.getContext('2d');
const board=document.getElementById('board');
const scoreEl=document.getElementById('score');
const bestEl=document.getElementById('best');
const statusEl=document.getElementById('status');
const overlay=document.getElementById('overlay');
const overTitle=document.getElementById('overTitle');
const overSub=document.getElementById('overSub');
const start=document.getElementById('start');
const leftBtn=document.getElementById('leftBtn');
const rightBtn=document.getElementById('rightBtn');

const W=380,H=520;
let obstacles=[],stars=[],trail=[],shake=0;
let score=0,best=0,playing=false,last=0;
let speed=150;         // Velocidade de descida (px/s)
let spawnTimer=0;
// Nave: fica mais ou menos no meio do céu, só anda na horizontal.
let ship={x:W/2,y:H*0.62,w:30,h:34};

try{best=parseInt(localStorage.getItem('nemesis_nave_best')||'0',10)||0}catch(e){best=0}

function pad(v){return String(Math.floor(v)).padStart(3,'0')}

function ui(){
  scoreEl.textContent=pad(score);
  bestEl.textContent=pad(best);
  statusEl.textContent='RECORDE '+pad(best)+' • VELOCIDADE '+(speed/150).toFixed(1)+'x';
}

function seedStars(){
  stars=[];
  for(let i=0;i<40;i++)stars.push({x:Math.random()*W,y:Math.random()*H,s:.5+Math.random()*1.8,tw:Math.random()*6});
}

function reset(){
  obstacles=[];trail=[];shake=0;
  score=0;speed=150;spawnTimer=.5;
  ship={x:W/2,y:H*0.62,w:30,h:34};
  playing=true;last=0;seedStars();
  overlay.classList.add('hidden');ui();
}

// Cria Um Obstáculo No Topo Com Forma E Tamanho Aleatórios (fácil de desviar).
function addObstacle(){
  const w=16+Math.random()*34;
  const kind=Math.random();
  let h;
  if(kind<.3){h=w;             // Círculo (asteroide)
  }else if(kind<.65){h=20+Math.random()*20; // Pedra achatada
  }else{h=w*1.1;}              // Rocha alta
  obstacles.push({x:Math.random()*(W-w),y:-h,w:Math.max(14,w),h:Math.max(14,h),
    spin:Math.random()*Math.PI*2,rot:Math.random()*.06,kind});
}

// Colisão AABB um pouco "perdoada" (mais justa com a nave).
function hit(a,b){
  return a.x+6<b.x+b.w&&a.x+a.w-6>b.x&&a.y+5<b.y+b.h&&a.y+a.h-5>b.y;
}

function burst(px,py){
  for(let i=0;i<22;i++){
    trail.push({x:px,y:py,vx:(Math.random()-.5)*300,vy:(Math.random()-.5)*300,life:1});
  }
}

function gameOver(){
  playing=false;shake=10;
  best=Math.max(best,Math.floor(score));
  try{localStorage.setItem('nemesis_nave_best',String(best))}catch(e){}
  burst(ship.x+ship.w/2,ship.y+ship.h/2);
  overTitle.textContent='💥 GAME OVER';
  overSub.textContent='SCORE '+pad(score)+' • TOQUE PARA TENTAR DE NOVO';
  start.textContent='JOGAR NOVAMENTE';
  overlay.classList.remove('hidden');ui();
}

function update(dt){
  // Dificuldade sobe com o tempo.
  speed=Math.min(260,150+score*.35);
  score+=dt*.15;

  // Aparecem mais obstáculos conforme a velocidade sobe.
  spawnTimer-=dt;

  if(spawnTimer<=0){
    addObstacle();
    spawnTimer=Math.max(.45,1.05-speed*.0012)+Math.random()*.5;
  }

  // Nave não sai das bordas.
  ship.x=Math.max(
    ship.w/2+4,
    Math.min(W-ship.w/2-4,ship.x)
  );

  // Descida dos obstáculos e rotação; colisão.
  for(let i=obstacles.length-1;i>=0;i--){
    const o=obstacles[i];

    o.y+=speed*dt;
    o.rot+=o.spin*dt;

    if(hit(ship,o)){
      gameOver();
      return;
    }

    if(o.y-o.h>H){
      obstacles.splice(i,1);
    }
  }

  // Estrelas.
  for(let i=0;i<stars.length;i++){
    stars[i].y+=speed*.25*dt;

    if(stars[i].y>H){
      stars[i].y=-4;
      stars[i].x=Math.random()*W;
    }
  }

  // Partículas.
  for(let i=trail.length-1;i>=0;i--){
    const p=trail[i];

    p.x+=p.vx*dt;
    p.y+=p.vy*dt;

    p.life-=1.8*dt;

    if(p.life<=0){
      trail.splice(i,1);
    }
  }

  // Screen shake.
  if(shake>0){
    shake-=12*dt;
  }

  ui();
}

function loop(t){
  if(!last)last=t;

  const dt=Math.min((t-last)/1000,0.05);

  last=t;

  if(playing){
    update(dt);
  }

  draw();

  requestAnimationFrame(loop);
}

function drawShip(){
  const sx=ship.x, sy=ship.y, sw=ship.w, sh=ship.h;
  x.save();x.translate(sx+sw/2,sy+sh/2);
  // Asa esquerda.
  x.fillStyle='#3b8cff';x.beginPath();x.moveTo(-sw*.28,sh*.35);x.lineTo(-sw*.85,sh*.55);x.lineTo(-sw*.55,sh*.75);x.lineTo(-sw*.28,sh*.6);x.closePath();x.fill();
  // Asa direita.
  x.fillStyle='#3b8cff';x.beginPath();x.moveTo(sw*.28,sh*.35);x.lineTo(sw*.85,sh*.55);x.lineTo(sw*.55,sh*.75);x.lineTo(sw*.28,sh*.6);x.closePath();x.fill();
  // Núcleo da nave (corpo central).
  x.fillStyle='#dff0ff';x.beginPath();x.moveTo(0,-sh*.55);x.lineTo(sw*.3,sh*.15);x.lineTo(sw*.14,sh*.55);x.lineTo(-sw*.14,sh*.55);x.lineTo(-sw*.3,sh*.15);x.closePath();x.fill();
  // Canopy (cabine).
  x.fillStyle='#7ee8ff';x.beginPath();x.moveTo(0,-sh*.45);x.lineTo(sw*.16,sh*.05);x.lineTo(-sw*.16,sh*.05);x.closePath();x.fill();
  // Chama de propulsão (piscando).
  const fl=4+Math.sin(Date.now()*.03)*2;
  x.fillStyle='#ffb347';x.beginPath();x.moveTo(-sw*.08,sh*.55);x.lineTo(sw*.08,sh*.55);x.lineTo(0,sh*.55+fl);x.closePath();x.fill();
  x.restore();
  // Rastro de partículas atrás da nave enquanto joga.
  if(playing){
    trail.push({x:sx+sw/2+(Math.random()-.5)*6,y:sy+sh*.6,
      vx:(Math.random()-.5)*40,vy:90+Math.random()*60,life:.7});
  }
}

function drawObstacle(o){
  x.save();x.translate(o.x+o.w/2,o.y+o.h/2);x.rotate(o.rot);
  if(o.kind<.3){
    x.fillStyle='#a86a5a';x.beginPath();x.arc(0,0,o.w/2,0,Math.PI*2);x.fill();
    x.fillStyle='rgba(0,0,0,.18)';x.beginPath();x.arc(-o.w/6,-o.h/6,o.w/6,0,Math.PI*2);x.fill();
  }else{
    x.fillStyle='#8f98a8';x.beginPath();
    x.moveTo(-o.w/2,o.h/2);x.lineTo(-o.w/3,-o.h/3);x.lineTo(o.w/4,-o.h/2);x.lineTo(o.w/2,o.h/4);x.closePath();x.fill();
    x.fillStyle='rgba(0,0,0,.16)';x.fillRect(-o.w/2,o.h/4,o.w,o.h*.14);
  }
  x.restore();
}

function draw(){
  x.save();
  if(shake>0){
    x.translate((Math.random()-.5)*shake,(Math.random()-.5)*shake);
  }
  // Céu em degradê (noite espacial).
  const g=x.createLinearGradient(0,0,0,H);
  g.addColorStop(0,'#0a1030');g.addColorStop(.6,'#0c1a3a');g.addColorStop(1,'#123c4a');
  x.fillStyle=g;x.fillRect(0,0,W,H);

  // Estrelas cintilando.
  stars.forEach(function(s){
    const a=.35+.4*Math.abs(Math.sin(Date.now()*.002+s.tw));
    x.globalAlpha=Math.max(.1,a);
    x.fillStyle='#ffffff';x.fillRect(s.x,s.y,s.s,s.s);
  });
  x.globalAlpha=1;

  obstacles.forEach(drawObstacle);
  drawShip();

  // Partículas do rastro/explosão.
  trail.forEach(function(p){
    x.globalAlpha=Math.max(0,p.life);
    x.fillStyle='#8ab8ff';x.fillRect(p.x,p.y,3,3);
  });
  x.globalAlpha=1;

  x.restore();
}

function loop(t){
  if(!last)last=t;
  const dt=Math.min((t-last)/1000,0.05);
  last=t;
  if(playing)update(dt);
  draw();
  requestAnimationFrame(loop);
}

// Controles: botões seguram a direção enquanto pressionados + toque/arrasto.
let dir=0,pointerX=null;
function setDir(d){dir=d}
leftBtn.addEventListener('pointerdown',e=>{e.preventDefault();setDir(-1)});
leftBtn.addEventListener('pointerup',()=>setDir(0));leftBtn.addEventListener('pointercancel',()=>setDir(0));
rightBtn.addEventListener('pointerdown',e=>{e.preventDefault();setDir(1)});
rightBtn.addEventListener('pointerup',()=>setDir(0));rightBtn.addEventListener('pointercancel',()=>setDir(0));

board.addEventListener('pointerdown',e=>{if(e.target===start)return;e.preventDefault();pointerX=e.clientX});
board.addEventListener('pointermove',e=>{if(pointerX===null||!playing)return;ship.x+=(e.clientX-pointerX)*1.6;pointerX=e.clientX;ship.x=Math.max(ship.w/2+4,Math.min(W-ship.w/2-4,ship.x))});
board.addEventListener('pointerup',()=>pointerX=null);board.addEventListener('pointercancel',()=>pointerX=null);

document.addEventListener('keydown',e=>{if(e.code==='ArrowLeft')setDir(-1);if(e.code==='ArrowRight')setDir(1);if(e.code==='Space'){e.preventDefault();if(!playing)reset()}});
document.addEventListener('keyup',e=>{if(e.code==='ArrowLeft'||e.code==='ArrowRight')setDir(0)});

// Atualiza posição da nave em cada frame usando a direção dos botões/teclado.
const origUpdate=update;
update=function(dt){
  if(dir!==0)ship.x+=dir*190*dt;
  ship.x=Math.max(ship.w/2+4,Math.min(W-ship.w/2-4,ship.x));
  return origUpdate(dt);
};

start.addEventListener('pointerdown',e=>{e.preventDefault();e.stopPropagation();reset()});

seedStars();ui();requestAnimationFrame(loop);
</script>
</body>
</html>`;
}

/**
 * Escapa HTML De Um Texto Pra Não Quebrar A Página (Usado Pro Nome Do Bot).
 * @param {string} str
 * @returns {string}
 */
function esc(str) {
    return String(str)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#39;");
}
