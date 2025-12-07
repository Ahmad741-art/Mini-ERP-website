Mini-ERP Light - Lager & Order Dashboard

Ett webbbaserat realtidssystem för att hantera ordrar, lagerstatus, plockning och fakturering. Perfekt för mindre lager och e-handel.

Översikt

Mini-ERP Light är en fullstack-applikation som ger dig realtidskoll på:
- Ordrar - Filtrera och hantera order genom hela flödet
- Lager - Se nuvarande saldo, reserverat saldo och varningar
- Plockning - Bocka av plockrader snabbt med tangentbordsnavigering
- Fakturering - Spåra fakturastatusar från klar till betald

Funktioner

Användarhantering
- Inloggning med JWT-autentisering
- Tre roller: Admin, Lager, Ekonomi
- Rollbaserad åtkomstkontroll

Orderhantering
- Visa ordrar med realtidsuppdatering
- Filtrera på status:
  - Ej klar för plock
  - Klar för plock
  - Plockad
  - Fakturerad
- Automatisk statusuppdatering vid lagerändringar

Lagerhantering
- Realtidsvy av lagerstatus
- Nuvarande saldo och reserverat saldo
- Varningar vid låg lagernivå
- Lagerhistorik och rörelser

Plockfunktion
- Plockrader sorterade efter prioritet
- Snabb avbockning med tangentbord
- Automatisk reservering av lagersaldo
- Realtidsuppdatering till alla användare

Fakturahantering
- Statusar: Klar för fakturering, Skickad, Betald, Förfallen
- Filtrera på fakturastatusar
- Kopplade till ordrar

Teknikstack

Backend
- Node.js med Express
- MongoDB för databas
- Socket.io för realtidskommunikation
- JWT för autentisering
- Bcrypt för lösenordshashning

Frontend
- **React** med Hooks
- **Socket.io-client** för realtidsuppdateringar
- **Axios** för API-anrop
- **React Router** för navigation
- **CSS Modules** för styling

Installation

Förutsättningar
- Node.js (v14 eller senare)
- MongoDB (v4.4 eller senare)
- npm eller yarn

Backend Setup

```bash
Klona projektet och navigera till backend-mappen
cd mini-erp/backend

Installera dependencies
npm install

Skapa .env-fil (se .env.example)
cp .env.example .env

Uppdatera .env med dina inställningar
MONGODB_URI=mongodb://localhost:27017/mini-erp
JWT_SECRET=din_hemliga_nyckel
PORT=5000

Starta MongoDB (om lokalt)
mongod

Starta servern
npm run dev
```

Frontend Setup

```bash
Navigera till frontend-mappen
cd mini-erp/frontend

Installera dependencies
npm install

Skapa .env-fil
cp .env.example .env

Uppdatera med backend URL (vanligtvis http://localhost:5000)
REACT_APP_API_URL=http://localhost:5000

Starta utvecklingsservern
npm start
```

Projektstruktur

```
mini-erp/
├── backend/
│   ├── config/
│   │   └── database.js          # MongoDB-anslutning
│   ├── models/
│   │   ├── User.js               # Användarmodell
│   │   ├── Order.js              # Ordermodell
│   │   ├── Article.js            # Artikelmodell
│   │   ├── StockMovement.js      # Lagerrörelser
│   │   └── Invoice.js            # Fakturamodell
│   ├── routes/
│   │   ├── auth.js               # Autentisering
│   │   ├── orders.js             # Orderhantering
│   │   ├── articles.js           # Artikelhantering
│   │   ├── stock.js              # Lagerhantering
│   │   └── invoices.js           # Fakturahantering
│   ├── middleware/
│   │   ├── auth.js               # JWT-verifiering
│   │   └── roleCheck.js          # Rollkontroll
│   ├── controllers/
│   │   ├── authController.js
│   │   ├── orderController.js
│   │   ├── articleController.js
│   │   ├── stockController.js
│   │   └── invoiceController.js
│   ├── utils/
│   │   └── socketHandler.js      # Socket.io-hantering
│   ├── seeds/
│   │   └── seedData.js           # Testdata
│   ├── server.js                 # Huvudserverfil
│   ├── package.json
│   └── .env.example
│
├── frontend/
│   ├── public/
│   │   └── index.html
│   ├── src/
│   │   ├── components/
│   │   │   ├── Layout/
│   │   │   │   ├── Header.js
│   │   │   │   ├── Sidebar.js
│   │   │   │   └── Layout.js
│   │   │   ├── Auth/
│   │   │   │   └── Login.js
│   │   │   ├── Orders/
│   │   │   │   ├── OrderList.js
│   │   │   │   ├── OrderDetails.js
│   │   │   │   └── OrderFilter.js
│   │   │   ├── Stock/
│   │   │   │   ├── StockList.js
│   │   │   │   ├── StockDetails.js
│   │   │   │   └── LowStockWarning.js
│   │   │   ├── Picking/
│   │   │   │   ├── PickingList.js
│   │   │   │   └── PickingRow.js
│   │   │   └── Invoices/
│   │   │       ├── InvoiceList.js
│   │   │       └── InvoiceDetails.js
│   │   ├── contexts/
│   │   │   ├── AuthContext.js
│   │   │   └── SocketContext.js
│   │   ├── hooks/
│   │   │   └── useSocket.js
│   │   ├── services/
│   │   │   └── api.js
│   │   ├── styles/
│   │   │   └── components/
│   │   ├── App.js
│   │   ├── App.css
│   │   └── index.js
│   ├── package.json
│   └── .env.example
│
└── README.md
```

