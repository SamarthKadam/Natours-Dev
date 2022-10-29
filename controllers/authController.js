const User=require('../models/userModel');
const jwt=require('jsonwebtoken');
const AppError=require('./appError');
const catchAsync=require('./catchAsync');
const sendEmail=require('../utils/email');
const {promisify}=require('util');
const crypto=require('crypto');

const { hash } = require('bcryptjs');

const signToken=id=>{
    return jwt.sign({id},process.env.JWT_SECRET,{
        expiresIn:process.env.JWT_EXPIRES_IN
    });
}

const createSendToken=(user,statusCode,res)=>{
    const token=signToken(user._id);

    const cookieOption={
        expires:new Date(Date.now()+process.env.JWT_COOKIE_EXPIRESIN*24*60*60*1000),
        httpOnly:true
    }

    if(process.env.NODE_ENV==='production') cookieOption.secure=true;

    res.cookie('jwt',token,cookieOption);

    user.password=undefined;

    res.status(statusCode).json({
        status:'success',
        token,
        data:{
            user
        }
    })

}




exports.signup=catchAsync(async(req,res,next)=>{
    const newUser= await User.create({
        name:req.body.name,
        email:req.body.email,
        password:req.body.password,
        passwordConfirm:req.body.passwordConfirm,
        passwordChangedAt:req.body.passwordChangedAt,
        role:req.body.role

    });

    createSendToken(newUser,201,res);
})
exports.login=catchAsync(async (req,res,next)=>{
    const {email,password}=req.body;

    if(!email||!password)
    {
        return next(new AppError('please provide email and password',400))
    }
    const user=await User.findOne({email}).select('+password');
    console.log(user);


    if(!user || !(await user.correctPassword(password,user.password)))
    {
        return next(new AppError('Incorrect email or password',401));
    }


    createSendToken(user,200,res);
})

exports.protect=catchAsync(async (req,res,next)=>{

    let token;
    if(req.headers.authorization && req.headers.authorization.startsWith('Bearer'))
    {
        token=req.headers.authorization.split(' ')[1];
    }
    else if(req.cookies.jwt)
    {
        token=req.cookies.jwt
    }
    console.log(token);

    if(!token)
    {
        return next(new AppError('You are not logged in,Please log in to get',401));    
    }

   const decoded=await promisify(jwt.verify)(token,process.env.JWT_SECRET);
   console.log(decoded);

   const currentUser=await User.findById(decoded.id);
   if(!currentUser)
   {
    return next(new AppError('The user belonging to this user does not exist',401));
   }

    if(currentUser.changedPasswordAfter(decoded.iat))
    {
        return next(new AppError('User recently changed the password,Please log in again',401));
    }
    req.user=currentUser;

    next();
})


exports.isLoggedIn=catchAsync(async (req,res,next)=>{

    if(req.cookies.jwt)
    {
   const decoded=await promisify(jwt.verify)(req.cookies.jwt,process.env.JWT_SECRET);

   const currentUser=await User.findById(decoded.id);
   if(!currentUser)
   {
    return next();
   }

    if(currentUser.changedPasswordAfter(decoded.iat))
    {
        return next();
    }
    res.locals.user=currentUser;
    return next();
}
next();
})


exports.restrictTo=(...roles)=>{
    return (req,res,next)=>{
        if(!roles.includes(req.user.role))
        {
            return next(new AppError('You do not have permission to perform this action',403));
        }
        next();
    }
}

exports.forgotPassword=async(req,res,next)=>{

    const user=await User.findOne({email:req.body.email});
    if(!user)
    {
        return next(new AppError('There is no user with Email address',404));
    }
    const resetToken=user.createPasswordResetToken();
    await user.save({validateBeforeSave:false});


    const resetURL=`${req.protocol}://${req.get('host')}/api/v1/users/resetPassword/${resetToken}`;

    const message=`Forgot your password submit a patch request with your new password and password confirm to :${resetURL} \n if you didn't forgot your password please ignore this message`;


    try{
    await sendEmail({email:user.email,
    subject:'your password reset token valid for 10 minutes',
    message});
    res.status(200).json({
        status:'success',
        messsage:'Token sent to email!'
    })
    }
    catch(err)
    {
        user.passwordResetToken=undefined;
        user.passwordResetExpires=undefined
        await user.save({validateBeforeSave:false});
        return next(new AppError('There was error sending the email.Try again later',500));
    }
}
exports.resetPassword=catchAsync(async(req,res,next)=>{

    const hashedtoken=crypto.createHash('sha256').update(req.params.token.trim()).digest('hex');
    const user=await User.findOne({passwordResetToken:hashedtoken,passwordResetExpires:{$gt:Date.now()}});


    if(!user)
    {
        return next(new AppError('Token is invalid or expired',400));
    }

    user.password=req.body.password;
    user.passwordConfirm=req.body.passwordConfirm;
    user.passwordResetToken=undefined;
    user.passwordResetExpires=undefined;
    await user.save()

    createSendToken(user,200,res);

});

exports.updatePassword=catchAsync(async(req,res,next)=>{
    
    const user=await User.findById(req.user.id).select('+password');

    if(!(user.correctPassword(req.body.passwordCurrent,user.password)))
    {
        return next(new AppError('Your current password is wrong.',401))
    }

    user.password=req.body.password;
    user.passwordConfirm=req.body.passwordConfirm;

    await user.save();

    createSendToken(user,200,res);
})