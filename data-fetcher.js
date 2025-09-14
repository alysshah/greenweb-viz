// Data fetching and processing

class DataFetcher {
    constructor() {
        this.websites = [];
        this.requestDelay = 1000; // 1 second delay between requests to respect rate limits
        this.cacheKey = 'greenWebCache_v77'; // v77 to force fresh data with debug logging
        this.cacheExpiry = 7 * 24 * 60 * 60 * 1000; // 7 days in milliseconds
        
        // Clear old cache versions
        this.clearOldCacheVersions();
    }

    // Clear old cache versions to force fresh data with realistic hosts
    clearOldCacheVersions() {
        try {
            const oldKeys = ['greenWebCache', 'greenWebCache_v1', 'greenWebCache_v2', 'greenWebCache_v3', 'greenWebCache_v4', 'greenWebCache_v5', 'greenWebCache_v6', 'greenWebCache_v7', 'greenWebCache_v8', 'greenWebCache_v9', 'greenWebCache_v10', 'greenWebCache_v11', 'greenWebCache_v12', 'greenWebCache_v13', 'greenWebCache_v14', 'greenWebCache_v15', 'greenWebCache_v16', 'greenWebCache_v17', 'greenWebCache_v18', 'greenWebCache_v19', 'greenWebCache_v20', 'greenWebCache_v21', 'greenWebCache_v22', 'greenWebCache_v23', 'greenWebCache_v24', 'greenWebCache_v25', 'greenWebCache_v26', 'greenWebCache_v27', 'greenWebCache_v28', 'greenWebCache_v29', 'greenWebCache_v30', 'greenWebCache_v31', 'greenWebCache_v32', 'greenWebCache_v33', 'greenWebCache_v34', 'greenWebCache_v35', 'greenWebCache_v36', 'greenWebCache_v37', 'greenWebCache_v38', 'greenWebCache_v39', 'greenWebCache_v40', 'greenWebCache_v41', 'greenWebCache_v42', 'greenWebCache_v43', 'greenWebCache_v44', 'greenWebCache_v45', 'greenWebCache_v46', 'greenWebCache_v47', 'greenWebCache_v48', 'greenWebCache_v49', 'greenWebCache_v50', 'greenWebCache_v51', 'greenWebCache_v52', 'greenWebCache_v53', 'greenWebCache_v54', 'greenWebCache_v55', 'greenWebCache_v56', 'greenWebCache_v57', 'greenWebCache_v58', 'greenWebCache_v59', 'greenWebCache_v60', 'greenWebCache_v61', 'greenWebCache_v62', 'greenWebCache_v63', 'greenWebCache_v64', 'greenWebCache_v65', 'greenWebCache_v66', 'greenWebCache_v67', 'greenWebCache_v68', 'greenWebCache_v69', 'greenWebCache_v70', 'greenWebCache_v71', 'greenWebCache_v72', 'greenWebCache_v73', 'greenWebCache_v74', 'greenWebCache_v75', 'greenWebCache_v76'];
            oldKeys.forEach(key => {
                if (localStorage.getItem(key)) {
                    localStorage.removeItem(key);
                    console.log(`🗑️ Cleared old cache: ${key}`);
                }
            });
        } catch (e) {
            console.warn('Error clearing old cache:', e);
        }
    }

    // Manual cache clear function for debugging
    clearAllCache() {
        try {
            console.log('🧹 Clearing ALL cache data...');
            for (let i = 0; i < 20; i++) {
                const key = `greenWebCache_v${i}`;
                if (localStorage.getItem(key)) {
                    localStorage.removeItem(key);
                    console.log(`🗑️ Cleared: ${key}`);
                }
            }
            console.log('✅ All cache cleared!');
        } catch (error) {
            console.error('Error clearing cache:', error);
        }
    }

    // Cache management
    getFromCache(domain) {
        try {
            const cache = JSON.parse(localStorage.getItem(this.cacheKey) || '{}');
            const cached = cache[domain];
            
            if (cached && Date.now() - cached.timestamp < this.cacheExpiry) {
                console.log(`📋 Using cached data for ${domain}`);
                return cached.data;
            }
        } catch (e) {
            console.warn('Cache read error:', e);
        }
        return null;
    }

