const asyncHandler = require("express-async-handler")
const User = require("../models/userModel");
const generateToken = require("../config/generateToken");
//Register a new user

const registerUser = asyncHandler(async (req, res) => {
    const { name, email, password, pic } = req.body;
    if (!name || !email || !password) {
        throw new Error("Please fill all the fields");
    }

    const userExists = await User.findOne({ email });

    if (userExists) {
        res.status(400);
        throw new Error("User already exists");
    }
    const user = await User.create({
        name,
        email,
        password,
        pic
    })
    if (user) {
        res.status(201).json({
            _id: user.id,
            name: user.name,
            email: user.email,
            pic: user.pic,
            token: generateToken(user._id)
        })
    }
    else {
        res.status(400);
        throw new Error("Failed to create the user");
    }
});


// Create guest user if it doesn't exist
const bcrypt = require('bcryptjs');
const createGuestUser = async () => {
    try {
        const guestEmail = "guest@example.com";
        let guestUser = await User.findOne({ email: guestEmail });

        if (!guestUser) {
            // Hash the password before creating the user
            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash("123456", salt);
            
            guestUser = await User.create({
                name: "Guest User",
                email: guestEmail,
                password: hashedPassword, // Use the hashed password
                pic: "https://icon-library.com/images/anonymous-avatar-icon/anonymous-avatar-icon-25.jpg"
            });
            console.log("Guest user created successfully");
        }
        return guestUser;
    } catch (error) {
        console.error("Error creating guest user:", error);
        throw error;
    }
};

const authUser = asyncHandler(async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            res.status(400);
            throw new Error("Please provide both email and password");
        }

        let user;
        
        // If it's a guest login attempt, ensure guest user exists
        if (email === "guest@example.com") {
            user = await createGuestUser();
            // For guest user, we'll bypass password check
            return res.json({
                _id: user._id,
                name: user.name,
                email: user.email,
                pic: user.pic,
                token: generateToken(user._id)
            });
        }

        // Regular user login flow
        user = await User.findOne({ email });
        
        if (!user) {
            res.status(401);
            throw new Error("Invalid email or password");
        }

        const isMatch = await user.matchPassword(password);
        
        if (!isMatch) {
            res.status(401);
            throw new Error("Invalid email or password");
        }

        res.json({
            _id: user._id,
            name: user.name,
            email: user.email,
            pic: user.pic,
            token: generateToken(user._id)
        });
    } catch (error) {
        console.error("Login error:", error);
        res.status(error.status || 500);
        throw new Error(error.message || "Something went wrong during login");
    }
})

// api/user?search=Ric
const allUsers = asyncHandler(async (req, res) => {
    const keyword = req.query.search
    ? {
        $or: [
       {name:{$regex:req.query.search,$options:'i'}},
       {email:{$regex:req.query.search,$options:'i'}},
    ]
    }
    : {};
    const users = await User.find(keyword).find({_id:{$ne:req.user._id}});
    res.send(users);
})



// Guest login controller
const guestLogin = asyncHandler(async (req, res) => {
    try {
        // Create or get guest user
        const guestUser = await createGuestUser();
        
        // Generate token
        const token = generateToken(guestUser._id);
        
        // Send response
        res.json({
            _id: guestUser._id,
            name: guestUser.name,
            email: guestUser.email,
            pic: guestUser.pic,
            token: token
        });
    } catch (error) {
        console.error('Guest login error:', error);
        res.status(500).json({ message: 'Error processing guest login' });
    }
});

module.exports = { registerUser, authUser, allUsers, guestLogin };