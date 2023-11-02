const JWT=require('jsonwebtoken');

const verifyToken = (req, res, next) => {
  //const token = req.body.token;
  const token= req.headers['access_token']
  if (!token){
      res.send("you are not allowed")
      return

  } 

  JWT.verify(token, process.env.JWT, (err,data) => {
    if (err) {
    res.send("error occured")
      return
    }
    else
    req.data=data
    next();
  });
};

module.exports=verifyToken