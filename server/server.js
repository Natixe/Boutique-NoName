import express from "express";
import "dotenv/config";
import jwt from "jsonwebtoken";
import multer from "multer";
import path from "path";
import cors from "cors";
import pkg from "pg";
import helmet from 'helmet';
import { fileURLToPath } from 'url';
import cron from 'node-cron';
import bcrypt from 'bcrypt';
import nodemailer from 'nodemailer';
import fetch from "node-fetch";
import { getConfirmationEmailHtml } from "./Email/confirmationEmailTemplate.js";
import emailRoutes from './routes/emailRoutes.js';
import { sendEmail, sendGenericEmail } from './Email/emailController.js';



const { Pool } = pkg;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);


const { PAYPAL_CLIENT_ID, PAYPAL_CLIENT_SECRET } = process.env;
const base = "https://api-m.sandbox.paypal.com";
const PAYPAL_API = base;

const app = express();
app.use(express.json());
app.use(cors({
  origin: ['https://freepbyh.com', 'http://localhost:8888', 'http://localhost:3000'],
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
}));
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: [
          "'self'",
          "https://www.paypal.com",
          "https://www.sandbox.paypal.com",
          "https://js.paypal.com",
          "https://js-de.sentry-cdn.com",
          "https://apis.google.com",
          "https://accounts.google.com",
          "https://www.googletagmanager.com",
        ],
        connectSrc: [
          "'self'",
          "https://www.googleapis.com",
          "https://smtp.gmail.com",
          "https://www.google-analytics.com",
          "https://www.googletagmanager.com",
        ],      
        imgSrc: [
          "'self'",
          "https://www.sandbox.paypal.com",
          "https://www.google-analytics.com",
          "https://www.googletagmanager.com", 
        ],
        frameSrc: [
          "'self'",
          "https://www.sandbox.paypal.com",
          "https://www.paypal.com",
          "https://www.googletagmanager.com",
        ],
      },
    },
  })
);

const pool = new Pool({
  user: process.env.PGUSER, 
  host: process.env.PGHOST,
  database: process.env.PGDATABASE,
  password: process.env.PGPASSWORD,
  port: process.env.PGPORT || 5432,
  ssl: {
    rejectUnauthorized: false,
  },
});

// Vérification de la connexion à la base de données
pool.connect((err, client, release) => {
  if (err) {
    return console.error('Erreur lors de la connexion à la base de données', err);
  }
  console.log('Connecté à la base de données PostgreSQL');
  release();
});

// Middleware d'authentification Admin (JWT)
const authenticateJWT = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (authHeader) {
    const token = authHeader.split(' ')[1];
    jwt.verify(token, 'votre_secret_jwt', (err, user) => {
      if (err) {
        return res.sendStatus(403); // Token invalide
      }
      req.user = user;
      next();
    });
  } else {
    res.sendStatus(401); // Non authentifié
  }
};

// Middleware pour utilisateurs (JWT)
const fetchuser = async (req, res, next) => {
  const token = req.header("auth-token");
  if (!token) {
    return res.status(401).send({ errors: "Veuillez vous authentifier avec un token valide" });
  }
  try {
    const data = jwt.verify(token, "secret_ecom");
    req.user = data.user;
    // Mise à jour du last_active utilisateur si nécessaire
    if (req.user && req.user.id) {
      try {
        await pool.query('UPDATE users SET last_active = NOW() WHERE id = $1', [req.user.id]);
      } catch (err) {
        console.error('Erreur lors de la mise à jour de last_active:', err.message);
      }
    }
    next();
  } catch {
    res.status(401).send({ errors: "Token invalide" });
  }
};

// Route de test santé
app.get('/api/health', (req, res) => {
  res.json({ status: 'API is running' });
});

