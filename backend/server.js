import express from 'express';
import cors from 'cors';
import 'dotenv/config'
import connectDB from './config/mongodb.js';
import connectCloudinary from './config/cloudinary.js';
import adminRouter from './routes/adminRoute.js';
import doctorRouter from './routes/doctorroute.js';
import userRouter from './routes/userRoute.js';

//app config
const app = express()
const port = process.env.PORT || 4000
connectDB()
connectCloudinary()

//middlewares
app.use(express.json())
const allowedOrigins = [
  'https://full-stack-project-frontend-9man.onrender.com',
  'https://full-stack-project-admin.onrender.com'
];

app.use(cors({
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));

//api endpoints 
app.use('/api/admin',adminRouter)   //localhost:4000/api/admin
app.use('/api/doctor',doctorRouter)
app.use('/api/user',userRouter)


app.get('/',(req,res)=>{
    res.send('API WORKING GREAT')
})

app.listen(port, ()=> 
    {
        console.log("Server Started",port)
    }
)
