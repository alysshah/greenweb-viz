const express = require('express');
const cors = require('cors');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const app = express();

// Initialize Gemini AI
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || 'your-api-key-here');

app.use(cors());
app.use(express.json());

// Simple cache to avoid repeated API calls
const cache = new Map();

// Carbon data endpoint - using the new /data endpoint
app.get('/api/carbon', async (req, res) => {
    const domain = req.query.domain;
    const green = req.query.green === 'true' ? 1 : 0; // Convert boolean to 1/0
    
    try {
        // Check cache first
        if (cache.has(`carbon_${domain}`)) {
            console.log(`⚡ Using cached carbon data for ${domain}`);
            return res.json(cache.get(`carbon_${domain}`));
        }
        
        console.log(`🔥 Calculating carbon data for ${domain}...`);
        
        // Get Gemini page size estimation first
        let estimatedBytes;
        try {
            const geminiResponse = await fetch(`http://localhost:3000/api/gemini/page-size?domain=${domain}`);
            
            if (geminiResponse.ok) {
                const geminiData = await geminiResponse.json();
                estimatedBytes = geminiData.estimatedPageSize;
                console.log(`🤖 Gemini estimated page size for ${domain}: ${estimatedBytes} bytes`);
            } else {
                console.warn(`⚠️ Gemini API returned error for ${domain}`);
                throw new Error('Gemini page size estimation failed');
            }
        } catch (geminiError) {
            console.warn(`⚠️ Gemini page size estimation failed for ${domain}:`, geminiError.message);
            
            // Fallback to simple estimation based on domain type
            if (domain.includes('amazon') || domain.includes('ebay') || domain.includes('shopify')) {
                estimatedBytes = 2000000; // 2MB for e-commerce
            } else if (domain.includes('youtube') || domain.includes('netflix') || domain.includes('twitch')) {
                estimatedBytes = 5000000; // 5MB for video sites
            } else if (domain.includes('facebook') || domain.includes('instagram') || domain.includes('twitter')) {
                estimatedBytes = 3000000; // 3MB for social media
            } else if (domain.includes('google') || domain.includes('wikipedia') || domain.includes('github')) {
                estimatedBytes = 500000; // 500KB for search/utility sites
            } else {
                estimatedBytes = 1000000; // 1MB default
            }
            
            console.log(`📊 Using fallback page size for ${domain}: ${estimatedBytes} bytes`);
        }
        
        console.log(`📊 Final page size for ${domain}: ${estimatedBytes} bytes`);
        
        // Use the new /data endpoint
        const response = await fetch(`https://api.websitecarbon.com/data?bytes=${estimatedBytes}&green=${green}`);
        
        if (!response.ok) {
            throw new Error(`API error: ${response.status}`);
        }
        
        const data = await response.json();
        
        // Transform the response to match our expected format
        const transformedData = {
            co2PerPageView: data.gco2e || 1.0,
            energyPerVisit: data.statistics?.energy || 2.0,
            cleanerThan: data.cleanerThan || 0.5,
            bytes: data.bytes,
            green: data.green === 1,
            rating: data.rating,
            estimatedPageSize: estimatedBytes
        };
        
        // Cache for 1 hour
        cache.set(`carbon_${domain}`, transformedData);
        console.log(`✅ Carbon data calculated for ${domain}: ${transformedData.co2PerPageView}g CO₂`);
        
        res.json(transformedData);
    } catch (error) {
        console.error(`❌ Carbon API error for ${domain || 'unknown'}:`, error.message);
        res.status(500).json({ error: 'Failed to calculate carbon data' });
    }
});


