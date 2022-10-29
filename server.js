const mongoose=require('mongoose');
const dotenv=require('dotenv');
const Tour=require('./models/tourModel')

dotenv.config({path:'./config.env'});


process.on('uncaughtException',err=>{
    console.log("UNCAUGHT EXCEPTION");
    console.log(err.name,err.message);
})


const DB=process.env.DATABASE.replace('<PASSWORD>',process.env.DATABASE_PASSWORD)
// const DB=process.env.DATABASE_LOCAL;
// const DB='mongodb+srv://samarthkadam:hxY3zrR5INoIjcE8@cluster0.jtoecjs.mongodb.net/?retryWrites=true&w=majority';
mongoose.connect(DB,{
    useNewUrlParser:true,
    useCreateIndex:true,
    useFindAndModify:false,
    useUnifiedTopology:true
}).then((con)=>{
    console.log("DB connection successful");
})


const app=require('./app');
const port=8000;
const domain='127.0.0.1';
// console.log(process.env);

const server=app.listen(port,domain,()=>{
    console.log(`App running in ${port}`);
});

process.on('unhandledRejection',err=>{
    console.log(err.name,err.message);
    console.log("UNHANDLED REJECTION ");
    server.close(()=>{
        process.exit(1);
    });
})