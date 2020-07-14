const cheerio = require('cheerio');
const axios = require('axios');
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
let posicion = 0;
let urls = [];
let array = [];
let urlPagina = 'https://www.hacesfalta.org';


let maxPageIndex = 49;
robarURLS(1);
function robarURLS(index) {
  axios.get(`https://www.hacesfalta.org/oportunidades/presencial/buscador/listado/Default.aspx?pageIndex=${index}`)
    .then((response) => {

      const $ = cheerio.load(response.data);
      const URLcontenedor = $('div.resultado-busqueda div.row div.col-sm-4');
      for (let h = 0; h < URLcontenedor.length; h++) {
        const URLs = $(URLcontenedor[h]).find('[id^="cphContenido_rptResultado_aOpor_"]');
        if (URLs) {

          let direcciones = $(URLs).attr('href');
          if (direcciones) {
            direcciones.trim();
            urls.push(direcciones);
          }

        }
      }
      index++;
      if (index < maxPageIndex) {
        setTimeout(function () {
          console.log('descarganado pagina' + index)
          robarURLS(index);
        }, 1000);
      } else {
        console.log('ya hemos acabado. este es el array: ');
        console.log(urls);
        robarDatos(0);
      }

    }
    );
};



function robarDatos(posicion) {
  console.log(`obteniendo datos de página en posicion ${posicion} de ${urls.length}`);
  axios.get(`${urlPagina + urls[posicion]}`)
    .then((response) => {
      const datosVoluntariado = [];
      const $ = cheerio.load(response.data)
      const elementoTitulo = $('div.col-xs-12')
      for (let i = 0; i < elementoTitulo.length; i++) {
        const urlTitulo = $(elementoTitulo[i]).find("h2")[0];

        if (urlTitulo) {

          const urlText = $(urlTitulo).text().trim();

          datosVoluntariado.push(urlText);
          console.log(urlText);
        }
      }
      const urlElemdos = $('table.table');
      const urlTablados = $(urlElemdos).find("tr")[5];
      for (let m = 0; m < 2; m++) {
        let fecha = $(urlTablados).find("td")[m];
        if (fecha) {
          const urlTexto = $(fecha).text().trim(); //.trim() sirve para quitar todos los espacios sobrantes cuando te devuelve texto bruto
          let soloFecha = urlTexto.substring(urlTexto.length - 10, urlTexto.length);
          console.log(soloFecha);
          datosVoluntariado.push(soloFecha);
        }
      };
      const urlElem = $('table.table')
      for (let i = 0; i < urlElem.length; i++) {
        const urlTabla = $(urlElem[i]).find("tr");
        for (let j = 0; j < urlTabla.length; j++) {
          let columna2 = $(urlTabla[j]).find("td")[1];
          if (columna2) {
            const urlTexto = $(columna2).text().trim(); //.trim() sirve para quitar todos los espacios sobrantes cuando te devuelve texto bruto
            datosVoluntariado.push(urlTexto);
          }
        }
      }
      console.log(datosVoluntariado);
      let object = {
        titulo: datosVoluntariado[0],
        provincia: datosVoluntariado[4],
        fechaLimite: datosVoluntariado[5],
        ambito: datosVoluntariado[6],
        fechaInicio: datosVoluntariado[1],
        fechaFin: datosVoluntariado[2],
        descripcion: datosVoluntariado[8],
        extras: `${datosVoluntariado[9] + datosVoluntariado[11]}`,
        municipio: datosVoluntariado[14]
      };
      console.log(object)
      ofertas.insertOne(object);

      posicion++;
      if (posicion <= urls.length) {
        setTimeout(() => robarDatos(posicion), 1000);
      } else {
        console.log("ya hemos terminado")
      };
    });
};
