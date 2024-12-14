import express from 'express';
import { sendGenericEmail } from '../Email/emailController.js';
import { check, validationResult } from 'express-validator';

const router = express.Router();

// Route pour envoyer un e-mail générique
router.post(
  '/send-email',
  [
    check('to', 'Veuillez fournir une adresse e-mail valide.').isEmail(),
    check('subject', 'Le sujet est requis.').not().isEmpty(),
    check('text', 'Le message est requis.').not().isEmpty(),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    const { to, subject, text } = req.body;

    try {
      await sendGenericEmail(to, subject, text);
      res.status(200).json({ message: 'E-mail envoyé avec succès.' });
    } catch (error) {
      console.error('Erreur lors de l\'envoi de l\'e-mail:', error);
      res.status(500).json({ error: 'Erreur lors de l\'envoi de l\'e-mail.' });
    }
  }
);

export default router;
