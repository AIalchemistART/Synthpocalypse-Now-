// bullet_origin_fix.js - Handles the correct positioning of bullets from the enemy gun barrel
// This tracks the gun barrel position through enemy movements and crouching

(function() {
    // Configuration for bullet origin tracking
    const bulletOriginConfig = {
        offsetX: -11.5,      // Horizontal offset from enemy center to gun barrel tip (moved -2 units)
        offsetY: 7.5,        // Vertical offset from enemy center to gun barrel when standing (unchanged)
        crouchOffsetY: -4.5, // Additional vertical offset when crouching (moved down another 1 unit)
        debugMode: false,    // Set to true to visualize the bullet origin point
        shotCooldown: 1000,  // Cooldown time in ms between high/low shot transitions
    };

    // State tracking for the bullet origin
    let bulletOriginState = {
        originMarker: null,         // Visual marker for debugging
        lastKnownPosition: new THREE.Vector3(), // Last calculated position
        lastShotHeight: null,       // Track the height of the last shot (high or low)
        lastShotTime: 0,            // Timestamp of the last shot
        highThreshold: 4            // Y value above which a shot is considered "high"
    };

    // Initialize the bullet origin tracking system
    function initBulletOriginTracking() {
        console.log("Bullet origin tracking system initialized");
        
        // If debug mode is enabled, create a visual marker for the bullet origin
        if (bulletOriginConfig.debugMode && typeof THREE !== 'undefined') {
            // Create a small sphere to visualize the bullet origin point
            const markerGeometry = new THREE.SphereGeometry(0.5, 8, 8);
            const markerMaterial = new THREE.MeshBasicMaterial({ 
                color: 0x00ff00,
                transparent: true,
                opacity: 0.7
            });
            bulletOriginState.originMarker = new THREE.Mesh(markerGeometry, markerMaterial);
            
            // Add to scene if available
            if (typeof scene !== 'undefined') {
                scene.add(bulletOriginState.originMarker);
                console.log("Bullet origin debug marker added to scene");
            }
        }
    }

    // Update the bullet origin position based on enemy state
    function updateBulletOriginPosition() {
        // Safety checks
        if (typeof enemy === 'undefined' || enemy === null) {
            return bulletOriginState.lastKnownPosition;
        }
        
        // Base position starts at the enemy's position
        const originPosition = new THREE.Vector3().copy(enemy.position);
        
        // Add the default offsets for the gun barrel
        originPosition.x += bulletOriginConfig.offsetX;
        originPosition.y += bulletOriginConfig.offsetY;
        
        // Check if enemy movement module is available to get crouch state
        if (typeof EnemyMovement !== 'undefined' && EnemyMovement.state) {
            // Adjust Y position based on crouching state
            if (EnemyMovement.state.isCrouching) {
                originPosition.y += bulletOriginConfig.crouchOffsetY;
            }
            
            // If the weapon reference is available, use its world position for more accuracy
            const weapon = EnemyMovement.state.bodyParts.weapon;
            if (weapon) {
                // Create a vector to hold world position
                const weaponWorldPos = new THREE.Vector3();
                
                // Get the world position of the weapon barrel tip
                weapon.getWorldPosition(weaponWorldPos);
                
                // Adjust x position to account for the weapon tip
                originPosition.x = weaponWorldPos.x - 9.0; // Offset to the tip of the barrel (moved -2 units)
                originPosition.y = weaponWorldPos.y + 4.0; // Add 4 units to Y for standing position (moved up 1 unit)
                
                // Apply additional offset when crouching
                if (EnemyMovement.state.isCrouching) {
                    originPosition.y -= 3.0; // Additional downward adjustment when crouched (increased to match config)
                }
            }
        }
        
        // Update debug marker if available
        if (bulletOriginState.originMarker) {
            bulletOriginState.originMarker.position.copy(originPosition);
        }
        
        // Save and return the calculated position
        bulletOriginState.lastKnownPosition.copy(originPosition);
        return bulletOriginState.lastKnownPosition;
    }

    // Get the current bullet origin position (for external use)
    function getBulletOriginPosition() {
        return updateBulletOriginPosition();
    }

    // Determine if a shot at the given height is allowed based on cooldown
    function canFireAtHeight(height) {
        const currentTime = Date.now();
        const isHighShot = height >= bulletOriginState.highThreshold;
        
        // First shot is always allowed
        if (bulletOriginState.lastShotHeight === null) {
            bulletOriginState.lastShotHeight = isHighShot;
            bulletOriginState.lastShotTime = currentTime;
            return true;
        }
        
        // Check if we're trying to switch from high to low or low to high
        const wasHighShot = bulletOriginState.lastShotHeight;
        
        // If same height category as before, allow it
        if (isHighShot === wasHighShot) {
            bulletOriginState.lastShotTime = currentTime;
            return true;
        }
        
        // Different height than before, check cooldown
        const timeSinceLastShot = currentTime - bulletOriginState.lastShotTime;
        if (timeSinceLastShot >= bulletOriginConfig.shotCooldown) {
            // Cooldown elapsed, allow the shot
            bulletOriginState.lastShotHeight = isHighShot;
            bulletOriginState.lastShotTime = currentTime;
            console.log(`Shot height changed from ${wasHighShot ? 'high' : 'low'} to ${isHighShot ? 'high' : 'low'} after ${timeSinceLastShot}ms`);
            return true;
        }
        
        // Cooldown not elapsed, don't allow height change
        console.log(`Shot height change from ${wasHighShot ? 'high' : 'low'} to ${isHighShot ? 'high' : 'low'} blocked (cooldown: ${timeSinceLastShot}/${bulletOriginConfig.shotCooldown}ms)`);
        return false;
    }

    // Override the bullet firing functions to use the correct origin
    function applyBulletOriginPatches() {
        console.log("Applying bullet origin position patches");
        
        // Store references to original functions
        const originalFireHorizontalLaneBullet = window.fireHorizontalLaneBullet;
        
        // Safety check
        if (!originalFireHorizontalLaneBullet) {
            console.warn("Original fireHorizontalLaneBullet function not found, waiting...");
            setTimeout(applyBulletOriginPatches, 1000);
            return;
        }
        
        // Override horizontal lane bullet firing
        window.fireHorizontalLaneBullet = function() {
            // Get the current bullet origin position
            const originPos = getBulletOriginPosition();
            let height = horizontalLaneY[Math.floor(Math.random() * horizontalLaneY.length)];
            
            // Adjust Y position if the origin is different from the default enemy height
            height = height + (originPos.y - 2.5);
            
            // Check if the shot is allowed based on cooldown
            if (!canFireAtHeight(height)) {
                return;
            }
            
            // Create bullet from the calculated origin position
            let bullet = new Bullet(originPos.x, height, 0);
            
            // Original logic for first level bullets
            if (currentLevel === 0) {
                bullet.mesh.scale.set(1.2, 1.2, 1.2);
                bullet.material.emissiveIntensity = 0.7;
            }
            
            // Add debug logging
            console.log("Firing horizontal bullet from gun barrel at position:", 
                        originPos.x, height, 0);
            
            // Override the update method for leftward movement
            bullet.update = function() { 
                this.mesh.position.x -= 0.4;
                
                // Update trail position
                this.trailMesh.position.copy(this.mesh.position);
                this.trailMesh.position.x += 3.0;
            };
            
            // Rotate the trail to point along the X axis
            bullet.trailMesh.rotation.x = 0;
            bullet.trailMesh.rotation.z = Math.PI / 2;
            
            bullets.push(bullet);
        };
        
        // Check if other bullet firing functions exist and patch them too
        if (window.fireVerticalLaneBullet) {
            const originalFireVerticalLaneBullet = window.fireVerticalLaneBullet;
            
            window.fireVerticalLaneBullet = function() {
                // Get the current bullet origin position
                const originPos = getBulletOriginPosition();
                
                // Use original function's logic but with new origin position
                let bullet = new Bullet(originPos.x, originPos.y, 0);
                
                // Rest of the original function's logic
                bullet.update = function() {
                    this.mesh.position.z += 0.4;
                    
                    this.trailMesh.position.copy(this.mesh.position);
                    this.trailMesh.position.z -= 3.0;
                };
                
                bullets.push(bullet);
            };
        }
        
        // Patch spawnTestBullet if it exists
        if (window.spawnTestBullet) {
            const originalSpawnTestBullet = window.spawnTestBullet;
            
            window.spawnTestBullet = function() {
                // Get the current bullet origin position
                const originPos = getBulletOriginPosition();
                
                // Create bullet at the origin position
                const bullet = new Bullet(originPos.x, originPos.y, 0);
                
                // Rest of original function logic
                bullet.update = function() {
                    this.mesh.position.x -= 0.4;
                    
                    this.trailMesh.position.copy(this.mesh.position);
                    this.trailMesh.position.x += 3.0;
                };
                
                bullet.trailMesh.rotation.x = 0;
                bullet.trailMesh.rotation.z = Math.PI / 2;
                
                bullets.push(bullet);
            };
        }
        
        console.log("Bullet origin position patches applied successfully");
    }

    // Export functions to be used in the main game
    window.BulletOrigin = {
        init: initBulletOriginTracking,
        update: updateBulletOriginPosition,
        getPosition: getBulletOriginPosition,
        applyPatches: applyBulletOriginPatches,
        config: bulletOriginConfig,
        canFireAtHeight: canFireAtHeight
    };
    
    // Auto-initialize after a short delay to ensure the game is loaded
    setTimeout(function() {
        initBulletOriginTracking();
        applyBulletOriginPatches();
    }, 2000);
})();
