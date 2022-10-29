const express=require('express');
const userController=require('./../controllers/userController');
const authController=require('../controllers/authController');
const tourController=require('../controllers/tourController')

const router=express.Router();


router.patch('/updateMyPassword',authController.protect,authController.updatePassword);
router.patch('/updateMe',authController.protect,userController.updateMe);

router.delete('/deleteMe',authController.protect,userController.deleteMe);

router.get('/me',authController.protect,userController.getMe,userController.getUser);


router.post('/signup',authController.signup);
router.post('/login',authController.login);  

router.post('/forgotPassword',authController.forgotPassword);
router.patch('/resetPassword/:token',authController.resetPassword);


router.use(authController.protect,authController.restrictTo('admin'));

router.route('/').get(userController.getAllUsers).post(userController.createUser);
// router.route('/:id').get(userController.getUser).patch(userController.updateUser).delete(authController.protect,authController.restrictTo('admin','lead-guide'),tourController.deleteTour);
router.route('/:id').get(userController.getUser).patch(userController.updateUser).delete(userController.deleteUser);


module.exports=router;

///Try to use something modified here by setting up middleweare for all the one which require same middleware that is declare global middleware
// as router.use(middleware)