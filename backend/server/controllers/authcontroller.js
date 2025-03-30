import userModel from "../models/userModel.js";
import bcrypt from "bcryptjs"
import jwt from "jsonwebtoken"
import transport from "../config/nodemailer.js";


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
            sameSite: process.env.NODE_ENV  ===  'production' ? 'none': 'strict',
            maxAge: 7 * 24 * 60 * 60 * 1000
        })

        // Sending a Welcome Email
        const mailOption = {
            from: process.env.SENDER_EMAIL,
            to: email,
            subject: 'Welcome to Vibeyy',
            text: 'Dear Vibe creator, Welcome onboard your account has been Created.'
        }
        await transport.sendMail(mailOption)

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
        const {userId} = req.body

        const user = await userModel.findById(userId);

        // If account is already verify 
        if(user.isAccountVerified) {
            return res.json({success: false, message:'Account is Already verified'})
        }

        // If it is not Generate Otp and saving it 
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
        res.status(500).json({ success: false, message: error.message });
    }
}


export const verifyEmail = async (req, res) => {
    const { userId, otp } = req.body;

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