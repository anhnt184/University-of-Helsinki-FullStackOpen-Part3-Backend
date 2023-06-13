const personRouter = require('express').Router()
const Person = require('../models/person')

personRouter.get('/', (req, res) => {
  Person.find({}).then((persons) => {
    res.json(persons.map(person => person.toJSON()))
  })
})

personRouter.get('/info', (req, res, next) => {
  Person.countDocuments({})
    .then(count => {
      const currentTime = new Date()
      const htmlContent = `
        <div>
        <p>Phone book has info for ${count} people</p>
        <p>${currentTime}</p>
      </div>`
      res.send(htmlContent)
    })
    .catch(error => next(error))
})

personRouter.get('/:id', (req, res, next) => {
  const id = req.params.id
  Person.findById(id)
    .then((person) => {
      if (person) {
        res.json(person.toJSON)
      } else {
        res.status(404).end()
      }
    })
    .catch((error) => next(error))
})

personRouter.delete('/:id', (req, res, next) => {
  const id = req.params.id
  Person.findByIdAndRemove(id)
    .then(() => {
      res.status(204).end()
    })
    .catch((error) => next(error))
})

personRouter.post('/', (req, res, next) => {
  const { name, number } = req.body
  if (!name || !number) {
    return res.status(400).json({
      error: 'Name or number missing',
    })
  }
  // Create new person
  const newPerson = new Person({
    name: name,
    number: number,
  })

  newPerson.save()
    .then((savedPerson) => {
      res.json(savedPerson.toJSON)
    })
    .catch((error) => next(error))
})

personRouter.put('/:id', (req, res, next) => {
  const id = req.params.id
  const { name, number } = req.body
  Person.findByIdAndUpdate(id, { name, number }, { new: true, runValidators: true, context: 'query' })
    .then((updatedPerson) => {
      res.json(updatedPerson.toJSON)
    })
    .catch((error) => next(error))
})

module.exports = personRouter