const express = require("express");
//To improve latter

const controlador = require("../controladores/controlador");
const roteador = express();

roteador.get("/contas", controlador.listarContas);
roteador.post("/contas", controlador.criarConta);
roteador.put("/contas/:numeroConta/usuario", controlador.atualizarUsuarioConta);
roteador.delete("/contas/:numeroConta", controlador.excluirConta);
roteador.post("/transacoes/depositar", controlador.depositar);
roteador.post("/transacoes/sacar", controlador.sacar);
roteador.post("/transacoes/transferir", controlador.transferir);
roteador.get("/contas/saldo", controlador.saldo);
roteador.get("/contas/extrato", controlador.extrato);

module.exports = roteador;
