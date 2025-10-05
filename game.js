import Phaser from 'phaser';

const config = {
    type: Phaser.AUTO,
    width: 800,
    height: 600,
    physics: {
        default: 'arcade',
        arcade: { gravity: { y: 300 } }
    },
    scene: {
        preload: preload,
        create: create,
        update: update
    }
};

const game = new Phaser.Game(config);

function preload() {
    // 画像やアセットを読み込む
}

function create() {
    // ゲームオブジェクトを作成
}

function update() {
    // ゲームループ
}