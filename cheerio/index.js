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
    actividades = db.collection('actividades');
  }
});
let posicion = 0;
let urls = [];
let urlPagina = 'https://www.hacesfalta.org';


let maxPageIndex = 49;
robarURLS(1);
function robarURLS(index) {
  axios.get(`https://www.hacesfalta.org/oportunidades/presencial/buscador/listado/Default.aspx?pageIndex=${index}`)
    .then((response) => {
      //Antes que nada necesitamos todas las urls de cada página de búsqueda que nos llevarán a cada oferta de voluntariado
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
          console.log('descargando pagina' + index)
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
      //Primero rascamos el título de la oferta de voluntariado
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
      //Ahora cogeremos el nombre de la ONG, que se encuentran en la tabla, pero en una posición diferente al conjunto que rascaremos más tarde
      const tabla = $('table.table');
      const fila = $(tabla).find("tr")[4];
      let interior = $(fila).find("td div.clear");
      let ong = $(interior.find("a"))[1];
      if (ong) {
        let ongText = $(ong).text().trim();
        datosVoluntariado.push(ongText);
      };
      //Necesitamos la dirección de la ficha de cada ONG para obtener una URL  a su web oficial
      
      let interior2 = $(fila).find("td div.clear");
      let ongUrl = $(interior2.find("a"))[1];
      if (ongUrl) {
        let ongText2 = $(ongUrl).attr('href');
        datosVoluntariado.push(ongText2);
      };
      
      //Algo parecido con la fecha inicio, está en la columna 1 de la tabla, por lo que lo pediremos por separado
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
      //Por último rascamos la columna dos entera de la tabla, donde están la mayoría de datos que necesitamos
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
        provincia: datosVoluntariado[6],
        fechaLimite: datosVoluntariado[7],
        ambito: datosVoluntariado[8],
        fechaInicio: datosVoluntariado[3],
        fechaFin: datosVoluntariado[4],
        ong: datosVoluntariado[1],
        descripcion: datosVoluntariado[10],
        extras: `${datosVoluntariado[11] + datosVoluntariado[13]}`,
        municipio: datosVoluntariado[16],
        ruta: datosVoluntariado[2]
      };
      infoExtra(object, object.ruta);
      console.log(object)
      // actividades.insertOne(object);

      posicion++;
      if (posicion <= urls.length) {
        setTimeout(() => robarDatos(posicion), 1000);
      } else {
        console.log("ya hemos terminado");
      };
    });
};

function infoExtra(objeto, dirONG) {
  axios.get(`${urlPagina + dirONG}`).then(function(response) {
    //hago cheerio
    const $ = cheerio.load(response.data);
    let container = $('div.ficha-ong dl.datos-ong dd')[2];
    let objetivo = $(container).find('a');
    if(objetivo){
      let pasaraTexto = $(objetivo).attr('href');
      objeto.webOficial = pasaraTexto;
      actividades.insertOne(objeto);
    }
    //consigo el dato de la url del voluntariado
    
    
  })
}