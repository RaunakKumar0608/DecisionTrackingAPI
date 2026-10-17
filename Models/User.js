import { model, Schema } from "mongoose";

const userSchema = new Schema(
    {
        name: {
            type: String,
            required: true,
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

        decisions: [{
            type: Schema.Types.ObjectId,
            ref: "decision",
        }],

        groups: [{
            type: Schema.Types.ObjectId,
            ref: "Group",
        }],
    },
    { timestamps: true }
);

const User = model("User", userSchema);
export default User;