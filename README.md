# AI Job Assistant 🤖💼

An intelligent job application assistant that leverages AI to analyze job descriptions, optimize resumes, and help job seekers land their dream roles. Built with modern web technologies and multiple AI providers for comprehensive job search support.

## 🌟 Features

### ✅ Currently Implemented

- **Job Description Analysis** - AI-powered analysis of job requirements, skills, and fit scoring
- **Resume Optimization** - Intelligent resume analysis with personalized improvement recommendations
- **Match Scoring** - Quantitative assessment of resume-job compatibility
- **Keyword Optimization** - Identify and suggest important keywords from job descriptions
- **Rate Limiting** - Production-ready API rate limiting to manage costs and usage

### 🚧 Planned Features

- **Cover Letter Generation** - AI-generated, personalized cover letters
- **Mock Interviews** - Interactive voice-based interview practice with AI
- **Company Research** - Automated research on company culture, values, and recent news
- **Networking Assistant** - LinkedIn contact identification and outreach message templates
- **Application Tracking** - Full job application pipeline management

## 🛠️ Tech Stack

### Frontend

- **Next.js 14+** with App Router
- **TypeScript** for type safety
- **Tailwind CSS** for styling
- **React Hooks** for state management

### Backend

- **Next.js API Routes** for serverless functions
- **Custom Rate Limiting** with in-memory storage
- **RESTful API design**

### AI & Machine Learning

- **Google Gemini API** for intelligent text analysis
- **Anthropic Claude API** integration (ready for implementation)
- **Prompt Engineering** for optimal AI responses

### Database & Storage

- **Supabase** (PostgreSQL) for structured data
- **Environment-based configuration**

### Development & Deployment

- **Git** version control
- **GitHub** repository management
- **Vercel** deployment platform
- **ESLint & Prettier** for code quality

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ and npm
- Google AI API key
- Supabase account and project
- Git

### Installation

1. **Clone the repository**

   ```bash
   git clone https://github.com/AvionShea/ai-job-assistant
   cd ai-job-assistant
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Set up environment variables**

   Create a `.env` file in the root directory:

   ```env
   # Supabase Configuration
   NEXT_PUBLIC_SUPABASE_PROJECT_URL=your_supabase_project_url
   NEXT_PUBLIC_SUPABASE_API_KEY=your_supabase_anon_key

   # AI API Keys
   GEMINI_API_KEY=your_google_ai_api_key
   CLAUDE_API_KEY=your_anthropic_api_key
   ```

4. **Run the development server**

   ```bash
   npm run dev
   ```

5. **Open your browser**

   Navigate to [http://localhost:3000](http://localhost:3000)

## 📖 Usage

### Job Analysis

1. Navigate to the "Job Analysis" tab
2. Paste a job description into the text area
3. Click "Analyze Job" to get:
   - Required and nice-to-have skills
   - Key responsibilities breakdown

### Resume Optimization

1. Switch to the "Resume Optimizer" tab
2. Paste your current resume in the left text area
3. Paste the target job description in the right text area
4. Click "Optimize Resume" to receive:
   - Match percentage score
   - Your strengths that align with the job
   - Skill gaps to address
   - Specific improvement recommendations
   - Important keywords to include
   - Rewritten professional summary

## 🔧 API Endpoints

### `POST /api/analyze-job`

Analyzes job descriptions and extracts key information.

**Request Body:**

```json
{
  "jobDescription": "string"
}
```

**Response:**

```json
{
  "success": true,
  "analysis": "AI-generated job analysis",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "rateLimitStatus": {
    "remaining": 9,
    "dailyRemaining": 1299
  }
}
```

### `POST /api/optimize-resume`

Provides resume optimization recommendations based on job requirements.

**Request Body:**

```json
{
  "resumeText": "string",
  "jobDescription": "string"
}
```

**Response:**

```json
{
  "success": true,
  "analysis": "JSON-formatted optimization results",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "rateLimitStatus": {
    "remaining": 8,
    "dailyRemaining": 1298
  }
}
```

## 🛡️ Rate Limiting

The application implements intelligent rate limiting to stay within API quotas:

- **10 requests per minute** per IP address
- **1,200 requests per day** per IP address
- Automatic rate limit status reporting
- User-friendly error messages when limits are exceeded

Rate limits reset automatically and are tracked in-memory for optimal performance.

## 🏗️ Architecture

### Project Structure

```
ai-job-assistant/
├── app/
│   ├── api/
│   │   ├── analyze-job/
│   │   │   └── route.ts
│   │   ├── optimize-resume/
│   │   │   └── route.ts
│   │   └── test-setup/
│   │       └── route.ts
│   ├── globals.css
│   ├── layout.tsx
│   └── page.tsx
├── components/
│   └── ResumeOptimizer.tsx
├── lib/
│   └── rate-limiter.ts
├── .env (your environment variables)
├── .gitignore
├── next.config.js
├── package.json
├── README.md
└── tsconfig.json
```

### Design Patterns

- **Separation of Concerns** - API logic separated from UI components
- **Reusable Components** - Modular React components for different features
- **Custom Hooks** - Centralized state management patterns
- **Error Handling** - Comprehensive error handling and user feedback
- **Type Safety** - Full TypeScript implementation

## 🚀 Deployment

### Vercel Deployment (Recommended)

1. **Connect your GitHub repository** to Vercel
2. **Add environment variables** in Vercel dashboard
3. **Deploy automatically** on git push

### Manual Deployment

1. **Build the application**

   ```bash
   npm run build
   ```

2. **Start production server**
   ```bash
   npm start
   ```

## 🔮 Future Enhancements

### Phase 2: Advanced AI Features

- Multi-provider AI comparison (Claude vs Gemini)
- Vector embeddings for semantic job matching
- Machine learning model for personalized recommendations

### Phase 3: Voice & Real-time Features

- Voice-to-text resume input
- Real-time mock interviews with speech synthesis
- Live feedback during practice sessions

### Phase 4: Integration & Automation

- LinkedIn API integration
- ATS-friendly resume formatting
- Email automation for follow-ups
- Calendar integration for interview scheduling

## 🤝 Contributing

This is a learning project, but contributions and suggestions are welcome!

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📚 Learning Outcomes

This project demonstrates proficiency in:

- **Full-Stack Development** with Next.js and TypeScript
- **AI/ML Integration** with multiple providers
- **API Design** and rate limiting
- **Modern React Patterns** and hooks
- **Database Design** with Supabase
- **Production Considerations** (error handling, rate limiting, security)
- **Clean Code Practices** and documentation

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Google AI for Gemini API access
- Anthropic for Claude API capabilities
- Supabase for database and authentication services
- Vercel for seamless deployment platform

---

**Built with ❤️ as a portfolio project to demonstrate modern web development and AI integration skills.**
