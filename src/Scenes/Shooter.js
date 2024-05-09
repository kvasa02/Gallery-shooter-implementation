class SpaceShooterScene extends Phaser.Scene {
    constructor() {
        super('SpaceShooterScene');
        this.initialPlayerSpeed = 20; // Initial speed of player movement
        this.initialEnemySpeed = 3; // Initial speed of enemy movement
        this.initialEmittedSpriteSpeed = 5; // Initial speed of emitted sprite movement
        this.playerSpeed = this.initialPlayerSpeed; // Speed of player movement
        this.enemySpeed = this.initialEnemySpeed; // Speed of enemy movement
        this.emittedSpriteSpeed = this.initialEmittedSpriteSpeed; // Speed of emitted sprite movement
        this.emittedSprites = []; // Array to store emitted sprites
        this.enemies = []; // Array to store enemy sprites
        this.enemyLasers = []; // Array to store enemy laser sprites
        this.energyCollections = []; // Array to store energy collection sprites
        this.score = 0; // Player score
        this.waveNumber = 0; // Current wave number
        this.maxWaves = 3; // Maximum number of waves
        this.lives = 3; // Player lives
    }

    preload() {
        this.load.image('player', 'assets/playerShip2_red.png');
        this.load.image('emittedSprite', 'assets/laserBlue07.png');
        this.load.image('enemy', 'assets/enemyBlack4.png');
        this.load.image('enemy2', 'assets/ufoGreen.png'); // New enemy image
        this.load.image('enemyLaser', 'assets/laserRed03.png'); // New enemy laser image
        this.load.image('energyCollection', 'assets/bolt_gold.png');
        this.load.audio('sfx_laser1', 'assets/sfx_laser1.ogg'); // Laser sound effect
    }

    create() {
        // Set up the initial position of the player
        this.player = this.add.sprite(100, 300, 'player');
        this.player.setOrigin(0.5, 0.5); // Set origin to center
        this.player.setRotation(Phaser.Math.DegToRad(90)); // Set initial rotation to 90 degrees (horizontal)
    
        // Keyboard input events
        this.input.keyboard.on('keydown-W', () => {
            this.player.y -= this.playerSpeed; // Move up
            // Ensure player does not go off the top edge
            this.player.y = Phaser.Math.Clamp(this.player.y, 0, this.game.config.height);
        });
    
        this.input.keyboard.on('keydown-S', () => {
            this.player.y += this.playerSpeed; // Move down
            // Ensure player does not go off the bottom edge
            this.player.y = Phaser.Math.Clamp(this.player.y, 0, this.game.config.height);
        });
    
        this.input.keyboard.on('keydown-SPACE', () => {
            this.shootLaser();
        });

        // Create initial wave of enemies
        this.createEnemies();

        // Create energy collections
        this.createEnergyCollections();

        // Display initial score
        this.scoreText = this.add.text(10, 10, 'Score: 0', { fontFamily: 'Arial', fontSize: 24, color: '#ffffff' });

        // Display initial lives
        this.livesText = this.add.text(10, 40, 'Lives: ' + this.lives, { fontFamily: 'Arial', fontSize: 24, color: '#ffffff' });

        this.explosionSound = this.sound.add('sfx_laser1');
    }
    
    update() {
        // Move emitted sprites vertically
        this.emittedSprites.forEach(sprite => {
            sprite.x += this.emittedSpriteSpeed; // Move laser horizontally
            // Check if emitted sprite is out of bounds
            if (sprite.x > this.game.config.width) {
                sprite.destroy();
                this.emittedSprites.splice(this.emittedSprites.indexOf(sprite), 1);
            }
        });
    
        // Move enemy lasers horizontally and check for collisions with player ship
        this.enemyLasers.forEach(laser => {
            // Move enemy laser horizontally
            laser.x -= laser.getData('speed');
            // Check for collision with player
            if (Phaser.Geom.Intersects.RectangleToRectangle(this.player.getBounds(), laser.getBounds())) {
                // Decrease player lives
                this.lives--;
                this.livesText.setText('Lives: ' + this.lives);
                // Check if player is out of lives
                if (this.lives === 0) {
                    this.gameOver();
                }
                laser.destroy(); // Destroy enemy laser
                this.enemyLasers.splice(this.enemyLasers.indexOf(laser), 1);
            } else if (laser.x < 0) {
                // Check if enemy laser is out of bounds
                laser.destroy();
                this.enemyLasers.splice(this.enemyLasers.indexOf(laser), 1);
            }
        });
    
        // Move player lasers horizontally and check for collisions with enemy lasers
        this.emittedSprites.forEach(playerLaser => {
            // Move player laser horizontally
            playerLaser.x += this.emittedSpriteSpeed;
            
            // Check for collision with enemy lasers
            this.enemyLasers.forEach(enemyLaser => {
                if (Phaser.Geom.Intersects.RectangleToRectangle(playerLaser.getBounds(), enemyLaser.getBounds())) {
                    // Destroy both lasers
                    playerLaser.destroy();
                    enemyLaser.destroy();
                    // Remove them from their respective arrays
                    this.emittedSprites.splice(this.emittedSprites.indexOf(playerLaser), 1);
                    this.enemyLasers.splice(this.enemyLasers.indexOf(enemyLaser), 1);
                }
            });
            
            // Check if emitted sprite is out of bounds
            if (playerLaser.x > this.game.config.width) {
                playerLaser.destroy();
                this.emittedSprites.splice(this.emittedSprites.indexOf(playerLaser), 1);
            }
        });
    
        // Move enemies horizontally
        this.enemies.forEach(enemy => {
            enemy.x -= this.enemySpeed;
            // Check for collision with player
            if (Phaser.Geom.Intersects.RectangleToRectangle(this.player.getBounds(), enemy.getBounds())) {
                // Decrease player lives
                this.lives--;
                this.livesText.setText('Lives: ' + this.lives);
                // Check if player is out of lives
                if (this.lives === 0) {
                    this.gameOver();
                }
                enemy.destroy(); // Destroy enemy
                this.enemies.splice(this.enemies.indexOf(enemy), 1);
            } else if (Math.random() < 0.01) { // Randomly make enemies shoot lasers
                this.enemyShootLaser(enemy.x, enemy.y);
            }
        });
    
        // Move energy collections
        this.energyCollections.forEach(collection => {
            collection.x -= this.emittedSpriteSpeed / 2; // Slower horizontal movement of energy collections
        });
    
        // Check for collision with energy collections
        this.energyCollections.forEach(collection => {
            // Check for collision with player
            if (Phaser.Geom.Intersects.RectangleToRectangle(this.player.getBounds(), collection.getBounds())) {
                // Handle player collision with energy collection (e.g., increase score)
                this.collectEnergy(collection);
            }
        });
    
        // Check for collision between emitted sprites (laser) and enemies
        this.emittedSprites.forEach(sprite => {
            this.enemies.forEach(enemy => {
                if (Phaser.Geom.Intersects.RectangleToRectangle(sprite.getBounds(), enemy.getBounds())) {
                    // Handle laser collision with enemy (e.g., delete enemy)
                    this.destroyEnemy(enemy);
                    sprite.destroy();
                    this.emittedSprites.splice(this.emittedSprites.indexOf(sprite), 1);
                }
            });
        });
    
        // Check if all enemies are destroyed or off the screen to start the next wave
        if (this.enemies.length === 0 || this.enemies.every(enemy => enemy.x < 0)) {
            if (this.waveNumber < this.maxWaves) {
                this.startNextWave();
            } else {
                this.startBossFight();
            }
        }
    }
    
    
    shootLaser() {
        // Create the laser sprite
        let laser = this.add.sprite(this.player.x, this.player.y, 'emittedSprite');
        laser.setRotation(Phaser.Math.DegToRad(90));
        laser.setOrigin(0.5, 0.5); // Set origin to center
        this.emittedSprites.push(laser);
        this.explosionSound.play();
    }

    enemyShootLaser(x, y) {
        // Create enemy laser sprite
        let enemyLaser = this.add.sprite(x, y, 'enemyLaser'); // Use x and y passed as parameters
        enemyLaser.setRotation(Phaser.Math.DegToRad(-90)); // Adjust rotation if needed
        enemyLaser.setOrigin(0.5, 0.5); // Set origin to center
        this.enemyLasers.push(enemyLaser);
        // Set a fixed speed for the enemy laser
        const enemyBulletSpeed = 6; // Adjust this value as needed
        enemyLaser.setData('speed', enemyBulletSpeed); // Store speed data
    }    
    

    createEnemies() {
        // Increment wave number
        this.waveNumber++;
        // Create enemies at random positions on the right side of the screen
        for (let i = 0; i < 5 + this.waveNumber; i++) { // Increase enemy count with each wave
            let enemy;
            if (i % 2 === 0) {
                enemy = this.add.sprite(Math.random() * (this.game.config.width - 100) + this.game.config.width - 100, Math.random() * this.game.config.height, 'enemy');
            } else {
                enemy = this.add.sprite(Math.random() * (this.game.config.width - 100) + this.game.config.width - 100, Math.random() * this.game.config.height, 'enemy2');
            }
            enemy.setOrigin(0.5, 0.5); // Set origin to center
            enemy.setRotation(Phaser.Math.DegToRad(-90));
            this.enemies.push(enemy);
        }
        this.enemySpeed += this.waveNumber * 0.5; // Increase enemy speed by wave number
    }

    createEnergyCollections() {
        // Create energy collections at random positions on the screen
        for (let i = 0; i < 3; i++) {
            let collection = this.add.sprite(Math.random() * (this.game.config.width - 100), Math.random() * (this.game.config.height - 100), 'energyCollection');
            collection.setOrigin(0.5, 0.5); // Set origin to center
            this.energyCollections.push(collection);
        }
    }

    collectEnergy(collection) {
        // Handle player collision with energy collection (e.g., increase score)
        this.score += 10;
        this.scoreText.setText('Score: ' + this.score);
        collection.destroy();
        this.energyCollections.splice(this.energyCollections.indexOf(collection), 1);
    }

    destroyEnemy(enemy) {
        // Handle laser collision with enemy (e.g., delete enemy)
        enemy.destroy();
        this.enemies.splice(this.enemies.indexOf(enemy), 1);
    }

    gameOver() {
        console.log('Game Over');
        this.add.text(200, 200, 'Game Over', { fontFamily: 'Arial', fontSize: 48, color: '#ffffff' });
        
        // Resume the scene before creating the restart button
        this.createRestartButton();
        this.scene.pause();
        this.scene.resume()
        
    }
    

    startNextWave() {
        // Clear existing wave completion text
        this.children.list.forEach(child => {
            if (child.text === 'Wave ' + this.waveNumber + ' Complete') {
                child.destroy();
            }
        });
        // Create new wave of enemies if maximum waves not reached
        if (this.waveNumber < this.maxWaves) {
            this.createEnemies();
        } else {
            // Display game completion message
            this.add.text(200, 200, 'Wave ' + this.waveNumber + ' Complete', { fontFamily: 'Arial', fontSize: 48, color: '#ffffff' });
        }
    }

    startBossFight() {
        // For example, spawn a boss enemy with more health and different behavior
        // Once the boss is defeated, display "You Win" message and create restart button
        this.add.text(200, 250, 'You Win!', { fontFamily: 'Arial', fontSize: 48, color: '#ffffff' });
        this.createRestartButton();
    }

    createRestartButton() {
        // Create restart button
        this.scene.resume();
        const restartButton = this.add.text(200, 300, 'Restart', { fontFamily: 'Arial', fontSize: 48, color: '#ffffff' });
        restartButton.setInteractive(); // Make the text interactive
        restartButton.on('pointerdown', () => {
            // Reset game properties
            this.playerSpeed = this.initialPlayerSpeed;
            this.enemySpeed = this.initialEnemySpeed;
            this.emittedSpriteSpeed = this.initialEmittedSpriteSpeed;
            this.score = 0;
            this.waveNumber = 0;
            this.lives = 3;

            // Clear arrays
            this.emittedSprites.forEach(sprite => sprite.destroy());
            this.enemies.forEach(enemy => enemy.destroy());
            this.enemyLasers.forEach(laser => laser.destroy());
            this.energyCollections.forEach(collection => collection.destroy());

            this.emittedSprites = [];
            this.enemies = [];
            this.enemyLasers = [];
            this.energyCollections = [];

            // Restart the scene
    
            this.scene.restart();
        });
    }
}
