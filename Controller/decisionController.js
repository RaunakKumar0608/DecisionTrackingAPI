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
    const decisions = await Decisions.find({_id : {$in : user.decisions}}).select("-User -createdAt -updatedAt -__v")
    return res.status(200).json({decisions});
}


export async function editDecisions(req, res) {
    try {
        const { id } = req.params;
        const { title, decision, reason, description } = req.body || {};

        const updates = {};

        if (title !== undefined) updates.title = title;
        if (decision !== undefined) updates.decision = decision;
        if (reason !== undefined) updates.reason = reason;
        if (description !== undefined) updates.description = description;

        if (Object.keys(updates).length === 0) {
            return res.status(400).json({
                message: "Provide at least one field to update"
            });
        }

        for (const [field, value] of Object.entries(updates)) {
            if (typeof value !== "string" || !value.trim()) {
                return res.status(400).json({
                    message: `${field} cannot be empty`
                });
            }

            updates[field] = value.trim();
        }

        const updatedDecision = await Decisions.findOneAndUpdate(
            { _id: id, User: req.user },
            { $set: updates },
            { after: true, runValidators: true }
        );

        if (!updatedDecision) {
            return res.status(404).json({
                message: "Decision not found or you do not own it"
            });
        }

        return res.status(200).json({
            message: "Decision updated successfully",
            decision: updatedDecision
        });
    } catch (err) {
        console.error("editDecisions error:", err);

        if (err.name === "CastError") {
            return res.status(400).json({
                message: "Invalid decision ID"
            });
        }

        return res.status(500).json({
            message: "Failed to edit decision"
        });
    }
}

export async function deleteDecisions(req, res) {
    try {
        const { id } = req.params;

        const decision = await Decisions.findOne({
            _id: id,
            User: req.user
        });

        if (!decision) {
            return res.status(404).json({
                message: "Decision not found or you do not own it"
            });
        }

        await User.findByIdAndUpdate(req.user, {
            $pull: { decisions: decision._id }
        });

        await Group.updateMany(
            { decisions: decision._id },
            { $pull: { decisions: decision._id } }
        );

        await Decisions.deleteOne({ _id: decision._id });

        return res.status(200).json({
            message: "Decision deleted successfully"
        });
    } catch (err) {
        console.error("deleteDecisions error:", err);

        if (err.name === "CastError") {
            return res.status(400).json({
                message: "Invalid decision ID"
            });
        }

        return res.status(500).json({
            message: "Failed to delete decision"
        });
    }
}