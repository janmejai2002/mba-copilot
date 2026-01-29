# Vidyos

**Knowledge, Reimagined**

> *Where ancient wisdom (Vidya) meets modern learning*

Vidyos is a universal learning platform that transforms any lecture, meeting, or session into structured knowledge using AI. From MBA classrooms to professional conferences, Vidyos captures, understands, and organizes your learning journey.

---

## ✨ Features

### 🎙️ **Live Transcription**
- Real-time speech-to-text with Deepgram
- Supports Hinglish and multiple languages
- Automatic timestamping

### 🧠 **AI-Powered Insights**
- Session summaries with Google Gemini
- Key concept extraction
- Interactive Q&A console

### 🕸️ **Knowledge Graphs**
- D3.js force-directed visualizations
- Concept relationships mapping
- Export as PNG or JSON

### 📅 **Smart Scheduling**
- Calendar-based class planning
- Bulk session creation
- Date-based organization

### 📚 **Session Management**
- Organize by subjects
- Search and filter
- Session history

### ☁️ **Google Drive Sync**
- Automatic cloud backup
- Cross-device access
- Privacy-first storage

---

## 🚀 Tech Stack

- **Frontend:** React 19 + TypeScript + Vite
- **Styling:** Tailwind CSS + Custom CSS
- **Transcription:** Deepgram API
- **AI:** Google Gemini
- **Visualizations:** D3.js + Three.js
- **Storage:** IndexedDB + Google Drive
- **Deployment:** Vercel

---

## 🛠️ Getting Started

### Prerequisites
- Node.js 18+ 
- npm or yarn
- Google OAuth credentials
- Deepgram API key
- Google Gemini API key

### Installation

```bash
# Clone the repository
git clone https://github.com/YOUR_USERNAME/vidyos.git
cd vidyos

# Install dependencies
npm install

# Create .env file
cp .env.example .env

# Add your API keys to .env
DEEPGRAM_API_KEY=your_deepgram_key
GEMINI_API_KEY=your_gemini_key
VITE_GOOGLE_CLIENT_ID=your_google_client_id
```

### Development

```bash
# Start dev server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

---

## 🌐 Deployment

### Vercel (Recommended)

1. Push to GitHub
2. Import project in Vercel
3. Add environment variables:
   - `DEEPGRAM_API_KEY`
   - `GEMINI_API_KEY`
   - `VITE_GOOGLE_CLIENT_ID`
4. Deploy!

**Live Demo:** [vidyos.vercel.app](https://vidyos.vercel.app)

---

## 📖 Usage

### 1. **Login**
- Sign in with Google
- Grant Drive permissions for cloud sync

### 2. **Create Subject**
- Add your courses/topics
- Organize by semester or category

### 3. **Start Session**
- Click "Attend Live" or schedule classes
- Allow microphone access
- Start recording

### 4. **Review & Learn**
- View live transcription
- Explore knowledge graph
- Ask questions in Q&A console
- Generate AI summary

---

## 🎯 Roadmap

- [ ] Mobile app (React Native)
- [ ] Offline mode
- [ ] Multi-language support
- [ ] Team collaboration
- [ ] Integration with Notion, Obsidian
- [ ] Advanced analytics
- [ ] Custom AI models

---

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 🙏 Acknowledgments

- **Deepgram** for transcription API
- **Google Gemini** for AI capabilities
- **D3.js** for beautiful visualizations
- **Vercel** for seamless deployment

---

## 📧 Contact

**Vidyos Team**
- Website: [vidyos.app](https://vidyos.app)
- GitHub: [@YOUR_USERNAME](https://github.com/YOUR_USERNAME)

---

<div align="center">

**Vidyos** - Knowledge, Reimagined

*From ancient Vedic wisdom to modern AI*

Made with ❤️ for learners everywhere

</div>
