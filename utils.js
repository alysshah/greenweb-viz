// Utility functions

// Sleep/delay function for rate limiting
function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// Update progress bar
function updateProgress(percentage, status) {
    const progressBar = document.getElementById('progress-bar');
    const statusText = document.getElementById('loading-status');
    
    if (progressBar) {
        progressBar.style.width = `${percentage}%`;
    }
    
    if (statusText && status) {
        statusText.textContent = status;
    }
}

// Hide loading screen
function hideLoading() {
    const loading = document.getElementById('loading');
    const controls = document.getElementById('controls');
    
    if (loading) {
        loading.style.opacity = '0';
        setTimeout(() => {
            loading.style.display = 'none';
        }, 500);
    }
    
    if (controls) {
        controls.classList.remove('hidden');
    }
}

// Show info panel with website data
function showInfoPanel(website) {
    const panel = document.getElementById('info-panel');
    const siteName = document.getElementById('site-name');
    const siteRank = document.getElementById('site-rank');
    const siteCo2 = document.getElementById('site-co2');
    const pageSize = document.getElementById('page-size');
    const pageSizeRow = document.getElementById('page-size-row');
    const siteEnergy = document.getElementById('site-energy');
    const siteCarbonImpact = document.getElementById('site-carbon-impact');
    const carbonImpactRow = document.getElementById('carbon-impact-section');
    const siteCleaner = document.getElementById('site-cleaner');
    const siteGreen = document.getElementById('site-green');
    const siteHost = document.getElementById('site-host');
    const hostedByRow = document.getElementById('hosted-by-row');
    const siteRating = document.getElementById('site-rating');
    const siteDescription = document.getElementById('site-description');
    const websiteDescriptionRow = document.getElementById('website-description-row');
    const pageSizeBreakdown = document.getElementById('page-size-breakdown');
    const pageSizeBreakdownRow = document.getElementById('page-size-breakdown-row');
    
    if (!panel) return;
    
    // Debug: Log the website data to see what we have
    console.log('🔍 Website data for info panel:', website);
    console.log('🔍 energyPerVisit value:', website.energyPerVisit);
    console.log('🔍 co2PerPageView value:', website.co2PerPageView);
    console.log('🔍 cleanerThan value:', website.cleanerThan);
    console.log('🔍 hostedByWebsite value:', website.hostedByWebsite);
    console.log('🔍 rating value:', website.rating);
    console.log('🔍 All website keys:', Object.keys(website));
    console.log('🔍 Has energyPerVisit?', 'energyPerVisit' in website);
    console.log('🔍 Has rating?', 'rating' in website);
    
    // Debug: Log Gemini data specifically
    console.log('🤖 Gemini data check:');
    console.log('🔍 co2Translation:', website.co2Translation);
    console.log('🔍 energyTranslation:', website.energyTranslation);
    console.log('🔍 cleanerThanTranslation:', website.cleanerThanTranslation);
    console.log('🔍 websiteDescription:', website.websiteDescription);
    console.log('🔍 estimatedPageSize:', website.estimatedPageSize);
    console.log('🔍 pageSizeBreakdown:', website.pageSizeBreakdown);
    
    // Update content
    if (siteName) {
        siteName.innerHTML = `<span class="site-text">${website.domain}</span> <span class="external-link">↗</span>`;
        siteName.onclick = () => {
            window.open(`https://${website.domain}`, '_blank');
        };
    }
    if (siteRank) siteRank.textContent = `#${website.rank}`;
    
    // Use Gemini translations if available, otherwise fallback to raw data
    if (siteCo2) {
        if (website.co2Translation) {
            siteCo2.textContent = website.co2Translation;
        } else {
            siteCo2.textContent = website.co2PerPageView ? `${website.co2PerPageView.toFixed(2)}g` : 'Calculating...';
        }
    }
    
    // Display estimated page size
    if (pageSize && pageSizeRow) {
        if (website.estimatedPageSize) {
            const sizeInMB = (website.estimatedPageSize / 1024 / 1024).toFixed(1);
            pageSize.textContent = `${sizeInMB} MB`;
            pageSizeRow.style.display = 'flex';
        } else {
            pageSizeRow.style.display = 'none';
        }
    }
    
    if (siteEnergy) {
        if (website.energyTranslation) {
            siteEnergy.textContent = website.energyTranslation;
        } else {
            if (website.energyPerVisit) {
                // Show more precision for very small energy values
                const energy = website.energyPerVisit;
                if (energy < 0.001) {
                    siteEnergy.textContent = `${(energy * 1000).toFixed(3)} mWh`; // Show in milliwatt-hours
                } else {
                    siteEnergy.textContent = `${energy.toFixed(4)} kWh`;
                }
            } else {
                siteEnergy.textContent = 'Calculating...';
            }
        }
    }
    
    // Display carbon impact translation
    if (siteCarbonImpact && carbonImpactRow) {
        console.log(`🌍 Carbon impact display check for ${website.domain}:`, website.carbonImpact);
        if (website.carbonImpact) {
            siteCarbonImpact.innerHTML = `${website.carbonImpact.icon} ${website.carbonImpact.description}`;
            carbonImpactRow.style.display = 'block';
            console.log(`✅ Carbon impact displayed for ${website.domain}`);
        } else {
            carbonImpactRow.style.display = 'none';
            console.log(`❌ No carbon impact data for ${website.domain}`);
        }
    }
    
    if (siteCleaner) {
        if (website.cleanerThanTranslation) {
            siteCleaner.textContent = website.cleanerThanTranslation;
        } else if (website.cleanerThan !== null && website.cleanerThan !== undefined) {
            siteCleaner.textContent = `${(website.cleanerThan * 100).toFixed(0)}% of sites`;
        } else {
            siteCleaner.textContent = 'Calculating...';
        }
    }
    if (siteGreen) {
        siteGreen.textContent = website.green ? 'Yes' : 'No';
        siteGreen.style.color = website.green ? '#00ff88' : '#ff4444';
    }
    // Show/hide "Hosted by" row based on green status
    if (hostedByRow) {
        if (website.green && website.hostedBy && website.hostedBy !== 'Unknown') {
            // Show the row for green sites with hosting info
            hostedByRow.style.display = 'flex';
            if (website.hostedByWebsite) {
                // Create a link with external icon
                siteHost.innerHTML = `${website.hostedBy} <a href="${website.hostedByWebsite}" target="_blank" style="color: #00ff88; text-decoration: none; margin-left: 5px;">↗</a>`;
            } else {
                siteHost.textContent = website.hostedBy;
            }
        } else {
            // Hide the row for non-green sites or sites without hosting info
            hostedByRow.style.display = 'none';
        }
    }
    if (siteRating) {
        const rating = website.rating || 'N/A';
        siteRating.textContent = rating;
        // Color code the rating
        if (rating === 'A+') siteRating.style.color = '#00ff88';
        else if (rating === 'A') siteRating.style.color = '#44ff88';
        else if (rating === 'B') siteRating.style.color = '#88ff00';
        else if (rating === 'C') siteRating.style.color = '#ffff00';
        else if (rating === 'D') siteRating.style.color = '#ff8800';
        else if (rating === 'F') siteRating.style.color = '#ff4444';
        else siteRating.style.color = '#ffffff';
    }
    
    // Display website description
    if (siteDescription && websiteDescriptionRow) {
        if (website.websiteDescription) {
            siteDescription.textContent = website.websiteDescription;
            websiteDescriptionRow.style.display = 'flex';
        } else {
            websiteDescriptionRow.style.display = 'none';
        }
    }
    
    // Display page size breakdown
    if (pageSizeBreakdown && pageSizeBreakdownRow) {
        if (website.pageSizeBreakdown) {
            pageSizeBreakdown.textContent = website.pageSizeBreakdown;
            pageSizeBreakdownRow.style.display = 'flex';
        } else {
            pageSizeBreakdownRow.style.display = 'none';
        }
    }
    
    
    // Show panel
    panel.classList.remove('hidden');
}

