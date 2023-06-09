const mongoose = require('mongoose')

const personSchema = new mongoose.Schema({
  name: {
    type: String,
    minLength: 3,
    required: true
  },
  number: {
    type: String,
    validate: {
      validator: function (v) {
        return /^(\d{2}-\d{6}|\d{3}-\d{5,})$/.test(v)
      },
      message: props => `${props.value} is not a valid phone number! The requirement is number have length of 8 or more, and it must be formed of two parts that are separated by -, the first part has two or three numbers and the second part also consists of numbers`
    },
    required: [true, 'User phone number required']
  }
})

personSchema.set('toJSON', {
  transform: (document, returnedObject) => {
    returnedObject.id = returnedObject._id.toString()
    delete returnedObject._id
    delete returnedObject.__v
  }
})

module.exports = mongoose.model('Person', personSchema)


