import nodemailer from 'nodemailer';
import { google } from 'googleapis';
import "dotenv/config";

const oAuth2Client = new google.auth.OAuth2(
  process.env.CLIENT_ID_GOOGLE,
  process.env.CLIENT_SECRET_GOOGLE,
  process.env.REDIRECT_URI_GOOGLE
);
oAuth2Client.setCredentials({ refresh_token: process.env.REFRESH_TOKEN_GOOGLE });

// Fonction pour envoyer un e-mail de confirmation de commande
export const sendEmail = async ({ email, name, cartItems, orderData }) => {
  try {
    // Obtenir le jeton d'accès
    const accessTokenResponse = await oAuth2Client.getAccessToken();
    console.log('Access Token Response:', accessTokenResponse);

    const accessToken = accessTokenResponse?.token || accessTokenResponse?.res?.data?.access_token;
    console.log('Access Token:', accessToken);

    if (!accessToken) {
      throw new Error('Impossible de récupérer le token d\'accès');
    }

    // Créer le transporteur Nodemailer
    let transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        type: 'OAuth2',
        user: 'support@freepbyh.com',
        clientId: process.env.CLIENT_ID_GOOGLE,
        clientSecret: process.env.CLIENT_SECRET_GOOGLE,
        refreshToken: process.env.REFRESH_TOKEN_GOOGLE,
        accessToken: accessToken,
      },
    });

    // Vérifier la configuration du transporteur
    await transporter.verify();
    console.log('Transporteur prêt');

    // Construire la liste des articles
    const itemsList = cartItems
      .map(item => `<li>${item.name} x ${item.quantity}: ${item.unit_amount.value}€</li>`)
      .join('');

    // Définir les options de l'e-mail
    const mailOptions = {
      from: 'Boutique NoName <support@freepbyh.com>',
      to: "natixe28@gmail.com",
      subject: 'Confirmation de votre commande',
      html: `<h1>Merci ${name}!</h1><p>Votre commande n°${orderData.id} est confirmée.</p><ul>${itemsList}</ul>`
    };

    // Envoyer l'e-mail
    await transporter.sendMail(mailOptions);
    console.log('Email de confirmation envoyé à', email);
  } catch (error) {
    console.error("Erreur d'envoi :", error);
    throw new Error('Email non envoyé');
  }
};

// Fonction pour envoyer un e-mail générique
export const sendGenericEmail = async (to, subject, text) => {
  try {
    const accessTokenResponse = await oAuth2Client.getAccessToken();
    const accessToken = accessTokenResponse?.token || accessTokenResponse?.res?.data?.access_token;
    console.log('Access Token for Generic Email:', accessToken);

    if (!accessToken) {
      throw new Error('Impossible de récupérer le token d\'accès pour l\'e-mail générique');
    }

    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        type: 'OAuth2',
        user: 'support@freepbyh.com',
        clientId: process.env.CLIENT_ID_GOOGLE,
        clientSecret: process.env.CLIENT_SECRET_GOOGLE,
        refreshToken: process.env.REFRESH_TOKEN_GOOGLE,
        accessToken: accessToken,
      },
    });

    // Vérifier la configuration du transporteur
    await transporter.verify();
    console.log('Transporteur pour e-mail générique prêt');

    const mailOptions = {
      from: 'Boutique NoName <support@freepbyh.com>',
      to: "natixe28@gmail.com",
      subject,
      text,
    };

    await transporter.sendMail(mailOptions);
    console.log('Email générique envoyé à', to);
  } catch (error) {
    console.error("Erreur d'envoi générique:", error);
    throw new Error('Email générique non envoyé');
  }
};
