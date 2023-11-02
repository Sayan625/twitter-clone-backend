const TWEET = require('../models/TWEET.js')
const express = require('express')
const fs=require('fs')
const multer=require('multer')
const verify = require('../middleweres/verify.js')
const router = express.Router()


const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const directory = `./uploads/user/${req.data.id}/tweets`
        if (!fs.existsSync(directory)) {
          fs.mkdirSync(directory, { recursive: true })
        }
        cb(null, directory)
    },
    filename: (req, file, cb) => {
        const originalFileName = file.originalname; 
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
        const fileExtension = originalFileName.split('.').pop();
        const newFileName = `${file.fieldname}-${uniqueSuffix}.${fileExtension}`;
        cb(null, newFileName);

    },
});

const upload = multer({ storage: storage });

router.use('/uploads', express.static('uploads'));


router.get('/', async (req, res) => {
    try {
        const tweet = await TWEET.find()
        .sort( { '_id': -1 } )
        .populate({
            path: 'repliedTo',
            select: '_id content tweetedBy image',
            populate:{
                path: 'tweetedBy',
                select: '_id name username profile_pic',
            }})
        .populate({
            path: 'retweetedFrom',
            select: '_id content tweetedBy image likes replies retweetedBy',
            populate:{
                path: 'tweetedBy',
                select: '_id name username profile_pic',
            }})
        .populate('tweetedBy','_id name username email profile_pic')
        .populate('comments.commentedBy','_id name username email profile_pic')
        .populate('likes','_id name username email profile_pic')
        .populate('retweetedBy','_id name username email profile_pic')
        .populate({
            path: 'replies',
            select: '_id content tweetedBy image image likes replies retweetedBy',
            populate:{
                path: 'tweetedBy',
                select: '_id name username profile_pic',
            }

        }).exec()
        
        res.json(tweet)
    } catch (error) {
        res.json(error.message)
    }
})



router.get('/:id', async (req, res) => {
    const id = req.params.id
    try {
        const tweet = await TWEET.findById(id)
        .populate({
            path: 'repliedTo',
            select: '_id content tweetedBy image',
            populate:{
                path: 'tweetedBy',
                select: '_id name username profile_pic',
            }})
        .populate({
            path: 'retweetedFrom',
            select: '_id content tweetedBy image likes replies retweetedBy',
            populate:{
                path: 'tweetedBy',
                select: '_id name username profile_pic',
            }})
        .populate('tweetedBy','_id name username email profile_pic')
        .populate('comments.commentedBy','_id name username email profile_pic')
        .populate('likes','_id name username email profile_pic')
        .populate('retweetedBy','_id name username email profile_pic')
        .populate({
            path: 'replies',
            select: '_id content tweetedBy image replies comments retweetedBy likes',
            populate:{
                path: 'tweetedBy',
                select: '_id name username profile_pic',
            }

        }).exec()
      
        res.json(tweet)
    } catch (error) {
        res.json(error.message)
    }
})

router.use(verify) 
router.post('/upload',upload.single('file'),async (req,res)=>{
    if (!req.file) {
        return res.status(400).send('No file uploaded.');
      }
      const filePath = req.file.path;
      const imageUrl = `${req.protocol}://${req.get('host')}/api/tweet/${filePath}`
      console.log(imageUrl)
      res.send(imageUrl);
})

router.post('/', async (req, res) => {
    try {
        console.log(req.body)
        const newTweet = new TWEET(req.body)
        newTweet.tweetedBy=req.data.id
        await newTweet.save()
        res.json(newTweet)
    } catch (error) {
        res.json(error.message)
    }
})

router.delete('/:id', async (req, res) => {
    const id = req.params.id
    try {
        const tweet = await TWEET.findById(id)
        
        if (!tweet) 
            return res.json("tweet not found")

        if (tweet.tweetedBy.toString() !== req.data.id) 
            return res.json("invalid token")
        
        if(tweet.retweetedFrom!=null)
        await TWEET.findByIdAndUpdate(tweet.retweetedFrom,{$pull: {retweetedBy: req.data.id}},{new:true})
        
        await tweet.deleteOne()
        
        res.json("tweet deleted")

    } catch (error) {
        res.send(error.message)

    }

})

router.put('/:id/like', async (req,res)=>{
    const id=req.params.id
    
    try {
        const tweet= await TWEET.findById(id)
        
        if(!tweet)
            return res.json("tweet not found")

        if(tweet.likes.includes(req.data.id))
            return res.json("Already liked")
        

        await tweet.updateOne({$push:{likes: req.data.id}},{new:true})

        res.json(tweet)


    } catch (error) {
    res.send(error.message)
        
    }

})

router.put('/:id/dislike', async (req,res)=>{
    const id=req.params.id
    
    try {
        const tweet= await TWEET.findById(id)
        
        if(!tweet)
            return res.json("tweet not found")

        if(!tweet.likes.includes(req.data.id))
            return res.json("Already disliked")
        
        await tweet.updateOne({$pull:{likes: req.data.id}})

        res.json(tweet)


    } catch (error) {
    res.send(error.message)
    }

})

router.put('/:id/comment', async (req,res)=>{
    const id=req.params.id
    const comment={
        content: req.body.content,
        commentedBy: req.data.id,
        commentedAt: Date.now()
    }

    
    try {
        const tweetUpdated= await TWEET.findByIdAndUpdate(id,{$push:{comments: comment}},{new:true})
        if(!tweetUpdated)
        return res.json("tweet not found")
    
        res.json(tweetUpdated)


    } catch (error) {
    res.send(error.message)
        
    }

})

router.put('/:id/reply', async (req,res)=>{
    const id=req.params.id

    const reply={
        content: req.body.content,
        tweetedBy: req.data.id,
        repliedTo: id

    }
    try {
        const tweet=await TWEET.findById(id)
        if(tweet.tweetedBy.toString()===req.data.id)
            return res.status(400).json("Can not reply on your Own Tweet")
        if(tweet.repliedTo?.includes(id))
            return res.status(400).json("already replied")
        const newTweet = new TWEET(reply)
        await newTweet.save()
        await TWEET.findByIdAndUpdate(id,{$push:{replies: newTweet._id}},{new:true})

        console.log(newTweet)
        res.json(newTweet)


    } catch (error) {
    res.send(error.message)
        
    }

})


router.put('/:id/retweet', async (req,res)=>{
    const id=req.params.id

        const comment={
        content: req.body.content,
        commentedBy: req.data.id,
        commentedAt: Date.now()
    }

    const newTweetByUser={
        content: req.body.content,
        tweetedBy: req.data.id,
        retweetedFrom: id

    }
    try {
        const tweet=await TWEET.findById(id)

        if(tweet.retweetedBy.includes(req.data.id))
        return res.json("Retweeted Already")

        if(tweet.tweetedBy.toString()===req.data.id)
        return res.json("Can not Retweet you Own Tweet")

        const tweetUpdated= await TWEET.findByIdAndUpdate(id,{$push:{ 'retweetedBy' : req.data.id,'comments': comment}},{new:true})
        if(!tweetUpdated)
        return res.json("tweet not found")

        const newTweet = new TWEET(newTweetByUser)
        await newTweet.save()
        await newTweet.populate('tweetedBy','_id name username email profile_pic')
        
        res.json(newTweet)


    } catch (error) {
    res.send(error.message)
        
    }

})

module.exports = router