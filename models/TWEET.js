const mongoose=require('mongoose')

const tweetSchema=new mongoose.Schema({

    content:{
        type:String,
        required:true,
    },
    tweetedBy:{
        type: mongoose.Schema.Types.ObjectId,
        ref:'USER'},
    likes:[{
        type: mongoose.Schema.Types.ObjectId,
        ref:'USER'}],
    retweetedBy:[{
        type: mongoose.Schema.Types.ObjectId,
        ref:'USER'}],
    image:{
        type: String,
        default:""
    },
    repliedTo: {
        type: mongoose.Schema.Types.ObjectId,
        ref:'TWEET',
        default:null

    },
    retweetedFrom : {
        type: mongoose.Schema.Types.ObjectId,
        ref:'TWEET',
        default: null
    },
    replies:[{
        type: mongoose.Schema.Types.ObjectId,
        ref:'TWEET'}],
    comments:[{
        content: {
            type: String,
            default:""
        },
        commentedBy:{
            type: mongoose.Schema.Types.ObjectId,
            ref:'USER'},
        commentedAt:{
            type: Date,
            default: null
        }}]

},{timestamps:true})





module.exports= mongoose.model('TWEET',tweetSchema)