import JWT from "jsonwebtoken";

const userAuth = async (req, res, next) => {
  const authHandler = req?.header?.authorization;
  if (!authHandler || !authHandler?.startsWith("Bearer")) {
    next("Authentication failed");
  }

  const token = authHandler?.split(" ")[1];
  try {
    const userToken = JWT.verify(token, process.env.JWT_SECRET_KEY);
    req.body.user = {
      userId: userToken.userId,
    };
    next();
  } catch (error) {
    console.log(error);
    next(error);
  }
};
