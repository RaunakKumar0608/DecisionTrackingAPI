import {model , Schema} from "mongoose";

const decision = new Schema({

    User: {
        type: Schema.Types.ObjectId
    },

    title: {
        type: String,
        required: true
    },

    description: {
        type: String,
        required: true
    },

    decision: {
        type: String,
        required: true
    },

    reason: {
        type: String,
        required: true
    },
    status: {
        type: String,
    }
},
{
    timestamps : true,
    strict : "throw"
})

const Decisions = model("decision",decision);
export default Decisions;