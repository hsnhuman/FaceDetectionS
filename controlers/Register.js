import jwt from "jsonwebtoken";

const SECRET_KEY = "your_secret_key"; // Use a secure key

const handleRegister = (req, res, db, bcrypt) => {
  const { Email, Name, Password } = req.body;
  if (!Email || !Name || !Password) {
    return res.status(400).json("Incorrect form submission");
  }

  const hash = bcrypt.hashSync(Password, 10);

  db.transaction((trx) => {
    trx
      .insert({
        hash: hash,
        Email: Email,
      })
      .into("login")
      .returning("Email")
      .then((loginEmail) => {
        return trx("users")
          .returning("*")
          .insert({
            Name: Name,
            Email: loginEmail[0].Email,
            joined: new Date(),
          })
          .then((user) => {
            // ✅ Generate JWT Token
            const token = jwt.sign({ user: user[0] }, SECRET_KEY, {
              expiresIn: "30m",
            });

            // ✅ Set Token in Cookie
            res.cookie("token", token, { httpOnly: true });

            // ✅ Return User Data & Token
            res.json({ success: true, user: user[0], token });
          });
      })
      .then(trx.commit)
      .catch(trx.rollback);
  }).catch((err) => {
    console.error("Error during registration:", err);
    res.status(400).json("Unable to register");
  });
};

export default handleRegister;
