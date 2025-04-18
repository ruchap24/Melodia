import { z } from 'zod'
import bcrypt from 'bcrypt'
import userModal from '../../modals/user.modal.js';
import generateJWT from '../../utils/generateJWT.utils.js';

export default async function signup(req, res) {
    try {
        const { name, email, password } = req.body

        const requiredBody = z.object({
            name: z.string().min(3).max(100),
            email: z.string().min(10).max(100).email(),
            password: z.string()
                .min(8, { message: "Password must be at least 8 characters long" })
                .max(50, { message: "Password must be at most 50 characters long" })
                .regex(/[a-z]/, { message: "Password must contain at least one lowercase letter" })
                .regex(/[A-Z]/, { message: "Password must contain at least one uppercase letter" })
                .regex(/\d/, { message: "Password must contain at least one number" })
                .regex(/[\W_]/, { message: "Password must contain at least one special character" })
        });

        const isParsedWithSuccess = requiredBody.safeParse(req.body)
        if (!isParsedWithSuccess.success) {
            return res.status(400).json({
                success: false,
                message: `Invalid input format`
            })
        }


        const userExists = await userModal.findOne({
            email
        })

        if (userExists) {
            return res.status(409).json({
                success: false,
                mesaage: `User already exists`
            })
        }

        const hashedPassword = await bcrypt.hash(password, 10)

        const user = await userModal.create({
            name,
            email,
            password: hashedPassword,
        })
        const token = generateJWT(user._id, "15d")

        let cookieOptions = {
            maxAge: 30 * 24 * 60 * 60 * 1000,
            sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            path: '/',
        };

        if (process.env.NODE_ENV === 'production') {
            cookieOptions.domain = '';
        }

        return res
        .cookie('token', token, cookieOptions)
        .status(201)
        .json({
            success: true,
            message: `You are signed up`,
            token: token,
            name,
            email,
        })
    } catch (err) {
        return res.status(500).json({
            success: false,
            message: `Server error in signup EP, ${err}`
        })
    }
}