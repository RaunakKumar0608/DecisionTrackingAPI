import { model, Schema } from "mongoose";

const groupSchema = new Schema(
    {
        groupName: {
            type: String,
            required: true,
            trim: true,
        },

        administrator: [{
            type: Schema.Types.ObjectId,
            ref: "User",
        }],

        groupMembers: [{
            type: Schema.Types.ObjectId,
            ref: "User",
        }],
    },
    { timestamps: true }
);

const Group = model("Group", groupSchema);
export default Group;