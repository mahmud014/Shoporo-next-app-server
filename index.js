const express = require("express");
const cors = require("cors");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const app = express();
require("dotenv").config();

const port = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.send("Hello World!");
});

const uri = `mongodb+srv://${process.env.USER_NAME}:${process.env.USER_PASS}@datahive.5frjob8.mongodb.net/?appName=DataHive`;

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    await client.connect();

    const database = client.db("shoporaDB");
    const productsCollection = database.collection("products");
    const reviewCollection = database.collection("reviews");

    // get all products
    app.get("/products", async (req, res) => {
      const email = req.query.email;
      let query = {};
      if (email) query.email = email;
      const cursor = productsCollection.find(query);
      const result = await cursor.toArray();

      // normalize _id to string
      const normalized = result.map((p) => ({ ...p, _id: p._id.toString() }));
      res.send(normalized);
    });

    // get single product
    app.get("/products/:id", async (req, res) => {
      const id = req.params.id;

      let query;
      try {
        query = { _id: new ObjectId(id) };
      } catch (err) {
        return res.status(400).json({ error: "Invalid product ID" });
      }

      const result = await productsCollection.findOne(query);
      if (!result) return res.status(404).json({ error: "Product not found" });

      // normalize _id to string
      result._id = result._id.toString();
      res.send(result);
    });

    // product add
    app.post("/products", async (req, res) => {
      const newProduct = req.body;
      const result = await productsCollection.insertOne(newProduct);
      res.send(result);
    });

    // product update
    app.patch("/products/:id", async (req, res) => {
      const id = req.params.id;
      const updatedProduct = req.body;

      let query;
      try {
        query = { _id: new ObjectId(id) };
      } catch (err) {
        return res.status(400).json({ error: "Invalid product ID" });
      }

      const update = {
        $set: {
          name: updatedProduct.name,
          price: updatedProduct.price,
        },
      };

      const result = await productsCollection.updateOne(query, update);
      res.send(result);
    });

    // product delete
    app.delete("/products/:id", async (req, res) => {
      const id = req.params.id;

      let query;
      try {
        query = { _id: new ObjectId(id) };
      } catch (err) {
        return res.status(400).json({ error: "Invalid product ID" });
      }

      const result = await productsCollection.deleteOne(query);
      res.send(result);
    });

    // Reviews API

    app.get("/reviews", async (req, res) => {
      const cursor = reviewCollection.find();
      const result = await cursor.toArray();

      // normalize _id to string
      const normalized = result.map((r) => ({ ...r, _id: r._id.toString() }));
      res.send(normalized);
    });

    await client.db("admin").command({ ping: 1 });
    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!"
    );
  } finally {
    // await client.close();
  }
}

run().catch(console.dir);

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
