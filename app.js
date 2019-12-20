const express = require('express')
const bodyParser = require('body-parser')
var Razorpay = require('razorpay')

const { mongoose } = require('./connect')
const { User } = require('./user.js')
var rzp = new Razorpay({
    key_id: 'use your key',
    key_secret: 'your secret test key'// need to change in payment.ejs
})

if (typeof localStorage === "undefined" || localStorage === null) {
    var LocalStorage = require('node-localstorage').LocalStorage;
    localStorage = new LocalStorage('./scratch');
}

const msg91sms = require('msg91-lib').msg91SMS;
const msg91SMS = new msg91sms('own auth key', 'incand', 4, 91);

var app = express()

app.set('view engine', 'ejs')
app.use(express.static('images'))
app.use(express.static('stylesheet'))


app.use(bodyParser.urlencoded({ extended: true }))

// start of get request

app.get('/register', (req, res) => {
    res.render('register',{validate:1})
})

app.get('/adminlogin', (req, res) => {
    res.render('adminlogin')
})

app.get('/payment', (req, res) => {
    name = req.query.name
    phone = req.query.phonenumber
    email = req.query.email
    
    localStorage.setItem('email', email)
    localStorage.setItem('name', name)
    localStorage.setItem('number', phone)
    res.render('payment')
    //{name:name,phonenumber:phone,email:email}
})

app.get('/success', (req, res) => {
    res.render('success', { name: localStorage.getItem("name")})
    console.log(localStorage.getItem("name"))
    localStorage.clear()
})

app.get('/admin', (req, res) => {
    res.render('admin')
})

//End of get request

//Start of post request
//to valididate email id
function fun1(req,res,next){
    var email = req.body.email
    var pos = email.indexOf('@')

    if(pos == -1)
    {
        res.render('register',{validate:0})
    }
    else{
        if(email.slice(pos+1,email.length)=="gmail.com" || email.slice(pos+1,email.length)=="yahoo.com")
        {
            next()
        }else{
            res.render('register',{validate:0})
        }
    }
}

app.post('/register',fun1, (req, res) => {
    college_id = req.body.college
    if (college_id == "1") {
        phone = req.body.number
        if (phone.length != 10) res.redirect('/register')
        else {
            new User({
                name: req.body.name,
                email: req.body.email,
                institute: "NIT Silchar",
                phonenumber: phone
            }).save().then((user) => {
                console.log(user)
                res.redirect('/success?name=' + req.body.name)
            })
        }
    } else {
        res.redirect('/payment?name=' + req.body.name + '&email=' + req.body.email + '&phonenumber='
            + req.body.number + '&institute=others')
    }

})

app.post('/adminlogin', (req, res) => {
    username = req.body.username
    password = req.body.password
    if (username == "admin" && password == "password") {
        res.redirect('/admin')
    } else {
        res.redirect('/adminlogin')
    }
})

app.post('/pay', (req, res) => {
    console.log(req.body)
    const amount = 1000
    name = localStorage.getItem('name')
    email = localStorage.getItem('email')
    phone = localStorage.getItem('number')
    console.log(localStorage.getItem("name"))
    console.log(localStorage.getItem("email"))
    console.log(localStorage.getItem("number"))

    rzp.customers.create({
        name: name,
        email: email,
        fail_existing: '0'
      }).then((data) => {
         console.log(data)
      
      rzp.orders.create({amount:amount, currency:"INR", receipt:data.id}).then((data) => {
      
        console.log("Order Details: ");
        console.log(data);
        console.log(data.id)
        var orderID = data.id;
        rzp.payments.capture(req.body.razorpay_payment_id, amount).then((data) => {
        // success
        new User({
            name: name,
            email: email,
            institute: "Others",
            phonenumber: phone
        }).save().then((user) => {
            console.log(user)
            res.redirect('/success')
        })
        console.log("Payment Captured Successfully: ")
        console.log(data)
      
      })
      }).catch((error) => {
        // error
        console.log("Payment Capture error: ")
        console.log(error)
        res.redirect('/register')
      })
      
      }).catch((error) => {
        // error
        console.log("Customer Create Error: ");
        console.log(error);
        res.redirect('/register')
      })
      
})


app.post('/send',(req, res)=>{
    message= req.body.message
    User.find().then((users)=>{
        users.map((user)=>{
            string = user.phonenumber
            phnumber = '91'+string
            console.log(phnumber)

            smsobj = [{
                "message" : message,
                "to" : [phnumber]
            }]

            args = {sender: 'Incandescence', sms: smsobj}

            msg91SMS.send(args).then((res)=>{
                console.log(res)
            }).catch((e)=>{
                console.log(e)
                if(e.data) console.log(e.data)
                else console.log(e.message)
            })
            console.log('success')
        })
    })

})



//End of post request























app.listen(3000, () => {
    console.log('Connected to server')
})









