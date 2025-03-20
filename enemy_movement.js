// enemy_movement.js - Handles enemy movement and behavior
// This file contains the logic for enemy movement in SynthBoarders

// Using an IIFE to encapsulate our code and prevent global namespace pollution
(function() {
    // Configuration for enemy movement with fixed boundaries matching the game's coordinate system
    const enemyConfig = {
        moveSpeed: 0.15,           // Reduced by 50% from 0.3 to improve gameplay
        minX: 10,                 // Minimum X position (left boundary, matching game's coordinate system)
        maxX: 40,                 // Maximum X position (right boundary, matching game's coordinate system)
        initialPosition: 30,      // Initial X position (within visible area)
        initialPositionY: 2.5,    // Initial Y position (0.5 units higher than default of 2)
        crouchProbability: 0.005, // Probability of initiating a crouch per frame
        crouchDuration: 60,       // How long to stay crouched (in frames)
        crouchAmount: 10,         // Total vertical travel for head (based on learnings)
        crouchScale: 1.4,         // Y-scale factor to apply when crouching (compresses model)
        crouchPositionY: -1.5,    // Y-position adjustment to keep feet grounded (-1.5 units)
        changeDirectionChance: 0.002, // Chance to randomly change direction
        pauseChance: 0.002,       // Chance to pause movement
        pauseDuration: 60,        // How long to pause (in frames)
    };

    // State variables
    let enemyState = {
        direction: -1,            // -1 = left, 1 = right
        isCrouching: false,       // Whether enemy is currently crouched
        crouchTimer: 0,           // Timer for crouching animation
        isPaused: false,          // Whether enemy is paused
        pauseTimer: 0,            // Timer for pause duration
        originalScale: 1,         // Original Y scale of the enemy model
        originalY: 0,             // Original Y position of the entire enemy model
        bodyParts: {              // Store references to body parts
            head: null,
            body: null,
            weapon: null,
            legs: []
        }
    };

    // Debug helper function to log component structure
    function logEnemyComponents(enemy) {
        console.log("Enemy children count:", enemy.children.length);
        enemy.children.forEach((child, index) => {
            console.log(`Child ${index}:`, {
                type: child.type,
                geometry: child.geometry ? child.geometry.type : "No geometry",
                position: {x: child.position.x, y: child.position.y, z: child.position.z},
                isGroup: child instanceof THREE.Group
            });
        });
    }

    // Initialize enemy movement system
    function initEnemyMovement(enemy) {
        // Safety check
        if (!enemy) {
            console.warn("Enemy object not provided to initEnemyMovement");
            return;
        }

        console.log("Enemy movement boundaries:", enemyConfig.minX, enemyConfig.maxX);

        // Set initial Y position to match player model height
        enemy.position.y = enemyConfig.initialPositionY;
        
        // Store original model properties after setting the new base position
        enemyState.originalScale = enemy.scale.y;
        enemyState.originalY = enemy.position.y;
        console.log("Original enemy Y position:", enemyState.originalY);

        // Log the enemy structure for debugging
        logEnemyComponents(enemy);

        // Analyze all children to categorize parts
        let headCandidates = [];
        let bodyCandidates = [];
        let legCandidates = [];
        let weaponCandidates = [];

        // Categorize all children based on position
        enemy.children.forEach(child => {
            // Skip any non-mesh objects or groups
            if (!child.geometry || child instanceof THREE.Group) return;

            const position = child.position.y;
            
            // Categorize based on Y position
            if (position > 5) {
                headCandidates.push(child);
            } else if (position > 0) {
                // Check if it's likely a weapon part (usually extends to the side or front)
                if (Math.abs(child.position.x) > 3 || Math.abs(child.position.z) > 3) {
                    weaponCandidates.push(child);
                } else {
                    bodyCandidates.push(child);
                }
            } else if (position < 0) {
                legCandidates.push(child);
            }
        });

        // Sort candidates by Y position
        headCandidates.sort((a, b) => b.position.y - a.position.y);
        bodyCandidates.sort((a, b) => b.position.y - a.position.y);
        weaponCandidates.sort((a, b) => Math.abs(b.position.x) - Math.abs(a.position.x));

        // Store references to body parts
        if (headCandidates.length > 0) {
            enemyState.bodyParts.head = headCandidates[0];
            console.log("Found enemy head");
        }

        if (bodyCandidates.length > 0) {
            enemyState.bodyParts.body = bodyCandidates[0];
            console.log("Found enemy body");
        }

        if (weaponCandidates.length > 0) {
            enemyState.bodyParts.weapon = weaponCandidates[0];
            console.log("Found enemy weapon");
        }

        // Store references to legs
        legCandidates.forEach(leg => {
            enemyState.bodyParts.legs.push(leg);
        });
        console.log("Found", enemyState.bodyParts.legs.length, "legs");

        // Set initial X position
        enemy.position.x = enemyConfig.initialPosition;
        
        console.log("Enemy movement system initialized");
    }

    // Update enemy position and behavior
    function updateEnemyMovement(enemy, deltaTime) {
        // Safety check
        if (!enemy) {
            return;
        }

        // Maintain the base enemy Y position if not crouching
        if (!enemyState.isCrouching) {
            // This ensures the enemy stays at the adjusted base height
            // and prevents other animation code from changing it
            enemy.position.y = enemyConfig.initialPositionY;
            
            // Make sure we update originalY in case it changed
            enemyState.originalY = enemyConfig.initialPositionY;
        }
        
        // Handle crouching first - this ensures the Y position adjustment is maintained throughout
        handleCrouching(enemy);

        // Check if enemy is paused
        if (enemyState.isPaused) {
            enemyState.pauseTimer--;
            if (enemyState.pauseTimer <= 0) {
                enemyState.isPaused = false;
                console.log("Enemy resumed movement");
            }
            // Skip horizontal movement while paused
            return;
        }

        // Random chance to pause
        if (Math.random() < enemyConfig.pauseChance) {
            enemyState.isPaused = true;
            enemyState.pauseTimer = enemyConfig.pauseDuration;
            console.log("Enemy paused");
            return;
        }

        // Random chance to change direction (makes movement seem more natural)
        if (Math.random() < enemyConfig.changeDirectionChance) {
            enemyState.direction *= -1;
            console.log("Enemy changed direction to:", enemyState.direction === -1 ? "left" : "right");
        }

        // Handle movement
        if (enemyState.direction === -1) {
            // Moving left (toward player)
            enemy.position.x -= enemyConfig.moveSpeed;
            
            // Check boundary
            if (enemy.position.x <= enemyConfig.minX) {
                enemy.position.x = enemyConfig.minX;
                enemyState.direction = 1; // Reverse direction at boundary
                console.log("Enemy reached left boundary, turning around");
            }
        } else {
            // Moving right (away from player)
            enemy.position.x += enemyConfig.moveSpeed;
            
            // Check boundary
            if (enemy.position.x >= enemyConfig.maxX) {
                enemy.position.x = enemyConfig.maxX;
                enemyState.direction = -1; // Reverse direction at boundary
                console.log("Enemy reached right boundary, turning around");
            }
        }
    }

    // Handle enemy crouching behavior
    function handleCrouching(enemy) {
        // Random crouching behavior - only initiate if not already crouching
        if (!enemyState.isCrouching && Math.random() < enemyConfig.crouchProbability) {
            startCrouching(enemy);
        }
        
        // If we're crouching, make sure to maintain the position/scale throughout the crouch duration
        if (enemyState.isCrouching) {
            // Ensure the position adjustment persists for the entire crouch duration
            maintainCrouchState(enemy);
            
            // Decrement the timer
            enemyState.crouchTimer--;
            if (enemyState.crouchTimer <= 0) {
                stopCrouching(enemy);
            }
        }
    }

    // Maintain the crouch state consistently throughout the animation
    function maintainCrouchState(enemy) {
        // Ensure scale and position stay at crouch values
        enemy.scale.y = enemyState.originalScale / enemyConfig.crouchScale;
        
        // Important: Make sure the Y position adjustment is relative to our base position
        // This should evaluate to 2.5 + (-1.5) = 1 when crouching
        const crouchYPosition = enemyConfig.initialPositionY + enemyConfig.crouchPositionY;
        enemy.position.y = crouchYPosition;
        
        console.log("Maintaining crouch at Y position:", crouchYPosition);
        
        // Double-check that head, body, and weapon maintain their adjusted positions
        const head = enemyState.bodyParts.head;
        const body = enemyState.bodyParts.body;
        const weapon = enemyState.bodyParts.weapon;
        
        if (head && head.userData.originalY) {
            head.position.y = head.userData.originalY - enemyConfig.crouchAmount;
        }
        
        if (body && body.userData.originalY) {
            body.position.y = body.userData.originalY - (enemyConfig.crouchAmount * 0.8);
        }
        
        if (weapon && weapon.userData.originalY) {
            weapon.position.y = weapon.userData.originalY - (enemyConfig.crouchAmount * 0.8);
        }
    }

    // Start enemy crouching animation using the improved approach
    function startCrouching(enemy) {
        enemyState.isCrouching = true;
        enemyState.crouchTimer = enemyConfig.crouchDuration;
        
        // Calculate the expected crouch position
        const crouchYPosition = enemyConfig.initialPositionY + enemyConfig.crouchPositionY;
        console.log("Starting enemy crouch. Base position:", enemyConfig.initialPositionY, "Crouch position:", crouchYPosition);
        
        // Store original positions for all body parts if not already stored
        const head = enemyState.bodyParts.head;
        const body = enemyState.bodyParts.body;
        const weapon = enemyState.bodyParts.weapon;
        
        // Store head original position
        if (head && !head.userData.originalY) {
            head.userData.originalY = head.position.y;
        }
        
        // Store body original position
        if (body && !body.userData.originalY) {
            body.userData.originalY = body.position.y;
        }
        
        // Store weapon original position
        if (weapon && !weapon.userData.originalY) {
            weapon.userData.originalY = weapon.position.y;
        }
        
        // Apply the crouch state immediately
        maintainCrouchState(enemy);
        
        console.log("Enemy crouching with improved animation");
    }

    // Stop enemy crouching animation using the improved approach
    function stopCrouching(enemy) {
        enemyState.isCrouching = false;
        
        console.log("Stopping enemy crouch. Restoring Y to:", enemyConfig.initialPositionY);
        
        // 1. Restore model-wide transformations
        enemy.scale.y = enemyState.originalScale;
        enemy.position.y = enemyConfig.initialPositionY;
        
        // 2. Restore body parts to original positions
        const head = enemyState.bodyParts.head;
        const body = enemyState.bodyParts.body;
        const weapon = enemyState.bodyParts.weapon;
        
        // Restore head position
        if (head && head.userData.originalY !== undefined) {
            head.position.y = head.userData.originalY;
        }
        
        // Restore body position
        if (body && body.userData.originalY !== undefined) {
            body.position.y = body.userData.originalY;
        }
        
        // Restore weapon position
        if (weapon && weapon.userData.originalY !== undefined) {
            weapon.position.y = weapon.userData.originalY;
        }
        
        console.log("Enemy stopped crouching");
    }

    // Change enemy position for game events
    function setEnemyPosition(xPosition) {
        enemyConfig.initialPosition = xPosition;
    }

    // Export all functions to be used in the main game
    window.EnemyMovement = {
        init: initEnemyMovement,
        update: updateEnemyMovement,
        setPosition: setEnemyPosition,
        config: enemyConfig,
        state: enemyState
    };
})();
