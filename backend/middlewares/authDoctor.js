import jwt from 'jsonwebtoken'

//Doctor authentication middleware
const authDoctor = async (req,res,next) =>{
    try {

        const {dtoken} = req.headers
        if (!dtoken) {
          return res.json({success:false,message:"Not Authorized!! Login Again"})
        }

     // Decode the token
     const token_decode = jwt.verify(dtoken, process.env.JWT_SECRET)

     // Attach user info to req.user
     req.docId = token_decode.id

        next()
        
    } catch (error) {
        console.log(error);
        res.json({success:false,message:error.message})
    }
}

export default authDoctor