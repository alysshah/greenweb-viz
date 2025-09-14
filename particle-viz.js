// Three.js particle visualization

class ParticleVisualization {
    constructor(containerId) {
        this.container = document.getElementById(containerId);
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.particles = [];
        this.hitboxes = []; // Separate array for invisible hitboxes
        this.particleSystem = null;
        this.controls = null;
        this.raycaster = new THREE.Raycaster();
        this.mouse = new THREE.Vector2();
        this.animationId = null;
        this.isAnimating = true;
        
        // Interaction state
        this.hoveredParticle = null;
        this.selectedParticle = null;
        this.selectionBorder = null; // White border for selected particle
        
        // Animation state management
        this.isPreviewMode = true;
        this.interactionsEnabled = false;
        this.animationState = 'orbital'; // 'orbital' -> 'exploding' -> 'floating'
        
        // Orbital animation parameters
        this.orbitalRadius = 10; // Larger initial circle
        this.baseOrbitalSpeed = (Math.PI * 2) / (10 * 60); // 10 seconds per rotation at 60fps
        this.orbitalCenter = { x: 0, y: 0, z: 0 };
        
        // Explosion tracking
        this.explosionQueue = [];
        this.currentlyExploding = [];
        
        this.init();
        this.setupEventListeners();
        this.createPreviewParticles();
    }

    init() {
        // Scene setup
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x0a0a0a);

