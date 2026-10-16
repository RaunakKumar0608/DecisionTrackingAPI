import {model,Schema} from "mongoose";
import User from "./User.js";
 const GroupSchema = new Schema({

    groupName : {
    type: String,
        required: true
    },

    administrator: {
    type: [Object],
        required: true,
    },

    groupMembers : {
    type : [Object]
    }

})

const Group = model("Group", GroupSchema);
export default Group;