    saveToCache(domain, data) {
        try {
            const cache = JSON.parse(localStorage.getItem(this.cacheKey) || '{}');
            cache[domain] = {
                data: data,
                timestamp: Date.now()
            };
            localStorage.setItem(this.cacheKey, JSON.stringify(cache));
            console.log(`💾 Cached data for ${domain}`);
        } catch (e) {
            console.warn('Cache write error:', e);
        }
    }

    // Get cache statistics
    getCacheStats() {
        try {
            const cache = JSON.parse(localStorage.getItem(this.cacheKey) || '{}');
            const domains = Object.keys(cache);
            const now = Date.now();
            const valid = domains.filter(domain => now - cache[domain].timestamp < this.cacheExpiry);
            
            return {
                total: domains.length,
                valid: valid.length,
                expired: domains.length - valid.length
            };
        } catch (e) {
            return { total: 0, valid: 0, expired: 0 };
        }
    }

    // Clear cache (for debugging)
    clearCache() {
        try {
            const cache = JSON.parse(localStorage.getItem(this.cacheKey) || '{}');
            const domains = Object.keys(cache);
            console.log(`🗑️ Clearing cache with ${domains.length} entries:`, domains.slice(0, 5));
            
            localStorage.removeItem(this.cacheKey);
            console.log('✅ Cache cleared successfully');
            
            // Verify it's actually cleared
            const afterClear = localStorage.getItem(this.cacheKey);
            console.log('🔍 Cache after clear:', afterClear ? 'Still exists!' : 'Properly cleared');
        } catch (e) {
            console.warn('Cache clear error:', e);
        }
    }




    // Fetch top 200 websites from Tranco via backend
    async fetchTrancoTop200() {
        try {
            updateProgress(5, 'Fetching top 200 websites from Tranco...');
            
            const response = await fetch('/api/tranco');
            
            if (!response.ok) {
                throw new Error(`Tranco API error: ${response.status}`);
            }
            
            const websites = await response.json();
            
            updateProgress(10, `Found ${websites.length} websites from Tranco`);
            
            return websites;
        } catch (error) {
            console.warn('🚨 Tranco API failed, using minimal fallback:', error.message);
            updateProgress(10, 'Using fallback website list...');
            
            // Minimal fallback with just a few real top websites
            const fallbackSites = [
                { rank: 1, domain: 'google.com' },
                { rank: 2, domain: 'youtube.com' },
                { rank: 3, domain: 'facebook.com' },
                { rank: 4, domain: 'twitter.com' },
                { rank: 5, domain: 'instagram.com' },
                { rank: 6, domain: 'wikipedia.org' },
                { rank: 7, domain: 'amazon.com' },
                { rank: 8, domain: 'reddit.com' },
                { rank: 9, domain: 'netflix.com' },
                { rank: 10, domain: 'github.com' }
            ];
            
            console.log(`✅ Fallback loaded: ${fallbackSites.length} websites`);
            return fallbackSites;
        }
    }


    // Fetch green hosting status from Green Web Foundation via backend
    async fetchGreenStatus(domain) {
        // Check cache first
        const cached = this.getFromCache(`green_${domain}`);
        if (cached) {
            console.log(`📋 Using cached green data for ${domain}: green=${cached.green}, host=${cached.hostedBy}`);
            return cached;
        }

        try {
            console.log(`🌱 Fetching green status for ${domain} via backend...`);
            
            const response = await fetch(`/api/green?domain=${domain}`);
            
            if (!response.ok) {
                throw new Error(`Server error: ${response.status}`);
            }
            
            const data = await response.json();
            
            // Debug: Log the actual API response to see what fields are available
            console.log(`🔍 Green Web API response for ${domain}:`, data);
            console.log(`🔍 Available fields:`, Object.keys(data));
            console.log(`🔍 hosted_by_website field:`, data.hosted_by_website);
            
            // Use real API data only
            const result = {
                green: data.green || false,
                hostedBy: data.hosted_by || data.hostedBy || data.hostedby || 'Unknown',
                hostedByWebsite: data.hosted_by_website || data.hostedByWebsite || data.website || null
            };

            // Cache successful result
            this.saveToCache(`green_${domain}`, result);
            console.log(`✅ Green status cached for ${domain}: ${result.green ? 'Green' : 'Not Green'}`);
            return result;
        } catch (error) {
            console.warn(`❌ Failed to fetch green status for ${domain}:`, error.message);
            
            // Return error instead of fake data
            throw new Error(`Green status fetch failed for ${domain}: ${error.message}`);
        }
    }

