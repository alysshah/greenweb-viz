# Green Web Current 🌍

A beautiful 3D visualization of website carbon footprints, where each particle represents a website's environmental impact. Built with Three.js and powered by real carbon data.

![Green Web Current](https://img.shields.io/badge/Status-Live-brightgreen) ![Three.js](https://img.shields.io/badge/Three.js-3D%20Visualization-orange) ![Carbon](https://img.shields.io/badge/Carbon-Footprint%20Analysis-green)

## ✨ Features

- **3D Particle Visualization**: Interactive constellation of websites based on their carbon footprint
- **Real-time Carbon Data**: Live data from the Green Web Foundation API
- **AI-Powered Translations**: Natural language descriptions of carbon impact using Google's Gemini AI
- **Collapsible Info Panel**: Clean, slide-out interface for detailed website information
- **Responsive Design**: Works seamlessly across desktop and mobile devices
- **Smooth Animations**: Fluid transitions and hover effects

## 🚀 Quick Start

1. **Clone the repository:**
   ```bash
   git clone https://github.com/YOUR_USERNAME/greenweb-viz.git
   cd greenweb-viz
   ```

2. **Set up the backend:**
   ```bash
   cd backend
   npm install
   ```

3. **Add your API key:**
   Create a `.env` file in the `backend` directory:
   ```bash
   echo "GEMINI_API_KEY=your_gemini_api_key_here" > .env
   ```

4. **Start the server:**
   ```bash
   npm start
   ```

5. **Open the visualization:**
   Open `index.html` in your browser or serve it with a local server.

## 🛠️ Tech Stack

- **Frontend**: HTML5, CSS3, JavaScript (ES6+)
- **3D Graphics**: Three.js
- **Backend**: Node.js, Express
- **AI**: Google Gemini API
- **Data**: Green Web Foundation API

## 📁 Project Structure

```
greenweb-viz/
├── index.html          # Main HTML file
├── style.css           # Styling and animations
├── main.js             # Application entry point
├── particle-viz.js     # 3D visualization logic
├── data-fetcher.js     # API data handling
├── utils.js            # Utility functions
├── backend/
│   ├── server.js       # Express server
│   ├── package.json    # Backend dependencies
│   └── .env            # Environment variables (create this)
└── README.md           # This file
```

## 🔧 Configuration

The visualization can be customized by modifying:
- **Particle count**: Adjust `MAX_PARTICLES` in `particle-viz.js`
- **Animation speed**: Modify `rotationSpeed` and `pulseSpeed` values
- **Color scheme**: Update the gradient colors in `style.css`
- **API endpoints**: Configure data sources in `data-fetcher.js`

## 🌱 Environmental Impact

This project helps visualize the environmental cost of web browsing, making carbon footprints tangible through interactive 3D particles. Each particle's size and color represent a website's carbon impact, encouraging more sustainable web practices.

## 📄 License

This project is open source and available under the [MIT License](LICENSE).

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📞 Support

If you have any questions or need help, please open an issue on GitHub.

---

**Made with 🌍 for a greener web**