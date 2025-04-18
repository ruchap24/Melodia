import { z } from 'zod';
import bcrypt from 'bcrypt';
import userModal from '../../modals/user.modal.js';
import generateJWT from '../../utils/generateJWT.utils.js';

export default async function signin(req, res) {
  try {
    const { email, password } = req.body;

    const requiredBody = z.object({
      email: z.string().min(10).max(100).email(),
      password: z.string().min(8).max(50),
    });

    const isParsedWithSuccess = requiredBody.safeParse(req.body);
    if (!isParsedWithSuccess.success) {
      return res.status(400).json({
        success: false,
        message: "Invalid input format"
      });
    }


    const user = await userModal.findOne({ email });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User does not exist"
      });
    }


    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(400).json({
        success: false,
        message: "Incorrect password"
      });
    }

    const token = generateJWT(user._id, "15d");

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
    .status(200)
    .json({
      success: true,
      message: "You are signed in",
      token,
      name: user.name,
      email,
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: `Server error in signin EP, ${err}`
    });
  }
}
