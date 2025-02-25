// In your authenticateUser.js file
const jwt = require('jsonwebtoken');

const authenticateUser = (req, res, next) => {
  const token = req.cookies.jwt;
  
  if (!token) {
    return res.redirect('/auth/login');
  }
  
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Set user directly on the request object
    req.user = {
      id: decoded.userId,
      epost: decoded.epost
    };
    
    console.log('Setting user in middleware:', req.user);
    // Continue to the next middleware or route handler
    next();
  } catch (error) {
    console.error('JWT verification error:', error);
    res.clearCookie('jwt');
    return res.redirect('/auth/login');
  }
};

module.exports = authenticateUser;