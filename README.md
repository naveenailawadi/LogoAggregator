# Logo Aggregator

A local web app for fetching company logos, reviewing them, and exporting a PowerPoint slide deck — built for M&A target lists, competitive landscapes, and industry maps.

## Features

- Paste a list of domains (or upload a CSV/TXT) to batch-fetch logos
- Real-time progress as logos load concurrently
- Review grid: select/deselect, drag-and-drop reorder, edit display names
- Export a clean PPTX with configurable grid layout, logo size, titles, and background color
- Fallback chain: Brandfetch CDN → Brandfetch API → Clearbit → Google Favicon

---

## Prerequisites

- **Node.js** v18+ (download from https://nodejs.org)
- **npm** v9+ (comes with Node)

---

## Setup

### 1. Install dependencies

Open a terminal in this folder and run:

```bash
npm install
cd client && npm install && cd ..
cd server && npm install && cd ..
```

Or if you have npm workspaces support (npm v7+), just:

```bash
npm install
```

### 2. (Optional) Add a Brandfetch API key

The app works without an API key using the Brandfetch CDN endpoint. For better logo coverage, sign up for a free API key at https://brandfetch.com/developers, then:

```bash
# In the server/ directory, create a .env file:
cp server/.env.example server/.env
# Then edit server/.env and add your key:
# BRANDFETCH_API_KEY=your_key_here
```

---

## Running the App

You need **two terminals** running simultaneously:

### Terminal 1 — Backend (Express)

```bash
cd server
npm run dev
```

Server starts at **http://localhost:3001**

### Terminal 2 — Frontend (Vite / React)

```bash
cd client
npm run dev
```

App opens at **http://localhost:5173**

### Or run both at once (from the root folder):

```bash
npm run dev
```

This uses `concurrently` to start both the backend and frontend together.

---

## Usage

1. **Paste domains** into the text area (one per line, or comma-separated), e.g.:
   ```
   fortifiedhealthsecurity.com
   clearwatercompliance.com
   imprivata.com
   ```
2. Click **Fetch Logos** (or press Ctrl+Enter)
3. Wait for the progress bar — logos load 8 at a time
4. **Review**: deselect bad logos, drag to reorder, edit company display names
5. Configure **Export Settings** (logos per row, size, slide title, etc.)
6. Click **Export PPTX** — the file downloads automatically

---

## Project Structure

```
logo-app/
├── client/                  # React frontend (Vite)
│   ├── src/
│   │   ├── App.jsx
│   │   ├── components/
│   │   │   ├── InputPanel.jsx
│   │   │   ├── LogoGrid.jsx      # Drag-and-drop grid
│   │   │   ├── LogoCard.jsx      # Individual logo card
│   │   │   ├── ExportSettings.jsx
│   │   │   └── ProgressBar.jsx
│   │   └── styles/app.css
│   └── package.json
├── server/                  # Express backend
│   ├── index.js
│   ├── routes/
│   │   ├── logos.js          # Logo fetch + CSV upload endpoints
│   │   └── export.js         # PPTX generation endpoint
│   ├── services/
│   │   ├── logoFetcher.js    # Logo API with fallback chain
│   │   └── pptxBuilder.js    # pptxgenjs slide builder
│   ├── .env.example
│   └── package.json
└── package.json              # Root (workspaces + concurrently)
```

---

## Environment Variables

| Variable | Default | Description |
|---|---|---|
| `BRANDFETCH_API_KEY` | *(empty)* | Optional — enables Brandfetch REST API for better SVG logos |
| `PORT` | `3001` | Backend server port |

---

## Troubleshooting

**Port already in use:**
Change the port in `server/.env` (`PORT=3002`) and update the Vite proxy in `client/vite.config.js` to match.

**Logo not loading:**
The card will show a placeholder. Try re-fetching, or the domain may not have a publicly accessible logo.

**PPTX looks blank:**
Make sure at least one logo is selected (checkboxes checked) before exporting.

**`sharp` install fails on Windows:**
Sharp is optional (used for image processing). If it fails, run:
```bash
cd server && npm install --ignore-scripts
```
The app will still work without it.
