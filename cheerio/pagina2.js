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
let websOficiales = [];
let Ongs = [];
let titulos = [];
let descripciones = [];
let pueblos = ["Erandio", "Erandio", "Bilbao", "Bilbao", "Bilbao", "Bilbao", "Getxo", "Getxo", "Varios", "No presencial"];
let fechas = ["", "", "", "", "de junio a septiembre", "desde el 1 de julio", "junio, julio y agosto", "junio, julio y agosto", "", ""];
bolunta();
function bolunta() {
    axios.get("https://bolunta.org/servicios/voluntariado/voluntariado-urgente-2/")
        .then((response) => {
            //Vamos a sacar datos de una tabla, cada fila tiene peculiaridades por lo que no puedo extraer de arriba a abajo todos los elementos. Empezamos cogiendo
            const $ = cheerio.load(response.data);
            let tablas = $('table.vista_vol_urgente');
            for (let i = 0; i < tablas.length; i++) {
                let fila1 = $(tablas[i]).find("tbody tr")[0];
                let url = $(fila1).find("th a")[0];
                if (url) {
                    let urlText = $(url).attr('href');
                    let Texto = $(url).text();
                    if (urlText) {
                        urlText.trim();
                        Texto.trim();
                        websOficiales.push(urlText);
                        Ongs.push(Texto);
                    }
                }
                let fila2 = $(tablas[i]).find("tbody tr")[1];
                let titulo = $(fila2).find("th")[0];
                if (titulo) {
                    let tituloText = $(titulo).text().trim();
                    titulos.push(tituloText);

                }
                let fila3 = $(tablas[i]).find("tbody tr")[2];
                let descripcion = $(fila3).find("td div p");
                let extra = $(fila3).find("td div ul li");
                let descripcionText;
                let extraTexto = "";
                if (extra){
                    descripcionText = $(descripcion).text().trim();
                    for (m = 0; m < extra.length; m++){
                        extraTexto += $(extra[m]).text().trim() + '; ';
                    }
                    descripciones.push(`${descripcionText + ' ' + extraTexto}`);
                } else {
                    descripcionText = $(descripcion).text().trim();
                    descripciones.push(descripcionText);
                }
                let object = {
                    titulo: titulos[i],
                    provincia: "Bizkaia",
                    fechaLimite: fechas[i],
                    ambito: "",
                    fechaInicio: "",
                    fechaFin: "",
                    ong: Ongs[i],
                    descripcion: descripciones[i],
                    extras: `${titulos[i] + descripciones[i]}`,
                    municipio: pueblos[i],
                    ruta: "",
                    webOficial: websOficiales[i]
                };
                console.log(object);
                actividades.insertOne(object);
            }



        }
        );
};
