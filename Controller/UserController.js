import User from "../Models/User.js";
import Group from "../Models/GroupModel.js";
import Decisions from "../Models/Decision.js";
import crypto from "node:crypto";
import bcrypt from "bcryptjs";
import { sendEmail } from "../Utils/email.js";


export async function createUser(req, res) {
    try {
        let { name, email, password } = req.body;

        if (!name || !email || !password) {
            return res.status(400).json({
                message: "Name, email and password are required",
            });
        }

        name = name.trim();
        email = email.trim().toLowerCase();

        if (!name || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            return res.status(400).json({
                message: "Please provide a valid name and email address",
            });
        }

        if (password.length < 8) {
            return res.status(400).json({
                message: "Password must be at least 8 characters",
            });
        }

        let user = await User.findOne({ email });

        // Don't allow an already-verified account to register again.
        if (user?.emailVerified) {
            return res.status(409).json({
                message: "An account with this email already exists",
            });
        }

        // Generate a cryptographically secure six-digit OTP.
        const otp = crypto.randomInt(100000, 1000000).toString();

        // Store a hash, not the actual OTP.
        const otpHash = crypto
            .createHash("sha256")
            .update(otp)
            .digest("hex");

        const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

        const salt = await bcrypt.genSalt(12);
        const hashedPassword = await bcrypt.hash(password, salt);

        if (user) {
            // Reuse an existing unverified account.
            user.name = name;
            user.password = hashedPassword;
            user.emailOtpHash = otpHash;
            user.emailOtpExpiresAt = expiresAt;
            user.emailOtpAttempts = 0;
        } else {
            user = new User({
                name,
                email,
                password: hashedPassword,
                emailVerified: false,
                emailOtpHash: otpHash,
                emailOtpExpiresAt: expiresAt,
                emailOtpAttempts: 0,
            });
        }

       await user.save();

        try {
            await sendEmail({
                to: email,
                subject: "Verify your DecisionFlow email",
                text: `Your DecisionFlow verification code is ${otp}. It expires in 10 minutes.`,
                html: `
                    <div style="font-family: Arial, sans-serif; max-width: 480px; margin: auto;">
                        <h2>Verify your email</h2>
                        <p>Use this code to verify your DecisionFlow account:</p>
                        <div style="font-size: 32px; font-weight: bold; letter-spacing: 8px;">
                            ${otp}
                        </div>
                        <p>This code expires in 10 minutes.</p>
                        <p>If you didn't request this, you can ignore this email.</p>
                    </div>
                `,
            });
        } catch (emailError) {
            console.error("OTP email delivery failed:", emailError.message);

            user.emailOtpHash = undefined;
            user.emailOtpExpiresAt = undefined;
            user.emailOtpAttempts = 0;
            await user.save();

            return res.status(502).json({
                message: "We couldn't send the verification email. Please try registering again.",
            });
        }

        return res.status(200).json({
            message: "Verification code sent to your email",
            email,
        });
    } catch (error) {
        console.error("Registration error:", error.message);

        return res.status(500).json({
            message: "Registration failed",
        });
    }
}