// Hide info panel
function hideInfoPanel() {
    const panel = document.getElementById('info-panel');
    if (panel) {
        panel.classList.add('hidden');
    }
}

// Parse CSV text into array of objects
function parseCSV(csvText) {
    const lines = csvText.trim().split('\n');
    const result = [];
    
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        if (line) {
            const [rank, domain] = line.split(',');
            if (rank && domain) {
                result.push({
                    rank: parseInt(rank),
                    domain: domain.trim()
                });
            }
        }
    }
    
    return result;
}

// Generate random position in 3D space for particles
function getRandomPosition(spread = 50) {
    return {
        x: (Math.random() - 0.5) * spread,
        y: (Math.random() - 0.5) * spread,
        z: (Math.random() - 0.5) * spread
    };
}

// Map CO2 value to particle size
function co2ToSize(co2Value, minSize = 0.5, maxSize = 3) {
    // Clamp CO2 value to reasonable range (0-10g)
    const clampedCo2 = Math.max(0, Math.min(10, co2Value || 1));
    
    // Linear mapping
    const normalizedCo2 = clampedCo2 / 10;
    return minSize + (normalizedCo2 * (maxSize - minSize));
}

// Get color based on green hosting status
function getParticleColor(isGreen) {
    return isGreen ? 0x00ff44 : 0x051a05; // Pure bright green or very dark forest green (lifeless)
}

// Get glow effect for green particles
function getGlowIntensity(isGreen) {
    return isGreen ? 1.5 : 0.3; // Green particles glow, red particles are dim
}

// Add glow effect color
function getGlowColor(isGreen) {
    return isGreen ? 0x88ffaa : 0xff8888; // Lighter versions for glow
}

// Error handling
function handleError(error, context = 'Unknown') {
    console.error(`Error in ${context}:`, error);
    
    // Update UI to show error
    const statusText = document.getElementById('loading-status');
    if (statusText) {
        statusText.textContent = `Error: ${error.message || 'Something went wrong'}`;
        statusText.style.color = '#ff4444';
    }
}

// Throttle function for performance
function throttle(func, limit) {
    let inThrottle;
    return function() {
        const args = arguments;
        const context = this;
        if (!inThrottle) {
            func.apply(context, args);
            inThrottle = true;
            setTimeout(() => inThrottle = false, limit);
        }
    };
}

// Format numbers for display
function formatNumber(num, decimals = 2) {
    if (num === null || num === undefined) return 'N/A';
    return typeof num === 'number' ? num.toFixed(decimals) : num.toString();
}

// Check if device is mobile
function isMobile() {
    return window.innerWidth <= 768 || /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
}

// Info panel toggle functionality
function initializeInfoPanelToggle() {
    const toggleBtn = document.getElementById('info-panel-toggle');
    const infoPanel = document.getElementById('info-panel');
    
    if (toggleBtn && infoPanel) {
        toggleBtn.addEventListener('click', (e) => {
            e.stopPropagation(); // Prevent event bubbling
            infoPanel.classList.toggle('collapsed');
            
            // Update button title
            const isCollapsed = infoPanel.classList.contains('collapsed');
            toggleBtn.title = isCollapsed ? 'Expand panel' : 'Collapse panel';
        });
    }
}
