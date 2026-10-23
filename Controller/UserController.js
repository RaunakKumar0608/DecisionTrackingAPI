import User from "../Models/User.js";
import Group from "../Models/GroupModel.js";
import Decisions from "../Models/Decision.js";

    export async function createUser(req, res) {
    let {name, email, password} = req.body;

    if(!name || !email || !password){
        return res.status(400).json({message: "All fields are required"});
    }

    email = email.toLowerCase();

    const existingUser = await User.findOne({email});

    if(existingUser){
        return res.status(401).json({message:"User already exists"});
    }

    const user = await User.create({
        name,
        email,
        password
    })

    return  res.status(200).json({ message: "User Registered",});
}

export async function login(req,res){
    const {password,email} = req.body;
    if(!email || !password){
            return res.status(400).json({message: "All field are required"});
        }

        const user = await User.findOne({email});
        if(!user){
          return  res.status(401).json({message: "Invalid Credentials"});
        }

        if(user.password !== password){
            return res.status(401).json({message: "Invalid Credentials"});
        }

        res.cookie("cid",user._id);

      return res.status(200).json({message: "User Logged In"});

    }

    export async function logout(req,res){
        res.clearCookie("cid");
        return res.status(200).json({message: "User Logged Out"});
    }


    export async function Users(req,res){
        try {
            const {groupId} = req.body;

            const user = req.user;

            if (!groupId) {
                return res.status(401).json({message: "All fields are required"});
            }

            const group = await Group.findById(groupId);

            if (!group) {
                return res.status(401).json({message: "Group not found"});
            }



            const groupMembers = group.groupMembers;
            const isMember = groupMembers.find(id => id === user.toString());
            if(!isMember){
                return res.status(401).json({message: "You are not authorized"});
            }
            const users = await User.find({_id: {$in: groupMembers}}).select("name email");
            return res.status(200).json(users);

        }catch (err){
            console.log(err);
            return res.status(401).json(err);
        }

    }

export async function membersDecisions(req, res) {
    try {
        const { email, groupId } = req.query;

        if (!groupId || !email) {
            return res.status(400).json({
                message: "Group ID and email are required"
            });
        }

        const requesterEmail = req.email.trim().toLowerCase();
        const targetEmail = email.trim().toLowerCase();

        const validGroup = await Group.findById(groupId)
            .select("groupMembers decisions");

        if (!validGroup) {
            return res.status(404).json({
                message: "Group not found"
            });
        }

        // 1. Verify that the requester belongs to this group.
        const requesterIsMember = validGroup.groupMembers.some(
            memberEmail => memberEmail.toLowerCase() === requesterEmail
        );

        if (!requesterIsMember) {
            return res.status(403).json({
                message: "You are not authorized to view this group"
            });
        }

        // 2. Find the selected user.
        const selectedUser = await User.findOne({
            email: targetEmail
        }).select("_id email");

        if (!selectedUser) {
            return res.status(404).json({
                message: "User not found"
            });
        }

        // 3. Verify that the selected user belongs to this group.
        const isGroupMember = validGroup.groupMembers.some(
            memberEmail => memberEmail.toLowerCase() === targetEmail
        );

        if (!isGroupMember) {
            return res.status(404).json({
                message: "This user is not a member of the group"
            });
        }

        // 4. Return only this user's decisions belonging to this group.
        const decisions = await Decisions.find({
            _id: { $in: validGroup.decisions },
            User: selectedUser._id
        }).select("-createdAt -updatedAt -__v ");

        return res.status(200).json({ decisions });

    } catch (error) {
        console.error("membersDecisions error:", error);

        if (error.name === "CastError") {
            return res.status(400).json({
                message: "Invalid group ID"
            });
        }

        return res.status(500).json({
            message: "Failed to fetch member decisions"
        });
    }
}

    export async function getMyGroups(req,res){
        try {
            const user = req.user

            const groupObj =await User.findById(user).select("groups")
            const  groupsArray = groupObj.groups;

            if (!groupsArray) {
                return res.status(401).json({message: "User Not found"});
            }

            const groups = await Group.find({_id : {$in : groupsArray}}).select("groupName groupMembers").lean()
            return res.status(200).json(groups);

        }catch (err){
            return res.status(401).json({error:err.message});
        }
    }
