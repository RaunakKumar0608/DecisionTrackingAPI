import { model, Schema } from "mongoose";

const decisionSchema = new Schema(
    {
        User: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },

        title: {
            type: String,
            required: true,
            trim: true,
        },

        description: {
            type: String,
            required: true,
        },

        decision: {
            type: String,
            required: true,
        },

        reason: {
            type: String,
            required: true,
        },

        status: {
            type: String,
            default: "Pending",
        },
    },
    {
        timestamps: true,
        strict: "throw",
    }
);

const Decisions = model("decision", decisionSchema);
export default Decisions;