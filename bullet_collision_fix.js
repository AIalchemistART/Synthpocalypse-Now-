// This file contains fixes for the bullet collision effects in SynthBoarders
// Include this script in your index.html to apply the fixes

// Wait for DOM to be ready
document.addEventListener('DOMContentLoaded', function() {
    console.log("Bullet collision fix script loaded");
    
    // Create a milder shake screen function
    window.mildShakeScreen = function() {
        // Get overlay element with null check
        const overlay = document.getElementById('overlay');
        if (!overlay) return;
        
        // Apply mild shake using direct style manipulation
        overlay.style.transform = 'translate(2px, 2px)';
        
        // Quick reset sequence for mild shake effect
        setTimeout(() => { overlay.style.transform = 'translate(-2px, -1px)'; }, 25);
        setTimeout(() => { overlay.style.transform = 'translate(1px, -1px)'; }, 50);
        setTimeout(() => { overlay.style.transform = 'translate(-1px, 0px)'; }, 75);
        setTimeout(() => { overlay.style.transform = ''; }, 100); // Back to normal
    };
    
    // Direct collision handler enhancement instead of modifying the animate loop
    window.enhanceBulletCollisions = function() {
        // Check if we've already patched the collision handling
        if (window._collisionsEnhanced) return;
        window._collisionsEnhanced = true;
        
        console.log("Enhancing bullet collision effects");
        
        // Create a patched bullet constructor that enhances collision effects
        const originalBullet = window.Bullet;
        if (!originalBullet) {
            console.log("Waiting for Bullet constructor to be available...");
            setTimeout(window.enhanceBulletCollisions, 1000);
            return;
        }
        
        // Replace the Bullet constructor with our enhanced version
        window.Bullet = function(x, y, z) {
            // Call the original constructor
            const bullet = new originalBullet(x, y, z);
            
            // Enhance the bullet's collision detection
            const originalUpdate = bullet.update;
            bullet.update = function() {
                // Call the original update method
                originalUpdate.call(this);
                
                // Add enhanced collision detection
                if (!window.character) return;
                
                let distance = this.mesh.position.distanceTo(window.character.position);
                let hitRadius = window.character.collisionRadius || 3.0;
                
                if (distance < hitRadius) {
                    // Only process collision once
                    if (this._collided) return;
                    this._collided = true;
                    
                    console.log("Enhanced collision detected");
                    
                    // Use mild shake for better effect
                    window.mildShakeScreen();
                    
                    // Use vignette-overlay with null check
                    const vignetteOverlay = document.getElementById('vignette-overlay');
                    if (vignetteOverlay) {
                        vignetteOverlay.style.opacity = '0.08'; // Milder effect
                        setTimeout(() => {
                            vignetteOverlay.style.opacity = '0';
                        }, 100);
                    }
                    
                    // Flash character if possible
                    if (window.character.children && window.character.children.length > 0) {
                        // Assume the body is the first child
                        const bodyMesh = window.character.children[0];
                        if (bodyMesh && bodyMesh.material) {
                            console.log("Flashing character body");
                            const originalColor = bodyMesh.material.color.clone();
                            bodyMesh.material.color.set(0xff0000); // Flash red
                            
                            setTimeout(() => {
                                bodyMesh.material.color.copy(originalColor);
                            }, 100);
                        }
                    }
                    
                    // Update debug info
                    const debugInfoElement = document.getElementById('debug-info');
                    if (debugInfoElement) {
                        debugInfoElement.textContent = "Debug: Player Hit!";
                        debugInfoElement.style.color = '#ff0000';
                        
                        setTimeout(() => {
                            debugInfoElement.textContent = "Debug: Active";
                            debugInfoElement.style.color = '#00ff00';
                        }, 100);
                    }
                }
            };
            
            return bullet;
        };
        
        console.log("Bullet collision enhancements applied");
    };
    
    // Apply the enhancements after a short delay to ensure the game is initialized
    setTimeout(window.enhanceBulletCollisions, 2000);
});
