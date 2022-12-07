const {Router,application} = require('express');
const router = Router();

//importacion de metodos para las rutas
const {holaDev,getAnimales,getZoo,getEspecies,addZoo,deleteZoo,updateZoo} = require('../controllers/index.controller');

//Definicion de rutas
/*GET - Trae datos
,POST - Insertar o modificar datos
,DELETE - Elimina datos
,PUT - Lo mismo que POST pero con XML*/

router.get('/', holaDev);

router.get('/animales', getAnimales);

router.get('/zoo', getZoo);

router.get('/especies', getEspecies);

router.post('/addZoo', addZoo);

router.delete('/deleteZoo', deleteZoo);

router.post('/updateZoo', updateZoo);

module.exports = router;