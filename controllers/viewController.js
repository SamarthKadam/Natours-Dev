const Tour=require('../models/tourModel');
const catchAsync=require('./catchAsync.js');

exports.getOverview=catchAsync(async(req,res,next)=>{


    const tours=await Tour.find();
    res.status(202).render('overview',{
        title:'All tours',
        tours

    })
});

exports.getTour=catchAsync(async(req,res,next)=>{

    const tour=await Tour.findOne({slug:req.params.slug}).populate({
        path:'reviews',
        fields:'review rating user'
    });

    console.log(tour);

    res.status(200).render('tour',{
        title:`${tour.name} Tour`,
        tour
    });
})

exports.getLoginForm=(req,res)=>{
    res.status(200).render('login',{
        title:`Log into your account`
    })
}