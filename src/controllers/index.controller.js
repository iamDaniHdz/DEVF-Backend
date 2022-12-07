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
       // Solo letras ^[a-zA-Z]+$ <- Zoo Paris
        // Solo números ^[0-9]*$
        // Solo números con punto decimal ^[0-9]+[.]+[0-9]*$

        //Definición de expresiones regulares
        //let exTexto = new RegExp("^[a-zA-Z]+$");
        let exNumero = new RegExp("^[0-9]*$");
        let exReal = new RegExp("^[0-9]+[.]+[0-9]*$");
        let exTexto = /^[a-zA-Z\s]*$/;
        
        //Obtención de datos del body de la request
        const {nombre,ciudad,pais,tamanio,presupuesto_anual} = req.body;
      
        // Validaciones contra expresiones regulares
        if((!exTexto.test(nombre)  || !exTexto.test(ciudad) || !exTexto.test(pais) || !exReal.test(tamanio) || !exReal.test(presupuesto_anual)) 
        && !exNumero.test(tamanio) && !exNumero.test(presupuesto_anual)){
            res.status(200).json({"Estatus": "Falso" , "mensaje":"Tu registro no se pudo realizar, checa tus datos"});
            return;
        }
        
        //Validación de registros repetidos
        let aux = await pool.query('SELECT * FROM zoo WHERE nombre = $1',[nombre]);

        if(aux.rowCount != 0){
            res.status(200).json({"Estatus": "Falso" , "mensaje":"Tu registro no se pudo realizar, ya existe en la base"});
            return;
        }

        //Ingreso de datos a la base
        await pool.query('INSERT INTO zoo(nombre,ciudad,pais,tamanio,presupuesto_anual) VALUES ($1,$2,$3,$4,$5)',[nombre,ciudad,pais,tamanio,presupuesto_anual]);
        res.status(200).json({"Estatus": "ok" , "mensaje":"Tu registro fue exitoso"});

    }catch(error){
        res.status(500).json({"error": error.message});
    }
}

const deleteZoo = async (req,res) =>{
    try{
        const {id_zoo,nombre} = req.body;


        if(id_zoo != ''){
            console.log("Estamos borrando con id_zoo");
            await pool.query('DELETE FROM zoo WHERE nombre = $1 AND id_zoo = $2',[nombre,id_zoo]);
            res.status(200).json({"Estatus": "ok" , "mensaje":"Tu registro se elimino correctamente"});
            return;
        }

        await pool.query('DELETE FROM zoo WHERE nombre = $1',[nombre]);
        res.status(200).json({"Estatus": "ok" , "mensaje":"Tu registro se elimino correctamente"});
    }catch(error){
        res.status(500).json({"error": error.message});
    }
}

const updateZoo = async (req,res) => {
    try{
        let exNumero = new RegExp("^[0-9]*$");
        let exReal = new RegExp("^[0-9]+[.]+[0-9]*$");
        let exTexto = /^[a-zA-Z\s]*$/;

        //Obtención de datos del body de la request
        const {nombre,tamanio,presupuesto_anual,tipo_modificacion,id_zoo} = req.body;

        // Validaciones contra expresiones regulares
        if(!exTexto.test(nombre)   || !exReal.test(tamanio) || !exReal.test(presupuesto_anual) && !exNumero.test(tamanio) && !exNumero.test(presupuesto_anual)){
            res.status(200).json({"Estatus": "Falso" , "mensaje":"Tu registro no se pudo realizar, checa tus datos"});
            return;
        }

        // 1. Solo por nombre
        // 2. Solo por tamanio
        // 3. Solo presupuesto_anual
        // 4. nombre y tamanio
        // 5. nombre y presupuesto_anual
        // 6. tamanio y presupuesto_anual
        // 7. nombre,tamanio y presupuesto_anual

        let dict = {
            "1": await pool.query('UPDATE zoo set nombre = $1 WHERE id_zoo = $2',[nombre,id_zoo]),
            "2": await pool.query('UPDATE zoo set tamanio = $1 WHERE id_zoo = $2',[tamanio,id_zoo]),
            "3": await pool.query('UPDATE zoo set presupuesto_anual = $1 WHERE id_zoo = $2',[presupuesto_anual,id_zoo]),
            "4": await pool.query('UPDATE zoo set nombre = $1, tamanio=$2 WHERE id_zoo = $3',[nombre,tamanio,id_zoo]),
            "5": await pool.query('UPDATE zoo set nombre = $1, presupuesto_anual=$2 WHERE id_zoo = $3',[nombre,presupuesto_anual,id_zoo]),
            "6": await pool.query('UPDATE zoo set tamanio = $1, presupuesto_anual=$2 WHERE id_zoo = $3',[tamanio,presupuesto_anual,id_zoo]),
            "7": await pool.query('UPDATE zoo set nombre = $1,tamanio = $2, presupuesto_anual=$3 WHERE id_zoo = $4',[nombre,tamanio,presupuesto_anual,id_zoo]),
        }

        response = dict[tipo_modificacion];

        res.status(200).json({"Estatus": "ok" , "mensaje":"Tu registro fue exitosamente actualizado"});

    }catch(error){
        res.status(500).json({"error": error.message});
    }
};


module.exports = {
    holaDev,
    getAnimales,
    getZoo,
    getEspecies,
    addZoo,
    deleteZoo,
    updateZoo
}