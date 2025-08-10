// 効果音（毎回新インスタンスで再生）
function playHitSound() {
    try {
        const s = new Audio('assets/sounds/hit.mp3');
        s.volume = 0.7;
        s.play();
    } catch(e) {}
}
// アイテム定義
const ITEM_NONE = 0;
const ITEM_CRYSTAL = 1; // 青クリスタル
const ITEM_BOMB = 2;    // 黄色爆弾
let items = [];
let spreadShotActive = false;
let spreadShotEndTime = 0;
// バージョン番号（コミットごとに手動で増やしてください）
const GAME_VERSION = 'v1.0.4';

// --- シンプル縦スクロールシューティング ---
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
canvas.width = 800;
canvas.height = 600;


// 画像読み込み
const playerImg = new Image();
playerImg.src = 'assets/images/player_girl.png';
const enemyImg = new Image();
enemyImg.src = 'assets/images/enemy_skeleton.png';

// プレイヤー
const player = {
    x: canvas.width / 2,
    y: canvas.height - 60,
    w: 40,
    h: 40,
    speed: 8,
    alive: true
};

// 弾

let bullets = [];
let enemies = [];
let score = 0;
let lastEnemyTime = 0;
let lastBulletTime = 0;
let isGameOver = false;

// 吹き出し（敵を倒したときのエフェクト）
let effects = [];

function resetGame() {
    player.x = canvas.width / 2;
    player.alive = true;
    bullets = [];
    enemies = [];
    score = 0;
    lastEnemyTime = 0;
    lastBulletTime = 0;
    isGameOver = false;
}

function spawnEnemy() {
    const size = 36 + Math.random() * 24;
    enemies.push({
        x: Math.random() * (canvas.width - size),
        y: -size,
        w: size,
        h: size,
        speed: 2 + Math.random() * 2
    });
}

function shootBullet(angle = 0) {
    // angle: 0で真上、負で左、正で右
    const speed = 10;
    const vx = Math.sin(angle) * speed;
    const vy = Math.cos(angle) * speed;
    bullets.push({
        x: player.x + player.w / 2 - 4,
        y: player.y,
        w: 8,
        h: 16,
        speed: speed,
        vx: vx,
        vy: -vy
    });
}

function update(dt) {
    // アイテム移動
    items.forEach(item => item.y += item.vy);
    items = items.filter(item => item.y < canvas.height && item.y > -100 && item.type !== undefined);

    // アイテム取得判定
    items.forEach((item, ii) => {
        if (player.x < item.x + item.w && player.x + player.w > item.x && player.y < item.y + item.h && player.y + player.h > item.y) {
            if (item.type === ITEM_CRYSTAL) {
                spreadShotActive = true;
                spreadShotEndTime = performance.now() + 6000; // 6秒間
            } else if (item.type === ITEM_BOMB) {
                // 画面上の敵を全滅
                enemies.forEach(e => e.y = canvas.height + 1000);
            }
            items[ii].y = canvas.height + 1000; // 取得したら消す
        }
    });

    // 扇状ショット中の効果終了
    if (spreadShotActive && performance.now() > spreadShotEndTime) {
        spreadShotActive = false;
    }
    if (!player.alive) return;

    // 弾発射（0.2秒ごと）
    if (performance.now() - lastBulletTime > 200) {
        if (spreadShotActive) {
            // 扇状に3発
            shootBullet(0);
            shootBullet(-0.3);
            shootBullet(0.3);
        } else {
            shootBullet(0);
        }
        lastBulletTime = performance.now();
    }

    // 弾移動
    bullets.forEach(b => {
        b.x += b.vx || 0;
        b.y += b.vy !== undefined ? b.vy : -b.speed;
    });
    bullets = bullets.filter(b => b.y + b.h > 0 && b.y < canvas.height && b.x + b.w > 0 && b.x < canvas.width && !isNaN(b.x) && !isNaN(b.y));

    // 敵出現（0.7秒ごと）
    if (performance.now() - lastEnemyTime > 700) {
        spawnEnemy();
        lastEnemyTime = performance.now();
    }
    // 敵移動
    enemies.forEach(e => e.y += e.speed);
    enemies = enemies.filter(e => e.y < canvas.height + e.h && e.y > -100 && e.w > 0 && e.h > 0);


    // 衝突判定（弾と敵）
    bullets.forEach((b, bi) => {
        enemies.forEach((e, ei) => {
            if (b.x < e.x + e.w && b.x + b.w > e.x && b.y < e.y + e.h && b.y + b.h > e.y) {
                // playHitSound(); // 効果音一時停止
                // 吹き出しエフェクト追加
                effects.push({
                    x: e.x + e.w/2,
                    y: e.y - 30, // 敵の上に表示
                    text: 'うわああああ',
                    time: performance.now()
                });
                // アイテム出現（10%の確率）
                if (Math.random() < 0.1) {
                    const itemType = Math.random() < 0.5 ? ITEM_CRYSTAL : ITEM_BOMB;
                    items.push({
                        x: e.x + e.w/2 - 16,
                        y: e.y + e.h/2 - 16,
                        w: 32,
                        h: 32,
                        type: itemType,
                        vy: 2
                    });
                }
                bullets[bi].y = -1000; // 画面外に
                enemies[ei].y = canvas.height + 1000; // 画面外に
                score++;
            }
        });
    });

    // 衝突判定（敵とプレイヤー）
    enemies.forEach(e => {
        if (player.x < e.x + e.w && player.x + player.w > e.x && player.y < e.y + e.h && player.y + player.h > e.y) {
            player.alive = false;
            isGameOver = true;
        }
    });
}

