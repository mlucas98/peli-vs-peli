const connection = require('./conexiondb.js');

function listarCompetencias(req, res) {
    let stmt = `SELECT * FROM competencias WHERE activa = 1`;
    connection.query(stmt, function(err, result) {
        if (err) {
            console.log('Error al traer las competencias. Error: ' + err);
        }
        let resultado = result

        res.json(resultado);
    });
}

function crearCompetencia(req, res) {
    let nombre = req.body.nombre;
    let genero = req.body.genero;
    let director = req.body.director;
    let actor = req.body.actor;
    let queryValidacion = `SELECT * FROM competencias WHERE nombre = '${nombre}'`;
    connection.query(queryValidacion, function(err, result) {
        if (err) {
            console.log('Error en chequear si la competencia es única. Error: ' + err);
            res.status(500).send('Ocurrió un error al insertar la competencia. Por favor inténtelo nuevamente más tarde.');
        }
        if (result.length >= 1) {
            console.log('Encuesta repetida');
            res.status(422).send('¡Ya contamos con esa encuesta!');
        } else {
            if (genero == 0) { genero = null }
            if (director == 0) { director = null }
            if (actor == 0) { actor = null }

            //generar consulta que valide la existencia de 2 o más películas para la competencia
            let queryValidarOpciones = generarConsultaFiltros(genero, director, actor);

            connection.query(queryValidarOpciones, function(err, result) {
                if (err) {
                    console.log('Error al verificar que existan dos o más películas para crear competencia. Error ' + err);
                    res.status(500).send('Ocurrió un error al validar la competencia. Por favor inténtelo nuevamente más tarde.');
                }

                //resultado de la verificación
                let resultado = result;

                if (resultado.length < 2) {
                    console.log('No hay dos o más películas para crear competencia.' + err);
                    res.status(422).send('No existen suficientes películas con el criterio deseado. ¡Inténtelo con otra combinación!');
                } else {
                    res.send(resultado)
                    let queryInsert = `INSERT INTO competencias (nombre, genero_id, director_id, actor_id) VALUES(?, ?, ?, ?)`;

                    let valores = [nombre, genero, director, actor];

                    connection.query(queryInsert, valores, function(err, result) {
                        if (err) {
                            console.log(queryInsert);
                            console.log('Error al insertar competenica.' + err);
                            res.status(500).send('Hubo un error al intentar insertar la competencia. Por favor inténtelo nuevamente más tarde.');
                            return
                        }
                        res.status(200).send('¡Encuestra agregada con éxito!')
                        return
                    });
                }
            });
        } //termina el else grande
    });
}

function obtenerCompetencia(req, res) {
    let id = req.params.id;
    let queryObtener = `SELECT c.nombre, d.nombre AS director_nombre, g.nombre AS genero_nombre, a.nombre AS actor_nombre FROM competencias c 
        LEFT JOIN director d ON d.id = c.director_id
        LEFT JOIN genero g ON g.id = c.genero_id
        LEFT JOIN actor a ON a.id = c.actor_id  
    WHERE c.id = ?`;

    connection.query(queryObtener, [id], function(err, result) {
        if (err) {
            console.log('Error al traer la competencia. Error: ' + err);
            res.status(404).send('No se pudo obtener la competencia. Por favor inténtelo nuevamente más tarde.')
        }
        let resultado = result[0];
        res.send(resultado);
    });
}

function eliminarCompetencia(req, res) {
    let id = req.params.id;
    let queryEliminar = `UPDATE competencias SET activa = 0 WHERE id = ?`;
    connection.query(queryEliminar, [id], function(err, result) {
        if (err) {
            console.log('Error al eliminar la competencia. Error: ' + err);
            res.status(500).send('No se pudo eliminar la competencia. Por favor inténtelo nuevamente más tarde.')
        }
        // alert('¡Competencia eliminada con éxito!');
        res.status(200).send('La competencia fue eliminada con éxito.');
    });
}

function editarCompetencia(req, res) {
    let id = req.params.id;
    let nuevoNombre = req.body.nombre;
    let queryValidacion = `SELECT * FROM competencias WHERE nombre = '${nuevoNombre}'`;

    connection.query(queryValidacion, function(err, result) {
        if (err) {
            console.log('Error al comprobar el nuevo nombre de la competencia. Error: ' + err);
            res.status(500).send('No se pudo editar la competencia. Por favor inténtelo nuevamente más tarde.')
        }

        let resultado = result;

        if (resultado.length == 0) {
            let queryEliminar = `UPDATE competencias SET nombre = ? WHERE id = ?`;
            connection.query(queryEliminar, [nuevoNombre, id], function(err, result) {
                if (err) {
                    console.log('Error al editar la competencia. Error: ' + err);
                    res.status(500).send('No se pudo editar la competencia. Por favor inténtelo nuevamente más tarde.')
                }
                // alert('¡Competencia eliminada con éxito!');
                res.status(200).send('La competencia fue editada con éxito.');
            });
        } else {
            res.status(422).send('¡Ya contamos con esa encuesta!');
        }

    });


}

