import JWT from "jsonwebtoken";

const userAuth = async (req, res, next) => {
  const authHeader = req?.headers?.authorization;

  // No/!Bearer token → 401 Unauthorized. `return` so we don't fall through
  // and try to verify an undefined token (which previously double-called next
  // and let the error handler answer with 404).
  if (!authHeader || !authHeader.startsWith("Bearer")) {
    return res.status(401).json({
      success: false,
      message: "Authentication failed: no token provided",
    });
  }

  const token = authHeader.split(" ")[1];

  try {
    const userToken = JWT.verify(token, process.env.JWT_SECRET_KEY);

    req.body.user = {
      userId: userToken.userId,
    };

    next();
  } catch (error) {
    // Invalid / expired token → 401, not 404.
    return res.status(401).json({
      success: false,
      message: "Authentication failed: invalid or expired token",
    });
  }
};

export default userAuth;
