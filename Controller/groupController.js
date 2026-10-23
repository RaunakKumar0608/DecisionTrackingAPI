import Group from "../Models/GroupModel.js";
import User from "../Models/User.js";
export async function createGroup(req, res) {
    try {
        const {groupName} = req.body;
        if (!groupName) {
            return res.status(400).json({message: "Give your group a name"});
        }

        const group = await Group.create({
            groupName: groupName,
            administrator: [req.email],
            groupMembers: [req.email]
        })

        await User.findByIdAndUpdate(req.user, {
            $addToSet: {groups: group._id.toString()}
        })

        return res.status(201).json(group);
    }catch(err) {
        return res.status(400).json({message: err.message,messages: "failed to create group"});
    }
}



export async function addMember(req, res) {
    try {
        const { group, newMember } = req.body;

        if (!group || !newMember) {
            return res.status(400).json({
                message: "Group ID and member email are required"
            });
        }

        const email = newMember.trim().toLowerCase();

        // Find the group.
        const existingGroup = await Group.findById(group)
            .select("administrator groupMembers");

        if (!existingGroup) {
            return res.status(404).json({
                message: "Group not found"
            });
        }

        // Only an administrator can add members.
        const isAdmin = existingGroup.administrator.some(
            adminEmail => adminEmail.toLowerCase() === req.email.toLowerCase()
        );

        if (!isAdmin) {
            return res.status(403).json({
                message: "Only group administrators can add members"
            });
        }

        // Check whether the account exists.
        const userExists = await User.findOne({ email });

        if (!userExists) {
            return res.status(404).json({
                message: "User does not exist"
            });
        }

        // Prevent duplicate membership.
        const alreadyMember = existingGroup.groupMembers.some(
            memberEmail => memberEmail.toLowerCase() === email
        );

        if (alreadyMember) {
            return res.status(409).json({
                message: "This user is already a member of the group"
            });
        }

        // Add the email to the group's member list.
        await Group.findByIdAndUpdate(group, {
            $addToSet: {
                groupMembers: email
            }
        });

        // Add the group ID to the user's group list.
        await User.findByIdAndUpdate(userExists._id, {
            $addToSet: {
                groups: group
            }
        });

        return res.status(200).json({
            message: "Member added successfully"
        });
    } catch (err) {
        console.error("addMember error:", err);

        if (err.name === "CastError") {
            return res.status(400).json({
                message: "Invalid group ID"
            });
        }

        return res.status(500).json({
            message: "Failed to add member"
        });
    }
}


export async function addAdmin(req, res) {
    try {
        const { group, newAdmin } = req.body;

        if (!group || !newAdmin) {
            return res.status(400).json({
                message: "Group ID and new administrator email are required"
            });
        }

        const requesterEmail = req.email.trim().toLowerCase();
        const targetEmail = newAdmin.trim().toLowerCase();

        // Find the group.
        const existingGroup = await Group.findById(group)
            .select("administrator groupMembers");

        if (!existingGroup) {
            return res.status(404).json({
                message: "Group not found"
            });
        }

        // Only current administrators can promote another member.
        const isAdmin = existingGroup.administrator.some(
            email => email.toLowerCase() === requesterEmail
        );

        if (!isAdmin) {
            return res.status(403).json({
                message: "Only group administrators can promote members"
            });
        }

        // The target must have an existing account.
        const targetUser = await User.findOne({
            email: targetEmail
        });

        if (!targetUser) {
            return res.status(404).json({
                message: "User does not exist"
            });
        }

        // The target must already belong to this group.
        const isMember = existingGroup.groupMembers.some(
            email => email.toLowerCase() === targetEmail
        );

        if (!isMember) {
            return res.status(400).json({
                message: "Add this user to the group before promoting them"
            });
        }

        // Avoid duplicate administrators.
        const alreadyAdmin = existingGroup.administrator.some(
            email => email.toLowerCase() === targetEmail
        );

        if (alreadyAdmin) {
            return res.status(409).json({
                message: "This user is already an administrator"
            });
        }

        // Promote the existing member.
        await Group.findByIdAndUpdate(group, {
            $addToSet: {
                administrator: targetEmail
            }
        });

        return res.status(200).json({
            message: "Administrator added successfully"
        });
    } catch (err) {
        console.error("addAdmin error:", err);

        if (err.name === "CastError") {
            return res.status(400).json({
                message: "Invalid group ID"
            });
        }

        return res.status(500).json({
            message: "Failed to promote administrator"
        });
    }
}

