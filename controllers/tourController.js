const fs=require('fs');
const Tour=require('./../models/tourModel');
const AppError = require('./appError');
// const tours= JSON.parse(fs.readFileSync(`${__dirname}/../dev-data/data/tours-simple.json`,'utf-8'));
const catchAsync=require('./catchAsync');
const factory=require('./handlerFactory');

// exports.checkBody=(req,res,next)=>{
//     if(!req.body.name || !req.body.price)
//     {
//         res.status(404).json({
//             status:'fail',
//             message:'Missing name or price'
//         })
//     }

//     next();

// }

// exports.checkId=(req,res,next,val)=>{
//     if(req.params.id * 1>tours.length-1)
//     {
//         return  res.status(404).json({
//             status:'fail',
//             message:'Invalid Id'
//         })
//     }
//     next();
// }


exports.aliasTopTour=(req,res,next)=>{
    req.query.limit='5';
    req.query.sort='-ratingsAverage,price';
    req.query.fields='name,price,ratingsAverage,summary,difficulty'
    next();
}


exports.getAllTours=factory.getAll(Tour);

exports.getTour=factory.getOne(Tour,{path:'reviews'});


exports.createTour=factory.createOne(Tour);
// exports.createTour=async(req,res)=>{
//     try{
//     const newTour=await Tour.create(req.body);
//     res.status(201).json({
//         status:'success',
//         data:newTour,
//     })
//     }catch(err)
//     {
//         console.log(err);
//         res.status(404).json({
//             status:'fail',
//             message:'Cannot fetch the data'
//         })
//     }

// }

exports.updateTour=factory.updateOne(Tour)

exports.deleteTour=factory.deleteOne(Tour);

exports.getTourStats=catchAsync(async(req,res)=>{
        const stats=await Tour.aggregate([
            {
                $match:{ ratingsAverage:{ $gte:4.5}}
            },
            {
                $group:{
                     _id:{$toUpper:'$difficulty'},
                     numTours:{ $sum:1},
                     numRatings:{ $sum:'$ratingsQuantity'},
                     avgRating:{ $avg:'$ratingsAverage'},
                     avgPrice:{ $avg:'$price'},
                     minPrice:{ $min:'$price'},
                     maxPrice:{ $max:'$price'},
                }
            },
            {
                $sort:{ avgPrice:1}
            },
            // {
            //     $match:{ _id:{$ne:'EASY'}}
            // }
        ]);

        res.status(200).json({
            status:'success',
            stats
        })

})

exports.getMonthlyPlan=catchAsync(async(req,res)=>{
        const year=req.params.year*1;

        const plan=await Tour.aggregate([
            {
                $unwind:'$startDates'
            },
            {
                $match:{
                    startDates:{
                        $gte:new Date(`${year}-01-01`),
                        $lte:new Date(`${year}-12-31`)
                    }
                }
            },
            {
                $group:{
                    _id:{ $month:'$startDates'},
                    numTourStarts:{ $sum:1},
                    tours:{ $push:'$name'}
                }
            },
            {
                $addFields:{ month:'$_id'}
            },
            {
                $project:{_id:0}
            },
            {
                $sort:{ numTourStarts:-1}
            },
            {
                $limit:6
            }

        ])

        res.status(200).json({
            status:'success',
            data:{
                plan
            }
        })

})


// 34.020730 118.6919316

exports.getToursWithin=catchAsync(async(req,res,next)=>{
    const {distance,latlng,unit}=req.params;
    const [lat,lng]=latlng.split(',');
    const radius=unit==='mi'?distance/3963.2:distance/6378.1;

    if(!lat||!lng)
    {
        next(new AppError('Please provide lat and long in proper format lat,lng',400));
    }

    const tours=await Tour.find({startLocation:{ $geoWithin:{ $centerSphere:[[lng,lat],radius]}}});

    res.status(200).json({
        status:'success',
        results:tours.length,
        data:{
            data:tours
        }
    })
})

exports.getDistances=catchAsync(async(req,res,next)=>{

    const {latlng,unit}=req.params;
    const [lat,lng]=latlng.split(',');

    const multiplier=unit==='mi'?0.000621371:0.001;

    if(!lat||!lng)
    {
        next(new AppError('Please provide lat and long in proper format lat,lng',400));
    }


   const distance=await Tour.aggregate([
    {
        $geoNear:{
            near:{
                type:'Point',
                coordinates:[lng*1,lat*1]
            },
            distanceField:'distance',
            distanceMultiplier:multiplier
        }
    },
    {
        $project:{
            distance:1,
            name:1
        }
    }
   ])

   res.status(200).json({
    status:'success',
    data:{
        data:distance
    }
})

})