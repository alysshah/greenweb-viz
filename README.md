# Green Web Current  

A real-time 3D data visualization of the carbon footprint of the world’s most popular websites, powered by environmental data APIs and enhanced with AI-generated insights.  

## 🌟 Overview  

Green Web Current is an interactive 3D visualization that makes the hidden environmental cost of the web visible. Each particle represents one of the world’s most visited websites, with **size based on popularity** and **color based on carbon emissions**. Users can click any particle to see detailed environmental metrics, including whether the site uses green hosting and how much CO₂ it emits per visit.  
To make the numbers meaningful, the system also uses **AI-powered translations** that convert raw CO₂ metrics into relatable comparisons — for example, how many minutes of car idling or how many trees would be needed to offset the emissions.  

## 📷 Screenshots

...

## 🚀 Live Demo  

[View the live application](https://greenweb-viz.vercel.app)  

## 🛠️ Built With  

- **Frontend**: Vanilla JavaScript, Three.js, HTML5/CSS3  
- **Backend**: Node.js, Express.js  
- **AI**: Google Gemini API  
- **APIs**: Tranco, Green Web Foundation, Website Carbon API  
- **Deployment**: Vercel  
- **3D Graphics**: Three.js WebGL  

## 📊 Data Sources  

### Tranco API  
- **Purpose**: Fetches the top 200 most popular websites  
- **Endpoint**: `https://tranco-list.eu/api/lists/date/YYYY-MM-DD`  
- **Caching**: 7-day cache with fallback to recent available lists  

### Green Web Foundation API  
- **Purpose**: Determines if websites are hosted on green energy  
- **Endpoint**: `https://api.thegreenwebfoundation.org/greencheck/{domain}`  
- **Data**: Green hosting status, hosting provider information  

### Website Carbon API  
- **Purpose**: Calculates carbon emissions per page view  
- **Endpoint**: `https://api.websitecarbon.com/site?url={domain}`  
- **Data**: CO₂ per page view, energy consumption, cleaner-than percentage  

### Google Gemini AI  
- **Purpose**: Provides AI-powered estimates and translations to enhance accuracy and accessibility  
- **Model**: Gemini 1.5 Flash  
- **Uses**:  
  - **Page Size Estimation**: Analyzes domains to estimate page sizes in bytes when Website Carbon API does not provide this data  
  - **Natural Language Impact Translation**: Converts raw CO₂ numbers into meaningful comparisons (e.g., minutes of car idling, trees required to offset emissions, or phone call equivalents)  
  - **Fallback Data Enhancer**: Supplies context or missing values when APIs return incomplete results  
- **Input**: Website domain metadata and carbon footprint data  
- **Output**: Estimated page sizes and natural-language impact translations  
- **Rate Limit**: 15 requests per minute  
- **Caching**: Page size estimates cached for 24 hours; translations cached for 7 days  

## 🔄 Data Flow  

1. **Website Discovery**: Fetch top 200 websites from Tranco API  
2. **Green Status Check**: Query Green Web Foundation for hosting status  
3. **Page Size Estimation**: Use Gemini AI to fill in missing size data  
4. **Carbon Calculation**: Calculate emissions using Website Carbon API  
5. **AI Translation**: Generate human-readable impact comparisons via Gemini  
6. **3D Visualization**: Render particles with size/color based on processed data  

## 🎨 Visualization Features  

- 200+ interactive 3D particles representing top websites  
- Particle **size = popularity**, particle **color = CO₂ emissions**  
- Hover and click interactions to reveal detailed metrics  
- Collapsible info panel for green hosting status, carbon data, and AI translations  
- Smooth animations and responsive design  

## ⚡ Performance & Caching  

### Multi-Layer Caching Strategy  
- **Frontend Cache**: localStorage with 7-day expiration  
- **Backend Cache**: In-memory Map for API responses  
- **Cache Busting**: Version-controlled cache keys  
- **Smart Fallbacks**: Graceful degradation when APIs fail  

### API Rate Limiting  
- **Request Throttling**: 1-second delays between API calls  
- **Retry Logic**: 3 attempts with exponential backoff  
- **Error Handling**: Graceful fallbacks for failed requests  

## 🏗️ Architecture  

```
Frontend (Static) ├── Three.js 3D Engine ├── Particle Visualization ├── Interactive UI Components └── API Client with Caching Backend (Node.js/Express) ├── API Proxy Layer ├── Gemini AI Integration ├── Response Caching └── Error Handling External APIs ├── Tranco (Website Rankings) ├── Green Web Foundation (Green Status) ├── Website Carbon (Emissions) └── Google Gemini (Page Size AI)
```

## 📈 API Usage  

### Gemini AI  
Gemini is integrated in two critical ways:  

1. **Page Size Estimation**  
   - Input: Website domain metadata  
   - Output: Estimated page size in KB  
   - Role: Ensures accurate carbon calculations when APIs don’t provide size data  

2. **Carbon Impact Translation**  
   - Input: CO₂ per visit values  
   - Output: Natural-language comparisons (e.g., “10,000 visits equals 0.3 hours of car idling”)  
   - Role: Makes complex carbon metrics understandable and relatable  

### Example Impact Translations  
- "10,000 visits consume about as much as 0.3 hours of car idling"  
- "100,000 visits equal the annual absorption capacity of 0.1 trees"  
- "10,000 visits consume as much energy as 9 minutes of phone calls"  

By combining **real data from APIs** with **AI-generated insights**, Green Web Current delivers a more complete and accessible view of the digital carbon footprint.  