export async function verifyEmailOtp(req, res) {
    try {
        let { email, otp } = req.body;

        if (!email || !otp) {
            return res.status(400).json({
                message: "Email and OTP are required",
            });
        }

        email = email.trim().toLowerCase();
        otp = String(otp).trim();

        if (!/^\d{6}$/.test(otp)) {
            return res.status(400).json({
                message: "Enter a valid six-digit OTP",
            });
        }

        const user = await User.findOne({ email });

        if (!user) {
            return res.status(400).json({
                message: "Invalid email or OTP",
            });
        }

        if (user.emailVerified) {
            return res.status(200).json({
                message: "Email is already verified",
            });
        }

        if (
            !user.emailOtpHash ||
            !user.emailOtpExpiresAt ||
            user.emailOtpExpiresAt.getTime() <= Date.now()
        ) {
            return res.status(400).json({
                message: "OTP has expired. Please register again to request a new one",
            });
        }

        if (user.emailOtpAttempts >= 5) {
            return res.status(429).json({
                message: "Too many incorrect attempts. Please request a new OTP",
            });
        }

        // Count this attempt before checking the submitted code.
        user.emailOtpAttempts += 1;

        const submittedHash = crypto
            .createHash("sha256")
            .update(otp)
            .digest("hex");

        const validOtp = crypto.timingSafeEqual(
            Buffer.from(submittedHash, "hex"),
            Buffer.from(user.emailOtpHash, "hex")
        );

        if (!validOtp) {
            if (user.emailOtpAttempts >= 5) {
                user.emailOtpHash = undefined;
                user.emailOtpExpiresAt = undefined;
            }

            await user.save();

            return res.status(400).json({
                message: user.emailOtpAttempts >= 5
                    ? "Too many incorrect attempts. Please register again to request a new OTP"
                    : "Invalid email or OTP",
            });
        }

        user.emailVerified = true;
        user.emailOtpHash = undefined;
        user.emailOtpExpiresAt = undefined;
        user.emailOtpAttempts = 0;

        await user.save();

        return res.status(200).json({
            message: "Email verified successfully. You can now log in.",
        });
    } catch (error) {
        console.error("Email verification error:", error.message);

        return res.status(500).json({
            message: "Email verification failed",
        });
    }
}



export async function login(req, res) {
    try {
        let { password, email } = req.body;

        if (!email || !password) {
            return res.status(400).json({
                message: "Email and password are required",
            });
        }

        email = email.trim().toLowerCase();

        const user = await User.findOne({ email });

        if (!user) {
            return res.status(401).json({
                message: "Invalid credentials",
            });
        }

        const storedPassword = user.password ?? "";
        const isBcryptHash = /^\$2[aby]\$\d{2}\$/.test(storedPassword);


        let passwordMatches = await bcrypt.compare(
                password,
                storedPassword
            );

        if (!passwordMatches) {
            return res.status(401).json({
                message: "Invalid credentials",
            });
        }

        if (!user.emailVerified) {
            return res.status(403).json({
                message: "Please verify your email before logging in.",
                emailVerified: false,
            });
        }

        res.cookie("cid", user._id.toString(), {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "lax",
            maxAge: 7 * 24 * 60 * 60 * 1000,
        });

        return res.status(200).json({
            message: "User logged in successfully",
        });
    } catch (error) {
        console.error("Login error:", error.message);

        return res.status(500).json({
            message: "Login failed",
        });
    }
}



export async function logout(req, res) {
    try {
        res.clearCookie("cid", {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "lax",
        });

        return res.status(200).json({
            message: "User logged out successfully",
        });
    } catch (error) {
        console.error("Logout error:", error.message);

        return res.status(500).json({
            message: "Logout failed",
        });
    }
}

    export async function Users(req,res){
        try {
            const {groupId} = req.body;

            const user = req.user;

            if (!groupId) {
                return res.status(401).json({message: "All fields are required"});
            }

            const group = await Group.findById(groupId);

            if (!group) {
                return res.status(401).json({message: "Group not found"});
            }

            const groupMembers = group.groupMembers;
            const isMember = groupMembers.find(id => id === user.toString());
            if(!isMember){
                return res.status(401).json({message: "You are not authorized"});
            }
            const users = await User.find({_id: {$in: groupMembers}}).select("name email");
            return res.status(200).json(users);

        }catch (err){
            console.log(err);
            return res.status(401).json(err);
        }

    }