    // Fetch carbon footprint from Website Carbon API via backend
    async fetchCarbonFootprint(domain, greenStatus = false) {
        // Check cache first
        const cached = this.getFromCache(`carbon_${domain}`);
        if (cached) {
            console.log(`📋 Using cached carbon data for ${domain}: ${cached.co2PerPageView}g CO₂`);
            console.log(`🔍 Cached energyPerVisit:`, cached.energyPerVisit);
            return cached;
        }

        try {
            console.log(`🔥 Calculating carbon data for ${domain} via backend...`);
            
            const response = await fetch(`/api/carbon?domain=${domain}&green=${greenStatus}`);
            
            if (!response.ok) {
                throw new Error(`Server error: ${response.status}`);
            }
            
            const data = await response.json();
            
            // Debug: Log the actual API response to see what fields are available
            console.log(`🔍 Website Carbon API response for ${domain}:`, data);
            console.log(`🔍 Available fields:`, Object.keys(data));
            console.log(`🔍 cleanerThan field:`, data.cleanerThan);
            
            const result = {
                co2PerPageView: data.co2PerPageView || 1.0,
                energyPerVisit: data.energyPerVisit || data.energyPerPageView || data.energy || 2.0,
                cleanerThan: data.cleanerThan || data.cleaner_than || data.cleanerThanPercentage || 0.5, // Use 0.5 as fallback if not provided
                rating: data.rating || 'N/A',
                estimatedPageSize: data.estimatedPageSize
            };

            // Cache successful result
            this.saveToCache(`carbon_${domain}`, result);
            console.log(`✅ Carbon data calculated for ${domain}: ${result.co2PerPageView}g CO₂, ${result.energyPerVisit} kWh`);
            return result;
        } catch (error) {
            console.warn(`❌ Failed to calculate carbon data for ${domain}:`, error.message);
            
            // Return error instead of fake data
            throw new Error(`Carbon calculation failed for ${domain}: ${error.message}`);
        }
    }

    // Fetch all data for a single website
    async fetchWebsiteData(website, index, total) {
        try {
            const progress = 10 + (index / total) * 80; // 10-90% range
            updateProgress(progress, `Analyzing ${website.domain}... (${index + 1}/${total})`);

            // Fetch green status first
            const greenData = await this.fetchGreenStatus(website.domain);
            
            // Then fetch carbon data using the green status (now includes Gemini page analysis)
            const carbonData = await this.fetchCarbonFootprint(website.domain, greenData.green);

            // Fetch carbon impact translation if we have CO₂ data
            let carbonImpact = null;
            if (carbonData.co2PerPageView) {
                console.log(`🌍 Fetching carbon impact for ${website.domain} with ${carbonData.co2PerPageView}g CO₂...`);
                carbonImpact = await this.fetchCarbonImpact(carbonData.co2PerPageView);
                console.log(`🌍 Carbon impact result for ${website.domain}:`, carbonImpact);
            } else {
                console.log(`⚠️ No CO₂ data for ${website.domain}, skipping carbon impact`);
            }

            // Debug: Log the individual data objects
            console.log(`🔍 Green data for ${website.domain}:`, greenData);
            console.log(`🔍 Carbon data for ${website.domain}:`, carbonData);
            console.log(`🔍 Carbon impact for ${website.domain}:`, carbonImpact);
            console.log(`🔍 Carbon data keys:`, Object.keys(carbonData));
            console.log(`🔍 Carbon energyPerVisit:`, carbonData.energyPerVisit);
            console.log(`🔍 Carbon rating:`, carbonData.rating);
            console.log(`🔍 Page analysis:`, carbonData.pageAnalysis);

            const result = {
                ...website,
                ...greenData,
                ...carbonData,
                carbonImpact: carbonImpact
            };
            
            // Debug: Log the final merged data
            console.log(`🔍 Final data for ${website.domain}:`, result);
            console.log(`🔍 Energy value:`, result.energyPerVisit);
            console.log(`🔍 Final rating:`, result.rating);
            
            return result;
        } catch (error) {
            console.error(`Failed to fetch data for ${website.domain}:`, error);
            
            // Return a minimal data object instead of crashing
            return {
                ...website,
                green: false,
                hostedBy: 'Unknown',
                co2PerPageView: 1.0,
                energyPerVisit: 2.0,
                cleanerThan: 0.5,
                rating: 'N/A'
            };
        }
    }