export async function removeMember(req, res) {
    try {
        const { group, email } = req.body;

        if (!group || !email) {
            return res.status(400).json({
                message: "Group ID and member email are required"
            });
        }

        const targetEmail = email.trim().toLowerCase();
        const requesterEmail = req.email.trim().toLowerCase();

        const existingGroup = await Group.findById(group)
            .select("administrator groupMembers");

        if (!existingGroup) {
            return res.status(404).json({
                message: "Group not found"
            });
        }

        // Only administrators may remove members.
        const isAdmin = existingGroup.administrator.some(
            adminEmail => adminEmail.toLowerCase() === requesterEmail
        );

        if (!isAdmin) {
            return res.status(403).json({
                message: "Only group administrators can remove members"
            });
        }

        const isMember = existingGroup.groupMembers.some(
            memberEmail => memberEmail.toLowerCase() === targetEmail
        );

        if (!isMember) {
            return res.status(404).json({
                message: "This user is not a member of the group"
            });
        }

        const targetIsAdmin = existingGroup.administrator.some(
            adminEmail => adminEmail.toLowerCase() === targetEmail
        );

        // Never allow removal of the last administrator.
        if (targetIsAdmin && existingGroup.administrator.length === 1) {
            return res.status(400).json({
                message: "You cannot remove the last administrator"
            });
        }

        // Remove the target from the group.
        await Group.findByIdAndUpdate(group, {
            $pull: {
                groupMembers: targetEmail,
                administrator: targetEmail
            }
        });

        // Update the removed user's group list.
        const targetUser = await User.findOne({ email: targetEmail });

        if (targetUser) {
            await User.findByIdAndUpdate(targetUser._id, {
                $pull: {
                    groups: group
                }
            });
        }

        return res.status(200).json({
            message: "Member removed successfully"
        });
    } catch (err) {
        console.error("removeMember error:", err);

        if (err.name === "CastError") {
            return res.status(400).json({
                message: "Invalid group ID"
            });
        }

        return res.status(500).json({
            message: "Failed to remove member"
        });
    }
}

export async function leaveGroup(req, res) {
    try {
        const { groupId } = req.body;

        if (!groupId) {
            return res.status(400).json({
                message: "Group ID is required"
            });
        }

        const email = req.email.trim().toLowerCase();

        // Find the group.
        const group = await Group.findById(groupId)
            .select("administrator groupMembers");

        if (!group) {
            return res.status(404).json({
                message: "Group not found"
            });
        }

        // Confirm that the user belongs to the group.
        const isMember = group.groupMembers.some(
            memberEmail => memberEmail.toLowerCase() === email
        );

        if (!isMember) {
            return res.status(403).json({
                message: "You are not a member of this group"
            });
        }

        const isAdmin = group.administrator.some(
            adminEmail => adminEmail.toLowerCase() === email
        );

        // The last administrator must transfer administration first.
        if (isAdmin && group.administrator.length === 1) {
            return res.status(400).json({
                message: "You are the last administrator. Promote another member before leaving."
            });
        }

        // Remove the user from the group and its administrator list.
        await Group.findByIdAndUpdate(groupId, {
            $pull: {
                groupMembers: email,
                administrator: email
            }
        });

        // Remove the group from the user's group list.
        await User.findByIdAndUpdate(req.user, {
            $pull: {
                groups: groupId
            }
        });

        return res.status(200).json({
            message: "You have left the group successfully"
        });
    } catch (err) {
        console.error("leaveGroup error:", err);

        if (err.name === "CastError") {
            return res.status(400).json({
                message: "Invalid group ID"
            });
        }

        return res.status(500).json({
            message: "Failed to leave group"
        });
    }
}

export async function getMembers(req, res) {
    try {
        const { groupId } = req.body;

        if (!groupId) {
            return res.status(400).json({
                message: "Group ID is required"
            });
        }

        const group = await Group.findById(groupId)
            .select("groupMembers");

        if (!group) {
            return res.status(404).json({
                message: "Group not found"
            });
        }

        const requesterEmail = req.email.trim().toLowerCase();

        // Only current group members may view the member list.
        const isMember = group.groupMembers.some(
            email => email.toLowerCase() === requesterEmail
        );

        if (!isMember) {
            return res.status(403).json({
                message: "You are not authorized to view this group"
            });
        }

        const memberEmails = group.groupMembers.map(
            email => email.toLowerCase()
        );

        const users = await User.find({
            email: { $in: memberEmails }
        }).select("name email");

        return res.status(200).json(users);
    } catch (err) {
        console.error("getMembers error:", err);

        if (err.name === "CastError") {
            return res.status(400).json({
                message: "Invalid group ID"
            });
        }

        return res.status(500).json({
            message: "Failed to fetch group members"
        });
    }
}