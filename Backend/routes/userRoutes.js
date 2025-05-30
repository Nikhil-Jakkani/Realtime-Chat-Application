const express=require('express');
const router=express.Router();
const {registerUser}=require('../controllers/userControllers');
const {authUser}=require('../controllers/userControllers');
const {allUsers} = require('../controllers/userControllers');
const {guestLogin} = require('../controllers/userControllers');
const {protect} = require('../middleware/authMiddleware');

router.route('/').post(registerUser);
router.post('/login', authUser);
router.post('/guest-login', guestLogin);
router.route('/').get(protect, allUsers);

module.exports=router;