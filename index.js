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


async function run() {
    try {
        await client.connect();
        // drill-insomnia.drills

        const drillCollection = client.db("drill-insomnia").collection("drills");
        const ratingCollection = client.db("drill-insomnia").collection("ratings");

        app.get('/tools', async (req, res) => {
            const query = {}
            const tools = await drillCollection.find(query).limit(6).toArray()
            res.send(tools)
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