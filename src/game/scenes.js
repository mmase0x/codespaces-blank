const scenes = {
    currentScene: null,
    scenes: {},

    addScene(name, scene) {
        this.scenes[name] = scene;
    },

    switchToScene(name) {
        if (this.scenes[name]) {
            if (this.currentScene && this.currentScene.exit) {
                this.currentScene.exit();
            }
            this.currentScene = this.scenes[name];
            if (this.currentScene && this.currentScene.enter) {
                this.currentScene.enter();
            }
        } else {
            console.error(`Scene "${name}" does not exist.`);
        }
    },

    update(deltaTime) {
        if (this.currentScene && this.currentScene.update) {
            this.currentScene.update(deltaTime);
        }
    }
};

// Example scenes
const menuScene = {
    enter() {
        console.log("Entering Menu Scene");
        // Initialize menu scene
    },
    exit() {
        console.log("Exiting Menu Scene");
        // Cleanup menu scene
    },
    update(deltaTime) {
        // Update menu scene logic
    }
};

const playScene = {
    enter() {
        console.log("Entering Play Scene");
        // Initialize play scene
    },
    exit() {
        console.log("Exiting Play Scene");
        // Cleanup play scene
    },
    update(deltaTime) {
        // Update play scene logic
    }
};

const gameOverScene = {
    enter() {
        console.log("Entering Game Over Scene");
        // Initialize game over scene
    },
    exit() {
        console.log("Exiting Game Over Scene");
        // Cleanup game over scene
    },
    update(deltaTime) {
        // Update game over scene logic
    }
};

// Add scenes to the manager
scenes.addScene('menu', menuScene);
scenes.addScene('play', playScene);
scenes.addScene('gameOver', gameOverScene);

// Export the scenes manager
export default scenes;