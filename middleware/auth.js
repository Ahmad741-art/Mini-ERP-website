const jwt = require('jsonwebtoken');
const User = require('../models/User');

exports.protect = async (req, res, next) => {
  let token;

  // Kolla om token finns i Authorization header
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Åtkomst nekad. Ingen token tillhandahållen.'
    });
  }

  try {
    // Verifiera token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Hämta användare från token
    req.user = await User.findById(decoded.id).select('-password');

    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Användare hittades inte'
      });
    }

    if (!req.user.active) {
      return res.status(401).json({
        success: false,
        message: 'Användarkonto är inaktiverat'
      });
    }

    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: 'Token är ogiltig eller har löpt ut'
    });
  }
};

// Generera JWT token
exports.generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || '7d'
  });
};