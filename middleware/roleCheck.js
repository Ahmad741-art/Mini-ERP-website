// Middleware för att kontrollera användarroller
exports.authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Användare inte autentiserad'
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Rollen '${req.user.role}' har inte behörighet att utföra denna åtgärd`
      });
    }

    next();
  };
};

// Kontrollera specifika behörigheter per roll
exports.checkPermission = (action) => {
  const permissions = {
    admin: ['*'], // Admin har alla rättigheter
    lager: ['view_stock', 'update_stock', 'view_orders', 'pick_orders'],
    ekonomi: ['view_invoices', 'create_invoices', 'update_invoices', 'view_orders']
  };

  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Användare inte autentiserad'
      });
    }

    const userPermissions = permissions[req.user.role] || [];
    
    // Admin har alltid tillgång
    if (userPermissions.includes('*') || userPermissions.includes(action)) {
      return next();
    }

    return res.status(403).json({
      success: false,
      message: 'Du har inte behörighet att utföra denna åtgärd'
    });
  };
};