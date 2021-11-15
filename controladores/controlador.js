const dados = require("../src/bancodedados");

async function listarContas(req, res) {
  const { senha_banco } = req.query;

  if (senha_banco !== "Cubos123Bank") {
    if (!senha_banco) {
      return res
        .status(400)
        .json({ mensagem: "Senha do banco deve ser informada" });
    } else {
      return res.status(400).json({ mensagem: "Senha incorreta" });
    }
  }

  return res.status(200).json(dados.contas);
}

let numeroNovaConta = 0;

async function criarConta(req, res) {
  const { nome, cpf, data_nascimento, telefone, email, senha } = req.body;
  const erro = await validarConta(req.body);
  numeroNovaConta++;

  if (erro) {
    return res.status(400).json({ mensagem: erro });
  }

  const novaConta = {
    numero: numeroNovaConta.toString(),
    saldo: 0,
    usuario: {
      nome,
      cpf,
      data_nascimento,
      telefone,
      email,
      senha,
    },
  };

  dados.contas.push(novaConta);
  return res.status(201).json(novaConta);
}

async function atualizarUsuarioConta(req, res) {
  const { numeroConta } = req.params;
  const { nome, cpf, data_nascimento, telefone, email, senha } = req.body;
  const { contas } = dados;

  if (validarNumeroConta(numeroConta)) {
    return res.status(404).json({ mensagem: validarNumeroConta(numeroConta) });
  }

  const erro =
    (await validarAtualizacao(req.body)) ?? validarDadosAtualizacao(req.body);

  if (erro) {
    res.status(400).json({ mensagem: erro });
    return;
  }

  const contaEncontrada = dados.contas.find(
    (conta) => conta.numero === Number(numeroConta)
  );

  if (contaEncontrada) {
    return res
      .status(404)
      .json({ mensagem: "Não há conta para o usuario informado." });
  }

  const usuarioAtualizado = {
    nome: nome ?? contaEncontrada.usuario.nome,
    cpf: cpf ?? contaEncontrada.usuario.cpf,
    data_nascimento: data_nascimento ?? contaEncontrada.usuario.data_nascimento,
    telefone: telefone ?? contaEncontrada.usuario.telefone,
    email: email ?? contaEncontrada.usuario.email,
    senha: senha ?? contaEncontrada.usuario.senha,
  };

  if (
    contaEncontrada.usuario.nome === usuarioAtualizado.nome &&
    contaEncontrada.usuario.cpf === usuarioAtualizado.cpf &&
    contaEncontrada.usuario.data_nascimento ===
      usuarioAtualizado.data_nascimento &&
    contaEncontrada.usuario.telefone === usuarioAtualizado.telefone &&
    contaEncontrada.usuario.email === usuarioAtualizado.email &&
    contaEncontrada.usuario.senha === usuarioAtualizado.senha
  ) {
    return res
      .status(400)
      .json({ mensagem: "Dados informados iguais aos anteriores." });
  }

  contaEncontrada.usuario = usuarioAtualizado;
  return res.status(200).json({ mensagem: "Conta atualizada com sucesso!" });
}

function excluirConta(req, res) {
  const { numeroConta } = req.params;
  const { contas } = dados;

  if (validarNumeroConta(numeroConta)) {
    return res.status(400).json({ mensagem: validarNumeroConta(numeroConta) });
  }

  const indexConta = dados.contas.findIndex(
    (conta) => conta.numero === Number(numeroConta)
  );

  if (indexConta === -1) {
    return res
      .status(404)
      .json({ mensagem: "Não há conta para o usuario informado." });
  }

  if (contas[indexConta].saldo !== 0) {
    return res.status(400).json({
      mensagem: "Não é possível exluir a conta pois ainda há saldo.",
    });
  }

  contas.splice(indexConta, 1);

  return res.status(200).json({ mensagem: "Conta excluída com sucesso!" });
}

function depositar(req, res) {
  const { numeroConta, valorDeposito } = req.body;
  const { contas, depositos } = dados;

  if (validarNumeroConta(numeroConta) || !numeroConta) {
    return res.status(400).json({
      mensagem:
        validarNumeroConta(numeroConta) ??
        "Informe o número da conta de destino.",
    });
  }

  if (!Number(valorDeposito) > 0) {
    return res.status(400).json({
      mensagem: "O valor do depósito deve ser informado e maior que 0.",
    });
  }

  const contaEncontrada = contas.find(
    (conta) => conta.numero === Number(numeroConta)
  );

  if (contaEncontrada) {
    return res
      .status(404)
      .json({ mensagem: "Não há conta para o usuario informado." });
  }

  contaEncontrada.saldo = Number(contaEncontrada.saldo) + Number(valorDeposito);

  const depositoRegistro = {
    data: new Date(),
    numero_conta: contaEncontrada.numero,
    valor: Number(valorDeposito),
  };

  depositos.push(depositoRegistro);

  return res.status(200).json({ mensagem: "Depósito realizado com sucesso!" });
}

