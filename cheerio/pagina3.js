const cheerio = require('cheerio');
const axios = require('axios');
const mongodb = require('mongodb');

const MongoClient = mongodb.MongoClient;
let db;
let actividades;

MongoClient.connect('mongodb+srv://cocorugo:bbkBoo1camp@cluster0-06yeb.mongodb.net/idatis?retryWrites=true&w=majority', function (err, res) {
    if (err !== null) {
        console.log(err);
        return err;
    } else {

        db = res.db('idatis');
        actividades = db.collection('actividades');
    }
});
let paginaPrincipal = 'https://voluntariosfundacionmapfre.cbiconsulting.es';
let rutas = [];
tomarPrestadasUrls();
function tomarPrestadasUrls() {
    axios.get('https://voluntariosfundacionmapfre.cbiconsulting.es/es/es/mapfre/activities/').then((response) => {
        const $ = cheerio.load(response.data);
        let container = $('div.card-container div.no-gutters div.card-info div.card div.card-body');
        for (let i = 0; i < container.length; i++) {
            let url = $(container[i]).find('a');
            if (url) {
                let urlTexto = $(url).attr('href').trim();
                rutas.push(urlTexto);
                setTimeout(function () {
                    tomarPrestadosDatos(urlTexto);
                }, 500);
            }
        }

        console.log(rutas);

    })
};

function tomarPrestadosDatos(ruta){
    axios.get(`${paginaPrincipal + ruta}`).then((response) => {
        const $ = cheerio.load(response.data);
        let contenedor = $('div.h-auto div.col-md-12');
        let titulo = $(contenedor).find('h6 b');
        if (titulo){
            let tituloText = $(titulo).text().trim();
            console.log(tituloText); 
        }
        let fechas = $(contenedor).find('p.nicedate');
        if(fechas){
            let fechasText = fechas.text().trim();
            let fechaIn = fechasText.substring(0,11);
            let fechaFin = fechasText.substring(fechasText.length-10,fechasText.length);
            console.log(fechaIn);
            console.log(fechaFin);
        }
        let extras = $(contenedor).text().trim();
        // console.log(extras);

        let tabla = $('table.table-hover tbody');
        let fila2 = $(tabla).find('tr')[1];
        let ong = $(fila2).find('td')[2]
        if(ong){
            let ongText = $(ong).text().trim();
            console.log(ongText);
        }
        let fila4 = $(tabla).find('tr')[3];
        let masextras = $(fila4).find('td')[2];
        if (masextras){
            masextrasText = $(masextras).text().trim();
            console.log(masextrasText);
        }

        
    })
};