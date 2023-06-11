require('dotenv').config();
const express = require('express');
const morgan = require('morgan');
const path = require('path');
const cors = require('cors');
const mongoose = require('mongoose');
const Person = require('./models/person');

const app = express();

// Middleware
app.use(cors());
app.use(morgan(':method :url :status :res[content-length] - :response-time ms :person'));
app.use(express.json());
app.use(morgan('tiny'));
app.use(express.static(path.join(__dirname, 'build')));

const requestLogger = (request, response, next) => {
  console.log('Method:', request.method);
  console.log('Path:  ', request.path);
  console.log('Body:  ', request.body);
  console.log('---');
  next();
};
app.use(requestLogger);

// Routes
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'build', 'index.html'));
});

app.get('/api/persons', (req, res) => {
  Person.find({}).then((persons) => {
    res.json(persons);
  });
});

app.get('/info', (req, res) => {
  Person.countDocuments({}, (err, count) => {
    if (err) {
      res.status(500).send({ error: 'Internal server error' });
    } else {
      const currentTime = new Date();
      const htmlContent = `
        <div>
          <p>Phone book has info for ${count} people</p>
          <p>${currentTime}</p>
        </div>
      `;
      res.send(htmlContent);
    }
  });
});

app.get('/api/persons/:id', (req, res) => {
  const id = Number(req.params.id);
  Person.findById(id)
    .then((person) => {
      if (person) {
        res.json(person);
      } else {
        res.status(404).end();
      }
    })
    .catch((error) => {
      console.log('Error fetching person from database:', error.message);
      res.status(500).send({ error: 'Internal server error' });
    });
});

app.delete('/api/persons/:id', (req, res) => {
  const id = req.params.id;
  Person.findByIdAndRemove(id)
    .then((result) => {
      if (result) {
        res.status(204).end();
      } else {
        res.status(404).end();
      }
    })
    .catch((error) => {
      console.log('Error deleting person from database:', error.message);
      res.status(500).send({ error: 'Internal server error' });
    });
});

app.post('/api/persons', (req, res) => {
  const { name, number } = req.body;
  if (!name || !number) {
    return res.status(400).json({
      error: 'Name or number missing',
    });
  }
// Create new person
const newPerson = new Person({
  name: name,
  number: number,
});

newPerson.save()
  .then((savedPerson) => {
    console.log(`Added ${savedPerson.name} number ${savedPerson.number} to phonebook`);
    res.json(savedPerson);
  })
  .catch((error) => {
    console.log('Error saving person to database:', error.message);
    res.status(500).send({ error: 'Internal server error' });
  });
});

app.put('/api/persons/:id', (req, res) => {
  const id = req.params.id;
  const { name, number } = req.body;
  Person.findByIdAndUpdate(id, { name, number }, { new: true })
    .then((updatedPerson) => {
      if (updatedPerson) {
        console.log(`Updated ${updatedPerson.name} number ${updatedPerson.number} in phonebook`);
        res.json(updatedPerson);
      } else {
        res.status(404).end();
      }
    })
    .catch((error) => {
      console.log('Error updating person in database:', error.message);
      res.status(500).send({ error: 'Internal server error' });
    });
});


const unknownEndpoint = (request, response) => {
  response.status(404).send({ error: 'unknown endpoint' })
}

// 404 Unknown Endpoint
app.use((req, res) => {
  res.status(404).send({ error: 'Unknown endpoint' });
});

// Connect to MongoDB and start the server
const url = process.env.MONGODB_URI;
console.log('connecting to', url);

// Connect to Database
mongoose.connect(url)
  .then(() => {
    console.log('connected to MongoDB');
  })
  .catch((error) => {
    console.log('error connecting to MongoDB:', error.message);
  });

// Disconnect from Database
process.on('SIGINT', () => {
  mongoose.connection.close(() => {
    console.log('MongoDB connection closed');
    process.exit(0);
  });
});
// Token for logging person data
morgan.token('person', (req) => {
  if (req.method === 'POST') {
    return JSON.stringify(req.body);
  }
  return '';
});

app.use(unknownEndpoint);

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
