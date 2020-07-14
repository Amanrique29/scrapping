const express = require('express');
const mongodb = require('mongodb');

const MongoClient = mongodb.MongoClient;

let db;
let ofertas;

MongoClient.connect('mongodb+srv://cocorugo:bbkBoo1camp@cluster0-06yeb.mongodb.net/idatis?retryWrites=true&w=majority', function (err, res) {
    if (err !== null) {
        console.log(err);
        return err;
    } else {

        db = res.db('idatis');
        ofertas = db.collection('actividades');
    }
});

const app = express();
app.use(express.static('public'));
app.use(express.json());

app.get('/buscador', function (req, res) {
    db.collection('ofertas').find().toArray(function (err, voluntario) {
        if (err !== null) {
            console.log(err);
            res.send(err);
        } else {
            res.send(voluntario);
            console.log("funciona");
        }
    })
});

let port = process.env.PORT || 3000;
app.listen(port);