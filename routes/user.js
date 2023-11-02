const express = require('express')
const multer=require('multer')
const path=require('path')
const fs=require('fs')
const USER = require('../models/USER.js')
const TWEET=require('../models/TWEET.js')
const verify = require('../middleweres/verify.js')


const router = express.Router()
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const directory = `./uploads/user/${req.data.id}/profile`

        if (!fs.existsSync(directory)) {
          fs.mkdirSync(directory, { recursive: true })
        }
        cb(null, directory)
    },
    filename: (req, file, cb) => {
        const originalFileName = file.originalname; // Get the original filename
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
        const fileExtension = originalFileName.split('.').pop(); // Get the original file extension
        const newFileName = `${file.fieldname}-${uniqueSuffix}.${fileExtension}`;
        cb(null, newFileName);

    },
});




const upload = multer({ storage: storage });

router.use('/uploads', express.static('uploads'));


router.get('/search', verify, async (req, res) => {
    const name = req.query.name
    if (!name) {
        res.send("query null")
        return

    }
    try {
        const user = await USER.find({ username: name })
            .populate('followers', '_id name username email profile_pic')
            .populate('following', '_id name username email profile_pic')

        if (!user) {
            
            return res.status(400).send("user not found")
        }

        let modifiedUser = []
        for (let i = 0; i < user.length; i++) {
            const { password, ...others } = user[i]._doc
            modifiedUser.push(others)
        }
        
        res.status(200).send(modifiedUser)
        
    } catch (error) {
        res.status(400).send(error.message)

    }
    
})

router.get('/:id', async (req, res) => {
    const id = req.params.id
    try {
        const user = await USER.findById(id)
        .populate('followers', '_id name username email profile_pic')
        .populate('following', '_id name username email profile_pic')

        if (!user) {
            res.send("user not found")
            return
        }
        
        const { password, ...others } = user._doc
        res.send({ ...others })
        
    } catch (error) {
        res.send(error.message)
    }
})

router.get('/:id/tweet', async (req, res) => {
    const id = req.params.id
    try {
        const tweet = await TWEET.find({ tweetedBy: id }).sort({ '_id': -1 })
        .populate({
            path: 'repliedTo',
            select: '_id content tweetedBy image likes replies retweetedBy',
            populate: {
                path: 'tweetedBy',
                    select: '_id name username profile_pic',
                }
            })
            .populate({
                path: 'retweetedFrom',
                select: '_id content tweetedBy image likes replies retweetedBy',
                populate: {
                    path: 'tweetedBy',
                    select: '_id name username profile_pic',
                }
            })
            .populate('tweetedBy', '_id name username email profile_pic')
            .populate('comments.commentedBy', '_id name username email profile_pic')
            .populate('likes', '_id name username email profile_pic')
            .populate('retweetedBy', '_id name username email profile_pic')
            .populate({
                path: 'replies',
                select: '_id content tweetedBy image',
                populate: {
                    path: 'tweetedBy',
                    select: '_id name username profile_pic',
                }
                
            }).exec()
            
            
            if (!tweet) {
                return res.send("tweet not found")
                
            }
            
            res.send(tweet)
            
        } catch (error) {
            res.send(error.message)
        }
    })
    

router.use(verify) 
router.post('/upload',upload.single('file'),async (req,res)=>{
    if (!req.file) {
        return res.status(400).send('No file uploaded.');
      }
      const filePath = req.file.path;
      const imageUrl = `${req.protocol}://${req.get('host')}/api/user/${filePath}`
      res.send(imageUrl);
})



router.put('/:id/update', async (req, res) => {
    const id = req.params.id
    if (id !== req.data.id) {
        res.send("invalid token")
        return
    }
    try {
        const updates = req.body

        const user = await USER.findByIdAndUpdate(req.params.id, { $set: updates }, { new: true })

        if (!user) {
            res.send("user not found")
            return
        }

        const { password, ...others } = user._doc
        res.send({ ...others })

    } catch (error) {
        res.send(error.message)

    }

})


router.delete('/:id/delete', async (req, res) => {
    const id = req.params.id
    if (id !== req.data.id) {
        res.send("invalid token")
        return
    }
    try {

        await USER.findByIdAndDelete(id)

        res.send("user deleted")

    } catch (error) {
        res.send(error.message)

    }

})

router.put('/:currrentUserId/follow', async (req, res) => {
    const currentUserId = req.params.currrentUserId
    const userToFollowId = req.body.userToFollowId

    if (currentUserId !== req.data.id)
        return res.json("invalid token")



    try {
        const currentUser = await USER.findById(currentUserId)
        const userToFollow = await USER.findById(userToFollowId)

        if (!currentUser || !userToFollow)
            return res.json("user not found")

        if (userToFollow.followers.includes(currentUserId))
            return res.json("Already following")

        if (currentUserId == userToFollowId)
            return res.json("can not follow yourself")

        await currentUser.updateOne({ $push: { following: userToFollowId } })
        await userToFollow.updateOne({ $push: { followers: currentUserId } })

        res.json("following the user")


    } catch (error) {
        res.send(error.message)

    }

})

router.put('/:currrentUserId/unfollow', async (req, res) => {
    const currentUserId = req.params.currrentUserId
    const userToUnFollowId = req.body.userToUnFollowId

    if (currentUserId !== req.data.id)
        return res.json("invaild token")



    try {
        const currentUser = await USER.findById(currentUserId)
        const userToUnFollow = await USER.findById(userToUnFollowId)

        if (!currentUser || !userToUnFollow)
            return res.json("user not found")

        if (!userToUnFollow.followers.includes(currentUserId))
            return res.json("Already unfollowed")

        if (currentUserId == userToUnFollowId)
            return res.json("can not unfollow yourself")

        await currentUser.updateOne({ $pull: { following: userToUnFollowId } })
        await userToUnFollow.updateOne({ $pull: { followers: currentUserId } })

        res.json("unfollowed the user")


    } catch (error) {
        res.send(error.message)

    }

})





module.exports = router