export async function membersDecisions(req, res) {
    try {
        const { email, groupId } = req.query;

        if (!groupId || !email) {
            return res.status(400).json({
                message: "Group ID and email are required"
            });
        }

        const requesterEmail = req.email.trim().toLowerCase();
        const targetEmail = email.trim().toLowerCase();

        const validGroup = await Group.findById(groupId)
            .select("groupMembers decisions");

        if (!validGroup) {
            return res.status(404).json({
                message: "Group not found"
            });
        }

        const requesterIsMember = validGroup.groupMembers.some(
            memberEmail => memberEmail.toLowerCase() === requesterEmail
        );

        if (!requesterIsMember) {
            return res.status(403).json({
                message: "You are not authorized to view this group"
            });
        }

        // 2. Find the selected user.
        const selectedUser = await User.findOne({
            email: targetEmail
        }).select("_id email");

        if (!selectedUser) {
            return res.status(404).json({
                message: "User not found"
            });
        }

        const isGroupMember = validGroup.groupMembers.some(
            memberEmail => memberEmail.toLowerCase() === targetEmail
        );

        if (!isGroupMember) {
            return res.status(404).json({
                message: "This user is not a member of the group"
            });
        }

        const decisions = await Decisions.find({
            _id: { $in: validGroup.decisions },
            User: selectedUser._id
        }).select("-createdAt -updatedAt -__v ");

        return res.status(200).json({ decisions });

    } catch (error) {
        console.error("membersDecisions error:", error);

        if (error.name === "CastError") {
            return res.status(400).json({
                message: "Invalid group ID"
            });
        }

        return res.status(500).json({
            message: "Failed to fetch member decisions"
        });
    }
}

export async function getMyGroups(req, res) {
    try {
        const user = await User.findById(req.user).select("groups email");

        if (!user) {
            return res.status(404).json({
                message: "User not found"
            });
        }

        const groups = await Group.find({
            _id: { $in: user.groups },
            groupMembers: user.email.toLowerCase()
        })
            .select("groupName groupMembers")
            .lean();

        return res.status(200).json(groups);

    } catch (err) {
        console.error("getMyGroups error:", err);

        if (err.name === "CastError") {
            return res.status(400).json({
                message: "Invalid group ID"
            });
        }

        return res.status(500).json({
            message: "Failed to fetch groups"
        });
    }
}

export async function resendEmailOtp(req, res) {
    try {
        let { email } = req.body;

        if (!email) {
            return res.status(400).json({
                message: "Email is required",
            });
        }

        email = email.trim().toLowerCase();

        const user = await User.findOne({ email });

        // Avoid revealing whether an email is registered.
        if (!user) {
            return res.status(200).json({
                message: "If the account needs verification, an OTP email will be sent.",
            });
        }

        if (user.emailVerified) {
            return res.status(400).json({
                message: "This email is already verified. Please log in.",
            });
        }

        const cooldownMs = 60 * 1000;
        const lastSentAt = user.emailOtpLastSentAt?.getTime() ?? 0;
        const remainingMs = cooldownMs - (Date.now() - lastSentAt);

        if (remainingMs > 0) {
            return res.status(429).json({
                message: `Please wait ${Math.ceil(remainingMs / 1000)} seconds before requesting another OTP.`,
            });
        }

        const otp = crypto.randomInt(100000, 1000000).toString();

        user.emailOtpHash = crypto
            .createHash("sha256")
            .update(otp)
            .digest("hex");

        user.emailOtpExpiresAt = new Date(Date.now() + 10 * 60 * 1000);
        user.emailOtpAttempts = 0;
        user.emailOtpLastSentAt = new Date();

        await user.save();

        try {
            await sendEmail({
                to: user.email,
                subject: "Your DecisionFlow verification code",
                text: `Your verification code is ${otp}. It expires in 10 minutes.`,
                html: `<p>Your DecisionFlow verification code is <strong>${otp}</strong>.</p><p>It expires in 10 minutes.</p>`,
            });
        } catch (emailError) {
            console.error("OTP resend failed:", emailError.message);

            user.emailOtpHash = undefined;
            user.emailOtpExpiresAt = undefined;
            user.emailOtpLastSentAt = undefined;
            user.emailOtpAttempts = 0;
            await user.save();

            return res.status(500).json({
                message: "Unable to send the verification email. Please try again later.",
            });
        }

        return res.status(200).json({
            message: "A new verification code has been sent.",
        });
    } catch (error) {
        console.error("Resend OTP error:", error.message);

        return res.status(500).json({
            message: "Failed to resend verification code.",
        });
    }
}
