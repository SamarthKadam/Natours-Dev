const AppError = require("./appError");

const sendErrorDev=(err,res)=>{
    res.status(err.statusCode).json({
        status:err.status,
        error:err,
        message:err.message,
        stack:err.stack
    });
}
const sendErrorProd=(err,res)=>{
    
    if(err.isOperational)
    {
        res.status(err.statusCode).json({
            status:err.status,
            message:err.message
        })
    }
    else{
        res.status(500).json({
            status:'error',
            message:'Something went wrong'
        })
    }
}

const HandleCastErrorDB=(err)=>{
    const message=`Invalid ${err.path}:${err.value}`;
    return new AppError(message,404);
}

const HandleDuplicateFields=(err)=>{

    console.log("The log of duplicate field is");
    const value=err.message.match(/(["'])(?:(?=(\\?))\2.)*?\1/)[0];
   const message=`Duplicate field value ${value}`;
   return new AppError(message,400);
}

const HandleValidationError=(err)=>{

    const errors=Object.values(err.errors).map(el=>el.message);
    const message=`Invalid input data ${errors.join('. ')}`;
    return new AppError(message,400)

}

const HandleJWTError=(err)=>{
    return new AppError('Invalid token Please login again',401);
}


module.exports=(err,req,res,next)=>{
    err.statusCode=err.statusCode||500;
    err.status=err.status||'error';
 
     if(process.env.NODE_ENV==='development')
     {
        console.log(err);
        sendErrorDev(err,res);
     }
     else if(process.env.NODE_ENV==='production')
     {
        let error={...err};
        console.log(error);
        if(error.name==='CastError')
        {
        error=HandleCastErrorDB(error);
        }
        if(error.code===11000)
        {
            error=HandleDuplicateFields(error);
        }
        if(error._message==='Validation failed')
        {
            error=HandleValidationError(error);
        }
        if(error.name==='TokenExpiredError')
        {
            error=HandleJWTError(error);
        }

        sendErrorProd(error,res);
     }

}