function obtenerPeliculas(req, res) {
    const id = req.params.id;
    let query = `SELECT c.nombre, c.genero_id, c.actor_id, c.director_id FROM competencias AS c WHERE id = ${id}`;

    connection.query(query, function(err, result) {
        if (err) {
            console.log('Error al conseguir la competencia. Error: ' + err);
            res.status(404).send('No se enctró la consulta. Por favor inténtelo nuevamente más tarde.')
        }
        resultado = {
            genero: result[0].genero_id,
            director: result[0].director_id,
            actor: result[0].actor_id,
            competencia: result[0].nombre
        }
        let queryPelicula = '';
        if (id == 1) {
            queryPelicula = 'SELECT p.id, p.poster, p.titulo FROM pelicula AS p WHERE p.titulo LIKE \'%Lord of the Rings%\'';
        } else {
            queryPelicula = generarConsultaFiltros(resultado.genero, resultado.director, resultado.actor);
        }
        // Ejecutar consulta
        connection.query(queryPelicula, function(err, result) {
            if (err) {
                console.log('Error al conseguir la peícula. Error: ' + err);
                res.status(500).send('Ocurrió un error. Por favor inténtelo nuevamente más tarde.')
            }
            resultado.peliculas = result;
            res.json(resultado);
        });
    });
}


function votarPelicula(req, res) {
    let idCompetencia = req.params.id;
    let idPelicula = req.body.idPelicula;
    let stmt = `INSERT INTO votos_peli_competencia VALUES(${idCompetencia}, ?);`;

    connection.query(stmt, [idPelicula], function(err, result) {
        if (err) {
            console.log('Error al traer la competencia. Error ' + err);
            res.status(404).send('Ocurrió un error al intentar cargar el voto.')
        }

        res.send('¡Voto cargado con éxito!')
    });
}

function obtenerResultados(req, res) {
    let competencia_id = req.params.id;
    let queryResultados = `SELECT c.nombre, p.titulo AS titulo, p.poster AS poster, p.id AS pelicula_id, COUNT(vpc.pelicula_id) AS votos
    FROM votos_peli_competencia AS vpc
            LEFT JOIN competencias AS c ON vpc.competencia_id = c.id
            LEFT JOIN pelicula AS p ON vpc.pelicula_id = p.id 
        WHERE c.id = ?
        GROUP BY c.nombre, p.titulo, p.poster, p.id, vpc.pelicula_id
        ORDER BY votos DESC LIMIT 3`

    connection.query(queryResultados, [competencia_id], function(err, result) {
        if (err) {
            console.log('Error al obtener resultados de encuestas. Error ' + err)
            res.send(500).send('Ocurrió un error al obtener los resultados.')
        }
        if (result.length != 0) {
            let data = {
                competencia: result[0].nombre,
                resultados: result
            }
            res.json(data);
        }
    });
}

function reiniciarVotos(req, res) {
    competencia = req.params.id;
    queryRevisarCompetencia = `SELECT * FROM competencias WHERE id = ?`;
    connection.query(queryRevisarCompetencia, [competencia], function(err, result) {
        if (err) {
            console.log('Error al encontrar competencia para reiniciar. ' + err);
            res.status(500).send('Ocurrió un error al intentar reiniciar la competencia. Por favor inténtelo nuevamente más tarde');
        }
        if (result.length == 0) {
            res.status(404).send('No se encontró la competencia desdeada.')
        } else if (result.length >= 1) {
            queryBorrarVotos = `DELETE FROM votos_peli_competencia WHERE competencia_id = ?`;
            connection.query(queryBorrarVotos, [competencia], function(err, result) {
                if (err) {
                    console.log('Error al intentar reiniciar votos de competencia. Error ' + err);
                    res.status(500).send('Ocurrió un error al intentar reiniciar la competencia. Por favor inténtelo nuevamente más tarde');
                }
                res.status(200).send('Competencia reiniciada con éxito. ¡A votar!')
            });
        }
    });

}

function obtenerGeneros(req, res) {
    let queryGeneros = `SELECT id, nombre FROM genero`
    connection.query(queryGeneros, function(err, result) {
        if (err) {
            console.log('Error al traer los géneros. Error ' + err)
            res.status(500).send('Ocurrió un error al cargar los géneros. Por favor inténtelo nuevamente más tarde.')
        }
        let data = result;
        res.send(data);
    });
}

function obtenerDirectores(req, res) {
    let queryDirectores = `SELECT id, nombre FROM director`
    connection.query(queryDirectores, function(err, result) {
        if (err) {
            console.log('Error al traer los directores. Error ' + err)
            res.status(500).send('Ocurrió un error al cargar los directores. Por favor inténtelo nuevamente más tarde.')
        }
        let data = result;
        res.send(data);
    });
}

function obtenerActores(req, res) {
    let queryDirectores = `SELECT id, nombre FROM actor`
    connection.query(queryDirectores, function(err, result) {
        if (err) {
            console.log('Error al traer los actores. Error ' + err)
            res.status(500).send('Ocurrió un error al cargar los actores. Por favor inténtelo nuevamente más tarde.')
        }
        let data = result;
        res.send(data);
    });
}

function generarConsultaFiltros(genero, director, actor) {
    let queryPelicula = 'SELECT p.id, p.poster, p.titulo FROM pelicula AS p LEFT JOIN director AS d ON p.director = d.nombre INNER JOIN actor_pelicula AS ap ON p.id = ap.pelicula_id ';
    let filtros = [];
    if (genero) { filtros.push(` p.genero_id = ${genero} `) }
    if (director) { filtros.push(` d.id = ${director} `) }
    if (actor) { filtros.push(` ap.actor_id = ${actor} `) }

    if (filtros.length > 0) {
        queryPelicula += ' WHERE ' + filtros.join(' AND ')
    }

    queryPelicula += ' GROUP BY p.id ORDER BY rand() LIMIT 2;'
    return queryPelicula;
}

module.exports = {
    listarCompetencias,
    crearCompetencia,
    obtenerCompetencia,
    eliminarCompetencia,
    editarCompetencia,
    obtenerPeliculas,
    votarPelicula,
    obtenerResultados,
    reiniciarVotos,
    obtenerGeneros,
    obtenerDirectores,
    obtenerActores,
}