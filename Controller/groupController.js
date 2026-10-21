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
            administrator: [req.user.toString()],
            groupMembers: [req.user.toString()]
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
        const {group, newMember} = req.body;

        if (!group || !newMember) {
            return res.status(400).json({message: "Group Id and Member's email is required"});
        }

        const userExists = await User.find({email : newMember});

        if (userExists.length == 0) {
            return res.status(400).json({message: "User Doesn't exist, User Can't be added to group"});
        }

        const groupExist = await Group.findById(group).select("administrator");

        if (!groupExist) {
            return res.status(400).json({message: "Group Does Not Exist, User Can't be added to group"});
        }
        const isAdmin = groupExist.administrator.find(user => user === req.user.toString());

        if (!isAdmin) {
            return res.status(401).json({message: "You are not authorized to add members"});
        }

        await Group.updateOne({
                _id: group
            },
            {
                $addToSet: {
                    groupMembers: newMember.toLowerCase()
                }
            })

        await User.updateOne({
            email : newMember
            },
            {
            $addToSet: {
                groups: group
            }
        })

        return res.status(201).json({message: "Member added successfully"});
    }catch(err) {
        console.log(err.message);
        return res.status(400).json({message: err.message});
    }
}

export async function addAdmin(req, res) {
    try{
    const user = req.user;
    const {group, newAdmin} = req.body;

    if (!group || !newAdmin) {
        return res.status(400).json({message: "Id of both group and newAdmin is required"});
    }


    const isGroup = await Group.findById(group).select("administrator");
    if (!isGroup) {
        return res.status(400).json({message: "Group not found"});
    }

    const isUser = await User.findById(newAdmin).select("_id");
    if (!isUser) {
        return res.status(400).json({message: "User can't be added because user doesn't exist"});
    }

    const isAdmin = isGroup.administrator.find(id => id.equals(user))

    if (!isAdmin) {
        return res.status(400).json({message: "You are not authorized to give administrator status"});
    }

    await Group.updateOne({_id : group}, {
        $addToSet: {
            administrator: newAdmin,
            groupMembers: newAdmin
        }
    })

    await User.findByIdAndUpdate({_id : newAdmin}, {
        $addToSet: {
            groups: group
        }
    })

    return res.status(201).json({message: "Admin added successfully"});
}catch(err) {
        return res.status(400).json({message: err.message});
    }
   j
}

export async function removeMember(req, res) {
    try {
        const {group, memberId} = req.body;

        if (!group || !memberId) {
            return res.status(400).json({message: "Id of both group and memberId is required"});
        }

        const isGroup = await Group.findById(group).select('administrator');
        if (!isGroup) {
            return res.status(400).json({message: "Group not found"});
        }

        const isAdmin = isGroup.administrator.find(id => id.equals(req.user))

        if (!isAdmin) {
            return res.status(400).json({message: "You are not authorized to remove from this group"});
        }

        await Group.findByIdAndUpdate( group, {
            $pull: {
                groupMembers: memberId,
                administrator: memberId
            }
        })

        await User.findByIdAndUpdate( memberId, {
            $pull: {
                groups: group
            }
        })

    return res.status(201).json({message : "Member removed successfully"})

    }catch (err){
        return res.status(400).json({message: err.message});
    }

}

export async function leaveGroup(req, res) {
    try {
        const {groupId} = req.body;
        if (!groupId) {
            return res.status(400).json({message: "Id of the group is required"});
        }

        const userId = req.user.toString();
        await Group.findByIdAndUpdate(req.user , {
            $pull:{
                administrator: userId,
                groupMembers: userId

            }
        })

        await User.findByIdAndUpdate(req.user,{
            $pull : {
                groups : groupId
            }
        })

        return res.status(201).json({message : "Member removed successfully"});
    }catch(err) {
        return res.status(400).json({message : "Member could not be removed"});
    }
}

export async function getMembers(req,res){

    try {
        const {groupId} = req.body;

        if (!groupId) {
            return res.status(401).json({message: "All fields are required"});
        }

        const group = await Group.findById(groupId);

        if (!group) {
            return res.status(401).json({message: "Group not found"});
        }

        const groupMembers = group.groupMembers;

        const isMember = groupMembers.find(user => user === req.email);

        if(!isMember){
            return res.status(401).json({message: "You are not authorized"});
        }

        const users = await User.find({email: {$in: groupMembers}}).select("name email");
        return res.status(200).json(users);

    }catch (err){
        console.log(err);
        return res.status(401).json(err);
    }
}