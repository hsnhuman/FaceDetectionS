import jwt from "jsonwebtoken";

const SECRET_KEY = "your_secret_key"; // Use a secure key

const handleSignin = (req, res, db, bcrypt) => {
  const { Email, Password } = req.body;
  if (!Email || !Password) {
    return res.status(400).json("Incorrect form submission");
  }

  db.select("Email", "hash")
    .from("login")
    .where("Email", "=", Email)
    .then((data) => {
      if (data.length) {
        const isValid = bcrypt.compareSync(Password, data[0].hash);
        if (isValid) {
          return db
            .select("*")
            .from("users")
            .where("Email", "=", Email)
            .then((user) => {
              // ✅ Generate JWT Token
              const token = jwt.sign({ user: user[0] }, SECRET_KEY, {
                expiresIn: "30m",
              });

              // ✅ Set Token in Cookie
              res.cookie("token", token, { httpOnly: true });

              // ✅ Return User Data & Token
              res.json({ success: true, user: user[0], token });
            })
            .catch((err) => {
              console.error("Error fetching user:", err);
              res.status(400).json("Unable to get user");
            });
        } else {
          return res.status(400).json("Wrong credentials");
        }
      } else {
        return res.status(400).json("Wrong Username or Password");
      }
    })
    .catch((err) => {
      console.error("Error in login process:", err);
      res.status(400).json("Wrong Username or Password");
    });
};

export default handleSignin;
