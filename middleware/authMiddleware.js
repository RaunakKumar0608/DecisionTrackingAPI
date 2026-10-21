import User from "../Models/User.js";


export async function authMiddleware(req, res, next) {

    if(!req.cookies.cid){
        return res.status(401).json({message: "Login required"});
    }

    const user = await User.findById(req.cookies.cid).select("email");
    if(!user) return res.status(401).json({message: "User does not exist anymore"});
    req.user = user._id
    req.email = user.email

    return next();
}


