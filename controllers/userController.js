
const catchAsync=require('../controllers/catchAsync');
const Users=require('../models/userModel');
const AppError=require('./appError');
const factory=require('./handlerFactory');

const filterObj=(obj,...allowedFields)=>{
    const newobj={};
    Object.keys(obj).forEach((el)=>{
        if(allowedFields.includes(el))
        {
            newobj[el]=obj[el];
        }
    })

    return newobj;
}

exports.getAllUsers=factory.getAll(Users);

exports.updateMe=catchAsync(async(req,res,next)=>{
    if(req.body.password||req.body.passwordConfirm)
    {
        return next(new AppError('This route is not for passwordUpdates.Please use /updateMyPassword',400));
    }




    const filteredBody=filterObj(req.body,'name','email')
    const updatedUser=await Users.findByIdAndUpdate(req.user.id,filteredBody,{
        new:true,
        runValidators:true
    })


    res.status(200).json({
        status:'success',
        data:updatedUser
    })
})


exports.getMe=(req,res,next)=>{
    req.params.id=req.user.id;
    next();
}

exports.deleteMe=catchAsync(async(req,res,next)=>{

    await Users.findByIdAndUpdate(req.user.id,{active:false});

    res.status(204).json({
        status:'success',
        data:null
    })

})

exports.getUser=factory.getOne(Users);

exports.createUser=(req,res)=>{
    res.status(500).json({
        status:'error',
        message:'This route is not yet defined Please sign up'
    })

}

exports.updateUser=factory.updateOne(Users)
exports.deleteUser=factory.deleteOne(Users);