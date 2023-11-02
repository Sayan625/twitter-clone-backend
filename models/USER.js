const mongoose=require('mongoose')

const userSchema=new mongoose.Schema({

    name:{
        type:String,
        required:true,
    },
    username:{
        type:String,
        required:true,
        unique:true,
    },
    email:{
        type:String,
        required:true,
        unique:true,
    },
    password:{
        type:String,
        required:true,
    },
    profile_pic:{
        type:String,
        default:""
    },
    location:{
        type:String,
        default:""
    },
    dateOfBirth:{
        type: Date,
        default:""
    },
    followers:[{
        type: mongoose.Schema.Types.ObjectId,
        ref:'USER'}],
    following:[{
            type: mongoose.Schema.Types.ObjectId,
            ref:'USER'}],
    about:{
        type: String,
        default:""
    }
},{timestamps:true})

module.exports= mongoose.model('USER',userSchema)