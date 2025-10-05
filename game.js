import Phaser from 'phaser';

// ========================================
// ゲームの設定
// ========================================
const config = {
    type: Phaser.AUTO,  // WebGLまたはCanvasを自動選択
    width: 800,         // ゲーム画面の幅
    height: 600,        // ゲーム画面の高さ
    physics: {
        default: 'arcade',  // Arcadeフィジックスを使用（シンプルな物理演算）
        arcade: {
            gravity: { y: 0 },  // 重力なし（ブロック崩しには不要）
            debug: false        // デバッグ表示オフ
        }
    },
    scene: {
        preload: preload,   // アセット読み込み関数
        create: create,     // ゲーム初期化関数
        update: update      // 毎フレーム実行される関数
    }
};

// ゲームインスタンスを作成
const game = new Phaser.Game(config);

// ========================================
// グローバル変数（ゲーム全体で使う変数）
// ========================================
let paddle;        // パドル（プレイヤーが操作する板）
let ball;          // ボール
let bricks;        // ブロックのグループ
let scoreText;     // スコア表示用テキスト
let score = 0;     // スコア
let gameOverText;  // ゲームオーバー表示用
let isGameOver = false;  // ゲームオーバーフラグ

// ========================================
// preload関数：ゲーム開始前にアセットを読み込む
// ========================================
function preload() {
    // このゲームでは画像を使わないので空のまま
    // 必要なら this.load.image('キー', 'パス') で画像を読み込める
}

// ========================================
// create関数：ゲームの初期設定
// ========================================
function create() {
    // ゲームオーバーフラグをリセット
    isGameOver = false;
    
    // --- パドルを作成 ---
    // add.rectangle(x, y, 幅, 高さ, 色)
    paddle = this.add.rectangle(400, 550, 100, 20, 0x6666ff);
    // 物理演算を有効化
    this.physics.add.existing(paddle);
    // パドルは動かないように固定（プレイヤーの入力でのみ動く）
    paddle.body.setImmovable(true);
    // 画面外に出ないようにする
    paddle.body.setCollideWorldBounds(true);

    // --- ボールを作成 ---
    ball = this.add.circle(400, 500, 10, 0xffffff);  // 円形のボール
    this.physics.add.existing(ball);
    // ボールに初速度を与える（x: 150, y: -150）
    ball.body.setVelocity(150, -150);
    // 画面の壁で跳ね返る（下だけは跳ね返らない）
    ball.body.setCollideWorldBounds(true);
    ball.body.onWorldBounds = true; // 壁との衝突イベントを有効化
    // 跳ね返り係数を1に（エネルギーが減らない）
    ball.body.setBounce(1, 1);
    
    // 画面下に当たったときのイベント
    this.physics.world.on('worldbounds', (body) => {
        if (body.gameObject === ball && body.blocked.down) {
            // ボールが下の壁に当たった
            gameOver(this);
        }
    });

    // --- ブロックを作成 ---
    bricks = this.physics.add.staticGroup();  // staticGroupに変更
    
    // 8行 x 10列のブロックを配置
    for (let row = 0; row < 8; row++) {
        for (let col = 0; col < 10; col++) {
            // ブロックのx座標とy座標を計算
            const x = col * 75 + 80;   // 75ピクセル間隔で横に配置
            const y = row * 30 + 80;   // 30ピクセル間隔で縦に配置
            
            // 行ごとに色を変える
            let color;
            if (row < 2) color = 0xff0000;      // 赤
            else if (row < 4) color = 0xff8800; // オレンジ
            else if (row < 6) color = 0xffff00; // 黄色
            else color = 0x00ff00;              // 緑
            
            // ブロックを作成してグループに追加
            const brick = this.add.rectangle(x, y, 70, 25, color);
            bricks.add(brick);  // staticGroupなので自動的に物理演算が追加される
        }
    }

    // --- 衝突判定を設定 ---
    // ボールとパドルが当たったときの処理
    this.physics.add.collider(ball, paddle, hitPaddle, null, this);
    // ボールとブロックが当たったときの処理
    this.physics.add.collider(ball, bricks, hitBrick, null, this);

    // --- スコア表示 ---
    scoreText = this.add.text(16, 16, 'スコア: 0', {
        fontSize: '24px',
        fill: '#ffffff'
    });

    // --- カーソルキー入力を取得 ---
    this.cursors = this.input.keyboard.createCursorKeys();
}

// ========================================
// update関数：毎フレーム実行される（ゲームループ）
// ========================================
function update() {
    // ゲームオーバー時は何もしない
    if (isGameOver) return;
    
    // --- パドルの移動制御 ---
    if (this.cursors.left.isDown) {
        // 左キーが押されている
        paddle.x -= 8;  // パドルを左に移動
    } else if (this.cursors.right.isDown) {
        // 右キーが押されている
        paddle.x += 8;  // パドルを右に移動
    }

    // パドルが画面外に出ないように制限
    paddle.x = Phaser.Math.Clamp(paddle.x, 50, 750);

    // --- 全ブロックを壊したらゲームクリア ---
    if (bricks.getLength() === 0) {
        gameClear(this);
    }
}

// ========================================
// ボールがパドルに当たったときの処理
// ========================================
function hitPaddle(ball, paddle) {
    // パドルのどこに当たったかで跳ね返る角度を変える
    const diff = ball.x - paddle.x;  // パドル中央からのズレ
    
    // ボールの横方向の速度を調整（最大200まで）
    ball.body.setVelocityX(diff * 5);
    
    // 縦方向の速度を維持または増加
    const currentSpeed = Math.abs(ball.body.velocity.y);
    ball.body.setVelocityY(-currentSpeed);
}

// ========================================
// ボールがブロックに当たったときの処理
// ========================================
function hitBrick(ball, brick) {
    // ブロックを破壊（画面から消す）
    brick.destroy();
    
    // スコアを加算
    score += 10;
    scoreText.setText('スコア: ' + score);
}

// ========================================
// ゲームオーバー処理
// ========================================
function gameOver(scene) {
    // すでにゲームオーバーなら何もしない
    if (isGameOver) return;
    isGameOver = true;
    
    // ボールを止める
    ball.body.setVelocity(0, 0);
    
    // ゲームオーバーテキストを表示
    gameOverText = scene.add.text(400, 300, 'ゲームオーバー\nクリックで再スタート', {
        fontSize: '48px',
        fill: '#ff0000',
        align: 'center'
    });
    gameOverText.setOrigin(0.5);
    
    // クリックで再スタート
    scene.input.once('pointerdown', () => {
        scene.scene.restart();
        score = 0;
    });
}

// ========================================
// ゲームクリア処理
// ========================================
function gameClear(scene) {
    // すでにゲームオーバーなら何もしない
    if (isGameOver) return;
    isGameOver = true;
    
    // ボールを止める
    ball.body.setVelocity(0, 0);
    
    // クリアテキストを表示
    const clearText = scene.add.text(400, 300, 'ゲームクリア！\nクリックで再スタート', {
        fontSize: '48px',
        fill: '#00ff00',
        align: 'center'
    });
    clearText.setOrigin(0.5);
    
    // クリックで再スタート
    scene.input.once('pointerdown', () => {
        scene.scene.restart();
        score = 0;
    });
}