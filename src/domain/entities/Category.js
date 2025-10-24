import mongoose from "mongoose";

const categorySchema = new mongoose.Schema({
    userId: { type: String, required: true, ref: "user" },
    name: { type: String, required: true, unique: true },
    description: { type: String, required: false },
    isActive: { type: Boolean, default: true },
    date: { type: Number, required: true }
})

const Category = mongoose.models.category || mongoose.model('category', categorySchema)

export default Category
