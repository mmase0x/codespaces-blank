// 効果音AudioPool
const hitSoundPool = Array.from({length: 8}, () => new Audio('assets/sounds/hit.mp3'));
let hitSoundIdx = 0;
function playHitSound() {
    try {
        const s = hitSoundPool[hitSoundIdx];
        s.currentTime = 0;
        s.volume = 0.7;
        s.play();
        hitSoundIdx = (hitSoundIdx + 1) % hitSoundPool.length;
    } catch(e) {}
}
// アイテム定義
const ITEM_NONE = 0;
const ITEM_CRYSTAL = 1; // 青クリスタル
const ITEM_BOMB = 2;    // 黄色爆弾
const ITEM_SHADOW = 3;  // 黒いクリスタル（分身）
// ちょうちょ型敵の弾
let butterflyBullets = [];
// 分身状態
let shadowActive = false;
let shadowEndTime = 0;
let items = [];
let spreadShotActive = false;
let spreadShotEndTime = 0;

import { GAME_VERSION } from './version.js';

// ドラッグ操作用
let dragging = false;
let dragOffsetX = 0;

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
    // 40%の確率でちょうちょ型敵を出現
    if (Math.random() < 0.4) {
        enemies.push({
            type: 'butterfly',
            x: Math.random() * (canvas.width - size),
            y: -size,
            w: size,
            h: size,
            speed: 2 + Math.random() * 1.5,
            angle: 0,
            angleSpeed: 0.1 + Math.random() * 0.1,
            fireCooldown: 0
        });
    } else {
        enemies.push({
            type: 'normal',
            x: Math.random() * (canvas.width - size),
            y: -size,
            w: size,
            h: size,
            speed: 2 + Math.random() * 2
        });
    }
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

    // 分身アイテム効果終了
    if (shadowActive && performance.now() > shadowEndTime) {
        shadowActive = false;
    }

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

    // ちょうちょ型敵の弾移動
    butterflyBullets.forEach(b => {
        b.x += b.vx;
        b.y += b.vy;
    });
    butterflyBullets = butterflyBullets.filter(b => b.y + b.h > 0 && b.y < canvas.height && b.x + b.w > 0 && b.x < canvas.width);

    // 敵出現（0.7秒ごと）
    if (performance.now() - lastEnemyTime > 700) {
        spawnEnemy();
        lastEnemyTime = performance.now();
    }
    // 敵移動
    enemies.forEach(e => {
        if (e.type === 'butterfly') {
            e.angle += e.angleSpeed;
            e.x += Math.sin(e.angle) * 3;
            e.y += e.speed;
            // 弾発射
            e.fireCooldown -= dt;
            if (e.fireCooldown <= 0) {
                // プレイヤー方向に弾
                const dx = (player.x + player.w/2) - (e.x + e.w/2);
                const dy = (player.y + player.h/2) - (e.y + e.h/2);
                const len = Math.sqrt(dx*dx + dy*dy);
                butterflyBullets.push({
                    x: e.x + e.w/2 - 4,
                    y: e.y + e.h/2 - 4,
                    w: 8,
                    h: 8,
                    vx: dx/len*4,
                    vy: dy/len*4
                });
                e.fireCooldown = 900 + Math.random()*600;
            }
        } else {
            e.y += e.speed;
        }
    });
    enemies = enemies.filter(e => e.y < canvas.height + e.h && e.y > -100 && e.w > 0 && e.h > 0);


    // 衝突判定（弾と敵）
    bullets.forEach((b, bi) => {
        enemies.forEach((e, ei) => {
            if (b.x < e.x + e.w && b.x + b.w > e.x && b.y < e.y + e.h && b.y + b.h > e.y) {
                playHitSound(); // 効果音再生
                // 吹き出しエフェクト追加
                effects.push({
                    x: e.x + e.w/2,
                    y: e.y - 30, // 敵の上に表示
                    text: 'うわああああ',
                    time: performance.now()
                });
                // アイテム出現
                if (e.type === 'butterfly') {
                    // 20%で分身アイテム
                    if (Math.random() < 0.2) {
                        items.push({
                            x: e.x + e.w/2 - 16,
                            y: e.y + e.h/2 - 16,
                            w: 32,
                            h: 32,
                            type: ITEM_SHADOW,
                            vy: 2
                        });
                    }
                } else {
                    // 通常敵は従来通り
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
    // ちょうちょ型敵の弾とプレイヤー
    butterflyBullets.forEach(b => {
        if (player.x < b.x + b.w && player.x + player.w > b.x && player.y < b.y + b.h && player.y + player.h > b.y) {
            player.alive = false;
            isGameOver = true;
        }
    });
    // アイテム取得: 分身
    items.forEach((item, ii) => {
        if (item.type === ITEM_SHADOW && player.x < item.x + item.w && player.x + player.w > item.x && player.y < item.y + item.h && player.y + player.h > item.y) {
            shadowActive = true;
            shadowEndTime = performance.now() + 6000; // 6秒間分身
            items[ii].y = canvas.height + 1000;
        }
    });
}

function render() {
    // アイテム
    items.forEach(item => {
        ctx.save();
        ctx.translate(item.x + item.w/2, item.y + item.h/2);
        if (item.type === ITEM_CRYSTAL) {
            // 青いクリスタル（ひし形＋グラデーション）
            let grad = ctx.createLinearGradient(0, -item.h/2, 0, item.h/2);
            grad.addColorStop(0, '#aef');
            grad.addColorStop(1, '#23f');
            ctx.beginPath();
            ctx.moveTo(0, -item.h/2);
            ctx.lineTo(item.w/2, 0);
            ctx.lineTo(0, item.h/2);
            ctx.lineTo(-item.w/2, 0);
            ctx.closePath();
            ctx.fillStyle = grad;
            ctx.globalAlpha = 0.9;
            ctx.fill();
            ctx.globalAlpha = 1.0;
            ctx.strokeStyle = '#fff';
            ctx.lineWidth = 2;
            ctx.stroke();
        } else if (item.type === ITEM_BOMB) {
            // 黄色い爆弾（丸＋導火線＋火花）
            // 本体
            ctx.beginPath();
            ctx.arc(0, 0, item.w/2.5, 0, Math.PI*2);
            ctx.fillStyle = '#ff0';
            ctx.globalAlpha = 0.9;
            ctx.fill();
            ctx.globalAlpha = 1.0;
            ctx.strokeStyle = '#cc0';
            ctx.lineWidth = 2;
            ctx.stroke();
            // 導火線
            ctx.beginPath();
            ctx.moveTo(0, -item.h/2.5);
            ctx.lineTo(0, -item.h/1.5);
            ctx.strokeStyle = '#333';
            ctx.lineWidth = 2;
            ctx.stroke();
            // 火花
            ctx.save();
            ctx.translate(0, -item.h/1.5);
            ctx.rotate(Math.random()*Math.PI*2);
            for(let i=0;i<6;i++){
                ctx.beginPath();
                ctx.moveTo(0,0);
                ctx.lineTo(6,0);
                ctx.strokeStyle = '#f90';
                ctx.lineWidth = 2;
                ctx.stroke();
                ctx.rotate(Math.PI/3);
            }
            ctx.restore();
        } else if (item.type === ITEM_SHADOW) {
            // 黒いクリスタル（分身）
            let grad = ctx.createLinearGradient(0, -item.h/2, 0, item.h/2);
            grad.addColorStop(0, '#222');
            grad.addColorStop(1, '#555');
            ctx.beginPath();
            ctx.moveTo(0, -item.h/2);
            ctx.lineTo(item.w/2, 0);
            ctx.lineTo(0, item.h/2);
            ctx.lineTo(-item.w/2, 0);
            ctx.closePath();
            ctx.fillStyle = grad;
            ctx.globalAlpha = 0.95;
            ctx.fill();
            ctx.globalAlpha = 1.0;
            ctx.strokeStyle = '#000';
            ctx.lineWidth = 2;
            ctx.stroke();
        }
        ctx.restore();
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
        // 分身状態なら2体描画
        if (shadowActive) {
            for (let i = -1; i <= 1; i += 2) {
                ctx.save();
                ctx.globalAlpha = 0.5;
                ctx.translate(player.x + player.w/2 + i*30, player.y + player.h/2);
                ctx.beginPath();
                ctx.moveTo(0, -player.h/2);
                ctx.lineTo(-player.w/2, player.h/2);
                ctx.lineTo(player.w/2, player.h/2);
                ctx.closePath();
                ctx.fillStyle = '#222';
                ctx.fill();
                ctx.restore();
            }
        }
        ctx.save();
        ctx.translate(player.x + player.w/2, player.y + player.h/2);
        ctx.beginPath();
        ctx.moveTo(0, -player.h/2);
        ctx.lineTo(-player.w/2, player.h/2);
        ctx.lineTo(player.w/2, player.h/2);
        ctx.closePath();
        ctx.fillStyle = '#0cf';
        ctx.fill();
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
        // 敵
        enemies.forEach(e => {
            ctx.save();
            ctx.translate(e.x + e.w/2, e.y + e.h/2);
            if (e.type === 'butterfly') {
                // ちょうちょ型（羽2枚＋胴体）
                ctx.save();
                ctx.rotate(Math.sin(e.angle)*0.5);
                // 左羽
                ctx.beginPath();
                ctx.ellipse(-e.w/3, 0, e.w/3, e.h/2, Math.PI/6, 0, Math.PI*2);
                ctx.fillStyle = '#f6f';
                ctx.globalAlpha = 0.8;
                ctx.fill();
                // 右羽
                ctx.beginPath();
                ctx.ellipse(e.w/3, 0, e.w/3, e.h/2, -Math.PI/6, 0, Math.PI*2);
                ctx.fillStyle = '#6ff';
                ctx.globalAlpha = 0.8;
                ctx.fill();
                ctx.globalAlpha = 1.0;
                ctx.restore();
                // 胴体
                ctx.beginPath();
                ctx.ellipse(0, 0, e.w/8, e.h/2.2, 0, 0, Math.PI*2);
                ctx.fillStyle = '#333';
                ctx.fill();
                // 頭
                ctx.beginPath();
                ctx.arc(0, -e.h/2.5, e.w/7, 0, Math.PI*2);
                ctx.fillStyle = '#222';
                ctx.fill();
            } else {
                // 骸骨風（丸＋目＋骨）
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
                // 口（削除済み）
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
            }
            ctx.restore();
        });

        // ちょうちょ型敵の弾
        ctx.fillStyle = '#333';
        butterflyBullets.forEach(b => {
            ctx.beginPath();
            ctx.arc(b.x + b.w/2, b.y + b.h/2, b.w/2, 0, Math.PI*2);
            ctx.fill();
        });
bgm.loop = true;
bgm.volume = 0.3;
let bgmStarted = false;
function playBGM() {
    if (!bgmStarted) {
        bgm.play();
        bgmStarted = true;
    }
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
    // 画面外に出ないよう制限
    player.x = Math.max(0, Math.min(canvas.width - player.w, player.x));
}
function handlePointerUp(e) {
    dragging = false;
}

// ポインター押下時
function handlePointerDown(e) {
    e.preventDefault();
    dragging = true;
    let pointerX;
    if (e.touches) {
        pointerX = e.touches[0].clientX - canvas.getBoundingClientRect().left;
    } else {
        pointerX = e.clientX - canvas.getBoundingClientRect().left;
    }
    dragOffsetX = pointerX - player.x;
}

// ポインター移動時
function handlePointerMove(e) {
    if (!dragging) return;
    let pointerX;
    if (e.touches) {
        pointerX = e.touches[0].clientX - canvas.getBoundingClientRect().left;
    } else {
        pointerX = e.clientX - canvas.getBoundingClientRect().left;
    }
    player.x = pointerX - dragOffsetX;
}

canvas.addEventListener('mousedown', handlePointerDown);
canvas.addEventListener('mousemove', handlePointerMove);
canvas.addEventListener('mouseup', handlePointerUp);
canvas.addEventListener('mouseleave', handlePointerUp);
canvas.addEventListener('touchstart', handlePointerDown);
canvas.addEventListener('touchmove', handlePointerMove);
canvas.addEventListener('touchend', handlePointerUp);


// メインループ関数
function gameLoop(timestamp) {
    if (!window._lastTime) window._lastTime = timestamp;
    const dt = timestamp - window._lastTime;
    window._lastTime = timestamp;
    update(dt);
    render();
    if (!isGameOver) {
        requestAnimationFrame(gameLoop);
    }
}

window.onload = () => {
    resetGame();
    window._lastTime = undefined;
    requestAnimationFrame(gameLoop);
};
