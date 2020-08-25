const express = require('express')
const router = express.Router()
const mongoose = require('mongoose')
const requireLogin = require('../middleware/requireLogin')
const { response } = require('express')
const Post = mongoose.model("Post")


router.get('/allposts', requireLogin, (req,  res) => {
    Post.find()
    .populate('postedBy', '_id name')
    .populate('comments.postedBy', '_id name')
    .sort('-createdAt')
    .then(posts => {
        res.json({posts})
    })
    .catch(error => console.log(error))
})

router.get('/getsubposts', requireLogin, (req,  res) => {
    Post.find({
        postedBy:{
            $in: req.user.following
        }})
    .populate('postedBy', '_id name')
    .populate('comments.postedBy', '_id name')
    .sort('-createdAt')
    .then(posts => {
        res.json({posts})
    })
    .catch(error => console.log(error))
})

router.post('/createpost', requireLogin, (req, res) => {
    const {title, body, pic} = req.body

    if(!title || !body || !pic) {
        return res.status(422).json({error:"please add all fields"})
    }

    req.user.password = undefined
    const post = new Post({
        title,
        body,
        photo: pic,
        postedBy: req.user
    })

    post.save().then(result => {
        res.json({post: result})
    })
    .catch(error => {
        console.log(error)
    })
})

router.get('/myposts', requireLogin, (req, res) => {
    Post.find({postedBy: req.user._id})
    .populate('PostedBy', '_id, name')
    .then(myposts => {
        res.json({myposts})
    })
    .catch(error => console.log(error))
})


router.put('/like', requireLogin, (req, res) =>{
    Post.findByIdAndUpdate(req.body.postId, {
        $push: {likes: req.user._id}
    }, {
        new: true
    }).exec((error, result) => {
        if(error){
            return res.status(422).json({error: error})
        }
        else {
            res.json(result)
        }
    })
})

router.put('/unlike', requireLogin, (req, res) =>{
    Post.findByIdAndUpdate(req.body.postId, {
        $pull: {likes: req.user._id}
    }, {
        new: true
    }).exec((error, result) => {
        if(error){
            return res.status(422).json({error: error})
        }
        else {
            res.json(result)
        }
    })
})

router.put('/comment', requireLogin, (req, res) =>{
    const comment = {
        text: req.body.text,
        postedBy: req.user._id
    }
    Post.findByIdAndUpdate(req.body.postId, {
        $push: {comments: comment}
    }, {
        new: true
    })
    .populate('comments.postedBy','_id name')
    .populate('postedBy', '_id name')
    .exec((error, result) => {
        if(error){
            return res.status(422).json({error: error})
        }
        else {
            res.json(result)
        }
    })
})

router.delete('/deletepost/:postId', requireLogin, (req, res) => {
    Post.findOne({_id: req.params.postId})
    .populate('postedBy', '_id')
    .exec((error, post) => {
        if(error || !post){
            return res.status(422).json({error: error})
        }
        if(post.postedBy._id.toString() === req.user._id.toString()){
            post.remove()
            .then(result => res.json(result))
            .catch(error => console.log(error))
        }
    })
})

module.exports = router