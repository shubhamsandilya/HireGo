import Users from "../models/userModel.js";
export const register = async (req, res, next) => {
  try {
    const { firstName, lastName, email, password } = req.body;
    if (!firstName || !lastName || !email || !password)
      throw new Error("Fill the mandatory fields");
    const isExist = await Users.findOne({ email });
    if (isExist) throw new Error("User already exist");

    const createUser = await Users.create({
      firstName,
      lastName,
      email,
      password,
    });
    const token = createUser.createJWT();
    res.status(201).send({
      success: true,
      message: "Account created Successfully",
      user: {
        _id: createUser._id,
        firstName: createUser.firstName,
        email: createUser.email,
      },
      token,
    });
  } catch (error) {
    next(error);
  }
};
export const signIn = async (req, res, next) => {
  const { email, password } = req?.body;
  try {
    if (!email || !password) throw new Error("Provide user");
    const user = await Users.findOne({ email }).select("+password");
    if (!user) {
      next("Please register first");
      return;
    }
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      // next();
      throw new Error("Invalid email or password");
      return;
    }
    user.password = undefined;
    const token = user.createJWT();
    res.status(201).send({
      success: true,
      message: "login successfully",
      token,
      user,
    });
  } catch (error) {
    next(error);
  }
};
