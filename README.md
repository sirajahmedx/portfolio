# Portfolio Website with AI Chat

A modern, interactive portfolio website featuring an AI-powered chat interface built with Next.js and Tailwind CSS v4.

## Screenshots

### Home Page

![Dark Theme Home Page](https://raw.githubusercontent.com/sirajahmedx/portfolio/main/public/dark-home.png)

### Chat Page

![Dark Theme Chat Page](https://raw.githubusercontent.com/sirajahmedx/portfolio/main/public/dark-chat.png)

## Overview

This portfolio website showcases personal projects, skills, and provides an interactive AI chat experience. Users can ask questions about the portfolio owner through a conversational interface powered by Google's Gemini AI.

## Features

- **Responsive Design**: Optimized for all devices with fluid animations
- **Theme Toggle**: Switch between dark and light themes
- **AI Chat Interface**: Interactive chat powered by Gemini AI
- **Project Showcase**: Display personal projects with interactive cards
- **Skills Section**: Highlight technical and soft skills
- **Contact Integration**: Easy ways to get in touch
- **GitHub Integration**: Fetch and display GitHub repository information

## Tech Stack

- **Framework**: Next.js 15
- **Styling**: Tailwind CSS v4
- **Language**: TypeScript
- **AI**: Google Gemini AI
- **Icons**: Lucide React, Tabler Icons
- **Animations**: Framer Motion
- **UI Components**: Radix UI

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- Git

### Installation

1. **Clone the repository**

   ```bash
   git clone https://github.com/sirajahmedx/portfolio.git
   cd portfolio
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Set up environment variables**

   Create a `.env.local` file in the root directory and add the following variables:

   ```env
   GITHUB_TOKEN=your_github_personal_access_token
   GEMINI_API_KEY=your_google_gemini_api_key
   ```

   **Getting API Keys:**
   - **GitHub Token**: Go to [GitHub Settings > Developer settings > Personal access tokens](https://github.com/settings/tokens) and create a new token with `repo` scope.
   - **Gemini API Key**: Visit [Google AI Studio](https://makersuite.google.com/app/apikey) to generate an API key.

4. **Run the development server**

   ```bash
   npm run dev
   ```

5. **Open your browser**

   Navigate to [http://localhost:3000](http://localhost:3000) to view the website.

## Usage

- **Home Page**: Explore the portfolio sections and use quick question buttons to start conversations
- **Chat Page**: Engage with the AI assistant to learn more about the portfolio owner
- **Theme Toggle**: Click the theme button in the header to switch between dark and light modes
- **Projects**: Browse through showcased projects with interactive hover effects

## Customization

To make this portfolio your own:

1. Update personal information in the components (name, bio, skills, etc.)
2. Replace project data in `src/components/projects/Data.tsx`
3. Customize colors and styling in the Tailwind configuration
4. Add your own projects and modify the layout as needed
5. Update the GitHub repository URL and social links

## Deployment

This project is configured for easy deployment on Vercel:

1. Push your changes to GitHub
2. Connect your repository to Vercel
3. Add environment variables in Vercel's dashboard
4. Deploy!

## Contributing

Feel free to fork this repository and customize it for your own use. If you find any issues or have suggestions, please open an issue or submit a pull request.

## License

This project is open source and available under the [MIT License](LICENSE).
