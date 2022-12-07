const {Pool} = require('pg');

const pool = new Pool({
    host: 'localhost',
    port: 5432,
    user: 'postgres',
    password: '8318',
    database: 'zoologicos',
});

const holaDev = (req,res) =>{
    console.log("Hola DEV");
    res.json("Hola MUNDO 5");
} 

const getAnimales = async (req,res) =>{
    // Agregar la consulta de que animales tiene el zoo

    /*
        SELECT zoo.nombre,animal.continente,especie.nombre_vulgar FROM zoo 
        INNER JOIN zoo_especie ON zoo.id_zoo = zoo_especie.id_zoo
        INNER JOIN especie ON zoo_especie.id_especie = especie.id_especie
        INNER JOIN animal ON zoo_especie.id_especie = animal.id_especie;
    */
    try{
        let response = await pool.query('SELECT animal.*, especie.nombre_vulgar FROM animal INNER JOIN especie ON animal.id_especie = especie.id_especie');

        if(Object.keys(req.query).includes('nombre_vulgar')){
            const {nombre_vulgar} = req.query;
            let aux = await pool.query('SELECT id_especie FROM especie WHERE nombre_vulgar = $1',[nombre_vulgar]);
            if(sinDatos(aux,res)) return;
            aux = aux.rows[0].id_especie;
            response = await pool.query(
                'SELECT animal.*, especie.nombre_vulgar FROM animal INNER JOIN especie ON animal.id_especie = especie.id_especie WHERE especie.id_especie = $1',
                [aux]);
        }

        if(sinDatos(response,res)) return;

        res.status(200).json(response.rows);

    }catch(error){
        res.status(500).json({"error": error.message});
    }
}

const getEspecies = async (req,res) =>{
    try{
        let response = await pool.query('SELECT * FROM especie');

        if(Object.keys(req.query).includes('nombre_vulgar')){
            const {nombre_vulgar} = req.query;
            response = await pool.query('SELECT * FROM especie WHERE nombre_vulgar = $1',[nombre_vulgar]);
        }else if(Object.keys(req.query).includes('nombre_cientifico')){
            const {nombre_cientifico} = req.query;
            response = await pool.query('SELECT * FROM especie WHERE nombre_cientifico = $1',[nombre_cientifico]);
        }else if(Object.keys(req.query).includes('peligro_ext')){
            const {peligro_ext} = req.query;
            response = await pool.query('SELECT * FROM especie WHERE peligro_ext = $1',[peligro_ext]);
        }

        if(response.rowCount == 0){
            res.status(200).json({"Estatus":"No existe ningún registro"});
            return;
        }

        res.status(200).json(response.rows);

    }catch(error){
        res.status(500).json({"error": error.message});
    }
}

const getZoo = async (req,res) =>{
    try{
        let response = await pool.query('SELECT * FROM zoo');
        const tipo_busqueda = req.query.tipo_busqueda;
        const {ciudad,pais,tamanio} = req.query;

        let dict = {
            "pais": await pool.query('SELECT * FROM zoo WHERE ciudad = $1', [pais]),
            "ciudad": await pool.query('SELECT * FROM zoo WHERE ciudad = $1', [ciudad]),
            "ciudadPais": await pool.query('SELECT * FROM zoo WHERE ciudad = $1 AND pais = $2', [ciudad,pais]),
            "ciudadPaisTamanio": await pool.query('SELECT * FROM zoo WHERE ciudad = $1 AND pais = $2 AND tamanio = $3', [ciudad,pais,tamanio])
        }
        
        if(Object.keys(req.query).length){
            response = dict[tipo_busqueda];
        }

        // if(Object.keys(req.query).includes('ciudad') && Object.keys(req.query).includes('pais')){
        //     const {ciudad,pais} = req.query;
        //     response = await pool.query('SELECT * FROM zoo WHERE ciudad = $1 AND pais = $2', [ciudad,pais]); 
        // }else if(Object.keys(req.query).includes('ciudad')){
        //     const ciudad = req.query.ciudad;
        //     console.log(Object.keys(req.query));
        //     response = await pool.query('SELECT * FROM zoo WHERE ciudad = $1', [ciudad]);
        // }else if(Object.keys(req.query).includes('pais')){
        //     const pais = req.query.pais;
        //     response = await pool.query('SELECT * FROM zoo WHERE ciudad = $1', [pais]);
        // }

        if (response.rowCount == 0) {
            res.status(200).json({"Estatus":"No existe ningún registro"})
            return;
        }
        
        res.status(200).json(response.rows)
    }catch(error){
        res.status(500).json({"Error": error.message})
    }
}

const sinDatos = (consulta,res) =>{
    if(consulta.rowCount == 0){
        res.status(200).json({"Estatus":"No existe ningun registro"});
        return true;
    }
    return false;
}

const addZoo = async (req,res) =>{
    try{
        let expresion = new RegExp("\D");
        const {nombre,ciudad,pais,tamanio,presupuesto_anual} = req.body;
        console.log(nombre.match(expresion));
        await pool.query('INSERT INTO zoo(nombre,ciudad,pais,tamanio,presupuesto_anual) VALUES ($1,$2,$3,$4,$5)',[nombre,ciudad,pais,tamanio,presupuesto_anual]);
        res.status(200).json({"Estatus": "ok" , "mensaje":"Tu registro fue exitoso"});
    }catch(error){
        res.status(500).json({"error": error.message});
    }
}

module.exports = {
    holaDev,
    getAnimales,
    getZoo,
    getEspecies,
    addZoo
}