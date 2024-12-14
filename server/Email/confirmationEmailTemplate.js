export function getConfirmationEmailHtml(name, orderData, itemsList) {
    return `
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <meta name="description" content="Confirmation d'achat pour vos services de coaching sportif. Suivez votre commande et explorez nos autres produits.">
        <meta name="keywords" content="coaching sportif, fitness, achat en ligne, confirmation de commande, suivi de commande">
        <title>Confirmation d'Achat - CNM</title>
        <style>
            body {
                font-family: 'Helvetica Neue', Arial, sans-serif;
                background-color: #f5f5f5;
                margin: 0;
                padding: 0;
            }
            .email-container {
                max-width: 600px;
                margin: 0 auto;
                background-color: #ffffff;
                border-radius: 12px;
                overflow: hidden;
                box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
            }
            .email-header {
                background: linear-gradient(45deg, #ff6b6b, #f06595);
                padding: 30px;
                text-align: center;
            }
            .email-header h1 {
                color: #fff;
                font-size: 28px;
                margin: 0;
            }
            .email-content {
                padding: 20px 30px;
                background-color: #fafafa;
            }
            .email-content p {
                font-size: 16px;
                color: #333;
                line-height: 1.8;
                margin: 0 0 20px;
            }
            .email-content ul {
                list-style: none;
                padding: 0;
                margin: 0 0 20px;
            }
            .email-content ul li {
                background-color: #e1f7d5;
                padding: 10px;
                border-radius: 8px;
                margin-bottom: 10px;
                color: #2c3e50;
                font-size: 15px;
            }
            .cta-button {
                display: block;
                width: 80%;
                margin: 0 auto 30px;
                padding: 15px;
                background-color: #ff6b6b;
                color: #fff;
                text-align: center;
                border-radius: 8px;
                text-decoration: none;
                font-size: 18px;
                font-weight: bold;
            }
            .email-footer {
                background-color: #ffec99;
                padding: 20px;
                text-align: center;
            }
            .email-footer p {
                font-size: 14px;
                color: #333;
                margin: 0 0 10px;
            }
            .social-links a {
                display: inline-block;
                margin: 0 15px;
                text-decoration: none;
            }
            .social-links img {
                width: 32px;
                height: 32px;
                vertical-align: middle;
            }
        </style>
    </head>
    <body>
        <div class="email-container">
            <div class="email-header">
                <h1>Merci pour votre achat !</h1>
            </div>
            <div class="email-content">
                <p>Bonjour ${name},</p>
                <p>Merci d'avoir choisi <strong>CNM</strong> pour vos besoins en coaching sportif. Nous avons bien reçu votre commande et nous sommes ravis de vous accompagner dans votre parcours fitness.</p>
                <p>Voici les détails de votre commande :</p>
                <p>Votre numéro de commande est <b>${orderData.id}</b><p>
                <ul>
                  ${itemsList}
                </ul>
                <p>Visitez notre <a href="https://cnm-nutrisport.com/" style="color: #ff6b6b; text-decoration: none;">site web</a> pour découvrir plus de produits et services inspirants.</p>
            </div>
            <div class="email-footer">
                <p>Suivez-nous pour plus de conseils et d'inspiration !</p>
                <div class="social-links">
                    <a href="https://instagram.com/alexis_cnm" target="_blank"><img src="https://image.shutterstock.com/image-vector/instagram-icon-260nw-604576989.jpg" alt="Instagram"></a>
                    <!-- TikTok icon removed or replaced with a generic icon -->
                </div>
                <p>&copy; 2024 CNM. Tous droits réservés.</p>
            </div>
        </div>
    </body>
    `;
}

export default getConfirmationEmailHtml;
  