// Route de connexion
app.post('/api/admin/login', async (req, res) => {
  const { email, password } = req.body;
  try {
    const now = new Date();
    const result = await pool.query('SELECT * FROM admin_users WHERE email = $1', [email]);
    const user = result.rows[0];

    if (!user) {
      return res.status(401).json({ message: 'Identifiants invalides.' });
    }

    const timeSinceLastAttempt = (now - (user.last_failed_attempt || now - 3600000)) / 1000;
    if (user.failed_attempts >= 3 && timeSinceLastAttempt < 3600) {
      await pool.query(
        'UPDATE admin_users SET failed_attempts = 0, last_failed_attempt = NULL WHERE email = $1',
        [email] // Correction ici
      );
      return res.status(429).json({ message: 'Trop de tentatives échouées. Réessayez plus tard.' });
    }

    if (timeSinceLastAttempt < 20 && user.failed_attempts > 0) {
      return res.status(429).json({ message: 'Veuillez patienter 20 secondes entre chaque tentative.' });
    }

    //const match = await bcrypt.compare(password, user.password_hash);
    const match = password === user.password_hash;
    if (match) {
      // Réinitialiser les tentatives échouées
      await pool.query(
        'UPDATE admin_users SET failed_attempts = 0, last_failed_attempt = NULL WHERE email = $1',
        [email]
      );
      const token = jwt.sign({ id: user.id, email: user.email }, 'votre_secret_jwt', { expiresIn: '1h' });
      res.json({ token });
    } else {
      // Incrémenter le compteur de tentatives échouées
      await pool.query(
        'UPDATE admin_users SET failed_attempts = failed_attempts + 1, last_failed_attempt = $1 WHERE email = $2',
        [now, email]
      );
      res.status(401).json({ message: 'Identifiants invalides.' });
    }
  } catch (error) {
    console.error('Erreur lors de la connexion:', error);
    res.status(500).json({ message: 'Erreur serveur.'});
  }
});

// Route protégée par JWT
app.get('/api/admin/secret', authenticateJWT, (req, res) => {
  res.json({ message: 'Bienvenue dans la zone protégée !' });
});

// Vérifiez la connexion à la base de données
pool.connect((err, client, release) => {
  if (err) {
    return console.error('Erreur lors de la connexion à la base de données', err);
  }
  console.log('Connecté à la base de données PostgreSQL');
  release();
});


app.get('/api/health', (req, res) => {
  res.json({ status: 'API is running' });
});

app.get('/oauth2callback', async (req, res) => {
  const code = req.query.code;

  try {
    const { tokens } = await oauth2Client.getToken(code); // Échangez le code pour un jeton
    oauth2Client.setCredentials(tokens); // Configurez les jetons d'accès et d'actualisation

    console.log('Tokens:', tokens); // Sauvegardez le refresh token si nécessaire
    res.send('Authentification réussie ! Vous pouvez fermer cette fenêtre.');
  } catch (error) {
    console.error('Erreur lors de l\'échange de code:', error);
    res.status(500).send('Erreur lors de l\'authentification.');
  }
});

// Function to generate PayPal access token
const generateAccessToken = async () => {
  // Génère un token d'accès PayPal
  if (!PAYPAL_CLIENT_ID || !PAYPAL_CLIENT_SECRET) {
    throw new Error("Manque le PayPal Client ID ou Secret dans les variables d'environnement");
  }
  const auth = Buffer.from(`${PAYPAL_CLIENT_ID}:${PAYPAL_CLIENT_SECRET}`).toString("base64");
  const response = await fetch(`${PAYPAL_API}/v1/oauth2/token`, {
    method: "POST",
    body: "grant_type=client_credentials",
    headers: {
      Authorization: `Basic ${auth}`,
      'Content-Type': 'application/x-www-form-urlencoded'
    },
  });
  if (!response.ok) {
    throw new Error(`Échec de la récupération du token d'accès PayPal: ${response.statusText}`);
  }
  const data = await response.json();
  return data.access_token;
};

const handleResponse = async (response) => {
  const text = await response.text();
  if (!text) {
    return { error: "Réponse vide", httpStatusCode: response.status };
  }
  try {
    return { jsonResponse: JSON.parse(text), httpStatusCode: response.status };
  } catch (err) {
    console.error("Échec du parsing JSON:", text);
    return { error: "Réponse JSON invalide", details: text, httpStatusCode: response.status };
  }
};

