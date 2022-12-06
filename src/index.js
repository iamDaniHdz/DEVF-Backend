// Aquí se importa la librería express
const express = require('express');
const app = express();

// Configuraciones del backend
app.use(express.json());
app.use(express.urlencoded({extended:false}))

//Se comienza el enrutamiento
app.use(require('./routes/index'));

// Se inicia el servidor
app.listen(3000);
console.log('Servidor en el puerto 3000')