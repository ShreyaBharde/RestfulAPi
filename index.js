const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const helmet = require('helmet');

require('dotenv').config(); // For loading environment variables

const port = process.env.PORT || 8084;
const mongoURI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/imagescruds';

const app = express();

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static('uploads'));

// MongoDB connection
mongoose.connect(mongoURI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const db = mongoose.connection;
db.once('open', () => {
  console.log('Database connected');
});

// Multer storage configuration
const storage = multer.diskStorage({
  destination: './uploads',
  filename: (req, file, cb) => {
    cb(null, file.fieldname + '-' + Date.now() + path.extname(file.originalname));
  },
});
const upload = multer({ storage: storage });

// Data Model
const dataschema = new mongoose.Schema({
  name: String,
  email: String,
  contact: String,
  address: String,
  imageurl: String,
});

const datamodel = mongoose.model('details', dataschema);

// Routes
// GET all data
app.get('/api/imgcrud', async (req, res) => {
  try {
    const data = await datamodel.find();
    res.json(data).status(200);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// GET data by ID
app.get('/api/imgcrud/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const data = await datamodel.findById(id);
    if (!data) {
      return res.status(404).json({ message: 'Data not found' });
    }
    res.json(data).status(200);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// POST new data
app.post('/api/imgcrud', upload.single('image'), async (req, res) => {
  const { name, email, contact, address } = req.body;
  const image = req.file;
  try {
    const newItem = new datamodel({
      name,
      email,
      contact,
      address,
      imageurl: image ? `/uploads/${image.filename}` : '',
    });
    await newItem.save();
    res.json(newItem).status(201);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// PUT update data by ID
app.put('/api/imgcrud/:id', upload.single('image'), async (req, res) => {
  const { name, email, contact, address } = req.body;
  const { id } = req.params;
  const image = req.file ? `/uploads/${req.file.filename}` : undefined;
  try {
    let data = await datamodel.findById(id);
    if (!data) {
      return res.status(404).json({ message: 'Data not found' });
    }
    data.name = name;
    data.email = email;
    data.contact = contact;
    data.address = address;
    if (image) {
      data.imageurl = image;
    }
    await data.save();
    res.json(data).status(200);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// DELETE data by ID
app.delete('/api/imgcrud/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const item = await datamodel.findById(id);
    if (!item) {
      return res.status(404).json({ message: 'Data not found' });
    }
    await item.deleteOne({ _id: id });
    res.json({ message: 'Data deleted' }).status(200);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

app.listen(port, () => {
  console.log(`Server started on port ${port}`);
});
