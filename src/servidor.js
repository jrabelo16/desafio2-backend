const express = require("express");
const roteador = require("./roteador");

const app = express();

app.use(express.json());
app.use(roteador);

//adicionar aqui o arquivo de rotas

module.exports = app;