// Function to create an order
const createOrder = async (cart) => {
  const accessToken = await generateAccessToken();

  const items = cart.map(item => ({
    name: item.name,
    unit_amount: {
      currency_code: 'EUR',
      value: item.unit_amount.value,
    },
    quantity: item.quantity,
  }));

  const totalValue = cart
    .reduce((acc, item) => acc + parseFloat(item.unit_amount.value) * item.quantity, 0)
    .toFixed(2);

  const orderPayload = {
    intent: 'CAPTURE',
    purchase_units: [{
      amount: {
        currency_code: 'EUR',
        value: totalValue,
        breakdown: {
          item_total: {
            currency_code: 'EUR',
            value: totalValue,
          },
        },
      },
      items: items,
    }],
  };

  const orderResponse = await fetch(`${PAYPAL_API}/v2/checkout/orders`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify(orderPayload),
  });

  if (!orderResponse.ok) {
    const errorData = await orderResponse.json();
    throw new Error(errorData.error || "Échec de la création de la commande PayPal");
  }

  return await orderResponse.json();
};

// Function to capture the order
const captureOrder = async (orderID) => {
  const accessToken = await generateAccessToken();
  const url = `${PAYPAL_API}/v2/checkout/orders/${orderID}/capture`;

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
  });

  const { jsonResponse, httpStatusCode } = await handleResponse(response);

  if (httpStatusCode !== 201) {
    throw new Error(`Échec de la capture de la commande: ${jsonResponse.error || JSON.stringify(jsonResponse)}`);
  }

  return jsonResponse;
};


// PayPal routes
app.post('/api/orders', async (req, res) => {
  try {
    const { cart } = req.body;
    const order = await createOrder(cart);
    res.status(201).json(order);
  } catch (error) {
    console.error('Erreur de commande :', error);
    res.status(500).json({ error: 'Erreur lors de la création de la commande.' });
  }
});

// Capturer une commande PayPal
app.post('/api/orders/:orderID/capture', async (req, res) => {
  try {
    const { orderID } = req.params;
    const { email, name, cartItems } = req.body;

    const order = await captureOrder(orderID);

    // Envoi de l'e-mail après capture
    await sendEmail({ email, name, cartItems, orderData: order });

    res.status(201).json(order);
  } catch (error) {
    console.error('Erreur de capture :', error);
    res.status(500).json({ error: 'Erreur lors de la capture.' });
  }
});

app.post('/api/send-email', async (req, res) => {
  const { to, subject, text } = req.body;

  // Validation des données
  if (!to || !subject || !text) {
    return res.status(400).json({ error: 'Tous les champs sont requis.' });
  }

  try {
    await sendGenericEmail(to, subject, text);
    res.status(200).json({ message: 'E-mail envoyé avec succès.' });
  } catch (error) {
    console.error('Erreur lors de l\'envoi de l\'e-mail:', error);
    res.status(500).json({ error: 'Erreur lors de l\'envoi de l\'e-mail.' });
  }
});

// Route pour les images
app.use('/api/images', express.static(path.join(__dirname, 'upload/images'), {
  setHeaders: (res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
  },
}));

// Vérifiez la connexion à la base de données
pool.connect((err, client, release) => {
  if (err) {
    return console.error('Erreur lors de la connexion à la base de données', err);
  }
  console.log('Connecté à la base de données PostgreSQL');
  release();
});

// Configuration du stockage des images
const storage = multer.diskStorage({
  destination: path.join(__dirname, 'upload/images'), // Chemin relatif
  filename: (req, file, cb) => {
    cb(null, `${file.fieldname}_${Date.now()}${path.extname(file.originalname)}`);
  }
});
const upload = multer({ storage: storage });

app.post("/api/upload", upload.single('product'), (req, res) => {
  res.json({
    success: 1,
    image_url: `/images/${req.file.filename}`
  });
});

