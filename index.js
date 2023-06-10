const express = require('express')
const app = express()
const morgan = require('morgan');
const path = require('path');
const cors = require('cors')

app.use(cors())

app.use(morgan('tiny'));

// Token for logging person data
morgan.token('person', (req) => {
  if (req.method === 'POST') {
    return JSON.stringify(req.body);
  }
  return '';
});
app.use(morgan(':method :url :status :res[content-length] - :response-time ms :person'));
app.use(express.json());

let persons = [
        {
        "id": 1,
        "name": "Arto Hellas",
        "number": "040-123456"
        },
        {
        "id": 2,
        "name": "Ada Lovelace",
        "number": "39-44-5323523"
        },
        {
        "id": 3,
        "name": "Dan Abramov",
        "number": "12-43-234345"
        },
        {
        "id": 4,
        "name": "Mary Poppendieck",
        "number": "39-23-6423122"
        }
]

app.use(express.static('build'))
// app.use(express.static(path.join(__dirname, 'build')));

// app.use(express.static(path.join(__dirname, 'build')));

// app.get('/*', function(req,res) {
//   res.sendFile(path.join(__dirname, 'build', 'index.html'));
// });

app.get('/api/persons', (req, res) => {
  res.json(persons)
})

// app.get('/', (req, res) => {
//   res.sendFile(__dirname + '/build/index.html');
// });

app.get('/info', (req, res) => {
    const entryCount = persons.length
    const currentTime = new Date()
    const htmlContent = `
    <div>
      <p>Phone book has info for ${entryCount} people</p>
      <p>${currentTime}</p>
    </div>
    `
    res.send(htmlContent)
  })

app.get('/api/persons/:id', (req, res) => {
    const id = Number(req.params.id)
    const person = persons.find(p => p.id === id)
  
    if (person) {
      res.json(person)
    } else {
      res.status(404).end()
    }
  
  })

  app.delete('/api/persons/:id', (req, res) => {
    const id = Number(req.params.id)
    persons = persons.filter(p => p.id !== id)
  
    res.status(204).end()
  })

const generateId = () => {
  const maxId = persons.length > 0
    ? Math.max(...persons.map(p => p.id))
    : 0
  return maxId + 1
}

app.post('/api/persons', (req, res) => {
  const body = req.body
  if (!body.name || !body.number) {
    return res.status(400).json({ 
      error: 'name or number missing' 
    })
  }

  const existingPerson = persons.find(p => p.name === body.name)

  if (existingPerson) {
    return res.status(400).json({
        error: { error: 'Name must be unique' }
    })
  }

  const person = {
    id: generateId(),
    name: body.name,
    number: body.number,
  }

  persons = persons.concat(person)
  res.json(person)
})

const PORT = process.env.PORT || 3001
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
})