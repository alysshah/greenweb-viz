// Main application entry point

class GreenWebApp {
    constructor() {
        this.dataFetcher = new DataFetcher();
        this.visualization = null;
        this.websiteData = [];
        this.isLoading = false;
        
        // Make cache management available globally for debugging
        window.cacheManager = {
            stats: () => this.dataFetcher.getCacheStats(),
            clear: () => this.dataFetcher.clearCache(),
            clearAll: () => this.dataFetcher.clearAllCache(),
            clearAndReload: () => {
                this.dataFetcher.clearAllCache();
                console.log('🔄 All cache cleared - refreshing page...');
                setTimeout(() => window.location.reload(), 500);
            }
        };
        
        // Also make dataFetcher globally accessible
        window.dataFetcher = this.dataFetcher;
        
        this.init();
    }

    async init() {
        console.log('🌱 Green Web Constellation starting...');
        
        try {
            // Initialize visualization in preview mode
            this.visualization = new ParticleVisualization('three-canvas');
            this.visualization.enableOrbitControls();
            
            // Set up welcome screen button
            this.setupWelcomeScreen();
            
            console.log('✨ Preview mode ready - click "Analyze the Web" to begin');
            
        } catch (error) {
            handleError(error, 'Application initialization');
            this.showErrorState();
        }
    }

    setupWelcomeScreen() {
        const startButton = document.getElementById('start-analysis');
        console.log('Setting up welcome screen, button found:', !!startButton); // Debug
        
        if (startButton) {
            startButton.addEventListener('click', async () => {
                console.log('🔘 Start button clicked!'); // Debug
                await this.startAnalysis();
            });
        } else {
            console.error('❌ Start button not found!');
        }
    }

    async startAnalysis() {
        console.log('🚀 Starting web analysis...');
        
        try {
            // Hide welcome screen
            const welcomeScreen = document.getElementById('welcome-screen');
            const header = document.getElementById('header');
            
            console.log('Welcome screen element:', !!welcomeScreen); // Debug
            console.log('Header element:', !!header); // Debug
            
            if (welcomeScreen) {
                console.log('Hiding welcome screen...'); // Debug
                welcomeScreen.classList.add('hidden');
            }
            
            if (header) {
                console.log('Showing header...'); // Debug
                header.classList.remove('hidden');
            }
            
            console.log('Starting data loading...'); // Debug
            // Start data loading
            await this.loadData();
            
        } catch (error) {
            console.error('❌ Error in startAnalysis:', error); // Debug
            handleError(error, 'Analysis start');
            this.showErrorState();
        }
    }

    async loadData() {
        if (this.isLoading) return;
        
        this.isLoading = true;
        console.log('🔄 Starting data loading process...');
        
        try {
            console.log('📊 Starting data fetch...');
            updateProgress(5, 'Initializing data fetcher...');
            
            // Fetch all website data
            console.log('🌐 Fetching website data...');
            this.websiteData = await this.dataFetcher.fetchAllData();
            
            console.log('✅ Data loaded successfully:', this.websiteData.length, 'websites');
            console.log('📊 Sample data:', this.websiteData.slice(0, 3));
            
            // Create visualization
            console.log('🎨 Creating visualization...');
            this.showVisualization(this.websiteData);
            
        } catch (error) {
            console.error('❌ Data loading failed completely:', error);
            console.error('❌ Error details:', error.message);
            console.error('❌ Error stack:', error.stack);
            updateProgress(100, 'Loading failed - please refresh the page');
            hideLoading();
        } finally {
            this.isLoading = false;
            console.log('🏁 Data loading process completed');
        }
    }

    showVisualization(data) {
        try {
            // Transition from preview to data mode
            this.visualization.transitionToDataMode(data);
            
            // Hide loading screen
            hideLoading();
            
            // Show Gemini status
            const geminiStatus = document.getElementById('gemini-status');
            if (geminiStatus) {
                geminiStatus.classList.remove('hidden');
            }
            
            // Log success
            console.log('🎨 Visualization created with', data.length, 'particles');
            console.log('🤖 Gemini AI analysis active for enhanced data');
            
            // Show some stats
            this.showStats(data);
            
        } catch (error) {
            handleError(error, 'Visualization creation');
            this.showErrorState();
        }
    }

    showStats(data) {
        const greenSites = data.filter(site => site.green).length;
        const totalCo2 = data.reduce((sum, site) => sum + (site.co2PerPageView || 0), 0);
        const avgCo2 = totalCo2 / data.length;
        
        console.log('📈 Statistics:');
        console.log(`  • Green hosting: ${greenSites}/${data.length} sites (${((greenSites/data.length)*100).toFixed(1)}%)`);
        console.log(`  • Average CO₂: ${avgCo2.toFixed(2)}g per page view`);
        console.log(`  • Total CO₂: ${totalCo2.toFixed(1)}g per page view across all sites`);
        
        // Update header with stats (optional)
        this.updateHeaderStats(greenSites, data.length, avgCo2, totalCo2);
    }

    updateHeaderStats(greenSites, totalSites, avgCo2, totalCo2) {
        const header = document.querySelector('#header p');
        if (header) {
            header.innerHTML = `
                Visualizing ${totalSites} websites<br>
                ${greenSites} green-hosted (${((greenSites/totalSites)*100).toFixed(0)}%)<br>
                ${avgCo2.toFixed(1)}g avg CO₂/visit<br>
                ${totalCo2.toFixed(1)}g total CO₂ overall
            `;
        }
    }

