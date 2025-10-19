const usuarioService = require("../services/usuarioService");

const createProfissional = async (req, res) => {
  try {
    const result = await usuarioService.createProfissional(req.body);
    res.status(201).json(result);
  } catch (err) {
    console.log("erro ao cadastrar profissional: ", err);
    res.status(500).json({ err: "erro ao cadastrar" });
  }
};

const login = async (req,res) => {
    try{
        const {email, senha} = req.body;
        if(!email || !senha){
            return res.status(400).json({message: "Email e senha sao obrigatorios"})
        }
        const result = await usuarioService.login(req.body)
        res.status(200).json(result)
    }catch(err){
        res.status(err.statusCode || 500).json({message: err.message})
    }
}
module.exports = {
    createProfissional,
    login,
};