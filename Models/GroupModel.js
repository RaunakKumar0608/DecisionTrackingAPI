import { model, Schema } from "mongoose";

const groupSchema = new Schema(
    {
        groupName: {
            type: String,
            required: true,
            trim: true,
        },

        administrator: [{
            type: String,
            ref: "User",
        }],

        groupMembers: [{
            type: String,
            ref: "User",
        }],
        decisions : [{
        type: Schema.Types.ObjectId,
        ref: "Decision",
        }]
    },
    { timestamps: true }
);

const Group = model("Group", groupSchema);
export default Group;