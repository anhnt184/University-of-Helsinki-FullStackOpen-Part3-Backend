require('dotenv').config();
const express = require('express');
const morgan = require('morgan');
const path = require('path');
const cors = require('cors');
const mongoose = require('mongoose');
const Person = require('./models/person');
const { count } = require('console');

const app = express();

// Middleware
app.use(cors());
app.use(morgan(':method :url :status :res[content-length] - :response-time ms :person'));
app.use(express.static('build'))
app.use(express.json());
app.use(morgan('tiny'));
// app.use(express.static(path.join(__dirname, 'build')));

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
  Person.countDocuments({})
    .then(count => {
      const currentTime = new Date();
      const htmlContent = `
      <div>
      <p>Phone book has info for ${count} people</p>
      <p>${currentTime}</p>
    </div>
  `;
      res.send(htmlContent);
    })
    .catch(error => next(error))
})

app.get('/api/persons/:id', (req, res, next) => {
  const id = req.params.id;
  Person.findById(id)
    .then((person) => {
      if (person) {
        res.json(person);
      } else {
        res.status(404).end();
      }
    })
    .catch((error) => next(error))
})

app.delete('/api/persons/:id', (req, res, next) => {
  const id = req.params.id;
  Person.findByIdAndRemove(id)
    .then((result) => {
      res.status(204).end()
    })
    .catch((error) => next(error))
})

app.post('/api/persons', (req, res, next) => {
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
    .catch((error) => next(error))
})

app.put('/api/persons/:id', (req, res, next) => {
  const id = req.params.id;
  const { name, number } = req.body;
  Person.findByIdAndUpdate(id, { name, number }, { new: true })
    .then((updatedPerson) => {
      console.log(`Updated ${updatedPerson.name} number ${updatedPerson.number} in phonebook`);
      res.json(updatedPerson);
    })
    .catch((error) => next(error))
})

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

const unknownEndpoint = (request, response) => {
  response.status(404).send({ error: 'unknown endpoint' })
}
app.use(unknownEndpoint)

const errorHandler = (error, request, response, next) => {
  console.error(error.message)

  if (error.name === 'CastError') {
    return response.status(400).send({ error: 'malformatted id' })
  }

  next(error)
}
app.use(errorHandler)

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
