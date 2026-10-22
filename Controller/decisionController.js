import User from "../Models/User.js";
import Decisions from "../Models/Decision.js";
import Group from "../Models/GroupModel.js";

export async function createDecision(req, res) {
    try {
        const {
            decision,
            title,
            reason,
            description,
            groupId
        } = req.body || {};

        if (!decision || !title || !description || !reason) {
            return res.status(400).json({
                message: "All fields are required"
            });
        }

        // If a group was selected, verify membership first.
        let group = null;

        if (groupId) {
            group = await Group.findById(groupId)
                .select("groupMembers");

            if (!group) {
                return res.status(404).json({
                    message: "Group not found"
                });
            }

            const isMember = group.groupMembers.some(
                id => id === req.email
            );

            if (!isMember) {
                return res.status(403).json({
                    message: "You are not a member of this group"
                });
            }
        }

        // Create the decision and record its creator.
        const dec = await Decisions.create({
            title,
            description,
            reason,
            decision,
            User: req.user
        });

        // Associate it with the creator.
       await User.findByIdAndUpdate(req.user, {
            $addToSet: {
                decisions: dec._id
            }
        });

        // Associate it with the selected group.
        if (groupId) {
            await Group.findByIdAndUpdate(groupId, {
                $addToSet: {
                    decisions: dec._id
                }
            });
        }

        return res.status(201).json({
            message: "Decision created successfully.",
            decision: dec
        });
    } catch (err) {
        console.error("createDecision error:", err);

        return res.status(500).json({
            message: "Failed to create decision"
        });
    }
}

export async function getDecisions(req, res) {

    const user = await User.findById(req.user);
    const decisions = await Decisions.find({_id : {$in : user.decisions}}).select("-_id -createdAt -updatedAt -__v")
    return res.status(200).json({decisions});
}