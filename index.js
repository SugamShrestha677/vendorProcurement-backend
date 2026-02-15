// const express = require('express');
// const cors = require('cors');
// const connectDB = require('./src/config/db');
// const config = require('./src/config/config');

// // Import Routes
// const authRoutes = require('./src/routes/authRoutes');
// const userRoutes = require('./src/routes/userRoutes');
// const requestRoutes = require('./src/routes/requestRoutes');
// const invoiceRoutes = require('./src/routes/invoiceRoutes');

// const app = express();

// // Connect to Database
// connectDB();

// // Middleware
// app.use(cors());
// app.use(express.json());
// app.use(express.urlencoded({ extended: true }));

// // API Routes
// app.use('/api/auth', authRoutes);
// app.use('/api/users', userRoutes);
// app.use('/api/requests', requestRoutes);
// app.use('/api/invoices', invoiceRoutes);

// // Health Check Route
// app.get('/', (req, res) => {
//   res.json({ 
//     message: 'ExpenseHub API is running',
//     version: '1.0.0',
//     endpoints: {
//       auth: '/api/auth',
//       users: '/api/users',
//       requests: '/api/requests',
//       invoices: '/api/invoices'
//     }
//   });
// });

// // Error Handling Middleware
// app.use((err, req, res, next) => {
//   console.error(err.stack);
//   res.status(500).json({ 
//     success: false, 
//     message: 'Something went wrong!',
//     error: process.env.NODE_ENV === 'development' ? err.message : undefined
//   });
// });

// // 404 Handler
// app.use((req, res) => {
//   res.status(404).json({ 
//     success: false, 
//     message: 'Route not found' 
//   });
// });

// const PORT = config.port;

// app.listen(PORT, () => {
//   console.log(`Server is running on port ${PORT}`);
//   console.log(`Environment: ${config.nodeEnv}`);
// });














// // todo: CallBack Function
// function greet(name,callback) {
//     // console.log("Hello "+ name)
//     console.log(`Hello! ${name}`)
//     callback // calling the callback function after greeting
// }
// function sayThanks() {
//     console.log("Thank You Everyone!")
// }
// greet("John",sayThanks());


// //todo: Callback Example
// function clzAdmin(clzMember) {
//     let message = "Tomorrow is the holiday!"
//     console.log(message)
//     setTimeout(() => {
//         clzMember(message) // calling the callback function with message
//     }, 3000); // simulating an asynchronous operation with a delay of 2 seconds
//     // clzMember(message) // calling the callback function with message
// }
// function clzMember(message) {
//     console.log("Message from Admin: " + message)
// }

// clzAdmin(clzMember)

//todo: Promise Example
function fetchData() {
    return new Promise((resolve, reject) => {
        setTimeout(() => {
            const data = { id: 1, name: "Sample Data" }
            resolve(data) // resolving the promise with data
        }, 2000); // simulating an asynchronous operation with a delay of 2 seconds
    })
}
fetchData()
    .then(data => {
        console.log("Data fetched:", data)
    })
    .catch(error => {
        console.error("Error fetching data:", error)
    })


//todo: Async/Await Example
function fetchedData() {
    return new Promise((resolve, reject) => {
        setTimeout(()=>{
            const data = { id: 2, name: "Async Data" }
            resolve(data) // resolving the promise with data
        },200000);
    });
}

async function process(params) {
    let data = await fetchedData() // waiting for the promise to resolve and getting the data
    console.log("Data processed:", data)
}
process();


function outer() {
  let count = 0;

  function inner() {
    count++;
    console.log(count);
  }

  return inner;
}

const counter = outer();
counter(); // 1
counter(); // 2
counter(); // 3