// Green hosting endpoint
app.get('/api/green', async (req, res) => {
    const domain = req.query.domain;
    
    try {
        // Check cache first
        if (cache.has(`green_${domain}`)) {
            console.log(`📋 Using cached green data for ${domain}`);
            return res.json(cache.get(`green_${domain}`));
        }
        
        console.log(`🌱 Fetching green data for ${domain}...`);
        const response = await fetch(`https://api.thegreenwebfoundation.org/greencheck/${domain}`);
        
        if (!response.ok) {
            throw new Error(`API error: ${response.status}`);
        }
        
        const data = await response.json();
        
        // Cache for 1 hour
        cache.set(`green_${domain}`, data);
        console.log(`✅ Green data cached for ${domain}`);
        
        res.json(data);
    } catch (error) {
        console.error(`❌ Green API error for ${domain || 'unknown'}:`, error.message);
        res.status(500).json({ error: 'Failed to fetch green data' });
    }
});

// Tranco API endpoint (to bypass CORS)
app.get('/api/tranco', async (req, res) => {
    try {
        console.log('📝 Fetching Tranco top 200 websites...');
        
        // First, get the latest list metadata (try today, then yesterday)
        const today = new Date().toISOString().slice(0, 10).replace(/-/g, '');
        const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().slice(0, 10).replace(/-/g, '');
        
        console.log(`📅 Trying list for date: ${today}`);
        let listResponse = await fetch(`https://tranco-list.eu/api/lists/date/${today}`);
        
        // If today's list isn't available, try yesterday
        if (!listResponse.ok) {
            console.log(`📅 Today's list not available, trying: ${yesterday}`);
            listResponse = await fetch(`https://tranco-list.eu/api/lists/date/${yesterday}`);
        }
        
        if (!listResponse.ok) {
            throw new Error(`Tranco list API error: ${listResponse.status}`);
        }
        
        const listData = await listResponse.json();
        console.log(`📋 List ID: ${listData.list_id}, Available: ${listData.available}`);
        
        if (!listData.available) {
            throw new Error('Latest list not available yet');
        }
        
        // Now fetch the actual list data
        const downloadResponse = await fetch(listData.download);
        
        if (!downloadResponse.ok) {
            throw new Error(`Tranco download error: ${downloadResponse.status}`);
        }
        
        const csvText = await downloadResponse.text();
        
        // Parse CSV and return as JSON (limit to top 200)
        const lines = csvText.trim().split('\n').slice(0, 200);
        const websites = lines.map((line, index) => {
            const [rank, domain] = line.split(',');
            return {
                rank: parseInt(rank) || index + 1,
                domain: domain?.trim() || `unknown${index + 1}.com`
            };
        });
        
        console.log(`✅ Tranco data fetched: ${websites.length} websites`);
        res.json(websites);
        
    } catch (error) {
        console.error('❌ Tranco API error:', error.message);
        res.status(500).json({ error: 'Failed to fetch Tranco data' });
    }
});

// Gemini AI endpoint for page size estimation only
app.get('/api/gemini/page-size', async (req, res) => {
    const domain = req.query.domain;
    
    try {
        // Check cache first
        if (cache.has(`page_size_${domain}`)) {
            console.log(`⚡ Using cached page size for ${domain}`);
            return res.json(cache.get(`page_size_${domain}`));
        }
        
        console.log(`🤖 Estimating page size for ${domain} with Gemini AI...`);
        
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
        
        // More specific prompt for page size estimation
        const prompt = `
You are a web performance expert. Research and estimate the typical homepage size in bytes for ${domain}.

Consider these real-world examples for reference:
- Google: ~380 KB (lightweight search)
- YouTube: ~2,400 KB (heavy video content)
- Amazon: ~3,600 KB (e-commerce with images)
- New York Times: ~5,800 KB (news with ads)
- Time Magazine: ~4,100 KB (magazine with media)

For ${domain}, analyze:
- What type of website is it? (search, social media, e-commerce, news, video, etc.)
- What content does it typically have? (images, videos, ads, tracking scripts, etc.)
- Is it optimized like Google or heavy like news sites?
- Consider modern web practices and typical page weights

Research online if needed to get accurate information about ${domain}.

Respond with JSON only:
{
  "estimatedPageSize": 2500000
}
`;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();
        
        // Parse JSON response
        let analysis;
        try {
            const jsonMatch = text.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                analysis = JSON.parse(jsonMatch[0]);
            } else {
                throw new Error('No JSON found in response');
            }
        } catch (parseError) {
            console.warn(`⚠️ Failed to parse Gemini response for ${domain}`);
            throw new Error('Failed to parse Gemini response');
        }
        
        
        // Cache for 24 hours
        cache.set(`page_size_${domain}`, analysis);
        console.log(`✅ Page size estimated for ${domain}: ${analysis.estimatedPageSize} bytes`);
        
        res.json(analysis);
        
    } catch (error) {
        console.error(`❌ Gemini page size estimation failed for ${domain}:`, error.message);
        res.status(500).json({ 
            error: 'Page size analysis unavailable',
            message: 'Unable to estimate page size at this time'
        });
    }
});