        // Add lighting for MeshStandardMaterial
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.8); // Soft ambient light
        this.scene.add(ambientLight);
        
        const directionalLight = new THREE.DirectionalLight(0xffffff, 0.5); // Directional light
        directionalLight.position.set(0, 0, 10);
        this.scene.add(directionalLight);
        
        // Add a point light to make green particles shine more
        const pointLight = new THREE.PointLight(0x00ff88, 1.0, 100);
        pointLight.position.set(0, 0, 20);
        this.scene.add(pointLight);

        // Camera setup - positioned directly in front for 2D view
        const aspect = window.innerWidth / window.innerHeight;
        this.camera = new THREE.PerspectiveCamera(75, aspect, 0.1, 1000);
        this.camera.position.set(0, 0, 50);
        this.camera.lookAt(0, 0, 0);

        // Renderer setup
        this.renderer = new THREE.WebGLRenderer({ 
            canvas: document.getElementById('three-canvas'),
            antialias: true,
            alpha: true
        });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

        // Lighting already added in init() method

        // Clean background - no atmospheric particles for minimal aesthetic

        // Start render loop
        this.animate();
    }

    // Removed atmospheric particles for clean, minimal aesthetic

    createPreviewParticles() {
        // Create particles for orbital preview
        const previewCount = 200; // Match expected final count
        
        for (let i = 0; i < previewCount; i++) {
            const size = 0.4; // All preview particles smaller (even smaller than smallest final size)
            
            // Calculate orbital starting position
            const orbitalAngle = (i / previewCount) * Math.PI * 2;
            const orbitalPosition = this.getOrbitalPosition(orbitalAngle, i, previewCount);
            
            // Create truly 2D square geometry (plane)
            const geometry = new THREE.PlaneGeometry(size, size);
            const material = new THREE.MeshStandardMaterial({
                color: 0xffffff,
                transparent: true,
                opacity: 1.0,
                side: THREE.DoubleSide,
                emissive: 0x000000,
                emissiveIntensity: 0,
                roughness: 1,
                metalness: 0
            });
            
            const particle = new THREE.Mesh(geometry, material);
            particle.position.set(orbitalPosition.x, orbitalPosition.y, orbitalPosition.z);
            
            // Create invisible larger hitbox for easier clicking
            const hitboxSize = size * 2.5; // 2.5x larger hitbox
            const hitboxGeometry = new THREE.SphereGeometry(hitboxSize, 8, 6);
            const hitboxMaterial = new THREE.MeshBasicMaterial({
                visible: false, // Invisible
                transparent: true,
                opacity: 0
            });
            const hitbox = new THREE.Mesh(hitboxGeometry, hitboxMaterial);
            hitbox.userData = { isHitbox: true, parentParticle: particle };
            particle.add(hitbox);
            this.hitboxes.push(hitbox); // Add to hitboxes array
            
            // Store orbital data
            particle.userData = {
                isPreview: true,
                originalScale: size,
                
                // Orbital animation data
                orbitalAngle: orbitalAngle,
                orbitalSpeed: this.baseOrbitalSpeed * (0.9 + Math.random() * 0.2), // ±10% variation
                orbitalRadius: this.orbitalRadius + (Math.random() - 0.5) * 2, // Slight radius variation
                
                // Explosion data (will be set later)
                finalPosition: null,
                isExploding: false,
                explosionStartTime: null,
                explosionStartPos: null,
                explosionTargetPos: null,
                
                // Final state data
                animationOffset: Math.random() * Math.PI * 2,
                floatingAmplitude: Math.random() * 0.3 + 0.1
            };
            
            this.scene.add(particle);
            this.particles.push(particle);
        }
        
        console.log(`Created ${previewCount} particles in orbital formation`);
    }

    transitionToDataMode(websiteData) {
        console.log('🔄 Transitioning from orbital to explosion mode...');
        
        // Start easing the orbital motion
        this.isPreviewMode = false;
        this.animationState = 'easing';
        this.easeStartTime = Date.now();
        this.easeDuration = 1500; // 1.5 seconds to ease out
        
        // Start explosions after easing completes
        setTimeout(() => {
            this.animationState = 'exploding';
            this.setupExplosionSequence(websiteData);
        }, this.easeDuration + 200); // Ease duration + small buffer
    }

    setupExplosionSequence(websiteData) {
        console.log('🎆 Setting up explosion sequence...');
        
        const targetCount = Math.min(websiteData.length, this.particles.length);
        
        // Create random explosion delays for all particles
        const delays = [];
        for (let i = 0; i < targetCount; i++) {
            delays.push(Math.random() * 800); // Random delay between 0 and 800ms (slower)
        }
        // Don't sort - keep them truly random!
        
        // Calculate final positions for all particles
        websiteData.slice(0, targetCount).forEach((website, index) => {
            const particle = this.particles[index];
            if (!particle) return;
            
            // Set final position
            particle.userData.finalPosition = this.getFinalCirclePosition(index, targetCount);
            
            // Store website data for later
            particle.userData.websiteData = website;
            
            // Add to explosion queue with random delay
            setTimeout(() => {
                this.triggerParticleExplosion(particle, website);
            }, delays[index]); // Random stagger delay
        });
        
        // Enable interactions after all explosions complete
        const totalDuration = 800 + 300; // Max delay (800ms) + explosion duration (150ms) + buffer (150ms)
        setTimeout(() => {
            this.animationState = 'floating';
            this.interactionsEnabled = true;
            console.log('✨ All explosions complete - interactions enabled');
            
            // Auto-select the top-ranking site (rank 1)
            this.autoSelectTopSite(websiteData);
        }, totalDuration);
    }

    triggerParticleExplosion(particle, website) {
        // Triggering explosion for particle
        
        // Set explosion data - explode outward from center in same direction
        particle.userData.isExploding = true;
        particle.userData.explosionStartTime = Date.now();
        
        // Start from wherever the particle is when spinning stops
        particle.userData.explosionStartPos = {
            x: particle.position.x,
            y: particle.position.y,
            z: particle.position.z
        };
        
        // Calculate direction away from center and extend it outward
        const currentPos = particle.position;
        const directionFromCenter = {
            x: currentPos.x, // direction away from center (0,0)
            y: currentPos.y,
            z: 0
        };
        
        // Normalize the current direction
        const distance = Math.sqrt(directionFromCenter.x * directionFromCenter.x + directionFromCenter.y * directionFromCenter.y);
        const normalizedDir = {
            x: directionFromCenter.x / distance,
            y: directionFromCenter.y / distance,
            z: 0
        };
        
        // Take the organic final position and project it onto the current direction
        // This keeps the organic distance variation but ensures the direction matches
        const finalPos = particle.userData.finalPosition;
        const finalDistance = Math.sqrt(finalPos.x * finalPos.x + finalPos.y * finalPos.y);
        
        particle.userData.explosionTargetPos = {
            x: normalizedDir.x * finalDistance,
            y: normalizedDir.y * finalDistance,
            z: 0
        };
        
        // Update particle properties (size and color)
        this.updateParticleWithData(particle, website);
        
        this.currentlyExploding.push(particle);
    }

    graduallyUpdateParticlesToData(websiteData) {
        console.log('🌈 Starting gradual color transition...');
        
        // Ensure we have the right number of particles
        const targetCount = Math.min(websiteData.length, 200);
        
        // Remove excess particles if we have too many
        while (this.particles.length > targetCount) {
            const particle = this.particles.pop();
            this.scene.remove(particle);
            if (particle.geometry) particle.geometry.dispose();
            if (particle.material) particle.material.dispose();
        }
        
        // Add more particles if we need them
        while (this.particles.length < targetCount) {
            const index = this.particles.length;
            const size = Math.random() * 0.3 + 0.6; // Size 0.6-0.9 (bigger particles)
            const position = this.getCirclePosition(index, targetCount);
            
            const geometry = new THREE.PlaneGeometry(size, size);
            const material = new THREE.MeshStandardMaterial({
                color: 0xffffff,
                transparent: true,
                opacity: 1.0,
                side: THREE.DoubleSide,
                emissive: 0x000000,
                emissiveIntensity: 0,
                roughness: 1,
                metalness: 0
            });
            
            const particle = new THREE.Mesh(geometry, material);
            particle.position.set(position.x, position.y, position.z);
            
            particle.userData = {
                isPreview: true,
                originalScale: size,
                originalPosition: { ...position },
                targetPosition: { ...position },
                animationOffset: Math.random() * Math.PI * 2,
                dispersed: false
            };
            
            this.scene.add(particle);
            this.particles.push(particle);
        }
        
        // Gradually update each particle with a delay
        websiteData.slice(0, targetCount).forEach((website, index) => {
            setTimeout(() => {
                this.updateParticleWithData(this.particles[index], website, index, targetCount);
            }, index * 30); // 30ms delay between each particle (much faster)
        });
        
        // Enable interactions and disable dispersion after all particles are updated
        setTimeout(() => {
            this.interactionsEnabled = true;
            this.dispersionEnabled = false; // Disable dispersion for clickable particles
            console.log('✨ Transition complete - interactions enabled, dispersion disabled');
        }, targetCount * 100 + 500);
    }

    updateParticleWithData(particle, website) {
        if (!particle) return;
        
        // Calculate new properties (keep existing position, only update size and color)
        const newSize = this.getRankBasedSize(website.rank, 200);
        const newColor = getParticleColor(website.green);
        
        // Validate size to prevent NaN errors
        const validSize = isNaN(newSize) ? 1.0 : Math.max(0.5, newSize);
        
        // Update geometry for new size
        if (particle.geometry) particle.geometry.dispose();
        particle.geometry = new THREE.PlaneGeometry(validSize, validSize);
        
        // Create or update invisible larger hitbox for easier clicking
        const hitboxSize = validSize * 2.5; // 2.5x larger hitbox
        const hitboxGeometry = new THREE.SphereGeometry(hitboxSize, 8, 6);
        const hitboxMaterial = new THREE.MeshBasicMaterial({
            visible: false, // Invisible
            transparent: true,
            opacity: 0
        });
        
        // Remove existing hitbox if it exists
        const existingHitbox = particle.children.find(child => child.userData.isHitbox);
        if (existingHitbox) {
            particle.remove(existingHitbox);
            existingHitbox.geometry.dispose();
        }
        
        const hitbox = new THREE.Mesh(hitboxGeometry, hitboxMaterial);
        hitbox.userData = { isHitbox: true, parentParticle: particle };
        particle.add(hitbox);
        this.hitboxes.push(hitbox); // Add to hitboxes array
        
        // Animate color transition
        this.animateColorTransition(particle, newColor);
        
        // Update user data (preserve all orbital/explosion data, just add website info)
        particle.userData.websiteData = website;
        particle.userData.originalScale = validSize;
        particle.userData.domain = website.domain;
        particle.userData.green = website.green;
        particle.userData.rank = website.rank;
        particle.userData.co2PerPageView = website.co2PerPageView;
        particle.userData.energyPerVisit = website.energyPerVisit;
        particle.userData.hostedBy = website.hostedBy;
        particle.userData.hostedByWebsite = website.hostedByWebsite;
        particle.userData.cleanerThan = website.cleanerThan;
        particle.userData.rating = website.rating;
        particle.userData.estimatedPageSize = website.estimatedPageSize;
        
        // Add Gemini data to userData for direct access
        particle.userData.co2Translation = website.co2Translation;
        particle.userData.energyTranslation = website.energyTranslation;
        particle.userData.cleanerThanTranslation = website.cleanerThanTranslation;
        particle.userData.websiteDescription = website.websiteDescription;
        particle.userData.estimatedPageSize = website.estimatedPageSize;
        particle.userData.pageSizeBreakdown = website.pageSizeBreakdown;
        particle.userData.carbonImpact = website.carbonImpact;
        
        // Particle updated with website data
    }

    animateColorTransition(particle, targetColor) {
        const startColor = new THREE.Color(0xffffff); // Start from white
        const endColor = new THREE.Color(targetColor);
        const isGreen = particle.userData.green;
        const duration = 800; // 800ms transition
        const startTime = Date.now();
        
        const animateColor = () => {
            const elapsed = Date.now() - startTime;
            const progress = Math.min(elapsed / duration, 1);
            
            // Interpolate color
            const currentColor = new THREE.Color().lerpColors(startColor, endColor, progress);
            
            particle.material.color.copy(currentColor);
            
            // Make green particles emit light, red particles dark
            if (isGreen) {
                // Green particles emit their own light
                particle.material.emissive = currentColor.clone().multiplyScalar(0.4); // Emit light
                particle.material.emissiveIntensity = 1.0; // Strong emission
                particle.material.roughness = 0.1; // Very smooth/shiny
                particle.material.metalness = 0.8; // Highly metallic
            } else {
                // Red particles are dark and matte
                particle.material.emissive = new THREE.Color(0x000000); // No emission
                particle.material.emissiveIntensity = 0; // No glow
                particle.material.roughness = 1.0; // Very rough/matte
                particle.material.metalness = 0.0; // No metallic sheen
            }
            
            if (progress < 1) {
                requestAnimationFrame(animateColor);
            }
        };
        
        animateColor();
    }

    animateParticlesOut(callback) {
        const animationDuration = 1000; // 1 second
        const startTime = Date.now();
        
        this.particles.forEach((particle, index) => {
            const delay = index * 50; // Stagger the animation
            
            setTimeout(() => {
                // Animate scale to 0
                const animateOut = () => {
                    const elapsed = Date.now() - startTime - delay;
                    const progress = Math.min(elapsed / 500, 1); // 500ms per particle
                    
                    if (progress < 1) {
                        const scale = 1 - progress;
                        particle.scale.set(scale, scale, scale);
                        particle.material.opacity = 0.6 * (1 - progress);
                        requestAnimationFrame(animateOut);
                    } else {
                        particle.scale.set(0, 0, 0);
                        particle.material.opacity = 0;
                    }
                };
                animateOut();
            }, delay);
        });
        
        // Call callback when animation is complete
        setTimeout(callback, animationDuration + 500);
    }

    createWebsiteParticles(websiteData) {
        // Clear existing particles
        this.clearParticles();

        websiteData.forEach((website, index) => {
            this.createParticle(website, index, websiteData.length);
        });

        console.log(`Created ${this.particles.length} website particles`);
    }

    createParticle(website, index, total) {
        // Calculate particle properties - size based on rank (higher rank = smaller size)
        const rankSize = this.getRankBasedSize(website.rank, total);
        const color = getParticleColor(website.green);
        const position = this.getCirclePosition(index, total);

        // Create truly 2D square geometry (plane)
        const geometry = new THREE.PlaneGeometry(rankSize, rankSize);
        
        // Create clean flat material (ready for glow effects)
        const material = new THREE.MeshStandardMaterial({
            color: color,
            transparent: true,
            opacity: 1.0,
            side: THREE.DoubleSide,
            emissive: 0x000000,
            emissiveIntensity: 0,
            roughness: 1,
            metalness: 0
        });

        // Create mesh
        const particle = new THREE.Mesh(geometry, material);
        particle.position.set(position.x, position.y, position.z);
        
        // Store website data
        particle.userData = website;
        particle.userData.originalScale = rankSize;
        particle.userData.originalPosition = { ...position };
        particle.userData.targetPosition = { ...position };
        particle.userData.dispersed = false;

        // Add subtle animation offset
        particle.userData.animationOffset = Math.random() * Math.PI * 2;

        this.scene.add(particle);
        this.particles.push(particle);
    }

    getOrbitalPosition(angle, index, total) {
        // Calculate position in tight orbital circle
        const radiusVariation = (Math.random() - 0.5) * 1.5; // Slight variation for organic look
        const radius = this.orbitalRadius + radiusVariation;
        
        const x = radius * Math.cos(angle);
        const y = radius * Math.sin(angle);
        const z = 0; // All particles on same Z plane
        
        return { x, y, z };
    }

    getFinalCirclePosition(index, total) {
        // Arrange particles in a loose circle formation (final expanded state)
        const baseRadius = 18; // Base circle radius - same for all particles
        
        // Create a "teardrop" effect by varying the "band width" around the circle
        // Higher ranks get more radius variation (wider band), lower ranks get less (narrower band)
        const normalizedIndex = index / total;
        
        // Use a power function to create dramatic band width variation
        // This creates a wide band at the start that narrows to a minimum at the tail
        const bandWidthFactor = Math.pow(1 - normalizedIndex, 2); // Quadratic curve: 1 to 0
        
        // Vary the radius variation based on rank - higher ranks get more variation
        const maxRadiusVariation = 12; // Maximum variation for high ranks
        const minRadiusVariation = 3; // Minimum variation for low ranks (not a point)
        const radiusVariationRange = maxRadiusVariation - minRadiusVariation;
        const radiusVariation = minRadiusVariation + (radiusVariationRange * bandWidthFactor);
        const finalRadiusVariation = (Math.random() - 0.5) * radiusVariation;
        
        // Keep the same base angle distribution (even spacing around circle)
        const angle = (index / total) * Math.PI * 2;
        const angleVariation = (Math.random() - 0.5) * 0.5; // ±0.25 radians
        const adjustedAngle = angle + angleVariation;
        
        // Apply the radius variation to the base radius
        const adjustedRadius = baseRadius + finalRadiusVariation;
        
        const x = adjustedRadius * Math.cos(adjustedAngle);
        const y = adjustedRadius * Math.sin(adjustedAngle);
        const z = 0; // All particles on same Z plane for true 2D look

        return { x, y, z };
    }

    getRankBasedSize(rank, total) {
        // Validate inputs to prevent NaN
        const validRank = (rank && !isNaN(rank)) ? rank : 50; // Default to middle rank
        const validTotal = (total && !isNaN(total) && total > 0) ? total : 200;
        
        // Higher rank (lower number) = larger size
        // Size range: 0.6 to 1.0 (original smaller particles)
        const normalizedRank = (validTotal - validRank) / validTotal; // Invert so rank 1 = 1.0, rank 200 = 0.0
        const minSize = 0.6;
        const maxSize = 1.0;
        
        const result = minSize + (normalizedRank * (maxSize - minSize));
        return isNaN(result) ? 1.0 : result; // Fallback to 1.0 if still NaN
    }

    clearParticles() {
        this.particles.forEach(particle => {
            this.scene.remove(particle);
            if (particle.geometry) particle.geometry.dispose();
            if (particle.material) particle.material.dispose();
        });
        this.particles = [];
        this.hitboxes = []; // Clear hitboxes array too
        
        // Clear selection state
        this.selectedParticle = null;
        this.hideSelectionBorder();
    }

    setupEventListeners() {
        // Mouse move for hover effects
        this.container.addEventListener('mousemove', (event) => {
            this.onMouseMove(event);
        });

        // Click for selection
        this.container.addEventListener('click', (event) => {
            this.onMouseClick(event);
        });

        // Keyboard navigation
        window.addEventListener('keydown', (event) => {
            this.onKeyDown(event);
        });

        // Window resize
        window.addEventListener('resize', () => {
            this.onWindowResize();
        });

        // Control buttons
        const resetBtn = document.getElementById('reset-camera');
        if (resetBtn) {
            resetBtn.addEventListener('click', () => {
                this.resetCamera();
            });
        }


        // Mouse leave container
        this.container.addEventListener('mouseleave', () => {
            this.onMouseLeave();
        });
    }

    onMouseMove(event) {
        // Calculate mouse position in normalized device coordinates
        const rect = this.container.getBoundingClientRect();
        this.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
        this.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

        // Handle mouse repulsion during preview mode
        if (this.isPreviewMode) {
            this.handleMouseRepulsion();
            return;
        }

        // Skip hover interactions when not in preview mode and interactions disabled
        if (!this.interactionsEnabled) {
            return;
        }

        // Raycast to find intersected hitboxes (larger, invisible collision areas)
        this.raycaster.setFromCamera(this.mouse, this.camera);
        const intersects = this.raycaster.intersectObjects(this.hitboxes);
        
        // Check for particle intersections

        if (intersects.length > 0) {
            const hitbox = intersects[0].object;
            const particle = hitbox.userData.parentParticle; // Get the actual particle from hitbox
            
            if (this.hoveredParticle !== particle) {
                // Reset previous hovered particle
                if (this.hoveredParticle) {
                    this.resetParticleHover(this.hoveredParticle);
                }
                
                // Set new hovered particle
                this.hoveredParticle = particle;
                this.highlightParticle(particle);
                
                // Change cursor
                this.container.style.cursor = 'pointer';
            }
        } else {
            // No intersection
            if (this.hoveredParticle) {
                this.resetParticleHover(this.hoveredParticle);
                this.hoveredParticle = null;
                
                // Only hide info panel if no particle is selected
                if (!this.selectedParticle) {
                    hideInfoPanel();
                } else {
                    // Keep info panel visible for selected particle
                    showInfoPanel(this.selectedParticle.userData);
                }
                
                this.container.style.cursor = 'default';
            }
        }
    }

    onMouseClick(event) {
        console.log('Mouse click detected, preview mode:', this.isPreviewMode, 'interactions enabled:', this.interactionsEnabled); // Debug
        
        // Skip interactions in preview mode
        if (this.isPreviewMode || !this.interactionsEnabled) {
            console.log('Click ignored - wrong mode'); // Debug
            return;
        }

        console.log('Hovered particle:', this.hoveredParticle?.userData?.domain); // Debug

        if (this.hoveredParticle) {
            // Select the particle using the new method
            this.selectParticle(this.hoveredParticle);
        } else {
            console.log('❌ No particle hovered for selection'); // Debug
        }
    }

    onMouseLeave() {
        console.log('Mouse left canvas'); // Debug
        this.isMouseOverCanvas = false;
        
        if (this.hoveredParticle) {
            this.resetParticleHover(this.hoveredParticle);
            this.hoveredParticle = null;
            
            // Only hide info panel if no particle is selected
            if (!this.selectedParticle) {
                hideInfoPanel();
            } else {
                // Keep info panel visible for selected particle
                showInfoPanel(this.selectedParticle.userData);
            }
            
            this.container.style.cursor = 'default';
        }
    }

    handleMouseRepulsion() {
        // Convert mouse position to world coordinates
        const mouseWorld = new THREE.Vector3(this.mouse.x, this.mouse.y, 0);
        mouseWorld.unproject(this.camera);
        
        let particlesAffected = 0;
        
        // Apply repulsion to all particles during preview mode
        this.particles.forEach(particle => {
            const distance = particle.position.distanceTo(mouseWorld);
            const repulsionRadius = 0.8; // Radius of repulsion effect
            const repulsionStrength = 0.3; // Strength of repulsion
            
            if (distance < repulsionRadius && distance > 0) {
                particlesAffected++;
                
                // Calculate repulsion direction (away from mouse)
                const repulsionDir = particle.position.clone().sub(mouseWorld).normalize();
                
                // Apply repulsion force
                const force = (repulsionRadius - distance) / repulsionRadius * repulsionStrength;
                particle.position.add(repulsionDir.multiplyScalar(force));
                
                // Keep particles within the orbital circle
                const distanceFromCenter = Math.sqrt(particle.position.x * particle.position.x + particle.position.y * particle.position.y);
                const maxRadius = 0.6; // Slightly larger than the orbital radius
                
                if (distanceFromCenter > maxRadius) {
                    const angle = Math.atan2(particle.position.y, particle.position.x);
                    particle.position.x = Math.cos(angle) * maxRadius;
                    particle.position.y = Math.sin(angle) * maxRadius;
                }
            }
        });
        
        // Debug feedback (remove in production)
        if (particlesAffected > 0) {
            console.log(`🖱️ Mouse repulsion affecting ${particlesAffected} particles`);
        }
    }

    showSelectionBorder(particle) {
        // Remove existing selection border
        this.hideSelectionBorder();
        
        if (!particle) return;
        
        // Get particle size for border sizing
        const particleSize = particle.userData.originalScale || 1;
        const borderSize = particleSize * 2; // 60% larger than particle (was 40%)
        
        // Create thick white square border using multiple overlapping lines
        const borderGeometry = new THREE.PlaneGeometry(borderSize, borderSize);
        const edges = new THREE.EdgesGeometry(borderGeometry);
        
        // Create multiple line segments for thickness effect
        this.selectionBorder = new THREE.Group();
        
        // Create 4 separate line segments for each edge with slight offsets
        const offsets = [
            { x: -0.05, y: 0, z: 0 },   // Left edge
            { x: 0.05, y: 0, z: 0 },    // Right edge  
            { x: 0, y: -0.05, z: 0 },   // Bottom edge
            { x: 0, y: 0.05, z: 0 }     // Top edge
        ];
        
        offsets.forEach(offset => {
            const lineMaterial = new THREE.LineBasicMaterial({
                color: 0xffffff,
                transparent: true,
                opacity: 0.9
            });
            
            const lineGeometry = edges.clone();
            lineGeometry.translate(offset.x, offset.y, offset.z);
            
            const line = new THREE.LineSegments(lineGeometry, lineMaterial);
            this.selectionBorder.add(line);
        });
        this.selectionBorder.position.copy(particle.position);
        this.selectionBorder.userData = { isSelectionBorder: true };
        
        this.scene.add(this.selectionBorder);
    }

    hideSelectionBorder() {
        if (this.selectionBorder) {
            this.scene.remove(this.selectionBorder);
            
            // Dispose of all child geometries and materials
            this.selectionBorder.traverse((child) => {
                if (child.geometry) child.geometry.dispose();
                if (child.material) child.material.dispose();
            });
            
            this.selectionBorder = null;
        }
    }

    // Removed dispersion functions - using orbital explosion system instead

    highlightParticle(particle) {
        // Scale up particle slightly for hover effect
        const scale = 1.3;
        particle.scale.set(scale, scale, scale);
        
        // Slightly brighten the color for hover
        const currentColor = particle.material.color.clone();
        currentColor.multiplyScalar(1.5); // Brighten
        particle.material.color.copy(currentColor);
    }

    resetParticleHover(particle) {
        // Reset scale
        particle.scale.set(1, 1, 1);
        
        // Reset to original color (check if we have website data)
        const isGreen = particle.userData.green !== undefined ? particle.userData.green : false;
        const originalColor = getParticleColor(isGreen);
        particle.material.color.copy(new THREE.Color(originalColor));
    }

    onWindowResize() {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
    }

    // Auto-select the top-ranking site (rank 1)
    autoSelectTopSite(websiteData) {
        if (!websiteData || websiteData.length === 0) return;
        
        // Find the particle with rank 1
        const topSite = websiteData.find(site => site.rank === 1);
        if (!topSite) return;
        
        // Find the corresponding particle
        const topParticle = this.particles.find(particle => 
            particle.userData && particle.userData.domain === topSite.domain
        );
        
        if (topParticle) {
            this.selectParticle(topParticle);
            console.log('🎯 Auto-selected top-ranking site:', topSite.domain);
        }
    }

    // Select a particle programmatically
    selectParticle(particle) {
        if (!particle || !particle.userData) return;
        
        // Clear previous selection
        if (this.selectedParticle) {
            this.hideSelectionBorder();
        }
        
        // Set new selection
        this.selectedParticle = particle;
        this.showSelectionBorder(particle);
        showInfoPanel(particle.userData);
        
        console.log('✅ Selected website:', particle.userData.domain);
    }

    // Navigate to next/previous site by rank with looping
    navigateToSite(direction) {
        if (!this.selectedParticle || !this.selectedParticle.userData) return;
        
        const currentRank = this.selectedParticle.userData.rank;
        let newRank;
        
        if (direction === 'next') {
            // Move to next rank, loop from 200 to 1
            newRank = currentRank >= 200 ? 1 : currentRank + 1;
        } else {
            // Move to previous rank, loop from 1 to 200
            newRank = currentRank <= 1 ? 200 : currentRank - 1;
        }
        
        // Find particle with the new rank
        const targetParticle = this.particles.find(particle => 
            particle.userData && particle.userData.rank === newRank
        );
        
        if (targetParticle) {
            this.selectParticle(targetParticle);
            console.log(`🔄 Navigated to rank ${newRank}:`, targetParticle.userData.domain);
        } else {
            console.log(`❌ No site found with rank ${newRank}`);
        }
    }

    // Handle keyboard input
    onKeyDown(event) {
        // Only handle arrow keys when interactions are enabled
        if (!this.interactionsEnabled) return;
        
        switch(event.key) {
            case 'ArrowRight':
            case 'ArrowDown':
                event.preventDefault();
                this.navigateToSite('next');
                break;
            case 'ArrowLeft':
            case 'ArrowUp':
                event.preventDefault();
                this.navigateToSite('prev');
                break;
        }
    }

    resetCamera() {
        // Smooth camera reset to 2D front view
        const targetPosition = { x: 0, y: 0, z: 50 };
        this.animateCamera(targetPosition);
    }

    animateCamera(targetPosition, duration = 1000) {
        const startPosition = this.camera.position.clone();
        const startTime = Date.now();

        const animateStep = () => {
            const elapsed = Date.now() - startTime;
            const progress = Math.min(elapsed / duration, 1);
            
            // Easing function
            const easeProgress = 1 - Math.pow(1 - progress, 3);
            
            this.camera.position.lerpVectors(startPosition, new THREE.Vector3().copy(targetPosition), easeProgress);
            
            if (progress < 1) {
                requestAnimationFrame(animateStep);
            }
        };
        
        animateStep();
    }


    animate() {
        this.animationId = requestAnimationFrame(() => this.animate());

        if (this.isAnimating) {
            const time = Date.now() * 0.001;
            const currentTime = Date.now();

            // Handle mouse repulsion during orbital mode (when particles are spinning)
            if (this.animationState === 'orbital') {
                this.handleMouseRepulsion();
            }

            this.particles.forEach((particle, index) => {
                if (!particle.userData) return;

                switch (this.animationState) {
                    case 'orbital':
                        this.animateOrbitalParticle(particle, time);
                        break;
                    
                    case 'easing':
                        this.animateEasingParticle(particle, time);
                        break;
                    
                    case 'stopped':
                        // Keep particles in current position (orbital motion stopped)
                        break;
                    
                    case 'exploding':
                        if (particle.userData.isExploding) {
                            this.animateExplodingParticle(particle, currentTime);
                        }
                        // Particles not exploding yet stay in their stopped position
                        break;
                    
                    case 'floating':
                        this.animateFloatingParticle(particle, time);
                        break;
                }
            });
        }

        this.renderer.render(this.scene, this.camera);
    }

    animateOrbitalParticle(particle, time) {
        // Update orbital angle
        particle.userData.orbitalAngle += particle.userData.orbitalSpeed;
        
        // Calculate new position
        const radius = particle.userData.orbitalRadius;
        const angle = particle.userData.orbitalAngle;
        
        particle.position.x = radius * Math.cos(angle);
        particle.position.y = radius * Math.sin(angle);
        particle.position.z = 0;
    }

    animateEasingParticle(particle, time) {
        // Calculate easing progress (0 to 1)
        const elapsed = Date.now() - this.easeStartTime;
        const progress = Math.min(elapsed / this.easeDuration, 1);
        
        // Ease-out function (starts fast, slows down)
        const easedProgress = 1 - Math.pow(1 - progress, 3); // Cubic ease-out
        
        // Gradually reduce orbital speed
        const originalSpeed = particle.userData.orbitalSpeed;
        const currentSpeed = originalSpeed * (1 - easedProgress);
        
        // Update orbital angle with reduced speed
        particle.userData.orbitalAngle += currentSpeed;
        
        // Calculate new position
        const radius = particle.userData.orbitalRadius;
        const angle = particle.userData.orbitalAngle;
        
        particle.position.x = radius * Math.cos(angle);
        particle.position.y = radius * Math.sin(angle);
        particle.position.z = 0;
    }

    animateExplodingParticle(particle, currentTime) {
        const explosionDuration = 150; // 0.15 seconds (extremely fast)
        const elapsed = currentTime - particle.userData.explosionStartTime;
        const progress = Math.min(elapsed / explosionDuration, 1);
        
        if (progress >= 1) {
            // Explosion complete - set final position
            particle.userData.isExploding = false;
            const finalPos = particle.userData.explosionTargetPos;
            particle.position.set(finalPos.x, finalPos.y, finalPos.z);
            
            // Update final position for floating animation
            particle.userData.finalPosition = finalPos;
            
            // Remove from exploding array
            const index = this.currentlyExploding.indexOf(particle);
            if (index > -1) {
                this.currentlyExploding.splice(index, 1);
            }
            return;
        }
        
        // Simple ease out curve (gentler)
        const easedProgress = 1 - Math.pow(1 - progress, 2);
        
        // Simple linear interpolation from start to target
        const startPos = particle.userData.explosionStartPos;
        const targetPos = particle.userData.explosionTargetPos;
        
        const x = startPos.x + (targetPos.x - startPos.x) * easedProgress;
        const y = startPos.y + (targetPos.y - startPos.y) * easedProgress;
        const z = 0;
        
        particle.position.set(x, y, z);
    }

    animateFloatingParticle(particle, time) {
        // Enhanced floating with breathing animation
        if (!particle.userData.finalPosition) return;
        
        const offset = particle.userData.animationOffset;
        const posAmplitude = particle.userData.floatingAmplitude || 0.4; // Increased from 0.2
        const finalPos = particle.userData.finalPosition;
        
        // Vertical floating
        particle.position.x = finalPos.x;
        particle.position.y = finalPos.y + Math.sin(time + offset) * posAmplitude;
        particle.position.z = finalPos.z;
        
        // Update selection border position if this particle is selected
        if (this.selectedParticle === particle && this.selectionBorder) {
            this.selectionBorder.position.copy(particle.position);
        }
        
        // Minimal breathing scale animation (very subtle to preserve ranking data)
        const breathingSpeed = 0.8; // Slower than position floating
        const breathingAmplitude = 0.03; // Only 3% scale variation (was 15%)
        const baseScale = particle.userData.originalScale || 1;
        const breathingScale = 1 + Math.sin(time * breathingSpeed + offset) * breathingAmplitude;
        
        particle.scale.set(baseScale * breathingScale, baseScale * breathingScale, baseScale * breathingScale);
        
        // Minimal pulsing for green particles during floating
        if (particle.userData.green) {
            // Very subtle extra pulsing for green particles
            const extraPulse = 1 + Math.sin(time * 1.5 + offset) * 0.05; // Only 5% extra pulsing (was 30%)
            particle.scale.set(
                baseScale * breathingScale * extraPulse, 
                baseScale * breathingScale * extraPulse, 
                baseScale * breathingScale * extraPulse
            );
        }
    }

    // Add zoom-only controls (no rotation for 2D view)
    enableOrbitControls() {
        // Zoom with mouse wheel only
        this.container.addEventListener('wheel', (event) => {
            event.preventDefault();
            const zoomSpeed = 0.1;
            const zoom = event.deltaY > 0 ? 1 + zoomSpeed : 1 - zoomSpeed;
            
            // Only zoom on Z-axis to maintain 2D view
            this.camera.position.z *= zoom;
            
            // Limit zoom range
            this.camera.position.z = Math.max(20, Math.min(100, this.camera.position.z));
        });
    }

    destroy() {
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
        }
        
        this.clearParticles();
        
        if (this.renderer) {
            this.renderer.dispose();
        }
    }
}

// Export for use in main.js
window.ParticleVisualization = ParticleVisualization;
