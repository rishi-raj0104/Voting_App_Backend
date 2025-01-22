const express = require('express');
const router = express.Router();
const User = require('../model/user');
const Candidate = require('../model/candidate');
const {jwtAuthMiddleware,generateToken} = require('../jwt');
const mongoose = require('mongoose');

const checkAdminRole = async (userID) => {
    try{
         const user = await User.findById(userID);
         if(user.role === 'admin'){
             return true;
         }
    }catch(err){
         return false;
    }
}
router.get('/candidates', async (req, res) => {
    try {
      const candidates = await Candidate.find();
      res.status(200).json(candidates);
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: 'Error fetching candidates' });
    }
  });

router.post('/', async (req, res) =>{
    try{
        const data = req.body
        const newCandidate = new Candidate(data);
        const response = await newCandidate.save();
        res.status(200).json({response: response});
    }
    catch(err){
        console.log(err);
        res.status(500).json({error: err});
    }
})
router.put('/:candidateID', jwtAuthMiddleware, async (req, res)=>{
    try{
        if(!checkAdminRole(req.user.id))
            return res.status(403).json({message: 'user does not have admin role'});
        
        const candidateID = req.params.candidateID;
        const updatedCandidateData = req.body;

        const response = await Candidate.findByIdAndUpdate(candidateID, updatedCandidateData, {
            new: true,
            runValidators: true,
        })

        if (!response) {
            return res.status(404).json({ error: 'Candidate not found' });
        }
        res.status(200).json(response);
    }catch(err){
        console.log(err);
        res.status(500).json({error: 'Internal Server Error'});
    }
})

router.delete('/:candidateID', jwtAuthMiddleware, async (req, res) => {
    try {
        if (!checkAdminRole(req.user.id)) 
            return res.status(403).json({ message: 'User does not have admin role' });

        const candidateID = req.params.candidateID;
        const candidate = await Candidate.findById(candidateID).populate('votes.user');

        if (!candidate) {
            return res.status(404).json({ error: 'Candidate not found' });
        }
        const voterIds = candidate.votes.map(vote => vote.user._id);
        await User.updateMany(
            { _id: { $in: voterIds } },
            { $pull: { 'votes': { candidate: candidateID } }, $set: { isVoted: false } }
        );

        const response = await Candidate.findByIdAndDelete(candidateID);
        console.log('Candidate and associated votes deleted');
        res.status(200).json(response);

    } catch (err) {
        console.log(err);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

router.get('/votecheck', jwtAuthMiddleware, async (req, res)=>{
    const userId = req.user.id;
    try{
        const user = await User.findById(userId);
        if(!user){
            return res.status(404).json({msgcode:'RESTAPI400', message: 'user not found' });
        }
        if(user.role == 'admin'){
            return res.status(403).json({msgcode:'RESTAPI403',  message: 'admin is not allowed'});
        }
        if(user.isVoted){
            return res.status(200).json({msgcode:'RESTAPI2001', message: 'You have already voted' });
        }

        return res.status(200).json({ msgcode:'RESTAPI200' , message: 'Eligible to vote' });
    }catch(err){
        console.log(err);
        return res.status(500).json({error: 'Internal Server Error'});
    }
});
router.get('/vote/count', async (req, res) => {
    try{
        const candidate = await Candidate.find().sort({ voteCount: -1 });
        const voteRecord = candidate.map((data)=>{
            return {
                name: data.name,
                party: data.party,
                count: data.voteCount,
                age: data.age
            }
        });

        return res.status(200).json(voteRecord);
    }catch(err){
        console.log(err);
        res.status(500).json({error: 'Internal Server Error11'});
    }
});

router.get('/vote/:candidateID', jwtAuthMiddleware, async (req, res)=>{
    const candidateID = req.params.candidateID;
    if (!mongoose.Types.ObjectId.isValid(candidateID)) {
        return res.status(400).json({ error: 'Invalid candidate ID' });
    }
    const userId = req.user.id;
    console.log('candidateID22',candidateID);
    console.log('userId',userId);
    try{
        const candidate = await Candidate.findById(candidateID);
        if(!candidate){
            return res.status(404).json({ message: 'Candidate not found' });
        }

        const user = await User.findById(userId);
        if(!user){
            return res.status(404).json({ message: 'user not found' });
        }
        if(user.role == 'admin'){
            return res.status(403).json({ message: 'admin is not allowed'});
        }
        if(user.isVoted){
            return res.status(400).json({ message: 'You have already voted' });
        }

        candidate.votes.push({user: userId})
        candidate.voteCount++;
        await candidate.save();
        user.isVoted = true
        await user.save();

        return res.status(200).json({ message: 'Vote recorded successfully' });
    }catch(err){
        console.log(err);
        return res.status(500).json({error: 'Internal Server Error'});
    }
});

router.get('/', async (req, res) => {
    try {
        const candidates = await Candidate.find({}, 'name party -_id');
        res.status(200).json(candidates);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

router.get('/:candidateID', jwtAuthMiddleware, async (req, res)=>{
    try{
        const candidateID = req.params.candidateID;
        const response = await Candidate.findById(candidateID);
        if (!response) {
            return res.status(404).json({ error: 'Candidate not found' });
        }
        console.log('candidate deleted');
        res.status(200).json(response);
    }catch(err){
        console.log(err);
        res.status(500).json({error: 'Internal Server Error'});
    }
})
module.exports = router;