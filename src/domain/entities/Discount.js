import mongoose from "mongoose";

const discountSchema = new mongoose.Schema({
    userId: { type: String, required: true, ref: "user" },
    code: { type: String, required: true, unique: true },
    percentage: { type: Number, required: true, min: 0, max: 100 },
    description: { type: String, required: false },
    isActive: { type: Boolean, default: true },
    startDate: { type: Date, required: false },
    endDate: { type: Date, required: false },
    maxUses: { type: Number, required: false }, // Número máximo de usos
    usedCount: { type: Number, default: 0 }, // Contador de usos
    applicableProducts: [{ type: String, required: false }], // IDs de productos específicos, vacío = todos
    minPurchase: { type: Number, required: false, default: 0 }, // Mínimo de compra para aplicar
    date: { type: Number, required: true }
})

const Discount = mongoose.models.discount || mongoose.model('discount', discountSchema)

export default Discount
