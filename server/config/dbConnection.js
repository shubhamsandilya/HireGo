import Mongoose from "mongoose";

const dbConnection = async () => {
  try {
    const dbConnect = await Mongoose.connect(process.env.MONGODB_URL);
    console.log("DB Connected Successfully");
  } catch (error) {
    console.log(error);
  }
};

export default dbConnection;
