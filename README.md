# Kinso - AI-Powered Unified Inbox

One inbox for every conversation. Kinso brings together all your messages, emails, and contacts with AI-powered prioritization and smart replies.

## Features

- **Unified Inbox**: Aggregates messages from Gmail, Outlook, Slack, LinkedIn, WhatsApp, and Instagram Business
- **AI Prioritization**: Automatically analyzes and prioritizes messages based on importance and urgency
- **Smart Replies**: AI-generated reply suggestions that match your writing style
- **Cross-Platform**: Beautiful web interface with mobile-responsive design
- **Real-time Updates**: Stay synced with all your conversations
- **Modern UI**: Built with Next.js, Tailwind CSS, and Framer Motion

## Tech Stack

- **Frontend**: Next.js 15, React 19, TypeScript
- **Styling**: Tailwind CSS, Shadcn/ui components
- **Database**: SQLite with Prisma ORM
- **AI**: OpenAI GPT-4
- **Animations**: Framer Motion
- **Icons**: Lucide React

## Getting Started

### Prerequisites

- Node.js 18+ installed
- npm or yarn
- (Optional) OpenAI API key for AI features

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd kinso
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env
```

Edit `.env` and add your OpenAI API key (optional - mock data works without it):
```
OPENAI_API_KEY="sk-your-api-key-here"
```

4. Initialize the database:
```bash
npx prisma generate
npx prisma db push
```

5. Run the development server:
```bash
npm run dev
```

6. Open [http://localhost:3000](http://localhost:3000) in your browser

## Project Structure

```
kinso/
├── app/                    # Next.js app directory
│   ├── api/               # API routes for AI features
│   ├── inbox/             # Inbox page
│   ├── page.tsx           # Landing page
│   ├── layout.tsx         # Root layout
│   └── globals.css        # Global styles
├── components/            # React components
│   ├── inbox/             # Inbox-specific components
│   └── ui/                # Reusable UI components
├── lib/                   # Utilities and configurations
│   ├── mock-data.ts       # Mock data generator
│   ├── openai.ts          # OpenAI integration
│   ├── prisma.ts          # Prisma client
│   └── utils.ts           # Utility functions
├── prisma/                # Database schema and migrations
│   └── schema.prisma      # Prisma schema
└── public/                # Static assets
```

## Features in Detail

### Unified Inbox
- View all messages from multiple platforms in one place
- Filter by platform (Gmail, Outlook, Slack, LinkedIn, WhatsApp, Instagram)
- See unread message counts
- Platform-specific icons and colors

### AI Prioritization
Messages are automatically analyzed for:
- **Priority Score** (0-100): Based on urgency, sender importance, and content
- **Sentiment**: Positive, neutral, or negative
- **Category**: Automatically categorized (Sales Contract, Project Update, etc.)

### Smart Replies
- AI-generated reply suggestions
- Learns your writing style over time
- Context-aware based on conversation history
- Customizable tone and length

### Notifications
- Real-time notification sidebar
- Prioritized high-importance messages
- Platform badges on avatars
- Time-based organization

## Mock Data

The application includes realistic mock data for demonstration:
- 50+ sample messages across all platforms
- 20+ mock contacts
- Realistic message content and metadata
- AI-generated priority scores and categories

## API Routes

- `POST /api/messages/prioritize` - Analyze message priority with AI
- `POST /api/messages/reply` - Generate AI reply suggestions

## Future Enhancements

- Real OAuth integrations for all platforms
- React Native mobile app
- Real-time WebSocket updates
- Advanced AI features (conversation summarization, smart scheduling)
- Team collaboration features
- Analytics and insights dashboard

## Development

```bash
# Run development server
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Run Prisma Studio (database GUI)
npx prisma studio
```

## License

MIT License - feel free to use this project as a template or learning resource.

## Credits

Built with Next.js, Prisma, OpenAI, and modern web technologies.
