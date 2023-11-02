const express=require('express')
const dotenv=require('dotenv')
const mongoose  = require('mongoose')
const cors=require('cors')
const auth=require('./routes/auth.js')
const user=require('./routes/user.js')
const tweet=require('./routes/tweet.js')


const app=express()
app.use(express.json())
app.use(cors())
dotenv.config()

mongoose.connect(process.env.MONGO_URI).then(()=>console.log("database connected"))


app.use("/api/auth",auth)
app.use("/api/user",user)
app.use("/api/tweet",tweet)




app.listen(5000,()=>console.log("server started at port 5000"))