function render() {
    // アイテム
    items.forEach(item => {
        if (item.type === ITEM_CRYSTAL) {
            // 青いクリスタル
            ctx.save();
            ctx.beginPath();
            ctx.arc(item.x + item.w/2, item.y + item.h/2, item.w/2, 0, Math.PI*2);
            ctx.fillStyle = '#33f';
            ctx.globalAlpha = 0.8;
            ctx.fill();
            ctx.globalAlpha = 1.0;
            ctx.font = '18px sans-serif';
            ctx.fillStyle = '#fff';
            ctx.textAlign = 'center';
            ctx.fillText('C', item.x + item.w/2, item.y + item.h/2 + 7);
            ctx.restore();
        } else if (item.type === ITEM_BOMB) {
            // 黄色い爆弾
            ctx.save();
            ctx.beginPath();
            ctx.arc(item.x + item.w/2, item.y + item.h/2, item.w/2, 0, Math.PI*2);
            ctx.fillStyle = '#ff0';
            ctx.globalAlpha = 0.8;
            ctx.fill();
            ctx.globalAlpha = 1.0;
            ctx.font = '18px sans-serif';
            ctx.fillStyle = '#000';
            ctx.textAlign = 'center';
            ctx.fillText('B', item.x + item.w/2, item.y + item.h/2 + 7);
            ctx.restore();
        }
    });

    // 扇状ショット中の表示
    if (spreadShotActive) {
        ctx.save();
        ctx.font = '20px sans-serif';
        ctx.fillStyle = '#3cf';
        ctx.fillText('扇状ショット!', canvas.width - 160, 40);
        ctx.restore();
    }
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // 背景
    ctx.fillStyle = '#111';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // プレイヤー

    if (player.alive) {
        // 飛行機風（三角形＋翼）
        ctx.save();
        ctx.translate(player.x + player.w/2, player.y + player.h/2);
        // 本体（三角形）
        ctx.beginPath();
        ctx.moveTo(0, -player.h/2);
        ctx.lineTo(-player.w/2, player.h/2);
        ctx.lineTo(player.w/2, player.h/2);
        ctx.closePath();
        ctx.fillStyle = '#0cf';
        ctx.fill();
        // 翼
        ctx.beginPath();
        ctx.moveTo(-player.w/2, player.h/4);
        ctx.lineTo(0, 0);
        ctx.lineTo(player.w/2, player.h/4);
        ctx.lineWidth = 6;
        ctx.strokeStyle = '#fff';
        ctx.stroke();
        ctx.restore();
    }

    // 弾
    ctx.fillStyle = '#fff';
    bullets.forEach(b => ctx.fillRect(b.x, b.y, b.w, b.h));


    // 敵
    enemies.forEach(e => {
        // 骸骨風（丸＋目＋骨）
        ctx.save();
        ctx.translate(e.x + e.w/2, e.y + e.h/2);
        // 頭
        ctx.beginPath();
        ctx.arc(0, 0, e.w/2, 0, Math.PI*2);
        ctx.fillStyle = '#fff';
        ctx.fill();
        ctx.strokeStyle = '#333';
        ctx.lineWidth = 2;
        ctx.stroke();
        // 目
        ctx.beginPath();
        ctx.arc(-e.w/6, -e.h/8, e.w/10, 0, Math.PI*2);
        ctx.arc(e.w/6, -e.h/8, e.w/10, 0, Math.PI*2);
        ctx.fillStyle = '#222';
        ctx.fill();
        // 口
        ctx.beginPath();
        ctx.arc(0, e.h/8, e.w/6, 0, Math.PI);
        ctx.strokeStyle = '#222';
        ctx.lineWidth = 2;
        ctx.stroke();
        // 骨（下）
        for(let i=-1;i<=1;i++){
            ctx.beginPath();
            ctx.moveTo(i*e.w/6, e.h/2-4);
            ctx.lineTo(i*e.w/6, e.h/2+8);
            ctx.strokeStyle = '#fff';
            ctx.lineWidth = 4;
            ctx.stroke();
            ctx.beginPath();
            ctx.arc(i*e.w/6, e.h/2+10, 3, 0, Math.PI*2);
            ctx.fillStyle = '#fff';
            ctx.fill();
        }
        ctx.restore();
    });
// BGM再生
let bgm;
function playBGM() {
    if (!bgm) {
        bgm = new Audio('assets/sounds/bgm.mp3');
        bgm.loop = true;
        bgm.volume = 0.3;
    }
    bgm.play();
}

window.addEventListener('pointerdown', playBGM, { once: true });

    // スコア
    ctx.fillStyle = '#fff';
    ctx.font = '24px sans-serif';

    ctx.fillText('SCORE: ' + score, 20, 40);
    // バージョン番号
    ctx.font = '16px sans-serif';
    ctx.fillStyle = '#aaa';
    ctx.fillText('ver: ' + GAME_VERSION, 22, 65);

    // 吹き出しエフェクト
    const now = performance.now();
    effects = effects.filter(e => now - e.time < 1000 && e.x !== undefined && e.y !== undefined);
    effects.forEach(e => {
        ctx.save();
        ctx.font = 'bold 44px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillStyle = '#ff0';
        ctx.strokeStyle = '#f00';
        ctx.lineWidth = 6;
        ctx.strokeText(e.text, e.x, e.y);
        ctx.fillText(e.text, e.x, e.y);
        ctx.restore();
    });

    // ゲームオーバー
    if (isGameOver) {
        ctx.fillStyle = 'rgba(0,0,0,0.7)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = '#fff';
        ctx.font = '48px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('GAME OVER', canvas.width/2, canvas.height/2);
        ctx.font = '28px sans-serif';
        ctx.fillText('タップでリトライ', canvas.width/2, canvas.height/2+60);
        ctx.textAlign = 'left';
    }
}

