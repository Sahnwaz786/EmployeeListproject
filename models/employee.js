const mongoose = require("mongoose");

function generateUniqueId() {
  return Math.floor(1000 + Math.random() * 90000); // Generates a number between 1000 and 99999
}
const employeeSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    email: {
      type: String,

      trim: true,
      unique: true,
      match: [/\S+@\S+\.\S+/, "is invalid"],
      required: true,
    },
    mobile: {
      type: Number,
      required: true,

      trim: true,
      match: [/^\d{10}$/, "is invalid"],
    },
    designation: {
      type: String,
      enum: ["hr", "manager", "sales"],
      required: true,
    },
    gender: {
      type: String,
      enum: ["male", "female"],
      required: true,
    },
    // Unique: {
    //   type: String,
    //   default: uuidv4,
    //   unique: true,
    // },
    Unique: {
      type: String,
      default: generateUniqueId,
      unique: true,
    },
    courses: {
      type: [String],
      enum: ["MCA", "BCA", "BSC"],
      required: true,
    },
    fileUpload: {
      type: String,
      required: true,
    },
    hireDate: {
      // New custom date field
      type: Date,
      required: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Employees", employeeSchema);
