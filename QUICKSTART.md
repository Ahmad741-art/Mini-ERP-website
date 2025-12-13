# Snabbstart - Mini-ERP Light

## Kom igång på 5 minuter

### 1. Installera förutsättningar
Se till att du har installerat:
- Node.js (v14 eller senare) - [nodejs.org](https://nodejs.org)
- MongoDB (v4.4 eller senare) - [mongodb.com](https://www.mongodb.com/try/download/community)

### 2. Starta MongoDB
```bash
# macOS/Linux
mongod

# Windows (om installerat som service)
# MongoDB startar automatiskt

# Eller med Homebrew på macOS
brew services start mongodb-community
```

### 3. Sätt upp Backend
```bash
# Navigera till backend-mappen
cd mini-erp/backend

# Installera dependencies
npm install

# Skapa .env-fil
cp .env.example .env

# Redigera .env om nödvändigt (standardinställningarna fungerar lokalt)

# Seeda databasen med testdata
npm run seed

# Starta backend-servern
npm run dev
```

Backend körs nu på http://localhost:5000

### 4. Sätt upp Frontend

Öppna en NY terminal:
```bash
# Navigera till frontend-mappen
cd mini-erp/frontend

# Installera dependencies
npm install

# Skapa .env-fil
cp .env.example .env

# Starta frontend
npm start
```

Frontend öppnas automatiskt i din webbläsare på http://localhost:3000

### 5. Logga in

Använd någon av testanvändarna:

**Admin:**
- Email: admin@miniorp.se
- Lösenord: admin123

**Lager:**
- Email: lager@miniorp.se
- Lösenord: lager123

**Ekonomi:**
- Email: ekonomi@miniorp.se
- Lösenord: ekonomi123

## Funktioner att testa

1. **Ordrar** - Se alla testordrar och deras statusar
2. **Lager** - Kontrollera lagerstatus, se artiklar med lågt lager
3. **Plockning** - Använd tangentbordet (↑↓ och Enter) för snabb plockning
4. **Fakturor** - Skapa fakturor från plockade ordrar (endast ekonomi/admin)

## Realtidsuppdateringar

Öppna applikationen i flera webbläsarfönster och se realtidsuppdateringar:
- Skapa en order i ett fönster → se den dyka upp i andra fönster
- Plocka en order → se statusuppdateringen direkt

## Felsökning

**MongoDB ansluter inte:**
```bash
# Kontrollera att MongoDB körs
ps aux | grep mongod  # macOS/Linux
tasklist | findstr mongod  # Windows
```

**Port redan i bruk:**
```bash
# Ändra PORT i backend/.env
PORT=5001

# Uppdatera REACT_APP_API_URL i frontend/.env
REACT_APP_API_URL=http://localhost:5001
```

**Dependencies-fel:**
```bash
# Rensa och installera om
rm -rf node_modules package-lock.json
npm install
```

## Nästa steg

1. Läs den fullständiga README.md för mer detaljer
2. Utforska API-dokumentationen i README.md
3. Anpassa systemet efter dina behov
4. Lägg till fler funktioner (se "Framtida förbättringar" i README)

## Support

För frågor eller problem, se den fullständiga README.md eller skapa ett issue.

---

**Lycka till med ditt Mini-ERP Light! 🚀**
```

---

### File 3: `.gitignore`
**Location:** `mini-erp/.gitignore`
```
# Dependencies
node_modules/
package-lock.json
yarn.lock

# Environment variables
.env
.env.local
.env.development.local
.env.test.local
.env.production.local

# Build output
/frontend/build
/backend/dist

# Logs
logs
*.log
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# OS files
.DS_Store
Thumbs.db

# IDE
.vscode/
.idea/
*.swp
*.swo
*~

# Testing
coverage/

# Production
build/