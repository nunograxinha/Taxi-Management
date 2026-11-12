const pedidoViagemService = require('../services/pedidoViagemService');
const { PedidoViagem } = require('../models/pedidoViagem');

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
    console.error('Error creating ride request:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  };
};

exports.get_pedidoViagem = async (req, res) => {
  try {
    const { id } = req.params;
    const pedido = await PedidoViagem.findById(id).populate('cliente');
    if (!pedido) {
      return res.status(404).json({ error: 'Ride request not found' });
    }
    res.status(200).json(pedido);
  } catch (error) {
    console.error('Error fetching ride request:', error);
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

    if (!updated) return res.status(404).json({ error: 'Ride request not found' });
    res.status(200).json(updated);
  } catch (err) {
    console.error('Error accepting ride request:', err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

exports.request_motorista = async (req, res) => {
  console.log("RequestMotorista params:", req.params);
  const { id } = req.params;

  console.log(`Starting request_motorista for PedidoViagem with id: ${id}`);

  const timeoutMs = 5 * 60 * 1000; // 5 minutes timeout
  const intervalMs = 15 * 1000; // 15 seconds interval

  let elapsed = 0;

  const cleanup = () => {
    clearInterval(intervalCheck);
    clearTimeout(timeoutTimer);
  };

  req.on('close', () => {
    cleanup();
  });

  const intervalCheck = setInterval(async () => {
    try {
      elapsed += intervalMs;

      console.log(`Checking PedidoViagem with id: ${id} (Elapsed time: ${elapsed / 1000}s)`);

      const pedidoViagem = await PedidoViagem.findById(id);

      if (!pedidoViagem) {
        cleanup();
        if (!res.headersSent) {
          return res.status(404).json({ message: 'Ride request not found or cancelled' });
        }
        return;
      }

      if (pedidoViagem.motoristaId) {
        cleanup();
        console.log(`Driver found: ${pedidoViagem.motoristaId}`);
        if (!res.headersSent) {
          return res.status(200).json({ motoristaId: pedidoViagem.motoristaId });
        }
        return;
      }

      if (elapsed >= timeoutMs) {
        clearInterval(intervalCheck);
        console.log("Timeout reached without finding a driver.");
      }
    } catch (err) {
      cleanup();
      console.log("Error checking driver status:", err);
      if (!res.headersSent) {
        return res.status(500).json({ message: 'Error checking driver status' });
      }
    }
  }, intervalMs);

  const timeoutTimer = setTimeout(() => {
    cleanup();
    console.log("No driver assigned within the timeout period.");
    if (!res.headersSent) {
      return res.status(202).json({ motoristaId: null, message: 'No driver assigned yet' });
    }
  }, timeoutMs);
};


exports.clientConfirm = async (req, res) => {
  console.log("clientConfirm params:", req.params);
  const { id } = req.params;

  console.log(`Starting clientConfirm for PedidoViagem with id: ${id}`);

  const timeoutMs = 5 * 60 * 1000; // 5 minutes timeout
  const intervalMs = 15 * 1000; // 15 seconds interval

  let elapsed = 0;

  const cleanup = () => {
    clearInterval(intervalCheck);
    clearTimeout(timeoutTimer);
  };

  req.on('close', () => {
    cleanup();
  });

  const intervalCheck = setInterval(async () => {
    try {
      elapsed += intervalMs;

      console.log(`Checking PedidoViagem with id: ${id} (Elapsed time: ${elapsed / 1000}s)`);

      const pedidoViagem = await PedidoViagem.findById(id);

      // If the request was cancelled or the client rejected the driver (motoristaId returned to null)
      if (!pedidoViagem || !pedidoViagem.motoristaId) {
        cleanup();
        console.log("Client rejected driver or cancelled order.");
        if (!res.headersSent) {
          return res.status(200).json({ confirmed: false, rejected: true, message: 'Client rejected or cancelled' });
        }
        return;
      }

      if (pedidoViagem.clienteAceitou) {
        cleanup();
        console.log(`Client accepted: ${pedidoViagem.clienteAceitou}`);
        if (!res.headersSent) {
          return res.status(200).json({ confirmed: true, message: 'Client confirmed' });
        }
        return;
      }

      if (elapsed >= timeoutMs) {
        clearInterval(intervalCheck);
        console.log("Timeout reached without confirming with the client.");
      }
    } catch (err) {
      cleanup();
      console.log("Error checking client status:", err);
      if (!res.headersSent) {
        return res.status(500).json({ message: 'Error checking client status' });
      }
    }
  }, intervalMs);

  const timeoutTimer = setTimeout(() => {
    cleanup();
    console.log("Client did not answer");
    if (!res.headersSent) {
      return res.status(202).json({ confirmed: false, rejected: false, message: 'Client did not answer' });
    }
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

    if (!updated) return res.status(404).json({ error: 'Ride request not found' });
    res.status(200).json(updated);
  } catch (err) {
    console.error('Error accepting ride request (client):', err);
    res.status(500).json({ error: 'Internal Server Error' });
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
      distanceKmToMotorista: null
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

    if (!updated) return res.status(404).json({ error: 'Ride request not found' });
    res.status(200).json(updated);
  } catch (err) {
    console.error('Error rejecting ride request:', err);
    res.status(500).json({ error: 'Error rejecting ride request' });
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
    if (!updated) return res.status(404).json({error: 'Ride request not found'});
    res.status(200).json(updated);
  } catch (err) {
    console.error('Error updating ride request:', err);
    res.status(500).json({ error: 'Error updating ride request' });
  }
};