function sacar(req, res) {
  if (validarNumeroConta(req.body) || !req.body.numeroConta) {
    res.status(400);
    res.json({
      mensagem: validarNumeroConta(req.body) ?? "Informe o número da conta.",
    });
    return;
  }

  const indexConta = dados.contas.findIndex(
    (conta) => conta.numero === Number(req.body.numeroConta)
  );

  if (indexConta === -1) {
    res.status(404);
    res.json({ mensagem: "Não há conta para o usuario informado." });
    return;
  }

  if (!Number(req.body.valorSaque) > 0) {
    res.status(400);
    res.json({
      mensagem: "Informe um número não nulo para o valor do saque.",
    });
    return;
  }

  if (!req.body.senha) {
    res.status(400);
    res.json({ mensagem: "Informe sua senha." });
    return;
  }

  if (req.body.senha !== dados.contas[indexConta].usuario.senha) {
    res.status(400);
    res.json({ mensagem: "Senha incorreta." });
    return;
  }

  if (dados.contas[indexConta].saldo < Number(req.body.valorSaque)) {
    res.status(400);
    res.json({ mensagem: "Saldo insuficiente." });
    return;
  }

  dados.contas[indexConta].saldo =
    Number(dados.contas[indexConta].saldo) - Number(req.body.valorSaque);

  res.status(200);
  res.json({ mensagem: "Saque realizado com sucesso." });

  //Registro de saque

  const saqueRegistro = {
    data: new Date(),
    numero_conta: dados.contas[indexConta].numero,
    valor: Number(req.body.valorSaque),
  };

  dados.saques.push(saqueRegistro);
  console.log(dados.saques);
}

function transferir(req, res) {
  if (
    validarNumeroContaOrigem(req.body) ||
    validarNumeroContaDestino(req.body)
  ) {
    res.status(400);
    res.json({
      mensagem:
        validarNumeroContaOrigem(req.body) ??
        validarNumeroContaDestino(req.body),
    });
    return;
  }

  const indexContaOrigem = dados.contas.findIndex(
    (conta) => conta.numero === Number(req.body.numeroContaOrigem)
  );

  const indexContaDestino = dados.contas.findIndex(
    (conta) => conta.numero === Number(req.body.numeroContaDestino)
  );

  if (indexContaOrigem === -1) {
    res.status(404);
    res.json({ mensagem: "Não há conta para o usuario de origem informado." });
    return;
  }

  if (indexContaDestino === -1) {
    res.status(404);
    res.json({ mensagem: "Não há conta para o usuario de destino informado." });
    return;
  }

  if (!req.body.senha) {
    res.status(400);
    res.json({ mensagem: "Informe sua senha." });
    return;
  }

  if (req.body.senha !== dados.contas[indexContaOrigem].usuario.senha) {
    res.status(400);
    res.json({ mensagem: "Senha incorreta." });
    return;
  }

  if (
    dados.contas[indexContaOrigem].saldo < Number(req.body.valorTransferencia)
  ) {
    res.status(400);
    res.json({ mensagem: "Saldo insuficiente." });
    return;
  }

  if (!Number(req.body.valorTransferencia) > 0) {
    res.status(400);
    res.json({
      mensagem: "Informe um número não nulo para o valor de transferência.",
    });
    return;
  }

  dados.contas[indexContaOrigem].saldo =
    Number(dados.contas[indexContaOrigem].saldo) -
    Number(req.body.valorTransferencia);

  dados.contas[indexContaDestino].saldo =
    Number(dados.contas[indexContaDestino].saldo) +
    Number(req.body.valorTransferencia);

  res.status(200);
  res.json({ mensagem: "Transferência realizada com sucesso." });

  //Registro de transferência

  const transferenciaRegistro = {
    data: new Date(),
    numero_conta_origem: dados.contas[indexContaOrigem].numero,
    numero_conta_destino: dados.contas[indexContaDestino].numero,
    valor: Number(req.body.valorTransferencia),
  };

  dados.transferencias.push(transferenciaRegistro);
  console.log(dados.transferencias);
}

function saldo(req, res) {
  if (validarNumeroContaNoQuery(req.query)) {
    res.status(400);
    res.json({ mensagem: validarNumeroContaNoQuery(req.query) });
  }

  const indexConta = dados.contas.findIndex(
    (conta) => conta.numero === Number(req.query.numeroConta)
  );

  if (indexConta === -1) {
    res.status(404);
    res.json({ mensagem: "Não há conta para o usuario informado." });
    return;
  }

  if (!req.query.senha) {
    res.status(400);
    res.json({ mensagem: "Informe sua senha." });
    return;
  }

  if (req.query.senha !== dados.contas[indexConta].usuario.senha) {
    res.status(400);
    res.json({ mensagem: "Senha incorreta." });
    return;
  }

  res.status(200);
  res.json(dados.contas[indexConta].saldo);
}

