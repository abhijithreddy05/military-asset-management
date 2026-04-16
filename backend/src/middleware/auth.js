const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'kristalball_secret_key';

const authenticate = (req, res, next) => {
  const token = req.header('Authorization')?.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ message: 'Access denied. No token provided.' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded; // { id, username, role, base_id }
    next();
  } catch (ex) {
    res.status(400).json({ message: 'Invalid token.' });
  }
};

const authorize = (roles = []) => {
  if (typeof roles === 'string') {
    roles = [roles];
  }

  return (req, res, next) => {
    if (!req.user || (roles.length && !roles.includes(req.user.role))) {
      return res.status(403).json({ message: 'Forbidden. You do not have the required permissions.' });
    }
    next();
  };
};

module.exports = { authenticate, authorize, JWT_SECRET };
