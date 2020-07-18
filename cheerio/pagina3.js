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

function tomarPrestadosDatos(ruta) {
    axios.get(`${paginaPrincipal + ruta}`).then((response) => {
        const $ = cheerio.load(response.data);
        let datos = [];
        let contenedor = $('div.h-auto div.col-md-12');
        let titulo = $(contenedor).find('h6 b');
        if (titulo) {
            let tituloText = $(titulo).text().trim();
            datos.push(tituloText);
            //console.log(tituloText);
        }
        let fechas = $(contenedor).find('p.nicedate');
        if (fechas) {
            let fechasText = fechas.text().trim();
            let fechaIn = fechasText.substring(0, 11);
            let fechaFin = fechasText.substring(fechasText.length - 10, fechasText.length);
            datos.push(fechaIn);
            datos.push(fechaFin);
           // console.log(fechaIn);
            //console.log(fechaFin);
        }
        let descripcion = $(contenedor).find('div.no-gutters p')[0];
        let descripcionSpan = $(contenedor).find('div.no-gutters span')[0];
        let descripcion2 = $(contenedor).find('div.no-gutters p')[1];
        let descripcionText = $(descripcion).text().trim();
        let descripcionSpanText = $(descripcionSpan).text().trim();
        let descripcion2Text = $(descripcion2).text().trim();
        let descripcionFinal;
        if (descripcionSpanText) {
            descripcionFinal = descripcionSpanText;
            datos.push(descripcionFinal);
           // console.log(descripcionSpanText);
        } else if (descripcionText !== '') {
            descripcionFinal = descripcionText;
            datos.push(descripcionFinal);
           // console.log(descripcionText);
        } else {
            descripcionFinal = descripcion2Text;
            datos.push(descripcionFinal);
            //console.log(descripcion2Text)
        }
        // console.log(extras);

        let tabla = $('table.table-hover tbody');
        let fila2 = $(tabla).find('tr')[1];
        let ong = $(fila2).find('td')[2]
        if (ong) {
            let ongText = $(ong).text().trim();
            datos.push(ongText);
            //console.log(ongText);
        }
        let fila4 = $(tabla).find('tr')[3];
        let masextras = $(fila4).find('td')[2];
        if (masextras) {
            masextrasText = $(masextras).text().trim();
            datos.push(masextrasText);
            //console.log(masextrasText);
        }

        let object = {
            titulo: datos[0],
            provincia: "",
            fechaLimite: datos[2],
            ambito: "Personas en riesgo de exclusión",
            fechaInicio: datos[1],
            fechaFin: datos[2],
            ong: `Fundación Mapfre en colaboración con ${datos[4]}`,
            descripcion: datos[3],
            extras: datos[5],
            municipio: "",
            ruta: "",
            webOficial: `${paginaPrincipal + ruta}`
        };
        console.log(object);
        actividades.insertOne(object);
    })
};