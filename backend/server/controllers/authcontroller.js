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
        res.json({success: false, message: error.message})
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
        res.json({success: false, message: error.message})
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
        res.json({success: false, message: error.message})

    }
}