let lastTime = 0;
function gameLoop(ts) {
    try {
        const dt = ts - lastTime;
        lastTime = ts;
        if (!isGameOver) update(dt);
        render();
    } catch (e) {
        console.error('Game error:', e);
    }
    requestAnimationFrame(gameLoop);
}

// タップ・ドラッグ操作
let dragging = false;
let offsetX = 0;

function handlePointerDown(e) {
    if (isGameOver) {
        resetGame();
        return;
    }
    dragging = true;
    const rect = canvas.getBoundingClientRect();
    const x = (e.touches ? e.touches[0].clientX : e.clientX) - rect.left;
    offsetX = x - player.x;
}
function handlePointerMove(e) {
    if (!dragging) return;
    const rect = canvas.getBoundingClientRect();
    const x = (e.touches ? e.touches[0].clientX : e.clientX) - rect.left;
    player.x = x - offsetX;
    // 画面外に出ないよう制限
    player.x = Math.max(0, Math.min(canvas.width - player.w, player.x));
}
function handlePointerUp(e) {
    dragging = false;
}

canvas.addEventListener('mousedown', handlePointerDown);
canvas.addEventListener('mousemove', handlePointerMove);
canvas.addEventListener('mouseup', handlePointerUp);
canvas.addEventListener('mouseleave', handlePointerUp);
canvas.addEventListener('touchstart', handlePointerDown);
canvas.addEventListener('touchmove', handlePointerMove);
canvas.addEventListener('touchend', handlePointerUp);

window.onload = () => {
    resetGame();
    requestAnimationFrame(gameLoop);
};