API Endpoints

Autentisering
- `POST /api/auth/login` - Logga in
- `POST /api/auth/register` - Registrera ny användare (admin)
- `GET /api/auth/me` - Hämta inloggad användare

Ordrar
- `GET /api/orders` - Hämta alla ordrar (med filter)
- `GET /api/orders/:id` - Hämta specifik order
- `POST /api/orders` - Skapa ny order
- `PUT /api/orders/:id` - Uppdatera order
- `PUT /api/orders/:id/status` - Uppdatera orderstatus

Artiklar & Lager
- `GET /api/articles` - Hämta alla artiklar
- `GET /api/articles/:id` - Hämta specifik artikel
- `POST /api/articles` - Skapa ny artikel
- `GET /api/stock` - Hämta lagervy
- `GET /api/stock/low` - Hämta artiklar med lågt lager
- `POST /api/stock/movement` - Registrera lagerrörelse

Plockning
- `GET /api/picking` - Hämta plockrader
- `PUT /api/picking/:id/complete` - Markera plockrad som klar

### Fakturor
- `GET /api/invoices` - Hämta alla fakturor
- `GET /api/invoices/:id` - Hämta specifik faktura
- `POST /api/invoices` - Skapa faktura från order
- `PUT /api/invoices/:id/status` - Uppdatera fakturastatus

Socket.io Events

Server → Client
- `order:created` - Ny order skapad
- `order:updated` - Order uppdaterad
- `stock:updated` - Lager uppdaterat
- `picking:completed` - Plockning klar
- `invoice:created` - Faktura skapad
- `stock:low-warning` - Varning för lågt lager

Client → Server
- `subscribe:orders` - Prenumerera på orderuppdateringar
- `subscribe:stock` - Prenumerera på lageruppdateringar

Standardanvändare (efter seed)

```
Admin:
- Email: admin@miniorp.se
- Password: admin123
- Roll: admin

Lager:
- Email: lager@miniorp.se
- Password: lager123
- Roll: lager

Ekonomi:
- Email: ekonomi@miniorp.se
- Password: ekonomi123
- Roll: ekonomi
```

Utveckling

Köra tester
```bash
# Backend
cd backend
npm test

# Frontend
cd frontend
npm test
```

Seeda databasen med testdata
```bash
cd backend
npm run seed
```

### Produktionsbygge
```bash
# Frontend
cd frontend
npm run build

# Backend sätts i produktion genom att sätta NODE_ENV=production
```

Säkerhet

- JWT-tokens för autentisering
- Bcrypt för lösenordshashning
- Rollbaserad åtkomstkontroll
- Input-validering på alla endpoints
- Rate limiting (rekommenderas i produktion)
- HTTPS (rekommenderas i produktion)

Framtida förbättringar

- [ ] PDF-generering för fakturor
- [ ] Email-notifikationer
- [ ] Statistik och rapporter
- [ ] Barcode-scanning
- [ ] Multiwarehouse-support
- [ ] Export till bokföringssystem
- [ ] Mobilapp

Licens

MIT

## Support

För frågor eller problem, skapa ett issue i projektet.
