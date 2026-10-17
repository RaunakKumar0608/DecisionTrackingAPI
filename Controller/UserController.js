import User from "../Models/User.js";
import Group from "../Models/GroupModel.js";

    export async function createUser(req, res) {
    const {name, email, password} = req.body;

    if(!name || !email || !password){
        return res.status(400).json({message: "All fields are required"});
    }

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

    export async function membersDecisions(req,res){
        const {groupId,memberId} = req.body;
        const user = req.user;

        if(!groupId || !memberId) {
            return res.status(401).json({message: "All fields are required"});
        }

        const validGroup = await Group.findById(groupId).select("groupMembers");
        if(!validGroup){
            return res.status(401).json({message: "You are not authorized"});
        }
        const isMember =  validGroup.groupMembers.find(id => id === user.toString());
        const isGroupMember = validGroup.groupMembers.find(id => id === memberId);

        if(!isMember){
            return res.status(401).json({message: "You are not authorized"});
        }
        if(!isGroupMember ){
            return res.status(401).json({message: "User does not exist"});
        }

        const memberDetails =await User.findById(memberId).select("name email decisions");
        return res.status(200).json(memberDetails);

    }

    export async function getMyGroups(req,res){
        try {
            const user = req.user

            const groupObj =await User.findById(user).select("groups")
            const  groupsArray = groupObj.groups;

            if (!groupsArray) {
                return res.status(401).json({message: "User Not found"});
            }

            const groups = await Group.find({_id : {$in : groupsArray}}).lean()
            return res.status(200).json(groups);

        }catch (err){
            return res.status(401).json({error:err.message});
        }
    }
