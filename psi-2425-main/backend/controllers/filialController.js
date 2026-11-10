const filialService = require('../services/filialService');

// GET filial/
exports.get_filiais = async (req, res) => { 
  try {
    const filiais = await filialService.getFiliais();
    console.log("Get de filiais: \n", filiais);
    res.status(200).json(filiais);
  } catch (error) {
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

// GET filial/get/:nipc
exports.get_filial_by_nipc = async (req, res) => {
  const { nipc } = req.params;
  try {
    const filial = await filialService.getFilialByNIPC(nipc);
    if (!filial) {
      return res.status(404).json({ error: `Filial with NIPC ${nipc} not found` });
    }
    console.log(`Filial with NIPC ${nipc}: \n`, filial);
    res.status(200).json(filial);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

// GET filial/init
exports.init_filiais = async (req, res) => { 
  try {
    const filiais = await filialService.initializeFilial();
    console.log("Filiais inicializadas com sucesso.");
    res.status(200).json(filiais);
  } catch (error) {
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

// POST filial/create
exports.post_filial = async (req, res) => {
  try {
    const filial = await filialService.createFilial(req.body);
    console.log("Filial inserida com sucesso: \n", filial);
    res.status(201).json(filial);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  };
};

// DELETE filial/delete/:nipc
exports.delete_filial = async (req, res) => {
  const { nipc } = req.params;
  try {
    const deleted = await filialService.deleteFilialByNIPC(nipc);
    if (!deleted) {
      return res.status(404).json({ error: `Filial with NIPC ${nipc} not found` });
    }
    console.log(`Filial com NIPC ${nipc} eliminada com sucesso.`);
    res.status(200).json({ message: 'Filial deleted successfully', deleted });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

// PUT filial/update/:nipc
exports.update_filial = async (req, res) => {
  const { nipc } = req.params;
  const { name, phone, address } = req.body;

  try {
    const updatedFilial = await filialService.updateFilialByNIPC(nipc, { name, phone, address });
    if (!updatedFilial) {
      return res.status(404).json({ error: `Filial with NIPC ${nipc} not found` });
    }
    console.log(`Filial com NIPC ${nipc} atualizada com sucesso.`);
    res.status(200).json(updatedFilial);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};
