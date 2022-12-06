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
    res.json({
        'nombre' : 'perro',
        'edad': '3'
    });
}

const getZoo = async (req,res) =>{
    const response = await pool.query('SELECT * FROM zoo');
    console.log(response.rows)
    res.status(200).json(response.rows)
}

module.exports = {
    holaDev,
    getAnimales,
    getZoo
}