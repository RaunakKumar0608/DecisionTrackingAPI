
import { model, Schema } from "mongoose";

const userSchema = new Schema(
    {
        name: {
            type: String,
            required: true,
            trim: true,
        },

        email: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
            trim: true,
        },

        password: {
            type: String,
            required: true,
        },

        emailVerified: {
            type: Boolean,
            default: false,
        },

        // OTP security fields
        emailOtpHash: {
            type: String,
            default: undefined,
        },

        emailOtpExpiresAt: {
            type: Date,
            default: undefined,
        },

        emailOtpAttempts: {
            type: Number,
            default: 0,
        },

        decisions: [{
            type: Schema.Types.ObjectId,
            ref: "decision",
        }],

        groups: [{
            type: Schema.Types.ObjectId,
            ref: "Group",
        }],
        emailOtpLastSentAt: {
            type: Date,
            default: undefined,
        },
    },
    { timestamps: true }
);

const User = model("User", userSchema);
export default User;
