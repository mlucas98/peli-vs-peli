const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
require('dotenv').config();
const controller = require('./controller');

const app = express();

app.use(cors());
app.use(bodyParser.urlencoded({
    extended: true
}));

app.use(bodyParser.json());

//Rutas
app.get('/competencias', controller.listarCompetencias)

app.post('/competencias', controller.crearCompetencia)

app.get('/competencias/:id', controller.obtenerCompetencia)

app.delete('/competencias/:id', controller.eliminarCompetencia)

app.put('/competencias/:id', controller.editarCompetencia)

app.get('/competencias/:id/peliculas', controller.obtenerPeliculas)

app.post('/competencias/:id/voto', controller.votarPelicula)

app.delete('/competencias/:id/votos', controller.reiniciarVotos)

app.get('/competencias/:id/resultados', controller.obtenerResultados)

app.get('/generos', controller.obtenerGeneros)

app.get('/directores', controller.obtenerDirectores)

app.get('/actores', controller.obtenerActores)


const port = 8080;
app.listen(port, function(){
    console.log("Escuchando en el puerto "+ port);
});