    showErrorState() {
        const loadingDiv = document.getElementById('loading');
        if (loadingDiv) {
            loadingDiv.innerHTML = `
                <div class="loading-text" style="color: #ff4444;">⚠️ Error Loading Data</div>
                <div style="color: #aaaaaa; margin-top: 10px;">
                    There was an issue fetching website data. This could be due to:
                    <ul style="margin: 10px 0; padding-left: 20px;">
                        <li>API rate limits</li>
                        <li>Network connectivity issues</li>
                        <li>CORS restrictions</li>
                    </ul>
                    <button onclick="location.reload()" style="
                        background: #00ff88; 
                        border: none; 
                        color: white; 
                        padding: 10px 20px; 
                        border-radius: 5px; 
                        cursor: pointer;
                        margin-top: 10px;
                    ">Try Again</button>
                </div>
            `;
        }
    }

    generateExtendedSampleData() {
        const baseSites = [
            { domain: 'google.com', green: true, hostedBy: 'Google Inc.', co2: 0.5 },
            { domain: 'youtube.com', green: false, hostedBy: 'Google Inc.', co2: 4.6 },
            { domain: 'facebook.com', green: false, hostedBy: 'Meta', co2: 2.3 },
            { domain: 'wikipedia.org', green: true, hostedBy: 'Wikimedia Foundation', co2: 0.3 },
            { domain: 'twitter.com', green: false, hostedBy: 'Twitter Inc.', co2: 1.8 },
            { domain: 'instagram.com', green: false, hostedBy: 'Meta', co2: 2.1 },
            { domain: 'reddit.com', green: true, hostedBy: 'Reddit Inc.', co2: 1.2 },
            { domain: 'amazon.com', green: true, hostedBy: 'Amazon Web Services', co2: 0.8 },
            { domain: 'netflix.com', green: false, hostedBy: 'Netflix Inc.', co2: 5.2 },
            { domain: 'tiktok.com', green: false, hostedBy: 'ByteDance', co2: 3.4 },
            { domain: 'linkedin.com', green: true, hostedBy: 'Microsoft', co2: 1.1 },
            { domain: 'github.com', green: true, hostedBy: 'Microsoft', co2: 0.6 },
            { domain: 'stackoverflow.com', green: true, hostedBy: 'Stack Overflow', co2: 0.4 },
            { domain: 'discord.com', green: false, hostedBy: 'Discord Inc.', co2: 2.8 },
            { domain: 'zoom.us', green: false, hostedBy: 'Zoom Communications', co2: 1.9 },
            { domain: 'spotify.com', green: true, hostedBy: 'Spotify AB', co2: 1.3 },
            { domain: 'twitch.tv', green: false, hostedBy: 'Amazon Web Services', co2: 4.1 },
            { domain: 'pinterest.com', green: false, hostedBy: 'Pinterest Inc.', co2: 2.0 },
            { domain: 'whatsapp.com', green: false, hostedBy: 'Meta', co2: 1.5 },
            { domain: 'dropbox.com', green: true, hostedBy: 'Dropbox Inc.', co2: 0.9 }
        ];

        // Generate more sample data to reach 50+ sites
        const additionalSites = [
            'apple.com', 'microsoft.com', 'yahoo.com', 'bing.com', 'ebay.com',
            'cnn.com', 'bbc.com', 'nytimes.com', 'medium.com', 'quora.com',
            'salesforce.com', 'adobe.com', 'paypal.com', 'shopify.com', 'wordpress.com',
            'tumblr.com', 'vimeo.com', 'soundcloud.com', 'slack.com', 'trello.com',
            'notion.so', 'figma.com', 'canva.com', 'unsplash.com', 'behance.net',
            'dribbble.com', 'codepen.io', 'jsbin.com', 'glitch.com', 'replit.com'
        ];

        const allSites = [];

        // Add base sites
        baseSites.forEach((site, index) => {
            allSites.push({
                rank: index + 1,
                domain: site.domain,
                green: site.green,
                hostedBy: site.hostedBy,
                co2PerPageView: site.co2,
                energyPerVisit: site.co2 * 2
            });
        });

        // Add additional sites with random data
        additionalSites.forEach((domain, index) => {
            const rank = baseSites.length + index + 1;
            const green = Math.random() > 0.6; // 40% chance of being green
            const co2 = Math.random() * 4 + 0.2; // 0.2 to 4.2g
            
            allSites.push({
                rank: rank,
                domain: domain,
                green: green,
                hostedBy: green ? 'Green Host Inc.' : 'Standard Host Ltd.',
                co2PerPageView: parseFloat(co2.toFixed(2)),
                energyPerVisit: parseFloat((co2 * 2).toFixed(2))
            });
        });

        return allSites.slice(0, 200); // Return first 200 sites
    }

    // Public methods for external control
    refresh() {
        this.loadData();
    }

    getVisualization() {
        return this.visualization;
    }

    getData() {
        return this.websiteData;
    }
}

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    console.log('🚀 DOM loaded, starting Green Web Constellation...');
    
    try {
        // Create global app instance
        window.greenWebApp = new GreenWebApp();
        
        // Add some developer helpers
        window.app = window.greenWebApp; // Shortcut for console debugging
        
        // Initialize info panel toggle
        initializeInfoPanelToggle();
        
        console.log('✅ App initialized successfully');
        console.log('💡 Tip: Use window.app to access the application instance from console');
    } catch (error) {
        console.error('❌ Failed to initialize app:', error);
    }
});
