const User = require('../models/User');
const { generateToken } = require('../middleware/auth');

// @desc    Registrera ny användare
// @route   POST /api/auth/register
// @access  Private/Admin
exports.register = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    // Kontrollera om användare redan finns
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({
        success: false,
        message: 'Email är redan registrerad'
      });
    }

    // Skapa användare
    const user = await User.create({
      name,
      email,
      password,
      role: role || 'lager'
    });

    res.status(201).json({
      success: true,
      data: {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role
        },
        token: generateToken(user._id)
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Fel vid registrering',
      error: error.message
    });
  }
};

// @desc    Logga in användare
// @route   POST /api/auth/login
// @access  Public
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validera input
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email och lösenord krävs'
      });
    }

    // Hitta användare och inkludera lösenord
    const user = await User.findOne({ email }).select('+password');
    
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Ogiltiga inloggningsuppgifter'
      });
    }

    // Kontrollera om användare är aktiv
    if (!user.active) {
      return res.status(401).json({
        success: false,
        message: 'Kontot är inaktiverat'
      });
    }

    // Verifiera lösenord
    const isMatch = await user.comparePassword(password);
    
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Ogiltiga inloggningsuppgifter'
      });
    }

    // Uppdatera senaste inloggning
    user.lastLogin = new Date();
    await user.save();

    res.json({
      success: true,
      data: {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role
        },
        token: generateToken(user._id)
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Fel vid inloggning',
      error: error.message
    });
  }
};

// @desc    Hämta inloggad användare
// @route   GET /api/auth/me
// @access  Private
exports.getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);

    res.json({
      success: true,
      data: user
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Fel vid hämtning av användare',
      error: error.message
    });
  }
};

// @desc    Uppdatera användaruppgifter
// @route   PUT /api/auth/updatedetails
// @access  Private
exports.updateDetails = async (req, res) => {
  try {
    const fieldsToUpdate = {
      name: req.body.name,
      email: req.body.email
    };

    const user = await User.findByIdAndUpdate(req.user.id, fieldsToUpdate, {
      new: true,
      runValidators: true
    });

    res.json({
      success: true,
      data: user
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Fel vid uppdatering av uppgifter',
      error: error.message
    });
  }
};

// @desc    Uppdatera lösenord
// @route   PUT /api/auth/updatepassword
// @access  Private
exports.updatePassword = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('+password');

    // Kontrollera nuvarande lösenord
    const isMatch = await user.comparePassword(req.body.currentPassword);
    
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Felaktigt nuvarande lösenord'
      });
    }

    user.password = req.body.newPassword;
    await user.save();

    res.json({
      success: true,
      data: {
        user,
        token: generateToken(user._id)
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Fel vid uppdatering av lösenord',
      error: error.message
    });
  }
};