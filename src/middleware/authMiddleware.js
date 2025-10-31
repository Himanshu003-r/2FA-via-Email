import CustomAPIError from "../errors/customApiError.js";
import jwt from "jsonwebtoken";
export const verifyJWT = async (req, res, next) => {
  try {
    const token =
      req.cookies?.token ||
      req.headers["authorization"]?.replace("Bearer ", "");

    if (!token) {
      throw new CustomAPIError("Unauthorized", 401);
    }

    const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);

    if(decodedToken.id){
      req.body = req.body || {};
      req.body.userId = decodedToken.id
    }else{
      throw new CustomAPIError(401, "Unauthorized access")
    }
  
    next();
  } catch (error) {
       console.log("Error in verifyJWT:", error);
    console.log("Error name:", error.name);
    console.log("Error message:", error.message);
           if (error instanceof CustomAPIError) {
            return res.status(error.statusCode || 401).json({
                success: false,
                message: error.message
            });
        }
            // Handle JWT specific errors
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: "Token has expired. Please login again"
      });
    }
        if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        message: "Invalid token"
      });
    }
    
        return res.status(401).json({
            success: false,
            message: "Invalid access token"
        });
  }
};