function extrato(req, res) {
  if (validarNumeroContaNoQuery(req.query)) {
    res.status(400);
    res.json({ mensagem: validarNumeroContaNoQuery(req.query) });
  }

  const indexConta = dados.contas.findIndex(
    (conta) => conta.numero === Number(req.query.numeroConta)
  );

  if (indexConta === -1) {
    res.status(404);
    res.json({ mensagem: "Não há conta para o usuario informado." });
    return;
  }

  if (!req.query.senha) {
    res.status(400);
    res.json({ mensagem: "Informe sua senha." });
    return;
  }

  if (req.query.senha !== dados.contas[indexConta].usuario.senha) {
    res.status(400);
    res.json({ mensagem: "Senha incorreta." });
    return;
  }

  const extrato = {
    depositos: dados.depositos.filter(
      (deposito) => deposito.numero_conta === dados.contas[indexConta].numero
    ),
    saques: dados.saques.filter(
      (saque) => saque.numero_conta === dados.contas[indexConta].numero
    ),
    transferenciasEnviadas: dados.transferencias.filter(
      (transferencia) =>
        transferencia.numero_conta_origem === dados.contas[indexConta].numero
    ),
    transferenciasRecebidas: dados.transferencias.filter(
      (transferencia) =>
        transferencia.numero_conta_destino === dados.contas[indexConta].numero
    ),
  };

  res.status(200);
  res.json(extrato);
}

//Validações

function validarNumeroContaNoQuery(query) {
  if (!Number(query.numero_conta) > 0) {
    return "Número de conta de destino inválido.";
  }

  if (!query.numero_conta) {
    return "Informe o número de conta de destino.";
  }
}

function validarNumeroContaDestino(requisicao) {
  if (!Number(requisicao.numeroContaDestino) > 0) {
    return "Número de conta de destino inválido.";
  }

  if (!requisicao.numeroContaDestino) {
    return "Informe o número de conta de destino.";
  }
}

function validarNumeroContaOrigem(requisicao) {
  if (!Number(requisicao.numeroContaOrigem) > 0) {
    return "Número de conta de origem inválido.";
  }

  if (!requisicao.numeroContaOrigem) {
    return "Informe o número de conta de origem.";
  }
}

async function validarNumeroConta(requisicao) {
  if (!Number(requisicao) > 0) {
    return "Número de conta inválido.";
  }

  if (!requisicao) {
    return "Informe o número de conta.";
  }
}

async function validarNome(conta) {
  if (typeof conta.nome !== "string") {
    return "O campo 'nome' deve ser preenchido com um texto.";
  } else if (conta.nome.split(" ").some((letra) => !letra)) {
    return "O campo 'nome' deve ser preenchido com um texto.";
  }
}

async function validarCpf(conta) {
  for (const contaEmFoco of dados.contas) {
    if (contaEmFoco.usuario.cpf === conta.cpf) {
      return "CPF já cadastrado.";
    }
  }
}

async function validarEmail(conta) {
  for (const contaEmFoco of dados.contas) {
    if (contaEmFoco.usuario.email === conta.email) {
      return "Email já cadastrado.";
    }
  }
}

async function validarConta(conta) {
  if (!conta.nome) {
    return "O campo 'nome' é obrigatório.";
  }

  if (validarNome(conta)) {
    return validarNome(conta);
  }

  if (!conta.cpf) {
    return "O campo 'cpf' é obrigatório.";
  }

  if (validarCpf(conta)) {
    return validarCpf(conta);
  }

  if (!conta.data_nascimento) {
    return "O campo 'data de nascimento' é obrigatório.";
  }

  if (!conta.telefone) {
    return "O campo 'telefone' é obrigatório.";
  }

  if (!conta.email) {
    return "O campo 'email' é obrigatório.";
  }

  if (validarEmail(conta)) {
    return validarEmail(conta);
  }

  if (!conta.senha) {
    return "O campo 'senha' é obrigatório.";
  }
}

async function validarAtualizacao(body) {
  if (
    !body.nome &&
    !body.cpf &&
    !body.data_nascimento &&
    !body.telefone &&
    !body.email &&
    !body.senha
  ) {
    return "Nenhum dado a ser atualizado foi informado.";
  }
}

async function validarDadosAtualizacao(conta) {
  if (conta.nome && validarNome(conta)) {
    return validarNome(conta);
  }

  if (conta.cpf && validarCpf(conta)) {
    return validarCpf(conta);
  }

  if (conta.email && validarEmail(conta)) {
    return validarEmail(conta);
  }
}

module.exports = {
  listarContas,
  criarConta,
  atualizarUsuarioConta,
  excluirConta,
  depositar,
  sacar,
  transferir,
  saldo,
  extrato,
};
