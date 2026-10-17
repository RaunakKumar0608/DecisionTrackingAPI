import User from "../Models/User.js";
import Decisions from "../Models/Decision.js";

export async function createDecision(req, res) {

    const {decision,title,reason,description} = req.body;
    if(!decision || !title || !description || !reason){
        return res.status(400).json({message:"All fields are required"});
    }

    console.log(decision);

    const dec = await Decisions.create({
        title,
        description,
        reason,
        decision,
        User : req.user
    })

    console.log("Here is the decision");

    await User.findByIdAndUpdate({_id : req.user}, {
            $push : {
                decisions : dec._id
            }
        });

    return res.json(dec , { message: "Decision created successfully." });

}

export async function getDecisions(req, res) {

    const user = await User.find(req.user);
    const decisions = await Decisions.find({_id : {$in : user.decision}})

    return res.status(200).json({decisions});
}