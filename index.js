const { MongoClient, ServerApiVersion } = require('mongodb');
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