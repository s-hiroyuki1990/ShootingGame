jQuery(function ($) {

	// 全体で使用する変数
	var canvas = $("#screen").get(0);
	var ctx = canvas.getContext('2d');
	// FPS管理に使用するパラメータを定義
	var FPS = 30;
	var MSPF = 1000 / FPS;
	var loop = 0;

	// キー状態管理変数の定義
	var KEYS = new Array(256);
	var RIGHT_KEY = 39;
	var LEFT_KEY  = 37;
	var SPACE_KEY = 32;
	// キーが押された時に呼び出される処理を指定
	window.onkeydown = function(e) {
		// キーを押された状態に更新
		KEYS[e.keyCode] = true;
	};
	// キーが離された時に呼び出される処理を指定
	window.onkeyup = function(e) {
		// キーを離された状態に更新
		KEYS[e.keyCode] = false;
	};

	// ゲーム開始フラグ
	var start = false;

	// 物体の情報を定義
	var Object = function (hp, x, y) {
		this.hp = hp || 1;
		this.x = x || 0;
		this.y = y || 0;
	};
	Object.prototype = {
		getHP: function() {
			return this.hp;
		},
		getPosition: function() {
			return [this.x, this.y];
		}
	};

	// モデル : プレイヤー
	var playerModel = {
		// 最大の持ち弾数
		max_bullet: 50,
		// プレイヤーの画像情報
		img: $("#player").get(0),
		speed: 10,
		player: '',
		bullet_num: 30,
		defeated_enemy: 0,
		score: 0,

		// 初期化
		init: function() {
			this.player = new Object(3, (canvas.width - this.img.width) / 2, (canvas.height - this.img.height) - 20);
		},
		setStatus: function() {
			$("#player-hp-counter").text(this.player.hp);
			$("#player-bullet-counter").text(this.bullet_num);
			$("#player-score-counter").text(this.score);
		},
		// プレイヤーの移動
		move: function() {
			// 左右の移動
			if(KEYS[RIGHT_KEY] && (this.player.x + this.img.width < canvas.width)) {
				this.player.x += this.speed;
			}
			if(KEYS[LEFT_KEY] && this.player.x > 0) {
				this.player.x -= this.speed;
			}

			// プレイヤーがはみ出てしまった場合は強制的に中に戻す
			if(this.player.x < 0) {
				this.player.x = 0;
			} else if (this.player.x + this.img.width > canvas.width) {
				this.player.x = canvas.width - this.img.width;
			}
		},
		// 弾の補充
		plusBullet: function() {
			if(this.bullet_num < this.max_bullet) {
				this.bullet_num += 1;
			}
		},
		minusBullet: function() {
			this.bullet_num -= 1;
		},
		plusScore: function(point) {
			this.score += point;
		},
		// プレイヤーが敵に当たっているか判定
		hit: function() {
			var enemies = enemyModel.get();
			for(var i=0; i < enemies.length; i++) {
				var hit = hitCheck(this.player.x, this.player.y, this.img, enemies[i].x, enemies[i].y, enemies[i].img);
				if(hit) {
					this.player.hp -= 1;
					enemyModel.hit(i);
				}
			}
		},
		// 死んだ場合の処理
		delete: function() {
			if(this.player.hp <= 0) {
				// 生きていない場合は画面から飛ばす
				this.player.x = -1000;
				this.player.y = -1000;
				start = false;
			}
		},
		// viewを更新
		updateView: function() {
			ctx.drawImage(this.img, this.player.x, this.player.y);
		},
		// プレイヤーの情報を取得
		getPlayerInfo: function() {
			return this.player;
		},
	};

	// モデル : 敵
	var enemyModel = {
		// 敵のスピード
		speed: 2,
		// 敵の横のスピード,
		speed_x: 10,
		// 敵の最大数
		enemy_num: 10,
		// 敵のリスト
		enemies: [],
		// 敵の画像
		img_abyss: $("#enemy-abyss").get(0),
		img_worm: $("#enemy-worm").get(0),
		img_hornet: $("#enemy-hornet").get(0),
		img_raijin: $("#enemy-raijin").get(0),

		// 初期化
		init: function() {

		},
		// 敵を追加
		add: function() {
			var enemy_type = Math.ceil( Math.random()*10 );
			var enemy;
			switch(enemy_type) {
				case 1:
				case 2:
				case 3:
				case 4:
				case 5:
				case 6:
					enemy = this.create_abyss();
					break;
				case 7:
					enemy = this.create_hornet();
					break;
				case 8:
				case 9:
					enemy = this.create_worm();
					break;
				case 10:
					enemy = this.create_raijin();
					break;
				default:
					enemy = this.create_abyss();
			}
			this.enemies.push(enemy);
		},
		create_abyss: function() {
			var x = Math.floor( Math.random() * canvas.width );
			var y = -10;
			var enemy = new Object(1, x, -20);
			enemy.speed_x = 2;
			enemy.speed_y = 2;
			enemy.point = 10;
			enemy.img = this.img_abyss;
			return enemy;
		},
		create_worm: function() {
			var x = Math.floor( Math.random() * canvas.width );
			var y = -10;
			var enemy = new Object(1, x, -20);
			enemy.speed_x = 20;
			enemy.speed_y = 1;
			enemy.point = 20;
			enemy.img = this.img_worm;
			return enemy;
		},
		create_hornet: function() {
			var x = Math.floor( Math.random() * canvas.width );
			var y = -10;
			var enemy = new Object(1, x, -20);
			enemy.speed_x = 0;
			enemy.speed_y = 10;
			enemy.point = 50;
			enemy.img = this.img_hornet;
			return enemy;
		},
		create_raijin: function() {
			var x = Math.floor( Math.random() * canvas.width );
			var y = -10;
			var enemy = new Object(10, x, -50);
			enemy.speed_x = 0;
			enemy.speed_y = 2;
			enemy.point = 100;
			enemy.img = this.img_raijin;
			return enemy;
		},
		// 敵を移動
		move: function() {
			for(var i=0; i < this.enemies.length; i++) {
				this.enemies[i].y += this.enemies[i].speed_y;
				if(loop % 2 == 0) {
					var x = Math.round( Math.random())*this.enemies[i].speed_x*2 - this.enemies[i].speed_x;
					this.enemies[i].x += x;
				}
				// はみ出てしまった場合は強制的に中に戻す
				if(this.enemies[i].x < 0) {
					this.enemies[i].x = 0;
				} else if (this.enemies[i].x + this.enemies[i].img.width > canvas.width) {
					this.enemies[i].x = canvas.width - this.enemies[i].img.width;
			}
			}
		},
		// 敵に衝突, 配列番号
		hit: function(i) {
			this.enemies[i].hp -= 1;
			if(this.enemies[i].hp < 1) {
				playerModel.plusScore(this.enemies[i].point);
			}
		},
		// 敵の削除
		delete: function() {
			for(var i = 0; i < this.enemies.length; i++) {
				if((this.enemies[i].hp <= 0) || (this.enemies[i].y > canvas.height)) {
					this.enemies.splice(i,1);
				}
			}
		},
		// viewを更新
		updateView: function() {
			for(var i = 0; i < this.enemies.length; i++) {
				ctx.drawImage(this.enemies[i].img, this.enemies[i].x, this.enemies[i].y);
			}
		},
		// 敵を取得
		get: function() {
			return this.enemies;
		},
	};

	// モデル : 弾
	var bulletModel = {
		img: $("#player-bullet").get(0),
		imgSizeW: '',
		imgSizeH: '',
		// 弾のスピード
		speed: 15,
		// 弾のリスト
		bullets: [],
		// 初期化
		init: function() {
			this.imgSizeW = this.img.width;
			this.imgSizeH = this.img.height;
		},
		// 弾を発射, 弾数を-1
		add: function(x, y) {
			if(KEYS[SPACE_KEY] && (playerModel.bullet_num > 0)) {
				var bullet = new Object(1, x, y);
				this.bullets.push(bullet);
				playerModel.minusBullet();
				$("#player-bullet-counter").text(playerModel.bullet_num);
			}
		},
		// 弾を移動
		move: function() {
			for(var i=0; i < this.bullets.length; i++) {
				this.bullets[i].y -= this.speed;
			}
		},
		// プレイヤーが敵に当たっているか判定
		hit: function() {
			var enemies = enemyModel.get();
			for(var i=0; i < this.bullets.length; i++) {
				for(var j=0; j < enemies.length; j++) {
					var hit = hitCheck(this.bullets[i].x, this.bullets[i].y, this.img, enemies[j].x, enemies[j].y, enemies[j].img);
					if(hit) {
						this.bullets[i].hp -= 1;
						enemyModel.hit(j);
					};
				};
			};
		},
		delete: function() {
			for(var i = 0; i < this.bullets.length; i++) {
				if((this.bullets[i].hp <= 0) || (this.bullets[i].y < 0)) {
					this.bullets.splice(i,1);
				};
			};
		},
		// viewを更新
		updateView: function() {
			for(var i=0; i < this.bullets.length; i++) {
				ctx.drawImage(this.img, this.bullets[i].x, this.bullets[i].y);
			};
		},
	};

	// 衝突判定
	var hitCheck = function(x1, y1, obj1, x2, y2, obj2) {
		var cx1, cy1, cx2, cy2, r1, r2, d;
		// 中心座標の取得
		cx1 = x1 + obj1.width/2;
		cy1 = y1 + obj1.height/2;
		cx2 = x2 + obj2.width/2;
		cy2 = y2 + obj2.height/2;
		// 半径の計算
		r1 = (obj1.width+obj1.height)/4;
		r2 = (obj2.width+obj2.height)/4;
		// 中心座標同士の距離の測定
		d = Math.sqrt(Math.pow(cx1-cx2, 2) + Math.pow(cy1-cy2, 2));
		// 当たっているか判定
		if(r1 + r2 > d) {
			// hit
			return true;
		} else {
			// no hit
			return false;
		}
	};


	// ビュー : キャンバスを更新
	var updateScreen = function() {
		// キャンバスをクリアする
		ctx.clearRect(0, 0, canvas.width, canvas.height);
		// プレイヤーを描画
		playerModel.updateView();
		// 弾を描画
		bulletModel.updateView();
		// 敵を描画
		enemyModel.updateView();
	};

	// 一時停止中の画面表示
	var drawPauseScreen = function() {
		ctx.fillStyle = "rgba(0, 0, 0, 0.5)";
		ctx.fillRect (0, 0, canvas.width, canvas.height);
		ctx.font = "12pt 'Arial'";
		ctx.fillStyle = "white";
		if(playerModel.player.hp > 0) {
			ctx.fillText("ゲームを始めるにはSTART押してください", 50, 200);
		}else{
			ctx.fillText("Game Over", 150, 200);
			ctx.fillText("score : " + playerModel.score, 150, 250);
		}
	};

	// 物体情報の整理
	var deleteObjData = function() {
		playerModel.delete();
		// 敵データの削除
		enemyModel.delete();
		// 弾データの削除
		bulletModel.delete();
	};

	// 各キャラの移動
	var moveObj = function() {
		// プレイヤーの移動処理
		playerModel.move();
		// 弾を移動
		bulletModel.move();
		// 敵の移動
		enemyModel.move();
	};

	// 初期化関数
	var initGame = function() {
		// キーの状態を false （押されていない）で初期化
		for(var i=0; i<KEYS.length; i++) {
			KEYS[i] = false;
		}

		// プレイヤー情報を初期化
		playerModel.init();

		// 敵の情報を初期化
		enemyModel.init();

		// 弾の情報を初期化
		bulletModel.init();

		updateScreen();
	};

	// メインループ関数
	var main = function() {

		playerModel.setStatus();

		// 再描画
		updateScreen();

		// 停止
		if(!start) {
			setTimeout(main, 10);
			drawPauseScreen();
			return;
		}

		// ループ回数をプラス1
		loop++;
		// 処理開始時間を保存
		var startTime = new Date();

		// 敵を追加
		if(loop % 30 == 0) {
			enemyModel.add();
		};

		// 弾を発射
		if(loop % 5 == 0) {
			bulletModel.add(playerModel.player.x + (playerModel.img.width / 2) - 8, playerModel.player.y);
		};

		// 弾を補充
		if(loop % 15 == 0) {
			playerModel.plusBullet();
		};

		// 各キャラの移動
		moveObj();

		// 衝突判定
		playerModel.hit();
		bulletModel.hit();

		// 物体情報の整理
		deleteObjData();

		// 処理経過時間および次のループまでの間隔を計算
		var deltaTime = (new Date()) - startTime;
		var interval = MSPF - deltaTime;
		if(interval > 0) {
			// 処理が早すぎるので次のループまで少し待つ
			setTimeout(main, interval);
		} else {
			// 処理が遅すぎるので即次のループを実行する
			main();
		}
	};

	// 初期化
	initGame();
	// メインループ
	main();


	// ゲーム開始
	$("#start-btn").on('click', function(){
		start = true;
	});

	// ゲーム終了
	$("#stop-btn").on('click', function(){
		start = false;
	})
});

