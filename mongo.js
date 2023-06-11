const mongoose = require('mongoose')

const password = process.argv[2]

const url =
  `mongodb+srv://anhntvn:${password}@atncluster.knqhy0n.mongodb.net/phonebookApp?retryWrites=true&w=majority`
mongoose.set('strictQuery',false)
mongoose.connect(url).then(() => {
    console.log('Connected to MongoDB');
}
)
.catch((error) => {
    console.log('Error connecting to MongoDB: ', error.message);
}
)

const personSchema = new mongoose.Schema({
    name: String,
    number: String,
})

const Person = mongoose.model('Person', personSchema)

if (process.argv.length === 5) {
    const name = process.argv[3];
    const number = process.argv[4];
  
    const person = new Person({
      name,
      number,
    });
    person.save().then(() => {
        console.log(`added ${name} number ${number} to phonebook`);
        mongoose.connection.close();
      });
    } else if (process.argv.length === 3) {
      Person.find({}).then((persons) => {
        console.log('phonebook:');
        persons.forEach((person) => {
          console.log(`${person.name} ${person.number}`);
        });
        mongoose.connection.close();
      });
    } else {
      console.log('Invalid command-line arguments.');
      mongoose.connection.close();
    }