const path=require('path');
const express=require('express');
const morgan=require('morgan');
const AppError=require('./controllers/appError');
const tourRouter=require('./routes/tourRoutes');
const reviewRouter=require('./routes/reviewRoutes');
const userRouter=require('./routes/userRoutes');
const globalErrorHandler=require('./controllers/errorController');
const app=express(); 
const rateLimit=require('express-rate-limit');
const helmet=require('helmet');
const mongosanitize=require('express-mongo-sanitize');
const xss=require('xss-clean');
const hpp=require('hpp');
const viewRouter=require('./routes/viewRoutes');
const cookieParser=require('cookie-parser');


app.set('view engine','pug');
app.set('views',path.join(__dirname,'views'));

app.use(express.static(path.join(__dirname,'public')));


app.use(helmet());

if(process.env.NODE_ENV==='development')
{
app.use(morgan('dev'));////this is the 3rd party middleware which provide the info of routing status code and the time taken to get the response and size of the response in kb
}

const limiter=rateLimit({
    max:100,
    windowMs:60*60*1000,
    message:'Too many request from this IP,please try again in hour'
})

app.use('/api',limiter)

// app.use(express.static(`${__dirname}/public`))
app.use(express.json({limit:'10kb'}));   ///We can write on body kind of thing,It is caled middleware that is in between request response model
app.use(cookieParser())

app.use(mongosanitize());
app.use(xss());

app.use(hpp({
    whitelist:['duration','ratingsQuantity','ratingsAverage','maxGroupSize','difficulty','price']
}))

app.use((req,res,next)=>{
    // console.log("Hello from the middleWare");
    // console.log(req.headers);
    next();
})

app.use((req,res,next)=>{
    req.requestTime=new Date().toISOString();
    console.log(req.cookies);
    next();
})


app.use('/',viewRouter);
app.use('/api/v1/tours',tourRouter);
app.use('/api/v1/users',userRouter);
app.use('/api/v1/reviews',reviewRouter);


app.all('*',(req,res,next)=>{
    // res.status(404).json({
    //     status:'fail',
    //     message:`Can't find ${req.originalUrl} on this server`
    // })
    // const err=new Error(`Can't find the ${req.originalUrl} on this server`);
    // err.statusCode=404;
    // err.status='fail';
    next(new AppError(`Can't find the ${req.originalUrl} on this server`,404));
})


app.use(globalErrorHandler);

module.exports=app;