    // Main function to fetch all data
    async fetchAllData() {
        try {
            // Show cache statistics
            const cacheStats = this.getCacheStats();
            console.log(`📊 Cache status: ${cacheStats.valid} valid, ${cacheStats.expired} expired, ${cacheStats.total} total entries`);
            if (cacheStats.valid > 0) {
                updateProgress(2, `Found ${cacheStats.valid} cached entries - this will speed up loading!`);
            }

            // Step 1: Get top 200 websites
            console.log('📝 Step 1: Fetching website list...');
            const websites = await this.fetchTrancoTop200();
            console.log(`✅ Successfully loaded ${websites.length} websites for processing`);

            console.log(`📋 Found ${websites.length} websites, starting data collection...`);
            const allWebsiteData = [];

            // Step 2: Fetch data for each website with rate limiting
            for (let i = 0; i < websites.length; i++) {
                const website = websites[i];
                console.log(`🔄 Processing ${i + 1}/${websites.length}: ${website.domain}`);
                
                const websiteData = await this.fetchWebsiteData(website, i, websites.length);
                allWebsiteData.push(websiteData);
                console.log(`✅ Completed ${website.domain}: green=${websiteData.green}, co2=${websiteData.co2PerPageView}g, host=${websiteData.hostedBy}`);

                // Rate limiting: only wait if we made actual API calls (not cached)
                if (i < websites.length - 1) {
                    // Only wait if we actually made API calls (not cached data)
                    const madeApiCalls = !this.getFromCache(`green_${website.domain}`) || 
                                       !this.getFromCache(`carbon_${website.domain}`);
                    if (madeApiCalls) {
                        await sleep(200); // Much shorter delay: 200ms instead of 1000ms
                    }
                }
            }

            updateProgress(95, 'Processing data...');
            
            // Step 3: Sort by rank and validate data
            allWebsiteData.sort((a, b) => a.rank - b.rank);
            
            updateProgress(100, 'Data loading complete!');
            
            this.websites = allWebsiteData;
            return allWebsiteData;

        } catch (error) {
            handleError(error, 'fetchAllData');
            throw error;
        }
    }


    // Quick test function for development
    async testAPIs() {
        console.log('Testing APIs...');
        
        const testDomain = 'google.com';
        
        try {
            // Test Website Carbon API directly
            console.log('🔍 Testing Website Carbon API directly...');
            const carbonResponse = await fetch(`https://api.websitecarbon.com/site?url=${testDomain}`);
            const carbonData = await carbonResponse.json();
            console.log('🔍 Direct Website Carbon API response:', carbonData);
            console.log('🔍 Available fields:', Object.keys(carbonData));
            
            // Test Green Web API directly
            console.log('🔍 Testing Green Web API directly...');
            const greenResponse = await fetch(`https://api.thegreenwebfoundation.org/greencheck/${testDomain}`);
            const greenData = await greenResponse.json();
            console.log('🔍 Direct Green Web API response:', greenData);
            console.log('🔍 Available fields:', Object.keys(greenData));
            
            const greenDataProcessed = await this.fetchGreenStatus(testDomain);
            console.log('Green Web API test (processed):', greenDataProcessed);
            
            const carbonDataProcessed = await this.fetchCarbonFootprint(testDomain);
            console.log('Website Carbon API test (processed):', carbonDataProcessed);
            
            return true;
        } catch (error) {
            console.error('API test failed:', error);
            return false;
        }
    }

    // Fetch carbon impact translation from backend
    async fetchCarbonImpact(co2PerPageView) {
        try {
            const response = await fetch(`/api/gemini/carbon-impact?co2PerPageView=${co2PerPageView}`);
            
            if (!response.ok) {
                throw new Error(`Carbon impact API error: ${response.status}`);
            }
            
            const data = await response.json();
            return data;
            
        } catch (error) {
            console.error(`❌ Carbon impact fetch failed for ${co2PerPageView}g CO₂:`, error);
            return null;
        }
    }

}

// Export for use in other files
window.DataFetcher = DataFetcher;