// Après avoir vérifié le token JWT
app.use(async (req, res, next) => {
  if (req.user && req.user.id) {
    try {
      await pool.query('UPDATE users SET last_active = NOW() WHERE id = $1', [req.user.id]);
    } catch (err) {
      console.error('Erreur lors de la mise à jour de last_active:', err.message);
    }
  }
  next();
});



// Route de connexion
app.post('/api/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // Trouver l'utilisateur par email
    const userResult = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    if (userResult.rows.length === 0) {
      return res.status(400).json({ success: false, errors: "Email/Mot de passe incorrect" });
    }
    
    const user = userResult.rows[0];
    
    // Comparer les mots de passe
    if (password !== user.password) {
      return res.status(400).json({ success: false, errors: "Email/Mot de passe incorrect" });
    }
    
    // Générer le token JWT
    const token = jwt.sign({ user: { id: user.id } }, 'secret_ecom');
    res.json({ success: true, token });
  } catch (error) {
    console.error(error.message);
    res.status(500).send("Erreur du serveur");
  }
});


// Route d'inscription
app.post('/api/signup', async (req, res) => {
  try {
    const { username, email, password } = req.body;
    
    // Vérifier si l'utilisateur existe déjà
    const existingUser = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    if (existingUser.rows.length > 0) {
      return res.status(400).json({ success: false, errors: "Utilisateur existant avec cet email" });
    }
    
    // Initialiser le panier
    let cart = {};
    for (let i = 0; i < 300; i++) {
      cart[i] = 0;
    }
    
    // Insérer le nouvel utilisateur
    const newUser = await pool.query(
      'INSERT INTO users (name, email, password, cart_data) VALUES ($1, $2, $3, $4) RETURNING *',
      [username, email, password, JSON.stringify(cart)]
    );
    
    const user = newUser.rows[0];
    
    // Générer le token JWT
    const token = jwt.sign({ user: { id: user.id } }, 'secret_ecom');
    res.json({ success: true, token });
  } catch (error) {
    console.error(error.message);
    res.status(500).send("Erreur du serveur");
  }
});


// Récupérer tous les produits
app.get("/api/allproducts", async (req, res) => {
  try {
    const products = await pool.query('SELECT * FROM products');
    res.json(products.rows);
  } catch (error) {
    console.error(error.message);
    res.status(500).send("Erreur du serveur");
  }
});


// Récupérer les dernières collections
app.get("/api/newcollections", async (req, res) => {
  try {
    const products = await pool.query('SELECT * FROM products ORDER BY date DESC LIMIT 8');
    console.log("Nouvelles collections");
    res.json(products.rows);
  } catch (error) {
    console.error(error.message);
    res.status(500).send("Erreur du serveur");
  }
});


// Récupérer les produits populaires pour les femmes
app.get("/api/popularinwomen", async (req, res) => {
  try {
    const products = await pool.query('SELECT * FROM products WHERE category = $1 LIMIT 4', ['women']);
    console.log("Produits populaires pour femmes");
    res.json(products.rows);
  } catch (error) {
    console.error(error.message);
    res.status(500).send("Erreur du serveur");
  }
});

// Récupérer des produits liés
app.post("/api/relatedproducts", async (req, res) => {
  try {
    const { category } = req.body;
    const products = await pool.query('SELECT * FROM products WHERE category = $1 LIMIT 4', [category]);
    console.log("Produits liés");
    res.json(products.rows);
  } catch (error) {
    console.error(error.message);
    res.status(500).send("Erreur du serveur");
  }
});


