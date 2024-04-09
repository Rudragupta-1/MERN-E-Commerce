const express = require("express");
const app = express();
const cors = require("cors");
require("./db/config");
const User = require("./db/User");
const Product = require("./db/Products");
const Jwt = require("jsonwebtoken");
const jwtKey = "e-com";
app.use(express.json());
app.use(cors());
app.post("/register", async (req, rep) => {
  let user = new User(req.body);
  let result = await user.save();
  result = result.toObject();
  delete result.password;
  Jwt.sign({ result }, jwtKey, { expiresIn: "2h" }, (err, token) => {
    if (err) {
      rep.send({ result: "Something went wrong please try again later" });
    }
    rep.send({ result, auth: token });
  });
});
app.post("/login", async (req, rep) => {
  if (req.body.password && req.body.email) {
    let user = await User.findOne(req.body).select("-password");
    if (user) {
      Jwt.sign({ user }, jwtKey, { expiresIn: "2h" }, (err, token) => {
        if (err) {
          rep.send({ result: "No result found" });
        }
        rep.send({ user, auth: token });
      });
    } else rep.send({ result: "No User found" });
  } else rep.send({ result: "No result found" });
});
app.post("/add-product", verifyToken, async (req, rep) => {
  let product = new Product(req.body);
  let result = await product.save();
  rep.send(result);
});
app.get("/products", verifyToken, async (req, rep) => {
  let product = await Product.find();
  if (product.length > 0) {
    rep.send(product);
  } else {
    rep.send({ result: "No results found" });
  }
});
app.delete("/product/:id", verifyToken, async (req, rep) => {
  const result = await Product.deleteOne({ _id: req.params.id });
  rep.send(result);
});
app.get("/product/:id", verifyToken, async (req, rep) => {
  const result = await Product.findOne({ _id: req.params.id });
  if (result) {
    rep.send(result);
  } else {
    rep.send({ result: "No result found" });
  }
});
app.put("/product/:id", verifyToken, async (req, rep) => {
  const result = await Product.updateOne(
    { _id: req.params.id },
    {
      $set: req.body,
    }
  );
  rep.send(result);
});
app.get("/search/:key", verifyToken, async (req, rep) => {
  let result = await Product.find({
    $or: [
      { name: { $regex: req.params.key } },
      { category: { $regex: req.params.key } },
    ],
  });
  rep.send(result);
});

function verifyToken(req, rep, next) {
  let token = req.headers["authorization"];
  if (token) {
    token = token.split(" ")[1];
    Jwt.verify(token, jwtKey, (err, valid) => {
      if (err) {
        rep.status(401).send({ result: "Please provide valid token" });
      } else {
        next();
      }
    });
  } else {
    rep.status(403).send({ result: "Please add token with header" });
  }
}
app.listen(5000, () => {
  console.log("Server Started");
});