// Gemini AI endpoint for page analysis and data translation
app.post('/api/gemini/analyze', async (req, res) => {
    const { domain, pageData, carbonData } = req.body;
    
    try {
        // Check cache first
        if (cache.has(`gemini_${domain}`)) {
            console.log(`⚡ Using cached Gemini analysis for ${domain}`);
            return res.json(cache.get(`gemini_${domain}`));
        }
        
        console.log(`🤖 Analyzing ${domain} with Gemini AI...`);
        
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
        
        // Create prompt for page size estimation and data translation
        const prompt = `
You are an expert web performance analyst. Analyze this website and provide detailed insights:

Domain: ${domain}
Page Title: ${pageData?.title || 'Unknown'}
Meta Description: ${pageData?.description || 'Unknown'}
Page Type: ${pageData?.type || 'Unknown'}

Current Carbon Data:
- CO₂ per visit: ${carbonData?.co2PerPageView || 'Unknown'}g
- Energy per visit: ${carbonData?.energyPerVisit || 'Unknown'} kWh
- Cleaner than: ${carbonData?.cleanerThan || 'Unknown'}% of sites
- Green hosting: ${carbonData?.green || 'Unknown'}

For page size estimation, consider:
- Domain type (e-commerce, social media, news, search, etc.)
- Typical content for this type of site (images, videos, ads, scripts)
- Modern web standards and optimization practices
- Mobile vs desktop considerations
- CDN usage and caching strategies

For translations, make them relatable and educational:
- Use everyday objects and activities people understand
- Be specific and accurate
- Make environmental impact clear

Please provide:
1. Estimated page size in bytes (realistic based on domain analysis)
2. Page size breakdown explanation (what contributes to the size)
3. Translate CO₂ data into relatable terms
4. Translate energy data into relatable terms  
5. Brief website description (1-2 sentences)
6. Cleaner than percentage in engaging way

Respond in JSON format:
{
  "estimatedPageSize": 15000000,
  "pageSizeBreakdown": "Typical e-commerce site with product images, reviews, and tracking scripts",
  "co2Translation": "0.21g CO₂ = 1.5 minutes of phone charging",
  "energyTranslation": "0.00 kWh = 0.1% of a light bulb's hourly usage", 
  "websiteDescription": "Google - Search engine and cloud services",
  "cleanerThanTranslation": "This site is cleaner than 51% of websites"
}
`;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();
        
        // Parse JSON response
        let analysis;
        try {
            // Extract JSON from response (in case there's extra text)
            const jsonMatch = text.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                analysis = JSON.parse(jsonMatch[0]);
            } else {
                throw new Error('No JSON found in response');
            }
        } catch (parseError) {
            console.warn(`⚠️ Failed to parse Gemini response for ${domain}, using fallback`);
            analysis = {
                estimatedPageSize: 5000000, // 5MB fallback
                pageSizeBreakdown: `Page size analysis unavailable`,
                co2Translation: `${carbonData?.co2PerPageView || 0}g CO₂ per visit`,
                energyTranslation: `${carbonData?.energyPerVisit || 0} kWh per visit`,
                websiteDescription: `${domain} - Website`,
                cleanerThanTranslation: `Cleaner than ${Math.round((carbonData?.cleanerThan || 0.5) * 100)}% of sites`
            };
        }
        
        // Cache for 24 hours
        cache.set(`gemini_${domain}`, analysis);
        console.log(`✅ Gemini analysis completed for ${domain}`);
        
        res.json(analysis);
        
    } catch (error) {
        console.error(`❌ Gemini API error for ${domain}:`, error.message);
        
        // Fallback to basic analysis
        const fallbackAnalysis = {
            estimatedPageSize: 5000000, // 5MB fallback
            pageSizeBreakdown: `Page size analysis unavailable`,
            co2Translation: `${carbonData?.co2PerPageView || 0}g CO₂ per visit`,
            energyTranslation: `${carbonData?.energyPerVisit || 0} kWh per visit`,
            websiteDescription: `${domain} - Website`,
            cleanerThanTranslation: `Cleaner than ${Math.round((carbonData?.cleanerThan || 0.5) * 100)}% of sites`
        };
        
        res.json(fallbackAnalysis);
    }
});

