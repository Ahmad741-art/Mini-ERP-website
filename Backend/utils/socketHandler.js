// Socket.io event handler
const setupSocketHandlers = (io) => {
  io.on('connection', (socket) => {
    console.log(`Ny klient ansluten: ${socket.id}`);

    // Hantera prenumerationer
    socket.on('subscribe:orders', () => {
      socket.join('orders');
      console.log(`${socket.id} prenumererar på ordrar`);
    });

    socket.on('subscribe:stock', () => {
      socket.join('stock');
      console.log(`${socket.id} prenumererar på lager`);
    });

    socket.on('subscribe:invoices', () => {
      socket.join('invoices');
      console.log(`${socket.id} prenumererar på fakturor`);
    });

    socket.on('subscribe:picking', () => {
      socket.join('picking');
      console.log(`${socket.id} prenumererar på plockning`);
    });

    // Unsubscribe
    socket.on('unsubscribe:orders', () => {
      socket.leave('orders');
    });

    socket.on('unsubscribe:stock', () => {
      socket.leave('stock');
    });

    socket.on('unsubscribe:invoices', () => {
      socket.leave('invoices');
    });

    socket.on('unsubscribe:picking', () => {
      socket.leave('picking');
    });

    socket.on('disconnect', () => {
      console.log(`Klient frånkopplad: ${socket.id}`);
    });
  });

  return io;
};

// Middleware för att göra io tillgänglig i routes
const attachSocketIO = (io) => {
  return (req, res, next) => {
    req.io = io;
    next();
  };
};

module.exports = {
  setupSocketHandlers,
  attachSocketIO
};