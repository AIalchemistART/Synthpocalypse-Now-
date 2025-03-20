// Muzzle Flash Animation System for SynthBoarders
// This system creates a bright flash effect on the player's weapon when damage is dealt

const MuzzleFlash = (function() {
    // References to game objects
    let weaponGlow = null;
    let scene = null;
    
    // Flash animation properties
    const flashDuration = 300; // milliseconds
    const flashIntensity = 3.0; // how bright the flash gets
    const flashColor = { r: 1, g: 0.8, b: 0.4 }; // yellow-orange flash color
    
    // Particles for muzzle flash effect
    let particles = [];
    const particleCount = 12;
    const particleLifetime = 500; // milliseconds
    
    // Saved original properties to restore after flash
    let originalColor = { r: 0, g: 1, b: 1 }; // Default cyan color
    let originalScale = { x: 1, y: 1, z: 1 };
    let isFlashing = false;
    
    // Initialize the muzzle flash system
    function init(characterScene, characterWeaponGlow) {
        scene = characterScene;
        weaponGlow = characterWeaponGlow;
        
        // Save original properties
        if (weaponGlow) {
            originalColor.r = weaponGlow.material.color.r;
            originalColor.g = weaponGlow.material.color.g;
            originalColor.b = weaponGlow.material.color.b;
            
            originalScale.x = weaponGlow.scale.x;
            originalScale.y = weaponGlow.scale.y;
            originalScale.z = weaponGlow.scale.z;
        }
    }
    
    // Trigger a muzzle flash animation
    function triggerFlash() {
        if (!weaponGlow || isFlashing) return;
        
        isFlashing = true;
        
        // 1. Weapon glow flash effect - make it bigger and brighter
        weaponGlow.material.color.setRGB(flashColor.r, flashColor.g, flashColor.b);
        weaponGlow.scale.set(
            originalScale.x * flashIntensity,
            originalScale.y * flashIntensity,
            originalScale.z * flashIntensity
        );
        
        // 2. Create particle effects for the muzzle flash
        createParticles();
        
        // 3. After flash duration, return to normal
        setTimeout(() => {
            resetFlash();
        }, flashDuration);
    }
    
    // Create particles for the muzzle flash effect
    function createParticles() {
        if (!scene || !weaponGlow) return;
        
        // Clean up any existing particles
        cleanupParticles();
        
        // Create new particles
        for (let i = 0; i < particleCount; i++) {
            // Create particle geometry (small sphere)
            const particleGeometry = new THREE.SphereGeometry(0.1, 8, 8);
            const particleMaterial = new THREE.MeshBasicMaterial({
                color: 0xffaa00, // Orange-yellow
                transparent: true,
                opacity: 0.8
            });
            
            const particle = new THREE.Mesh(particleGeometry, particleMaterial);
            
            // Position particle at weapon muzzle
            const weaponPos = weaponGlow.position.clone();
            particle.position.copy(weaponPos);
            
            // Add small random offset to particle position
            particle.position.x += weaponGlow.position.x + 0.5;
            particle.position.y += Math.random() * 0.5 - 0.25;
            particle.position.z += Math.random() * 0.5 - 0.25;
            
            // Set random velocity
            particle.velocity = new THREE.Vector3(
                Math.random() * 0.1 + 0.05, // Forward
                Math.random() * 0.04 - 0.02, // Small up/down
                Math.random() * 0.04 - 0.02  // Small left/right
            );
            
            // Store creation time for lifetime calculation
            particle.createdAt = Date.now();
            
            // Add particle to the scene and to our array
            scene.add(particle);
            particles.push(particle);
        }
    }
    
    // Clean up expired particles
    function cleanupParticles() {
        const now = Date.now();
        
        // Remove expired particles
        for (let i = particles.length - 1; i >= 0; i--) {
            const particle = particles[i];
            
            if (now - particle.createdAt > particleLifetime) {
                // Remove from scene and array
                scene.remove(particle);
                particles.splice(i, 1);
                
                // Dispose geometries and materials to prevent memory leaks
                if (particle.geometry) particle.geometry.dispose();
                if (particle.material) particle.material.dispose();
            }
        }
    }
    
    // Reset flash to original state
    function resetFlash() {
        if (!weaponGlow) return;
        
        // Gradually return to original color and scale
        const resetDuration = 200; // ms
        const startTime = Date.now();
        const startColor = {
            r: weaponGlow.material.color.r,
            g: weaponGlow.material.color.g,
            b: weaponGlow.material.color.b
        };
        const startScale = {
            x: weaponGlow.scale.x,
            y: weaponGlow.scale.y,
            z: weaponGlow.scale.z
        };
        
        function animateReset() {
            const elapsed = Date.now() - startTime;
            const progress = Math.min(elapsed / resetDuration, 1);
            
            // Ease back to original values
            weaponGlow.material.color.r = startColor.r + (originalColor.r - startColor.r) * progress;
            weaponGlow.material.color.g = startColor.g + (originalColor.g - startColor.g) * progress;
            weaponGlow.material.color.b = startColor.b + (originalColor.b - startColor.b) * progress;
            
            weaponGlow.scale.x = startScale.x + (originalScale.x - startScale.x) * progress;
            weaponGlow.scale.y = startScale.y + (originalScale.y - startScale.y) * progress;
            weaponGlow.scale.z = startScale.z + (originalScale.z - startScale.z) * progress;
            
            if (progress < 1) {
                requestAnimationFrame(animateReset);
            } else {
                // Once reset is complete
                isFlashing = false;
                
                // Final cleanup of any remaining particles
                cleanupParticles();
            }
        }
        
        // Start the reset animation
        animateReset();
    }
    
    // Update function to be called in the animation loop
    function update() {
        if (particles.length === 0) return;
        
        const now = Date.now();
        
        // Update particles
        particles.forEach(particle => {
            // Move particle based on velocity
            particle.position.x += particle.velocity.x;
            particle.position.y += particle.velocity.y;
            particle.position.z += particle.velocity.z;
            
            // Calculate age and fade out
            const age = now - particle.createdAt;
            const lifePercent = age / particleLifetime;
            
            // Fade out based on age
            particle.material.opacity = 0.8 * (1 - lifePercent);
            
            // Grow slightly as they move
            const scale = 1 + lifePercent * 0.5;
            particle.scale.set(scale, scale, scale);
        });
        
        // Clean up expired particles
        cleanupParticles();
    }
    
    // Public API
    return {
        init: init,
        triggerFlash: triggerFlash,
        update: update
    };
})();

// Export the module
if (typeof module !== 'undefined' && module.exports) {
    module.exports = MuzzleFlash;
} else {
    window.MuzzleFlash = MuzzleFlash;
}
