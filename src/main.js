"use strict"

// game config
// Configure the game
const config = {
    
    type: Phaser.AUTO,
    width: 800,
    height: 600,
    
    scene: SpaceShooterScene,
    physics: {
        default: 'arcade',
        arcade: {
            gravity: { y: 0 },
            debug: true 
        }
    }
    

};
const game = new Phaser.Game(config); 

