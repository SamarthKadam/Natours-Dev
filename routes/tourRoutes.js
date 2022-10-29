const express = require("express");
const fs=require('fs');
const tourController=require('./../controllers/tourController')
const AuthController=require('../controllers/authController');
const router=express.Router();
// const reviewController=require('../controllers/reviewController');
const reviewRouter=require('../routes/reviewRoutes')

router.use('/:tourId/reviews',reviewRouter);

// router.param('id',tourController.checkId)


router.route('/distances/:latlng/unit/:unit').get(tourController.getDistances);
router.route('/tours-within/:distance/center/:latlng/unit/:unit').get(tourController.getToursWithin);

router.route('/tour-stats').get(tourController.getTourStats);
router.route('/monthly-plan/:year').get(AuthController.protect,AuthController.restrictTo('admin','lead-guide','guide'),tourController.getMonthlyPlan);
router.route('/top-5-cheap').get(tourController.aliasTopTour,tourController.getAllTours);
router.route('/').get(tourController.getAllTours).post( AuthController.protect,AuthController.restrictTo('admin','lead-guide'),tourController.createTour);
router.route('/:id').get(tourController.getTour).patch(AuthController.protect,AuthController.restrictTo('admin','lead-guide'),tourController.updateTour).delete(AuthController.protect,AuthController.restrictTo('admin','lead-guide'),tourController.deleteTour);

// router.route('/:tourId/reviews').post(AuthController.protect,AuthController.restrictTo('user'),reviewController.createReview)

module.exports=router;