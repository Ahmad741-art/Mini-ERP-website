# Mini-ERP Light - Project Summary

## Overview
Mini-ERP Light is a comprehensive warehouse and order management system built with the MERN stack (MongoDB, Express, React, Node.js). It provides real-time inventory tracking, order processing, picking operations, and invoice management.

## Key Features

### 1. User Management
- JWT-based authentication
- Three user roles: Admin, Warehouse (Lager), Finance (Ekonomi)
- Role-based access control (RBAC)
- Secure password hashing with bcrypt

### 2. Order Management
- Create and track orders through their lifecycle
- Order statuses: Not Ready, Ready to Pick, Picked, Invoiced, Cancelled
- Real-time order updates via Socket.io
- Automatic stock reservation
- Filter and search capabilities

### 3. Inventory Management
- Real-time stock level tracking
- Reserved quantity tracking
- Available quantity calculation
- Low stock warnings
- Stock movement history
- Category-based organization

### 4. Picking Operations
- Keyboard-driven picking interface (↑↓ arrows, Enter/Space)
- Line-by-line picking confirmation
- Real-time progress tracking
- Automatic stock updates on picking completion
- Priority-based picking queue

### 5. Invoice Management
- Generate invoices from picked orders
- Invoice statuses: Draft, Sent, Paid, Overdue, Cancelled
- Overdue invoice tracking
- VAT calculations
- Payment tracking

### 6. Real-time Updates
- Socket.io integration for live updates
- Multi-user synchronization
- Instant notifications of stock changes
- Order status updates across all connected clients

## Technical Architecture

### Backend (Node.js/Express)
```
backend/
├── config/          # Database configuration
├── models/          # Mongoose schemas
├── controllers/     # Business logic
├── routes/          # API endpoints
├── middleware/      # Auth & role checking
├── utils/           # Socket.io handlers
└── seeds/           # Test data
```

### Frontend (React)
```
frontend/
├── components/
│   ├── Auth/        # Login
│   ├── Layout/      # Header, Sidebar, Layout
│   ├── Orders/      # Order management
│   ├── Stock/       # Inventory view
│   ├── Picking/     # Picking interface
│   └── Invoices/    # Invoice management
├── contexts/        # Auth & Socket contexts
└── services/        # API service layer
```

### Database Schema (MongoDB)

#### User
- name, email, password (hashed)
- role: admin | lager | ekonomi
- active status, lastLogin

#### Article
- articleNumber (unique), name, description
- price, cost
- stockQuantity, reservedQuantity
- minStockLevel, unit, category
- Virtual: availableQuantity, isLowStock

#### Order
- orderNumber (auto-generated)
- customer info (name, email, phone, address)
- orderLines (article, quantity, price, pickStatus)
- status workflow
- totalAmount (auto-calculated)

#### StockMovement
- article reference
- movementType: in | out | adjustment | reservation | release
- quantity, quantityBefore, quantityAfter
- reference info, user, timestamp

#### Invoice
- invoiceNumber (auto-generated)
- order reference, customer info
- invoiceLines, subtotal, VAT, total
- status, dates (invoice, due, sent, paid)
- payment tracking

## API Endpoints

### Authentication
- POST /api/auth/login - User login
- POST /api/auth/register - Register user (admin only)
- GET /api/auth/me - Get current user

### Orders
- GET /api/orders - List all orders (with filters)
- GET /api/orders/:id - Get single order
- POST /api/orders - Create order
- PUT /api/orders/:id - Update order
- PUT /api/orders/:id/status - Update order status
- DELETE /api/orders/:id - Delete order

### Articles
- GET /api/articles - List articles
- GET /api/articles/:id - Get article
- POST /api/articles - Create article
- PUT /api/articles/:id - Update article
- DELETE /api/articles/:id - Delete article
- GET /api/articles/low-stock - Get low stock items
- GET /api/articles/categories - Get categories

### Stock
- GET /api/stock - Stock overview
- GET /api/stock/movements - Movement history
- POST /api/stock/movement - Create movement
- GET /api/stock/picking - Get picking lines
- PUT /api/stock/picking/:orderId/:lineId - Complete picking line
- GET /api/stock/statistics - Stock statistics

### Invoices
- GET /api/invoices - List invoices
- GET /api/invoices/:id - Get invoice
- POST /api/invoices - Create invoice from order
- PUT /api/invoices/:id - Update invoice
- PUT /api/invoices/:id/status - Update status
- DELETE /api/invoices/:id - Delete invoice
- GET /api/invoices/overdue - Get overdue invoices
- GET /api/invoices/statistics - Invoice statistics

## Socket.io Events

### Server → Client
- `order:created` - New order created
- `order:updated` - Order updated
- `article:created` - New article created
- `article:updated` - Article updated
- `stock:updated` - Stock levels changed
- `invoice:created` - New invoice created
- `invoice:updated` - Invoice updated
- `picking:completed` - Picking line completed

### Client → Server
- `subscribe:orders` - Subscribe to order updates
- `subscribe:stock` - Subscribe to stock updates
- `subscribe:invoices` - Subscribe to invoice updates
- `subscribe:picking` - Subscribe to picking updates

## Security Features
- JWT token authentication
- Password hashing with bcrypt
- Role-based access control
- Protected routes
- Input validation
- SQL injection prevention (via Mongoose)

## Workflow Examples

### Order Processing Flow
1. **Order Creation** → Status: "not_ready"
2. **Stock Check** → If available, auto-update to "ready_to_pick"
3. **Stock Reservation** → Reserve items when ready to pick
4. **Picking** → Warehouse staff pick items
5. **Complete Picking** → Status: "picked"
6. **Invoice Generation** → Finance creates invoice
7. **Invoice Sent** → Status: "invoiced"

### Stock Movement Flow
1. **Incoming Stock** → Movement type: "in"
2. **Order Creation** → Movement type: "reservation"
3. **Picking Complete** → Movement type: "out"
4. **Order Cancelled** → Movement type: "release"
5. **Stock Adjustment** → Movement type: "adjustment"

## Performance Considerations
- Database indexing on frequently queried fields
- Pagination support (ready for implementation)
- Socket.io room-based subscriptions
- Efficient query filtering
- Virtual fields for calculated values

## Future Enhancements
- [ ] PDF invoice generation
- [ ] Email notifications
- [ ] Barcode scanning
- [ ] Advanced reporting & analytics
- [ ] Multi-warehouse support
- [ ] Purchase order management
- [ ] Customer portal
- [ ] Mobile app
- [ ] Integration with accounting systems
- [ ] Automated reordering

## Development Setup
See QUICKSTART.md for detailed setup instructions.

## Testing
- Backend: Jest & Supertest (configured)
- Frontend: React Testing Library (configured)
- Manual testing with seed data

## Production Considerations
- Set NODE_ENV=production
- Use strong JWT_SECRET
- Enable HTTPS
- Implement rate limiting
- Set up monitoring & logging
- Database backups
- Load balancing for scalability

## License
MIT

## Support
For issues or questions, refer to the main README.md