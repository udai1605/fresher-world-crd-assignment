const express = require('express');
const fs = require('fs');
const app = express();
const sizeof = require('./objectSize')
app.use(express.json());   //to parse request



app.get('/', (req, res) => {
    res.send('Working');
})

// To post the UserProfile to the JSON Store
app.post('/add', (req, res) => {
    const storedData = readData();
    const currentData = req.body;
    const key = currentData.username;
    const now = new Date();
    const JsonSize = sizeof(readData());
    const value = {
        name: currentData.name,
        age: currentData.age,
        password: currentData.password,
        email: currentData.email,
        expiry: now.getTime() + 36000   // Giving time to live as 6minutes
    };

    // to check if all the details are provided or not
    if (currentData.name == null || currentData.age == null || currentData.password == null || currentData.username == null || currentData.email == null) {
        return res.status(401).send({ error: true, msg: 'Give full details' })
    }

    // to check if the key is greater than 32chars
    if (currentData.username.length > 32) {
        return res.status(401).send({ error: true, msg: 'the username must not exceed 32 characters' })
    }

    // to check if value is greater than 16KB
    if (sizeof(key) > 16) {
        return res.status(401).send({ error: true, msg: 'The value must not be greater than 16KB' })
    }
    const alreadyExiting = (storedData.find((user) => Object.keys(user)[0] === currentData.username))
    if (alreadyExiting) {
        return res.status(401).send({ error: true, msg: 'user already exists' })
    }

    //to check if the JSON File exceeds 1GB
    if (JsonSize > 1073741824) {
        return res.status(401).send({ error: true, msg: 'The Json file exceeds 1GB' })
    }

    storedData.push({ [key]: value });
    storeData(storedData)
    res.send({ success: true, msg: 'User stored successfully' })
})

// To get the Required User from the JSON Store
app.get('/users/:user', (req, res) => {
    const users = readData()
    const reqUser = req.params.user
    const foundUser = (users.find((user) => Object.keys(user)[0] === reqUser))

    if (foundUser) {
        key = Object.keys(foundUser)[0]
        const now = new Date();
        if (now.getTime() > foundUser[key].expiry) {
            const deleteUser = users.filter((user) => Object.keys(user)[0] !== reqUser)
            storeData(deleteUser)
            res.status(409).send({ error: true, msg: 'User Account has Expired' })
        }
        delete foundUser[key].expiry
        res.send(foundUser[key])
    } else {
        res.status(404).send({ error: true, msg: 'User not found in the database' })
    }

})

// To delete the mentioned User from the JSON Store
app.delete('/delete/:username', (req, res) => {
    const username = req.params.username
    const existingUsers = readData()
    const requiredUser = existingUsers.filter((user) => Object.keys(user)[0] !== username)   //to find the user in the json file

    if (existingUsers.length === requiredUser.length) {
        res.status(409).send({ error: true, msg: 'User not found' })
    }
    storeData(requiredUser)
    res.send({ success: true, msg: 'User deleted' })
})

//add the new user
const storeData = (data) => {
    const stringifyData = JSON.stringify(data)
    fs.writeFileSync('data.json', stringifyData)
}

//get the user data from JSON Store
const readData = () => {
    const jsonData = fs.readFileSync('data.json')
    return JSON.parse(jsonData)
}


app.listen(5000, () => {
    console.log('Server listening on port 5000')
})