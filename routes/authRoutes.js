const express = require('express');
const router = express.Router();
const { registerUser, loginUser, logoutUser , forgotPassword, resetPassword } = require('../controllers/authController');

router.post('/register', registerUser);
router.post('/login', loginUser);
router.post('/logout', logoutUser);
router.post('/forgotpassword', forgotPassword);
router.put('/resetpassword/:resettoken', resetPassword); // PUT is better for updates

module.exports = router;