// Ajouter GET http://localhost:8888/api/images/product_1731168221559.png net::ERR_BLOCKED_BY_RESPONSE.NotSameOrigin 404 (Not Found) un produit au panier
app.post('/api/addtocart', fetchuser, async (req, res) => {
  try {
    const userId = req.user.id;
    const { itemId } = req.body;
    
    // Récupérer l'utilisateur
    const userResult = await pool.query('SELECT cart_data FROM users WHERE id = $1', [userId]);
    if (userResult.rows.length === 0) {
      return res.status(404).json({ success: false, errors: "Utilisateur non trouvé" });
    }
    
    let cartData = userResult.rows[0].cart_data;
    cartData[itemId] = (cartData[itemId] || 0) + 1;
    
    // Mettre à jour le panier
    await pool.query('UPDATE users SET cart_data = $1 WHERE id = $2', [JSON.stringify(cartData), userId]);
    
    console.log("Produit ajouté au panier");
    res.json({ success: true, message: "Produit ajouté au panier" });
  } catch (error) {
    console.error(error.message);
    res.status(500).send("Erreur du serveur");
  }
});

// Retirer un produit du panier
app.post('/api/removefromcart', fetchuser, async (req, res) => {
  try {
    const userId = req.user.id;
    const { itemId } = req.body;
    
    // Récupérer l'utilisateur
    const userResult = await pool.query('SELECT cart_data FROM users WHERE id = $1', [userId]);
    if (userResult.rows.length === 0) {
      return res.status(404).json({ success: false, errors: "Utilisateur non trouvé" });
    }
    
    let cartData = userResult.rows[0].cart_data;
    if (cartData[itemId] && cartData[itemId] > 0) {
      cartData[itemId] -= 1;
    }
    
    // Mettre à jour le panier
    await pool.query('UPDATE users SET cart_data = $1 WHERE id = $2', [JSON.stringify(cartData), userId]);
    
    console.log("Produit retiré du panier");
    res.json({ success: true, message: "Produit retiré du panier" });
  } catch (error) {
    console.error(error.message);
    res.status(500).send("Erreur du serveur");
  }
});


// Obtenir les données du panier
app.post('/api/getcart', fetchuser, async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Récupérer le panier
    const userResult = await pool.query('SELECT cart_data FROM users WHERE id = $1', [userId]);
    if (userResult.rows.length === 0) {
      return res.status(404).json({ success: false, errors: "Utilisateur non trouvé" });
    }
    
    res.json(userResult.rows[0].cart_data);
  } catch (error) {
    console.error(error.message);
    res.status(500).send("Erreur du serveur");
  }
});


// Ajouter un produit
app.post("/api/addproduct", async (req, res) => {
  try {
    const { name, description, image, category, new_price, old_price } = req.body;
    
    const newProduct = await pool.query(
      'INSERT INTO products (name, description, image, category, new_price, old_price) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
      [name, description, image, category, new_price, old_price]
    );
    
    console.log("Produit ajouté");
    res.json({ success: true, product: newProduct.rows[0] });
  } catch (error) {
    console.error("Erreur lors de l'ajout du produit:", error.message);
    res.status(500).json({ message: "Erreur du serveur", error: error.message });
  }
});


// Supprimer un produit
app.post("/api/removeproduct", async (req, res) => {
  try {
    const { id } = req.body;
    
    // Supprimer le produit
    await pool.query('DELETE FROM products WHERE id = $1', [id]);
    
    console.log("Produit supprimé");
    res.json({ success: true, message: "Produit supprimé" });
  } catch (error) {
    console.error(error.message);
    res.status(500).send("Erreur du serveur");
  }
});

app.get("/api/getproducts", async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM products');
    res.send(result.rows);
  } catch (error) {
    console.error("Erreur lors de la récupération des produits", error);
    res.status(500).send("Erreur serveur");
  }
});

app.get("/api/getproduct/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('SELECT * FROM products WHERE id = $1', [id]);
    const product = result.rows[0];
    res.send(product);
  } catch (error) {
    console.error("Erreur lors de la récupération du produit", error);
    res.status(500).send("Erreur serveur");
  }
});

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Erreur du serveur', error: err.message });
});



app.get('/api/active-users', async (req, res) => {
  try {
    const result = await pool.query('SELECT timestamp, user_count FROM active_users ORDER BY timestamp');
    res.json(result.rows);
  } catch (error) {
    console.error('Erreur lors de la récupération des utilisateurs actifs', error);
    res.status(500).send('Erreur du serveur');
  }
});


