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


const { Pool } = pkg;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);


const app = express();


app.use(express.json());

const corsOptions = {
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
};
app.use(cors(corsOptions));
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));

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

console.log('PGUSER:', process.env.PGUSER);
console.log('PGHOST:', process.env.PGHOST);
console.log('PGDATABASE:', process.env.PGDATABASE);
console.log('PGPASSWORD:', process.env.PGPASSWORD);
console.log('PGPORT:', process.env.PGPORT);

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

// Middleware pour vérifier le token
const fetchuser = async (req, res, next) => {
  const token = req.header("auth-token");
  if (!token) {
    return res.status(401).send({ errors: "Veuillez vous authentifier avec un token valide" });
  }
  try {
    const data = jwt.verify(token, "secret_ecom");
    req.user = data.user;
    next();
  } catch {
    res.status(401).send({ errors: "Token invalide" });
  }
};

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

// ROOT API Route For Testing
app.get("/api/", (req, res) => {
  res.send("Root");
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
    console.log("Tous les produits");
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
    console.log('Requête SQL :', 'SELECT * FROM Product');
    console.log('Valeurs :', []);
    const result = await pool.query('SELECT * FROM Product', []);
    res.send(result.rows);
  } catch (error) {
    console.error("Erreur lors de la récupération des produits", error);
    res.status(500).send("Erreur serveur");
  }
});

app.get("/api/getproduct/:id", async (req, res) => {
  try {
    const { id } = req.params;
    console.log('Requête SQL :', 'SELECT * FROM Product WHERE id = $1');
    console.log('Valeurs :', [id]);
    console.log('Type de id :', typeof id);
    const result = await pool.query('SELECT * FROM Product WHERE id = $1', [id]);
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

app.get('/api/visits', async (req, res) => {
  try {
    const result = await pool.query('SELECT visit_date, visit_count FROM visits ORDER BY visit_date');
    res.json(result.rows);
  } catch (error) {
    console.error('Erreur lors de la récupération des visites', error);
    res.status(500).send('Erreur du serveur');
  }
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

//cron.schedule('0 */2 * * *', async () => {
cron.schedule('*/1 * * * *', async () => {

  try {
    // Récupérer le nombre d'utilisateurs actifs dans les 2 dernières heures
    const result = await pool.query(`
      SELECT COUNT(*) AS user_count FROM users WHERE last_active >= NOW() - INTERVAL '2 HOURS'
    `);
    const userCount = parseInt(result.rows[0].user_count);

    // Insérer les données dans la table `active_users`
    await pool.query(`
      INSERT INTO active_users (timestamp, user_count) VALUES (NOW(), $1)
    `, [userCount]);

    console.log(`Tâche cron: ${userCount} utilisateurs actifs enregistrés à ${new Date()}`);
  } catch (error) {
    console.error('Erreur lors de l\'enregistrement des utilisateurs actifs:', error.message);
  }
});

cron.schedule('*/1 * * * *', async () => {
  try {
    // Compter les visiteurs uniques dans les 30 dernières minutes
    const result = await pool.query(`
      SELECT COUNT(DISTINCT ip_address) AS visit_count FROM visits_log WHERE timestamp >= NOW() - INTERVAL '30 MINUTES'
    `);
    const visitCount = parseInt(result.rows[0].visit_count);

    // Insérer les données dans la table `visits`
    await pool.query(`
      INSERT INTO visits (visit_date, visit_count) VALUES (NOW(), $1)
    `, [visitCount]);

    console.log(`Tâche cron: ${visitCount} visites enregistrées à ${new Date()}`);
  } catch (error) {
    console.error('Erreur lors de l\'enregistrement des visites:', error.message);
  }
});

cron.schedule('*/1 * * * *', async () => {
  try {
    // Compter les paniers en attente
    const pendingCartsResult = await pool.query(`
      SELECT COUNT(*) AS pending_count FROM carts WHERE status = 'pending'
    `);
    const pendingCount = parseInt(pendingCartsResult.rows[0].pending_count);

    // Compter les paniers finalisés dans les 30 dernières minutes
    const completedCartsResult = await pool.query(`
      SELECT COUNT(*) AS completed_count FROM carts WHERE status = 'completed' AND updated_at >= NOW() - INTERVAL '30 MINUTES'
    `);
    const completedCount = parseInt(completedCartsResult.rows[0].completed_count);

    // Insérer les données dans la table `cart_stats`
    await pool.query(`
      INSERT INTO cart_stats (timestamp, pending_carts, completed_carts) VALUES (NOW(), $1, $2)
    `, [pendingCount, completedCount]);

    console.log(`Tâche cron: Paniers enregistrés à ${new Date()}`);
  } catch (error) {
    console.error('Erreur lors de l\'enregistrement des statistiques de paniers:', error.message);
  }
});

// Configure Express pour faire confiance au proxy
app.set('trust proxy', true);

//Recuperation de IP de l'utilisateur
app.use((req, res, next) => {
  const ipAddress = req.ip;
  console.log('Adresse IP du visiteur :', ipAddress);

  // Enregistrement dans la base de données
  pool.query(`
    INSERT INTO visits_log (ip_address) VALUES ($1)
  `, [ipAddress])
    .then(() => {
      console.log('Visite enregistrée avec succès');
      next();
    })
    .catch(err => {
      console.error('Erreur lors de l\'enregistrement de la visite:', err.message);
      next();
    });
});

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

// Servir les fichiers statiques de main-app
app.use(express.static(path.join(__dirname, 'dist')));

// Servir les fichiers statiques de admin-app
app.use('/admin', express.static(path.join(__dirname, 'admin', 'dist')));

// Servir l'index.html pour les routes de l'admin
app.get('/admin/*', (req, res) => {
  res.sendFile(path.join(__dirname, 'admin', 'dist', 'index.html'));
});

// Servir l'index.html pour les routes non gérées
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

const port = process.env.PORT_API || 8888;
const host = '0.0.0.0';

// Démarrer le serveur
app.listen(port, host, () => {
  console.log(`Serveur en cours d'exécution sur le port ${process.env.PORT_API || 8888}`);
  console.log('Initialisation du serveur...');
});
