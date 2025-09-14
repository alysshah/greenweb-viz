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
    
    // Update content
    if (siteName) {
        siteName.innerHTML = `<span class="site-text">${website.domain}</span> <span class="external-link">↗</span>`;
        siteName.onclick = () => {
            window.open(`https://${website.domain}`, '_blank');
        };
    }
    if (siteRank) siteRank.textContent = `#${website.rank}`;
    
    // Use Gemini translations if available, otherwise show raw data or unavailable
    if (siteCo2) {
        if (website.co2Translation) {
            siteCo2.textContent = website.co2Translation;
        } else if (website.co2PerPageView) {
            siteCo2.textContent = `${website.co2PerPageView.toFixed(2)}g`;
        } else {
            siteCo2.textContent = 'Data unavailable';
        }
    }
    
    // Display estimated page size
    if (pageSize && pageSizeRow) {
        if (website.estimatedPageSize) {
            const sizeInMB = (website.estimatedPageSize / 1024 / 1024).toFixed(1);
            pageSize.textContent = `${sizeInMB} MB`;
            pageSizeRow.style.display = 'flex';
        } else {
            pageSize.textContent = 'Data unavailable';
            pageSizeRow.style.display = 'flex';
        }
    }
    
    if (siteEnergy) {
        if (website.energyTranslation) {
            siteEnergy.textContent = website.energyTranslation;
        } else if (website.energyPerVisit) {
            // Show more precision for very small energy values
            const energy = website.energyPerVisit;
            if (energy < 0.001) {
                siteEnergy.textContent = `${(energy * 1000).toFixed(3)} mWh`; // Show in milliwatt-hours
            } else {
                siteEnergy.textContent = `${energy.toFixed(4)} kWh`;
            }
        } else {
            siteEnergy.textContent = 'Data unavailable';
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


// Get color based on green hosting status
function getParticleColor(isGreen) {
    return isGreen ? 0x00ff44 : 0x051a05; // Pure bright green or very dark forest green (lifeless)
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
