# 🌙 Luna

Luna is a general-purpose Discord bot built using Node.js and the Discord.js library.

**[Stella](https://github.com/nikkoxd/stella) feature parity TODO:**
- [x] Command handler
- [x] Event handler
- [x] Join announcements
- [ ] Leveling system
  - [x] Experience and level calculation
  - [x] Role rewards
  - [ ] Level cards
- [ ] Currency system
  - [x] Balance calculation
  - [x] Role shop
  - [ ] Private rooms
- [ ] Leaderboards
- [ ] Custom messages

## Prerequisites

To run Luna locally, you will need the following:

* Node.js 16.x or higher
* npm, yarn or pnpm
* Docker (if you plan to use the Docker image)
* Discord bot token and client ID (get them from the [Discord Developer Portal](https://discord.com/developers/applications))

## Getting started

### 1. Cloning the repository

```bash
git clone https://github.com/nikkoxd/luna.git
cd luna
```

### 2. Installing dependencies

```bash
npm install
# or
yarn install
# or
pnpm install
```

### 3. Setting up environment variables

Create a `.env` file in the root directory of the project and add the following variables:
```dotenv
TOKEN=<your-bot-token>
POSTGRES_HOST=<your-db-hostname>
POSTGRES_USER=<your-db-username>
POSTGRES_PASSWORD=<your-db-password>
POSTGRES_DB=<your-db-name>
# required if you've set up a team application
OWNER_ID=<bot-owner-id>

# this will likely get removed
LOKI_URL=<your-loki-url>
```

### 4. Running the bot

**Locally**
```bash
npm run build && node src/index.js
```

**Start a development server**
```bash
npm run dev
```

**With Docker**
```bash
docker compose up -d --build
```