// Endpoint pour récupérer le nombre de comptes créés
app.get('/api/NumberOfAccountsCreated', async (req, res) => {
  try {
    const aggregated = await pool.query(`
      SELECT signup_date, user_count
      FROM daily_user_counts
      ORDER BY signup_date;
    `);

    console.log('Données agrégées:', aggregated.rows);
    res.json(aggregated.rows);
  } catch (error) {
    console.error('Erreur lors de la récupération:', error);
    res.status(500).send('Erreur du serveur');
  }
});

cron.schedule('*/1 * * * *', async () => { // Tous les jours à minuit
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const currentDate = new Date().toISOString().split('T')[0]; // Format 'YYYY-MM-DD'

    console.log(`Tentative de mise à jour de daily_user_counts pour la date ${currentDate}`);

    // Compter les nouveaux utilisateurs créés aujourd'hui
    const result = await client.query(`
      SELECT COUNT(*) AS user_count
      FROM users
      WHERE DATE(date) = $1;
    `, [currentDate]);

    let user_count = parseInt(result.rows[0].user_count, 10);

    console.log(`Nombre de comptes créés le ${currentDate}: ${user_count}`);

    // Validation
    if (user_count < 0) {
      throw new Error('Le nombre de comptes ne peut pas être négatif');
    }

    // Mettre à jour ou insérer dans daily_user_counts
    await client.query(`
      INSERT INTO daily_user_counts (signup_date, user_count)
      VALUES ($1, $2)
      ON CONFLICT (signup_date)
      DO UPDATE SET user_count = EXCLUDED.user_count;
    `, [currentDate, user_count]);

    await client.query('COMMIT');

    console.log(`daily_user_counts mis à jour pour la date ${currentDate} avec user_count=${user_count}`);
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Erreur lors de la mise à jour de daily_user_counts:', error);
  } finally {
    client.release();
  }
});


app.get('/api/cart-stats', async (req, res) => {
  try {
    const soldItemsResult = await pool.query('SELECT COUNT(*) FROM orders');
    const cartItemsResult = await pool.query("SELECT COUNT(*) FROM carts WHERE status = 'pending'");
    res.json({
      soldItems: parseInt(soldItemsResult.rows[0].count),
      cartItems: parseInt(cartItemsResult.rows[0].count),
    });
  } catch (error) {
    console.error('Erreur lors de la récupération des statistiques de panier', error);
    res.status(500).send('Erreur du serveur');
  }
});

app.get('/api/revenue', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT order_date, SUM(total_amount) AS revenue
      FROM orders
      GROUP BY order_date
      ORDER BY order_date
    `);
    res.json(result.rows);
  } catch (error) {
    console.error('Erreur lors de la récupération du chiffre d\'affaires', error);
    res.status(500).send('Erreur du serveur');
  }
});

app.get('/api/revenue-by-category', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT order_date, category, SUM(total_amount) AS revenue
      FROM orders
      GROUP BY order_date, category
      ORDER BY order_date
    `);
    res.json(result.rows);
  } catch (error) {
    console.error('Erreur lors de la récupération du chiffre d\'affaires par catégorie', error);
    res.status(500).send('Erreur du serveur');
  }
});




