const pedidoViagemService = require('../services/pedidoViagemService');
const { PedidoViagem } = require('../models/pedidoViagem');
const { error } = require('console');

// GET pedidoViagens
exports.get_pedidosViagens = async (req, res) => { 
  try {
    const pedidos = await pedidoViagemService.getpedidos();
    res.status(200).json(pedidos);
  } catch (error) {
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

// Delete pedidoViagem/:id
exports.delete_pedidoViagem = async (req, res) => {
  try {
    const { id } = req.params;
    const updatedpedido = await pedidoViagemService.deletePedido(id);

    res.status(200).json(updatedpedido);
  } catch (error) {
    res.status(500).json({ error: 'Internal Server Error' });
  };
};

exports.post_pedidoViagem = async (req, res) => {
  try {
    const newPedido = await pedidoViagemService.postPedido(req.body);

    res.status(201).json(newPedido);
  } catch (error) {
    console.error('Erro ao criar pedido de viagem:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  };
};

exports.get_pedidoViagem = async (req, res) => {
  try {
    const { id } = req.params;
    const pedido = await PedidoViagem.findById(id).populate('cliente');
    if (!pedido) {
      return res.status(404).json({ error: 'Pedido de viagem não encontrado' });
    }
    res.status(200).json(pedido);
  } catch (error) {
    console.error('Erro ao buscar pedido de viagem:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

exports.accept_pedidoViagem = async (req, res) => {
  const { id } = req.params;
  console.log("accept_pedido_viagem body", req.body)
  const { motoristaId, taxi, distanceKmToMotorista, clienteAceitou } = req.body;

  try {
    const updated = await PedidoViagem.findByIdAndUpdate(
      id,
      { motoristaId: motoristaId,
        taxi: taxi,
        distanceKmToMotorista: distanceKmToMotorista, 
        clienteAceitou: clienteAceitou },
      { new: true }
    ).populate('cliente');

    if (!updated) return res.status(404).json({ error: 'Pedido não encontrado' });
    res.status(200).json(updated);
  } catch (err) {
    console.error('Erro ao aceitar pedido:', err);
    res.status(500).json({ error: 'Erro interno' });
  }
};

exports.request_motorista = async (req, res) => {
  console.log("RequestMotorista params:", req.params);
  const { id } = req.params;

  console.log(`Starting request_motorista for PedidoViagem with id: ${id}`);

  const timeoutMs = 5 * 60 * 1000; // 5 minutes timeout
  const intervalMs = 15 * 1000; // 3 seconds interval

  let elapsed = 0;

  console.log(`Timeout set to: ${timeoutMs / 1000} seconds`);
  console.log(`Interval set to: ${intervalMs / 1000} seconds`);

  const intervalCheck = setInterval(async () => {
    try {
      elapsed += intervalMs; // Increment elapsed time first

      console.log(`Checking PedidoViagem with id: ${id} (Elapsed time: ${elapsed / 1000}s)`);

      const pedidoViagem = await PedidoViagem.findById(id);

      if (pedidoViagem && pedidoViagem.motoristaId) {
        clearInterval(intervalCheck);
        clearTimeout(timeoutTimer);
        console.log(`Driver found: ${pedidoViagem.motoristaId}`);
        return res.status(200).json({ motoristaId: pedidoViagem.motoristaId });
      }

      if (elapsed >= timeoutMs) {
        clearInterval(intervalCheck);
        console.log("Timeout reached without finding a driver.");
      }
    } catch (err) {
      clearInterval(intervalCheck);
      console.log("Error checking driver status:", err);
      clearTimeout(timeoutTimer);
      return res.status(500).json({ message: 'Error checking driver status' });
    }
  }, intervalMs);

  const timeoutTimer = setTimeout(() => {
    clearInterval(intervalCheck);
    console.log("No driver assigned within the timeout period.");
    return res.status(202).json({ message: 'No driver assigned yet' });
  }, timeoutMs);
};


exports.clientConfirm = async (req, res) => {
  console.log("clientConfirm params:", req.params);
  const { id } = req.params;

  console.log(`Starting clientConfirm for PedidoViagem with id: ${id}`);

  const timeoutMs = 5 * 60 * 1000; // 5 minutes timeout
  const intervalMs = 15 * 1000; // 3 seconds interval

  let elapsed = 0;

  console.log(`Timeout set to: ${timeoutMs / 1000} seconds`);
  console.log(`Interval set to: ${intervalMs / 1000} seconds`);

  const intervalCheck = setInterval(async () => {
    try {
      elapsed += intervalMs; // Increment elapsed time first

      console.log(`Checking PedidoViagem with id: ${id} (Elapsed time: ${elapsed / 1000}s)`);

      const pedidoViagem = await PedidoViagem.findById(id);

      if (pedidoViagem && pedidoViagem.clienteAceitou) {
        clearInterval(intervalCheck);
        clearTimeout(timeoutTimer);
        console.log(`Client accepted: ${pedidoViagem.clienteAceitou}`);
        return res.status(200).json({ message: 'Client confirmed' });
      }

      if (elapsed >= timeoutMs) {
        clearInterval(intervalCheck);
        console.log("Timeout reached without confirming with the client.");
      }
    } catch (err) {
      clearInterval(intervalCheck);
      console.log("Error checking client status:", err);
      clearTimeout(timeoutTimer);
      return res.status(500).json({ message: 'Error checking client status' });
    }
  }, intervalMs);

  const timeoutTimer = setTimeout(() => {
    clearInterval(intervalCheck);
    console.log("Client did not answer");
    return res.status(202).json({ message: 'Client did not answer' });
  }, timeoutMs);
};

exports.accept_pedidoViagemCliente = async (req, res) => {
  const { id } = req.params;
  const { clienteAceitou } = req.body;
  try {
    const updated = await PedidoViagem.findByIdAndUpdate(
      id,
      { clienteAceitou: clienteAceitou },
      { new: true }
    ).populate('cliente');

    if (!updated) return res.status(404).json({ error: 'Pedido não encontrado' });
    res.status(200).json(updated);
  } catch (err) {
    console.error('Erro ao aceitar pedido (cliente):', err);
    res.status(500).json({ error: 'Erro interno' });
  }
};

exports.reject_pedidoViagem = async (req, res) => {
  const { id } = req.params;
  const { motoristaId } = req.body;
  const update = {
    $set: {
      motoristaId: null,
      clienteAceitou: false,
      taxi: null,
      distanceKmToMotorista: 0
    }
  };

  if (motoristaId) {
    update.$addToSet = { rejeitados: motoristaId };
  }

  try {
    const updated = await PedidoViagem.findByIdAndUpdate(
      id,
      update,
      { new: true }
    ).populate('cliente');

    if (!updated) return res.status(404).json({ error: 'Pedido não encontrado' });
    res.status(200).json(updated);
  } catch (err) {
    console.error('Erro ao rejeitar pedido:', err);
    res.status(500).json({ error: 'Erro ao rejeitar pedido' });
  }
};

exports.update_pedidoViagem = async (req, res) => {
  const { id } = req.params;
  try {
    const updated = await PedidoViagem.findByIdAndUpdate(
      id,
      { $set: req.body },
      { new: true }
    ).populate('cliente');
    if (!updated) return res.status(404).json({error: 'Pedido não encontrado'});
    res.status(200).json(updated);
  } catch (err) {
    console.error('Erro ao atualizar pedido:', err);
    res.status(500).json({ error: 'Erro ao atualizar pedido' });
  }
};