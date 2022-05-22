const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const express = require('express');
const cors = require('cors');
require("dotenv").config()
const jwt = require('jsonwebtoken');

const app = express()
const port = process.env.PORT || 5000

// Middleware
app.use(express.json())
app.use(cors())


const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.uvxit.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });

const verifyJWT = (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
        return res.status(401).send({ message: "Unauthorized Access" })
    }
    const token = authHeader?.split(" ")[1]
    jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, function (err, decoded) {
        if (err) {
            return res.status(403).send({ message: "Forbidden Access" })
        }
        req.decoded = decoded
        next()
    })
}

async function run() {
    try {
        await client.connect();
        // drill-insomnia.drills

        const drillCollection = client.db("drill-insomnia").collection("drills");
        const ratingCollection = client.db("drill-insomnia").collection("ratings");
        const usersCollection = client.db("drill-insomnia").collection("users");
        const purchaseCollection = client.db("drill-insomnia").collection("purchase");

        app.get('/tools/home', async (req, res) => {
            const query = {}
            const tools = await drillCollection.find(query).limit(6).toArray()
            res.send(tools)
        })
        
        app.get('/rating', async (req, res) => {
            const query = {}
            const tools = await ratingCollection.find(query).toArray()
            res.send(tools)
        })
        app.put("/user/:email", async (req, res) => {
            const email = req.params.email;
            const user = req.body;
            const filter = { email: email };
            const options = { upsert: true };
            const updateDoc = {
                $set: user,
            };
            const result = await usersCollection.updateOne(filter, updateDoc, options)
            const token = jwt.sign({ email: email }, process.env.ACCESS_TOKEN_SECRET, {
                expiresIn: "1d"
            })
            res.send({ result, accessToken: token })
        })
        app.get('/admin/:email', async (req, res) => {
            const email = req.params.email;
            const user = await usersCollection.findOne({ email: email });
            const isAdmin = user.role === 'admin';
            res.send({ admin: isAdmin })
        })
        app.get('/item/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: ObjectId(id) };
            const item = await drillCollection.findOne(query);
            res.send(item);
        });
        app.post('/rating', verifyJWT, async (req, res) => {
            const newReview = req.body;
            const result = ratingCollection.insertOne(newReview)
            res.send(result)
        })
        app.post("/purchase", async (req, res) => {
            const purchase = req.body;
            const result = await purchaseCollection.insertOne(purchase)
            return res.send({ success: true, result: result })
        })
        app.put("/drill/:id", async (req, res) => {
            const id = req.params.id;
            const updatedQuantity = req.body;
            const filter = { _id: ObjectId(id) }
            const options = { upsert: true };
            const updatedDoc = {
                $set: {
                    quantity: updatedQuantity.quantity
                },
            };
            const result = drillCollection.updateOne(filter, updatedDoc, options);
            res.send({ result })
        })
        app.get('/myOrder', verifyJWT, async (req, res) => {
            const decodedEmail = req.decoded.email;
            const email = req.query.email;
            if (email === decodedEmail) {
                const query = { buyerEmail: email };
                const drill = await purchaseCollection.find(query).toArray();
                res.send(drill);
            }
            else {
                res.status(403).send({ message: 'forbidden access' })
            }
        })
    }
    finally {

    }
}

run().catch(console.dir)

app.listen(port, () => {
    console.log(`Server is running on ${port}`)
})

app.get('/', async (req, res) => {
    res.send("Drill Insomnia server is running")
})