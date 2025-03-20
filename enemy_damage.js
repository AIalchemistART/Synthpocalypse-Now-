// enemy_damage.js - Handles enemy health, damage, and health bar display
// This file contains the logic for damaging enemies based on completed lines

// Using an IIFE to encapsulate our code and prevent global namespace pollution
(function() {
    // Configuration for enemy health
    const enemyHealthConfig = {
        maxHealth: 1000,                            // Maximum health
        damagePerLineBase: 29,                      // Base damage per line (1000/35)
        healthBarColor: '#ff3333'                   // Default health bar color
    };

    // State variables for enemy health
    const enemyState = {
        currentHealth: 1000,                        // Current health (initialized to max)
        totalDamageDealt: 0,                        // Total damage dealt so far
        linesCompleted: 0,                          // Number of lyric lines completed
        lineCount: 35,                              // Expected number of lines in the song
        isDefeated: false,                          // Whether enemy is defeated
    };

    // DOM elements (now referring to static HTML elements)
    let healthBarContainer = null;
    let healthBarFill = null;
    let healthText = null;

    // Initialize enemy damage system
    function initEnemyDamage() {
        console.log("Initializing enemy damage system");
        
        // Reset enemy state
        enemyState.currentHealth = enemyHealthConfig.maxHealth;
        enemyState.totalDamageDealt = 0;
        enemyState.linesCompleted = 0;
        enemyState.isDefeated = false;
        
        // Get references to the static HTML elements
        healthBarFill = document.getElementById('static-enemy-health-fill');
        healthText = document.getElementById('static-enemy-health-value');
        healthBarContainer = document.getElementById('static-enemy-health-container');
        
        // Update UI with initial values
        if (healthText) {
            healthText.textContent = enemyState.currentHealth;
        }
        
        console.log("Enemy damage system initialized with static HTML elements");
    }

    // Update health bar display
    function updateHealthBar() {
        if (!healthBarFill || !healthText) {
            console.warn("Health bar elements not found, trying to get references again");
            healthBarFill = document.getElementById('static-enemy-health-fill');
            healthText = document.getElementById('static-enemy-health-value');
            if (!healthBarFill || !healthText) {
                console.error("Could not find health bar elements!");
                return;
            }
        }
        
        // Calculate health percentage
        const healthPercent = (enemyState.currentHealth / enemyHealthConfig.maxHealth) * 100;
        console.log(`Updating health bar: health = ${enemyState.currentHealth}, percentage = ${healthPercent}%`);
        
        // Update health bar fill width
        healthBarFill.style.width = healthPercent + '%';
        
        // Change color based on health remaining
        if (healthPercent <= 20) {
            healthBarFill.style.backgroundColor = '#ff0000'; 
            healthBarFill.style.boxShadow = '0 0 10px rgba(255, 0, 0, 0.8)';
        } else if (healthPercent <= 50) {
            healthBarFill.style.backgroundColor = '#ff6600'; 
        } else {
            healthBarFill.style.backgroundColor = enemyHealthConfig.healthBarColor; 
        }
        
        // Update health text
        healthText.textContent = Math.floor(enemyState.currentHealth);
    }

    // Apply damage based on completed line
    function applyDamage(lineText, isSuccessful, currentLyricText = "") {
        console.log("applyDamage called with:", { isSuccessful, currentHealth: enemyState.currentHealth });
        
        // Skip if enemy already defeated
        if (enemyState.isDefeated) {
            console.log("Enemy already defeated, no damage applied");
            return { damage: 0 };
        }
        
        // Skip damage if not successful
        if (!isSuccessful) {
            console.log("Attack not successful, no damage applied");
            return { damage: 0 };
        }
        
        // Increment lines completed
        enemyState.linesCompleted++;
        
        // Apply FIXED damage per line (exactly 1000 / 35 = ~29 per line)
        let damageAmount = enemyHealthConfig.damagePerLineBase;
        
        console.log(`Before damage: enemy health = ${enemyState.currentHealth}, damage amount = ${damageAmount}`);
        
        // Check if this is the final line (35th line)
        const isFinalLine = (enemyState.linesCompleted >= 35);
        
        // If final line, ensure it deals enough damage to defeat enemy
        if (isFinalLine) {
            damageAmount = Math.max(damageAmount, enemyState.currentHealth);
        }
        
        // Apply damage to enemy - ENSURE WE'RE ACTUALLY SUBTRACTING
        const oldHealth = enemyState.currentHealth;
        enemyState.currentHealth = Math.max(0, enemyState.currentHealth - damageAmount);
        enemyState.totalDamageDealt += damageAmount;
        
        console.log(`After damage: old health = ${oldHealth}, new health = ${enemyState.currentHealth}, total damage = ${enemyState.totalDamageDealt}`);
        
        // Check if enemy is defeated
        if (enemyState.currentHealth <= 0) {
            enemyState.isDefeated = true;
            enemyState.currentHealth = 0;
            onEnemyDefeated();
        }
        
        // Show damage number
        showDamageNumber(damageAmount);
        
        // Trigger muzzle flash effect if window.MuzzleFlash exists
        if (window.MuzzleFlash && typeof window.MuzzleFlash.triggerFlash === 'function') {
            window.MuzzleFlash.triggerFlash();
        }
        
        // Update health bar AFTER applying damage
        updateHealthBar();
        
        // Return damage info for other components
        return {
            damage: damageAmount,
            remainingHealth: enemyState.currentHealth,
            isFinalLine: isFinalLine,
            isDefeated: enemyState.isDefeated
        };
    }

    // Set current track info to calculate line distribution
    function setCurrentTrack(lrcData) {
        if (!lrcData || !lrcData.lyrics || lrcData.lyrics.length === 0) {
            console.warn("Invalid LRC data provided to setCurrentTrack");
            return;
        }
        
        // Count the number of lines with actual text content (excluding timestamps without lyrics)
        let lineCount = 0;
        for (const lyric of lrcData.lyrics) {
            if (lyric.text && lyric.text.trim() !== "") {
                lineCount++;
            }
        }
        
        enemyState.lineCount = lineCount;
        enemyState.linesCompleted = 0;
        
        console.log(`Track set with ${enemyState.lineCount} lines for damage calculation`);
    }

    // Show damage number floating upward
    function showDamageNumber(damage) {
        // Round to integer and format with commas
        const formattedDamage = Math.round(damage).toLocaleString();
        
        // Create damage number element
        const damageNumber = document.createElement('div');
        damageNumber.style.position = 'absolute';
        
        // Position above health bar
        const healthBarRect = healthBarContainer.getBoundingClientRect();
        damageNumber.style.right = (20 + Math.random() * 50) + 'px';
        damageNumber.style.top = (healthBarRect.top - 30 + Math.random() * 20) + 'px';
        
        damageNumber.style.color = '#ff6600'; // Orange color for damage numbers
        damageNumber.style.fontFamily = "'Orbitron', sans-serif";
        damageNumber.style.fontSize = '22px';
        damageNumber.style.fontWeight = 'bold';
        damageNumber.style.textShadow = '0 0 5px #ff0000, 0 0 10px #ff0000';
        damageNumber.style.zIndex = '10000';
        damageNumber.textContent = '-' + formattedDamage;
        
        // Add to DOM
        document.body.appendChild(damageNumber);
        
        // Animate upward and fade out
        damageNumber.animate([
            { transform: 'translateY(0)', opacity: 1 },
            { transform: 'translateY(-40px)', opacity: 0 }
        ], {
            duration: 1200,
            easing: 'ease-out'
        });
        
        // Remove from DOM after animation completes
        setTimeout(() => {
            document.body.removeChild(damageNumber);
        }, 1200);
    }

    // Handle enemy defeated
    function onEnemyDefeated() {
        console.log("Enemy defeated!");
        
        // Trigger visual effects for defeated enemy
        // This could flash the enemy red, make them fade out, etc.
        // For now, just add a class to the enemy to trigger CSS animations
        
        // Get the enemy object from the scene (assuming it has a specific ID or class)
        // Add a defeated animation...
        
        // Can be connected to other game systems later
    }

    // Reset enemy damage system (for new levels or when restarting)
    function resetEnemyDamageSystem() {
        // Reset health and counters
        enemyState.currentHealth = enemyHealthConfig.maxHealth;
        enemyState.totalDamageDealt = 0;
        enemyState.linesCompleted = 0;
        enemyState.isDefeated = false;
        
        // Update health bar
        updateHealthBar();
        
        console.log("Enemy damage system reset");
    }

    // Get enemy state for other systems
    function getEnemyState() {
        return {
            currentHealth: enemyState.currentHealth,
            maxHealth: enemyHealthConfig.maxHealth,
            healthPercent: (enemyState.currentHealth / enemyHealthConfig.maxHealth) * 100,
            totalDamageDealt: enemyState.totalDamageDealt,
            linesCompleted: enemyState.linesCompleted,
            lineCount: enemyState.lineCount,
            isDefeated: enemyState.isDefeated
        };
    }

    // Helper function to get the Y position of the health bar
    function getHealthBarYPosition() {
        const windowHeight = window.innerHeight;
        // Position health bar at 65% from top (just above horizon line)
        const targetPosition = Math.round(windowHeight * 0.65);
        
        console.log(`Health bar positioning: Window height: ${windowHeight}px, Target Y position: ${targetPosition}px`);
        
        return targetPosition;
    }

    // Show the health bar UI with a fade-in effect
    function showUI() {
        if (!healthBarContainer) {
            healthBarContainer = document.getElementById('static-enemy-health-container');
            if (!healthBarContainer) {
                console.error("Could not find health bar container!");
                return;
            }
        }
        
        // First ensure it's visible by setting display to block
        healthBarContainer.style.display = 'block';
        
        // Then trigger the fade-in by setting opacity to 1
        // Using setTimeout to ensure the display change is processed first
        setTimeout(() => {
            healthBarContainer.style.opacity = '1';
        }, 50);
        
        console.log("Health bar UI shown with fade-in");
    }
    
    // Hide the health bar UI
    function hideUI() {
        if (!healthBarContainer) {
            healthBarContainer = document.getElementById('static-enemy-health-container');
            if (!healthBarContainer) {
                console.error("Could not find health bar container!");
                return;
            }
        }
        
        // Fade out
        healthBarContainer.style.opacity = '0';
        
        // After animation completes, set display to none
        setTimeout(() => {
            healthBarContainer.style.display = 'none';
        }, 500); // Match the transition duration
        
        console.log("Health bar UI hidden with fade-out");
    }

    // Export functions to be used in the main game
    window.EnemyDamage = {
        init: initEnemyDamage,
        applyDamage: applyDamage,
        setCurrentTrack: setCurrentTrack,
        resetSystem: resetEnemyDamageSystem,
        getState: getEnemyState,
        showUI: showUI,
        hideUI: hideUI
    };
})();
