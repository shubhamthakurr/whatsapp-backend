import express from 'express';
import mongoose from 'mongoose';
import Messages from './dbMessages.js';
import Pusher from 'pusher';
import cors from 'cors';

const app = express();
const port = process.env.PORT || 9000;

const pusher = new Pusher({
    appId: "1143003",
    key: "af257f94766935fd9e74",
    secret: "4410e3b7610d15fd0881",
    cluster: "ap2",
    useTLS: true
  });

app.use(express.json());
app.use(cors());

const connection_url = `mongodb+srv://admin:HSu40ZANP8PCt61G@cluster0.wbkf3.mongodb.net/whatsappdb?retryWrites=true&w=majority`;

mongoose.connect(connection_url, {
    useCreateIndex: true,
    useNewUrlParser: true,
    useUnifiedTopology: true
});

const db = mongoose.connection;

db.once("open", () => {
    console.log("DB connected");

    const msgCollection = db.collection('messagecontents');
    const changeStream = msgCollection.watch();

    changeStream.on("change", (change) => {
        console.log("A Change occured", change);

        if(change.operationType === "insert"){
            const messageDetails = change.fullDocument;
            pusher.trigger("messages", "inserted", {
                name: messageDetails.name,
                message: messageDetails.message,
                timestamp: messageDetails.timestamp,
                recieved: messageDetails.recieved
            });
        } else {
            console.log("Error triggering Pusher");
        }
    });
});

app.get("/",(req,res)=>res.status(200).send("hello world"));

app.get('/messages/sync', (req,res) => { 
    Messages.find((err, data) => {
        if(err) {
            res.status(500).send(err);
        } else {
            res.status(200).send(data);
        }
    });
});

app.post('/messages/new', (req,res) => {
    const dbMessage = req.body;
  
    Messages.create(dbMessage, (err, data) => {
        if(err) {
            res.status(500).send(err);
        } else {
            res.status(201).send(data);
        }
    });
});

app.listen(port, () => console.log(`Listening on localhost:${port}`));