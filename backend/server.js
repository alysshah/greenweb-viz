const express = require('express');
const cors = require('cors');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const app = express();

// Initialize Gemini AI
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || 'your-api-key-here');

app.use(cors());
app.use(express.json());

// Serve static files only in development (not on Vercel)
if (process.env.NODE_ENV !== 'production') {
    // Serve static files from the parent directory for local development
    app.use(express.static('../'));
}

// Simple cache to avoid repeated API calls
const cache = new Map();

// Cache management endpoint
app.post('/api/clear-cache', (req, res) => {
    cache.clear();
    console.log('🗑️ Backend cache cleared');
    res.json({ success: true, message: 'Cache cleared' });
});

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
            
            // Use a default page size when Gemini fails
            estimatedBytes = 1000000; // 1MB default
            console.log(`📊 Using default page size for ${domain}: ${estimatedBytes} bytes`);
        }
        
        // Use the new /data endpoint
        const response = await fetch(`https://api.websitecarbon.com/data?bytes=${estimatedBytes}&green=${green}`);
        
        if (!response.ok) {
            throw new Error(`API error: ${response.status}`);
        }
        
        const data = await response.json();
        
        // Transform the response to match our expected format
        const transformedData = {
            co2PerPageView: data.gco2e || null,
            energyPerVisit: data.statistics?.energy || null,
            cleanerThan: data.cleanerThan || null,
            bytes: data.bytes,
            green: data.green === 1,
            rating: data.rating || 'Unavailable',
            estimatedPageSize: estimatedBytes,
            unavailable: false // Only set to true if the API call completely fails
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
        
        // Try multiple recent dates to find an available list
        const dates = [];
        for (let i = 0; i < 7; i++) {
            const date = new Date(Date.now() - i * 24 * 60 * 60 * 1000);
            dates.push(date.toISOString().slice(0, 10).replace(/-/g, ''));
        }
        
        let listData = null;
        let lastError = null;
        
        for (const date of dates) {
            try {
                console.log(`📅 Trying list for date: ${date}`);
                const listResponse = await fetch(`https://tranco-list.eu/api/lists/date/${date}`);
                
                if (listResponse.ok) {
                    const data = await listResponse.json();
                    if (data.available) {
                        listData = data;
                        console.log(`📋 Found available list for ${date}: ${data.list_id}`);
                        break;
                    }
                }
            } catch (error) {
                lastError = error;
                console.log(`📅 Date ${date} failed: ${error.message}`);
            }
        }
        
        if (!listData) {
            throw new Error(`No available Tranco lists found. Last error: ${lastError?.message || 'Unknown'}`);
        }
        
        // Now fetch the actual list data
        console.log(`📥 Downloading list data from: ${listData.download}`);
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

// Cache management endpoint
app.post('/api/clear-cache', (req, res) => {
    cache.clear();
    console.log('🗑️ Backend cache cleared');
    res.json({ success: true, message: 'Cache cleared' });
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
