// バージョン番号（コミットごとに手動で増やしてください）
const GAME_VERSION = 'v1.0.1';

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

function shootBullet() {
    bullets.push({
        x: player.x + player.w / 2 - 4,
        y: player.y,
        w: 8,
        h: 16,
        speed: 10
    });
}

function update(dt) {
    if (!player.alive) return;

    // 弾発射（0.2秒ごと）
    if (performance.now() - lastBulletTime > 200) {
        shootBullet();
        lastBulletTime = performance.now();
    }

    // 弾移動
    bullets.forEach(b => b.y -= b.speed);
    bullets = bullets.filter(b => b.y + b.h > 0);

    // 敵出現（0.7秒ごと）
    if (performance.now() - lastEnemyTime > 700) {
        spawnEnemy();
        lastEnemyTime = performance.now();
    }
    // 敵移動
    enemies.forEach(e => e.y += e.speed);
    enemies = enemies.filter(e => e.y < canvas.height + e.h);


    // 衝突判定（弾と敵）
    bullets.forEach((b, bi) => {
        enemies.forEach((e, ei) => {
            if (b.x < e.x + e.w && b.x + b.w > e.x && b.y < e.y + e.h && b.y + b.h > e.y) {
                // 吹き出しエフェクト追加
                effects.push({
                    x: e.x + e.w/2,
                    y: e.y - 30, // 敵の上に表示
                    text: 'うわああああ',
                    time: performance.now()
                });
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
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // 背景
    ctx.fillStyle = '#111';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // プレイヤー

    if (player.alive) {
        if (playerImg.complete && playerImg.naturalWidth > 0) {
            ctx.drawImage(playerImg, player.x, player.y, player.w, player.h);
        } else {
            // 画像がなければシルエット
            ctx.fillStyle = '#0ff';
            ctx.beginPath();
            ctx.arc(player.x + player.w/2, player.y + player.h/2, player.w/2, 0, Math.PI*2);
            ctx.fill();
        }
    }

    // 弾
    ctx.fillStyle = '#fff';
    bullets.forEach(b => ctx.fillRect(b.x, b.y, b.w, b.h));


    // 敵
    enemies.forEach(e => {
        if (enemyImg.complete && enemyImg.naturalWidth > 0) {
            ctx.drawImage(enemyImg, e.x, e.y, e.w, e.h);
        } else {
            // 画像がなければシルエット
            ctx.fillStyle = '#f33';
            ctx.beginPath();
            ctx.arc(e.x + e.w/2, e.y + e.h/2, e.w/2, 0, Math.PI*2);
            ctx.fill();
        }
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
    effects = effects.filter(e => now - e.time < 1000); // 1秒表示
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
    const dt = ts - lastTime;
    lastTime = ts;
    if (!isGameOver) update(dt);
    render();
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