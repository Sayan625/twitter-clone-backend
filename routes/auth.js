const USER=require('../models/USER.js')
const  express=require('express')
const bcrypt=require('bcrypt')
const JWT=require('jsonwebtoken')
const router=express.Router()

router.post('/signup', async(req,res)=>{
    try {
        const salt= await bcrypt.genSalt(10)
        const hash= await bcrypt.hash(req.body.password,salt)
        const newUser= new USER({...req.body, password: hash})
        await newUser.save()
        res.send({...newUser._doc})
    } catch (error) {
    res.send(error)
        
    }
})

router.post('/signin', async(req,res)=>{
    try {
        const user= await USER.findOne({email: req.body.email})
        .populate('followers', '_id name username email profile_pic')
        .populate('following', '_id name username email profile_pic')

        if(!user)
        return res.status(400).json("user not found")
        const isCorrect= await bcrypt.compare(req.body.password,user.password)
        if(isCorrect){
            const {password, ...others}=user._doc
            const token=JWT.sign({id: user._id},process.env.JWT)
            res.send({...others,token})

        }else{
            res.status(400).send("password not matched")
        }


    } catch (error) {
    res.send(error.message)
        
    }
})

module.exports=router