
require("dotenv").config();

const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const readline = require("readline/promises");
const User = require("./models/User");

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

const createAdmin = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);

        console.log("Connected to MongoDB");

        const name = await rl.question("Enter admin name: ");
        const email = await rl.question("Enter admin email: ");
        const password = await rl.question("Enter admin password: ");

        if (!name.trim() || !email.trim() || !password) {
            throw new Error("All fields are required");
        }

        if (password.length < 8) {
            throw new Error("Password must contain at least 8 characters");
        }

        const existingUser = await User.findOne({
            email: email.trim().toLowerCase()
        });

        if (existingUser) {
            existingUser.role = "admin";
            await existingUser.save();

            console.log("Existing account promoted to admin.");
        } else {
            const hashedPassword = await bcrypt.hash(password, 10);

            await User.create({
                name: name.trim(),
                email: email.trim().toLowerCase(),
                password: hashedPassword,
                role: "admin"
            });

            console.log("Admin account created successfully.");
        }

    } catch (error) {
        console.error("Error:", error.message);
    } finally {
        rl.close();
        await mongoose.disconnect();
    }
};

createAdmin();
