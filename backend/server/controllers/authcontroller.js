import userModel from "../models/creatorModel.js";
import bcrypt, { hash } from "bcryptjs"
import transport from "../config/nodemailer.js";
import jwt from 'jsonwebtoken';



export const register = async (req, res ) => {
    const {name, email, password} = req.body;

    //If user refuses to put in details
    if(!name || !email || !password){
        return res.json({success: false, message: 'Missing details'})
    }
    try {
        // If user Exist 
        const existingUser = await userModel.findOne({email})
        if(existingUser) {
            return res.json({success: false, message: 'User already exists'})
        }

        /** If user does not exist, Hash the password and save
         * and save it in the database
         * The third line gets the name, email, password and save in the DB
         * Generation of token using jwt
         */
        const hashedPassword = await bcrypt.hash(password, 10);
        const user = new userModel({name, email, password:hashedPassword})
        await user.save();

        const token = jwt.sign({id: user._id}, process.env.JWT_SECRET, { expiresIn: '7d'});
        res.cookie('token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV  ===  'production',
            sameSite: 'none',
            maxAge: 7 * 24 * 60 * 60 * 1000
        })
        return res.json({success: true})

        
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
}



export const login = async (req, res) => {
    const {email, password} = req.body;

    if(!email || !password){
        return res.json({success: false, message: 'Email and password are required'})
    }
    try {
        /**Find the user via Email 
         * compare password(if password is wrong fail)
         * Then the whole cookie for the login too
        */
        const user = await userModel.findOne({email})
        if(!user) {
            return res.json({success:false, message: 'User does not exist'})
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if(!isMatch){
            return res.json({success:false, message: 'Invalid password'})
        }
        const token = jwt.sign({id: user._id}, process.env.JWT_SECRET, { expiresIn: '7d'});
        res.cookie('token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV  ===  'production',
            sameSite: process.env.NODE_ENV  ===  'production' ? 'none': 'strict',
            maxAge: 7 * 24 * 60 * 60 * 1000
        })
        return res.json({success: true})

    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }

}


export const logout = async (req, res) => {
    try {
        res.clearCookie('token', {
            httpOnly: true,
            secure: process.env.NODE_ENV  ===  'production',
            sameSite: process.env.NODE_ENV  ===  'production' ? 'none': 'strict',
            maxAge: 7 * 24 * 60 * 60 * 1000
        })
        return res.json({success: true, message: 'Logged Out'})
    }catch(error) {
        res.status(500).json({ success: false, message: error.message });

    }
}


/**
 * Verificatiion, Firstly Get userId , find user.id in db
 */
export const sendVerifyotp = async (req, res) => {
    try {
        const userId  = req.user._id

        const user = await userModel.findById(userId);

        if (!user) {
            return res.status(404).json({ success: false, message: "User not found" });
        }

        // If account is already verify 
        if(user.isAccountVerified) {
            return res.json({success: false, message:'Account is Already verified'})
        }

        // If it is not, Generate Otp and saving it 
        const otp = String(Math.floor(100000 + Math.random() * 900000));
        user.verifyotp = otp;
        user.verifyotpExpireAt = Date.now() + 24 * 60 * 60 * 1000;
        await user.save();

        // Sending otp to User Email
        const mailOption = {
            from: process.env.SENDER_EMAIL,
            to: user.email,
            subject: 'Account Verification OTP',
            text: `Your OTP is ${otp}. Verify your account using this otp`
        }
        await transport.sendMail(mailOption)

        return res.json({success: true, message: 'Verification OTP sent to Email'})
        
    } catch (error) {
        console.log(error)
        res.status(500).json({ success: false, message: error.message });
    }
}


export const verifyEmail = async (req, res) => {
    const { otp } = req.body;
    const userId = req.user._id;

    if(!userId || !otp) {
        return res.json({success: false, message: 'Missing Details'});
    }
    try {
        const user = await userModel.findById(userId);

        if (!user) {
            return res.json({success: false, message:'User not found'})
        }
        if (user.verifyotp === "" || user.verifyotp !== otp) {
            return res.json({success: false, message:'Invalid OTP'})
        }
        if(user.verifyotpExpireAt < Date.now()) {
            return res.json({success: false, message: 'OTP expires'})
        }
        user.isAccountVerified = true;
        user.verifyotp = '';
        user.verifyotpExpireAt = 0;
        await user.save();

        return res.json({ success: true, message: 'Email Veified Successfully'})
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
}

//Check if user isAuthenticated
export const isAuthenticated = async(req, res) => {
    try {
        return res.json({success: true})
        
    } catch (error) {
        res.status(500).json({ success:false, message: error.message})
    }
}


// Send otp to reset password
export const sendResetOtp = async (req, res) => {

    const { email } = req.body;

    // If email not provided 
    if (!email) {
        return res.json({success:false, message: 'Email is required'})
    }

    try {
        const user = await userModel.findOne({email});
        if(!user){
            return res.json({success:false, message: 'User not Found'})
        }

        // If it is not, Generate Otp and saving it 
        const otp = String(Math.floor(100000 + Math.random() * 900000));
        user.resetOtp = otp;
        user.resetOtpExpiresAt = Date.now() + 15 * 60 * 1000;
        await user.save();

        // Sending otp to User Email
        const mailOption = {
            from: process.env.SENDER_EMAIL,
            to: user.email,
            subject: 'Password Reset',
            text: `Your OTP is ${otp}. Reset your password`
        }
        await transport.sendMail(mailOption)

        return res.json({success: true, message: 'OTP sent to Email'})
        
        
    } catch (error) {
        return res.status(500).json({success:false, message: error.message})
        
    }
}


// Reset User to Password
export const resetPassword = async (req, res) => {

    const { email, otp, newPassword } = req.body;

    if (!email || !otp || !newPassword){
        return res.json({success:false, message: "Email, otp, new Password is required"})
    }

    try {
        const user = await userModel.findOne({email})
        if(!user) {
            return res.json({success:false, message: 'User is not available'})
        }

        if(user.resetOtp === "" || user.resetOtp !== otp) {
            return res.json({success: false, message: 'Invalid Otp'})
        }
        
        if(user.resetOtpExpiresAt < Date.now()){
            return res.json({success: false, message: 'OTP has expired'})
        }
        
        const hashedPassword = await bcrypt.hash(newPassword, 10);
        user.password = hashedPassword;
        user.resetOtp = "";
        user.resetOtpExpiresAt = 0;
        await user.save();

        return res.json({success: true, message: "Password has been reset Successfully"})
        
    } catch (error) {
        return res.status(500).json({success:false, message: error.message})
    }
}