//------------------------------------------------------------------------------------------------------------
//Fini Fonctionelle
app.get('/api/visits', async (req, res) => {
  try {
    const result = await pool.query('SELECT visit_date, visit_count FROM visits ORDER BY visit_date');
    res.json(result.rows);
  } catch (error) {
    console.error('Erreur lors de la récupération des visites', error);
    res.status(500).send('Erreur du serveur');
  }
});
cron.schedule('*/1 * * * *', async () => {
  try {
    // Compter les visiteurs uniques dans les 30 dernières minutes
    const result = await pool.query(`
      SELECT COUNT(DISTINCT ip_address) AS visit_count 
      FROM visits_log 
      WHERE visit_date = CURRENT_DATE
    `);
    const visitCount = parseInt(result.rows[0].visit_count);
    
    console.log(`Nombre de visites uniques aujourd'hui : ${visitCount}`);
    
    // Insérer les données dans la table `visits`
    await pool.query(`
      INSERT INTO visits (visit_date, visit_count) VALUES (CURRENT_DATE, $1)
      ON CONFLICT (visit_date) 
      DO UPDATE SET visit_count = EXCLUDED.visit_count
    `, [visitCount]);

    console.log(`Tâche cron: ${visitCount} visites enregistrées à ${new Date()}`);
  } catch (error) {
    console.error('Erreur lors de l\'enregistrement des visites:', error.message);
  }
});
//Recuperation de IP de l'utilisateur
app.use(async (req, res, next) => {

  const ipAddress = req.ip;

  try {
    await pool.query(`
      INSERT INTO visits_log (ip_address, visit_date, timestamp) 
      VALUES ($1, CURRENT_DATE, NOW())
      ON CONFLICT (ip_address, visit_date)
      DO NOTHING
    `, [ipAddress]);

    console.log(`Adresse IP du visiteur : ${ipAddress}`);
    console.log('Visite enregistrée avec succès');
  } catch (error) {
    console.error('Erreur lors de l\'insertion de l\'IP:', error.message);
  }
  
  next();
});
//------------------------------------------------------------------------------------------------------------

app.use('/api/email', emailRoutes);


app.post('/api/cart/update', async (req, res) => {
  const { productId, action } = req.body;
  const userId = req.user.id; // Assurez-vous que l'utilisateur est authentifié
  let cartId;

  try {
    // Récupérer le panier de l'utilisateur
    const cartResult = await pool.query('SELECT id FROM carts WHERE user_id = $1 AND status = $2', [userId, 'pending']);
    if (cartResult.rows.length > 0) {
      cartId = cartResult.rows[0].id;
    } else {
      // Créer un nouveau panier si aucun n'existe
      const newCart = await pool.query('INSERT INTO carts (user_id, status) VALUES ($1, $2) RETURNING id', [userId, 'pending']);
      cartId = newCart.rows[0].id;
    }

    // Mise à jour des articles du panier selon l'action
    if (action === 'remove') {
      await pool.query('DELETE FROM cart_items WHERE cart_id = $1 AND product_id = $2', [cartId, productId]);
    } else if (action === 'add') {
      await pool.query('INSERT INTO cart_items (cart_id, product_id, quantity) VALUES ($1, $2, 1) ON CONFLICT (cart_id, product_id) DO UPDATE SET quantity = cart_items.quantity + 1', [cartId, productId]);
    }

    // Mettre à jour le champ `updated_at` du panier
    await pool.query('UPDATE carts SET updated_at = NOW() WHERE id = $1', [cartId]);

    res.status(200).json({ message: 'Panier mis à jour' });
  } catch (error) {
    console.error('Erreur lors de la mise à jour du panier:', error);
    res.status(500).json({ error: 'Erreur du serveur' });
  }
});


// ROOT API Route For Testing
app.get("/api/", (req, res) => {
  res.send("Root");
});

// Servir les fichiers statiques du frontend commercial
app.use(express.static(path.join(__dirname, '../dist')))

// Servir les fichiers statiques du frontend admin
app.use(express.static(path.join(__dirname, '../admin', 'dist')));

// Gérer le routage côté client pour admin (SPA)
app.get('/admin/', (req, res) => {
  res.sendFile(path.join(__dirname, '../admin', 'dist', 'index.html'));
});

// Gérer le routage côté client (SPA)
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../dist', 'index.html'));
});

// Gestion des erreurs
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send('Erreur du serveur');
});

const port = process.env.PORT_API || 8888;
const host = '0.0.0.0';

// Démarrer le serveur
app.listen(port, host, () => {
  console.log(`Serveur en cours d'exécution sur le port ${process.env.PORT_API || 8888}`);
  console.log('Initialisation du serveur...');
});
