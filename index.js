if (process.env.NODE_ENV !== 'production') {
  require('dotenv').config()
}
const express = require('express');
const bodyParser = require('body-parser')
// const morgan = require('morgan');
const cors = require('cors');
const Person = require('./models/person');
const { count } = require('console');
const person = require('./models/person');

const app = express();

const requestLogger = (request, response, next) => {
  console.log('Method:', request.method);
  console.log('Path:  ', request.path);
  console.log('Body:  ', request.body);
  console.log('---');
  next();
};

// Middleware
app.use(cors());
// app.use(morgan(':method :url :status :res[content-length] - :response-time ms :person'));
app.use(express.static('build'))
app.use(bodyParser.json())
// app.use(express.json());
// app.use(morgan('tiny'));

app.use(requestLogger);

// Routes

app.get('/api/persons', (req, res) => {
  Person.find({}).then((persons) => {
    res.json(persons.map(person => person.toJSON()))
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
        res.json(person.toJSON);
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
      res.json(savedPerson.toJSON);
    })
    .catch((error) => next(error))
})

app.put('/api/persons/:id', (req, res, next) => {
  const id = req.params.id;
  const { name, number } = req.body;
  Person.findByIdAndUpdate(id, { name, number }, { new: true, runValidators: true, context: 'query' })
    .then((updatedPerson) => {
      res.json(updatedPerson.toJSON);
    })
    .catch((error) => next(error))
})


// // Token for logging person data
// morgan.token('person', (req) => {
//   if (req.method === 'POST') {
//     return JSON.stringify(req.body);
//   }
//   return '';
// });

const unknownEndpoint = (request, response) => {
  response.status(404).send({ error: 'unknown endpoint' })
}
app.use(unknownEndpoint)

const errorHandler = (error, request, response, next) => {
  console.error(error.message)
  if (error.name === 'CastError') {
    return response.status(400).send({ error: 'malformatted id' })
  } else if (error.name === 'ValidationError') {
    return response.status(400).json({error: error.message})
  }
  next(error)
}
app.use(errorHandler)

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
