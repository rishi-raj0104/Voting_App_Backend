const express = require('express');
const router = express.Router();
const User = require('../model/user');
const jwt = require('jsonwebtoken');
const {jwtAuthMiddleware, generateToken} = require('./../jwt')

router.post('/signup', async (req, res) => {
    try {
      const data = req.body;
      const adminUser = await User.findOne({ role: 'admin' });
      if (data.role === 'admin' && adminUser) {
        return res.status(400).json({ msgcode:'RESTAPI400', data:'FAILED' , error: 'Admin user already exists' });
      }
  
      if (!/^\d{12}$/.test(data.aadharCardNumber)) {
        return res.status(400).json({msgcode:'RESTAPI400', data:'FAILED' , error: 'Aadhar Card Number must be exactly 12 digits' });
      }
      const existingUser = await User.findOne({ aadharCardNumber: data.aadharCardNumber });
      if (existingUser) {
        return res.status(200).json({msgcode:'RESTAPI400', data:'FAILED' , error: 'User with the same Aadhar Card Number already exists' });
      }

      const newUser = new User(data);
      const savedUser = await newUser.save();

      res.status(200).json({msgcode:'RESTAPI200', data:'SUCESS' });
      
    } catch (error) {
      console.error(error);
      res.status(500).json({msgcode:'RESTAPI500', data:'FAILED' , error: 'Internal Server Error' });
    }
  });
  
router.post('/login',async(req,res)=>{
    try {
        const {email, password} = req.body;
        if( !password){
            return res.status(400).json({error: 'Password is required'})
        }
        const user = await User.findOne({email: email});
        if( !user || !(await user.comparePassword(password))){
            return res.status(401).json({error: 'Invalid Password'});
        }
        const payload = {
            id: user._id,
            role: user.role
        }
        const token = generateToken(payload);
        res.status(200).json({msgcode:'RESTAPI200', data:'SUCESS' ,token:token});
    } catch (error) {
        console.error(err);
        res.status(500).json({ msgcode:'RESTAPI500', data:'FAILED' , error: 'Internal Server Error' });
    }
})

router.get('/profile', async (req, res) => {
    try {
      const token = req.headers.authorization.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const userId = decoded.id;
      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }
  
      res.status(200).json({ user });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Internal Server Error' });
    }
});

router.put('/profile/password', async (req, res) => {
    try {
        const { userId, currentPassword, newPassword } = req.body;
        if (!currentPassword || !newPassword) {
            return res.status(400).json({ error: 'Both currentPassword and newPassword are required' });
        }
        const user = await User.findById(userId);

        if (!user || !(await user.comparePassword(currentPassword))) {
            return res.status(401).json({ error: 'Invalid current password' });
        }

        user.password = newPassword;
        await user.save();
        res.status(200).json({ message: 'Password updated' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});
module.exports = router;