// Gemini AI endpoint for carbon impact translation
app.get('/api/gemini/carbon-impact', async (req, res) => {
    const co2PerPageView = parseFloat(req.query.co2PerPageView);
    
    if (!co2PerPageView || isNaN(co2PerPageView)) {
        return res.status(400).json({ error: 'co2PerPageView parameter required' });
    }
    
    try {
        // Check cache first
        const cacheKey = `carbon_impact_${co2PerPageView}`;
        if (cache.has(cacheKey)) {
            console.log(`⚡ Using cached carbon impact for ${co2PerPageView}g CO₂`);
            return res.json(cache.get(cacheKey));
        }
        
        console.log(`🌍 Generating carbon impact translation for ${co2PerPageView}g CO₂ per visit...`);
        
        // Calculate total CO₂ for 10,000 visits per year
        const totalCO2 = co2PerPageView * 10000; // 10,000 visits per year
        
        // Randomly select one of three comparison types
        const comparisonTypes = [
            'phone_calls',
            'tree_absorption', 
            'car_idling'
        ];
        const selectedType = comparisonTypes[Math.floor(Math.random() * comparisonTypes.length)];
        
        let comparison;
        
        switch (selectedType) {
            case 'phone_calls':
                // 50-60g CO₂ per minute of phone calls (using 55g average)
                const phoneMinutes = totalCO2 / 55;
                comparison = {
                    type: 'phone_calls',
                    amount: Math.round(phoneMinutes),
                    unit: 'minutes',
                    icon: '📞',
                    description: `10,000 visits consumes about as much as ${Math.round(phoneMinutes)} minutes of phone calls`
                };
                break;
                
            case 'tree_absorption':
                // 25kg = 25,000g CO₂ per tree per year
                const trees = totalCO2 / 25000;
                comparison = {
                    type: 'tree_absorption',
                    amount: trees.toFixed(2),
                    unit: 'trees',
                    icon: '🌳',
                    description: `100,000 visits consumes about as much as ${trees.toFixed(2)} trees can absorb in a year`
                };
                break;
                
            case 'car_idling':
                // 4 pounds = 1,814g CO₂ per hour of car idling
                const carHours = totalCO2 / 1814;
                const carMinutes = carHours * 60;
                comparison = {
                    type: 'car_idling',
                    amount: carMinutes.toFixed(0),
                    unit: 'minutes',
                    icon: '🚗',
                    description: `10,000 visits consumes about as much as ${carMinutes.toFixed(0)} minutes of car idling`
                };
                break;
        }
        
        // Cache for 24 hours
        cache.set(cacheKey, comparison);
        console.log(`✅ Carbon impact generated for ${co2PerPageView}g CO₂: ${comparison.description}`);
        
        res.json(comparison);
        
    } catch (error) {
        console.error(`❌ Carbon impact generation failed for ${co2PerPageView}g CO₂:`, error.message);
        res.status(500).json({ 
            error: 'Carbon impact translation unavailable',
            message: 'Unable to generate environmental impact comparison at this time'
        });
    }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.json({ status: 'OK', message: 'Server is running' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`🌐 Health check: http://localhost:${PORT}/api/health`);
});
