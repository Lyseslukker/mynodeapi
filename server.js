const express = require("express")
const app = express()
const cors = require("cors")
const cookie = require("cookie")
const { v4: uuidv4 } = require('uuid')
const fs = require("fs")
const asyncFs = require("fs").promises
const sharp = require("sharp")
const fetch = require("node-fetch")

const {addressCheckup} = require("./Functions/sanatization")
const {
    findUser, 
    createNewSession,
    findExistingSession,
    userCheck,
    saveOrder,
} = require("./Functions/basics")
const {encrypt} = require("./Functions/Encryption")

PORT = 3000


const whitelist = new Set(['http://localhost:5173', 'http://127.0.0.1:5500/', 'https://mydomain.com']);
const corsOptions = {
    origin: (origin, callback) => {
        if (whitelist.has(origin)) {
            callback(null, true)
        } else {
            callback(null, false)
        }
    },

    credentials: true
}

// CORS
app.use(cors(corsOptions))

// to support URL-encoded bodies
app.use(express.urlencoded({ extended: true }));

// to support JSON-encoded bodies
app.use(express.json({limit: "50mb"}));

// Middleware for raw data, applied only to the upload route
// const rawMiddleware = express.raw({ type: 'image/*', limit: '10mb' });

// console.log(" ")
// console.log(" ")
// console.log(" ")
// console.log(" ")

// const myTestStream = () => {
//     let buffer = ""
//     let objectStartIndex = 0

//     const stream = fs.createReadStream("./products.json", {
//         highWaterMark: 512
//     })
    
//     stream.on("error", (chunk) => {
//         console.log("error: ", chunk)
//     })
//     stream.on('data', (chunk) => {
//         buffer = buffer + chunk.toString()
//         console.log(" ")
//         console.log(chunk.toString())
//         console.log(chunk.length)

//         console.log(chunk.length)
//         const data = JSON.parse(chunk)
//         const string = JSON.stringify(data)
//         console.log(data.length)
//         console.log(string.length)
//         console.log(buffer)
//         console.log(" ")
//     })
//     stream.on("end", (chunk) => {
//         console.log("End: ", chunk)
//     })
    
//     stream.on("close", (chunk) => {
//         console.log("Close: ", chunk)
//     })
// }
// myTestStream()



/*=============================================
=                  ECOMMERCE                 =
=============================================*/

app.get("/csrf", (req, res) => {
    const myUUID = uuidv4()
    const userCookies = cookie.parse(req.headers.cookie || '')
    const userEncryption = userCookies.uid
    fs.readFile("./csrfSessions.json", 'utf8', (err, data) => {
        if (err) {
            console.log("Could'nt open csrfSessions.json: ", err)
        }
        const parsedSessions = JSON.parse(data)
        // const removedUserList = parsedSessions.filter((user) => {
        //     return user.uid !== 
        // })
    })

    console.log(userEncryption)
    res.send("Hello from csrf")
})

app.get("/ecommerce/userCheck", (req, res) => {
    const userCookies = cookie.parse(req.headers.cookie || '')


    userCheck(userCookies.uid, userCookies.session)
        .then((userSession) => {
            console.log("Data: ", userSession)
            res.send({
                status: "Success",
                msg: "Godkendt",
                data: `/${userSession.user}`
            })
        })
        .catch((err) => {
            // console.log("Error: ", err)
            res.cookie("uid", "", {httpOnly: true, sameSite: 'none', secure: true, maxAge: 0})
            res.cookie("session", "", {httpOnly: true, sameSite: 'none', secure: true, maxAge: 0})
            res.cookie("user", "", {sameSite: 'none', secure: true, maxAge: 0})
            res.send(err)
    })
})

app.get("/", (req, res) => {
    // console.log("Root got hit")
    res.end("Hello from /")
})


/*=====  PRE USER LOGIN  ======*/
// GET
app.get("/ecommerce/user", (req, res) => {
    const userCookies = cookie.parse(req.headers.cookie || '')

    // console.log(userCookies)
    findExistingSession(userCookies.uid, userCookies.session)
        .then((data) => {
            // console.log(data)
            if (data.status === "Success") {
                res.send(data)
            }
            if (data.status === "Pending") {
                res.send(data)
            }
        })
        .catch((err) => {
            res.cookie("uid", "", {httpOnly: true, sameSite: 'none', secure: true, maxAge: 0})
            res.cookie("session", "", {httpOnly: true, sameSite: 'none', secure: true, maxAge: 0})
            res.cookie("user", "", {sameSite: 'none', secure: true, maxAge: 0})
            res.send(err)
        })
})


// POST
/*=====  USER LOGIN  ======*/
app.post("/ecommerce/user", (req, res) => {
    console.log("Got hit")
    findUser(req.body)
    .then((user) => {
        encrypt(user)
        .then((encryption) => {
            createNewSession(encryption)
            .then((userSession) => {
                res.cookie("uid", userSession.myEncryption, {httpOnly: true, sameSite: 'none', secure: true, maxAge: 1000 * 604800})
                res.cookie("session", userSession.myIv, {httpOnly: true, sameSite: 'none', secure: true, maxAge: 1000 * 60 * 60 * 18})
                res.cookie("user", userSession.user, {sameSite: 'none', secure: true, maxAge: 1000 * 60 * 60 * 18})
                res.send({
                    status: "Success",
                    msg: "Godkendt",
                    data: `/${userSession.user}`
                })
            })
            .catch((err) => {
                console.log(err)
                res.send({
                    status: "Failed",
                    msg: err
                })
            })
        })
        .catch((err) => {
            console.log(err)
            res.send({
                status: "Failed",
                msg: err
            })
        })
    })
    .catch((err) => {
        console.log(err)
        res.send({
            status: "Failed",
            msg: err
        })
    })
})



/*=====  CREATE USER  ======*/
app.post("/ecommerce/createuser", async (req, res) => {

    try {
        const users = await asyncFs.readFile("./users.json", 'utf8')
        const parsedUsers = JSON.parse(users)
        const findDublicate = parsedUsers.filter((user) => {
            return user.email === req.body.email
        })
        if (findDublicate.length < 1) {
            const updatedUserlist = [
                ...parsedUsers,
                {
                    email: req.body.email,
                    password: req.body.password,
                    user: "user"
                }
            ]
            const stringedUpdate = JSON.stringify(updatedUserlist)
            await asyncFs.writeFile("./users.json", stringedUpdate)
            res.contentType("application/json")
            res.send({
                status: "Success",
                msg: "Bruger oprettet"
            })
        }
        if (findDublicate.length > 0) {
            res.contentType("application/json")
            res.send({
                status: "Failed",
                msg: "Email findes allerede i databasen"
            })
        }
    } 
    catch (error) {
        console.log(error)
    }
})





/*=====  GUEST PURCHASE  ======*/
app.post("/ecommerce/addresscheck", async (req, res) => {    
    // string.charAt(0).toUpperCase() + string.slice(1).toLowerCase();

    const roadname = req.body.roadname.charAt(0).toUpperCase() + req.body.roadname.slice(1).toLowerCase()
    const roadnumber = req.body.roadnumber
    const floor = req.body.floor
    const door = req.body.door.toLowerCase()

    const checkArray = [roadname, roadnumber, floor, door]

    const checkup = await addressCheckup(checkArray)

    if (checkup.status === "Failed") {
        res.contentType("application/json")
        res.send(checkup)
    }
    if (checkup.status === "Success") {
        try {
            const address = await fetch(`https://api.dataforsyningen.dk/adresser?vejnavn=${roadname}&husnr=${roadnumber}&etage=${floor}&dør=${door}&struktur=mini`)
            const resolvedAddress = await address.json()

            if (resolvedAddress.length > 0) {
                res.contentType("application/json")
                res.send({
                    status: "Success",
                    msg: "Er dette din adresse?",
                    data: resolvedAddress[0].betegnelse
                })
            }
            else {
                res.contentType("application/json")
                res.send({
                    status: "Failed",
                    msg: "Fandt ingen adresse med følgende input"
                })
            }
        } 
        catch (error) {
            res.contentType("application/json")
            res.status(500)
            res.send({
                status: "Failed",
                msg: "Fejl på server"
            })
        }
    }
})

app.post("/ecommerce/purchase", async (req, res) => {
    try {
        console.log(req.body)
        customerName = req.body.info.name
        customerEmail = req.body.info.email
        customerAddress = req.body.info.address
        customerPurchases = req.body.purchases

        const savingOrder = await saveOrder(req.body)
        console.log(savingOrder)
        res.contentType("application/json")
        res.send(savingOrder)
    }
    catch (error) {
        console.log(error)
        res.contentType("application/json")
        res.send(error)
    }
})

/*=====  USER PURCHASES  ======*/
app.get("/ecommerce/userpurchases", (req, res) => {

})






/*=====  ADD PRODUCT  ======*/
app.post("/ecommerce/addproduct", (req, res) => {

    const body = req.body
    // console.log(uuidv4())
    // console.log(body.title)
    // console.log(body.price)
    // console.log(body.description)
    // console.log(body.imageName)


    if (body.title.length < 1) {
        res.send({
            status: "Failed",
            msg: "Mangler en title"
        })
        return
    }
    if (body.price.length < 1) {
        res.send({
            status: "Failed",
            msg: "Mangler en pris"
        })
        return
    }
    if (body.description.length < 1) {
        res.send({
            status: "Failed",
            msg: "Mangler en beskrivelse af produktet"
        })
        return
    }

    if (body.image.length < 1) {
        res.send({
            status: "Failed",
            msg: "Mangler et billede af produktet"
        })
        return
    }


    
    // Split the base64 string in data and contentType
    const split = body.image.split(';base64,')

    const contentType = split[0].split(':')[1]
    console.log(contentType)
    const base64 = split[1]

    // base64 string to Buffer
    const buffer = Buffer.from(base64, 'base64')

    if (!['image/jpeg', 'image/png', 'image/jpg'].includes(contentType)) {
        res.send({status: "Failed", msg: "Understøtter kun: jpg, jpeg, png"})
        return
    }

    const imageUUID = uuidv4()

    sharp(buffer).metadata()
        .then((metadata) => {
            console.log(metadata)

            if (!['jpeg', 'png', 'jpg'].includes(metadata.format)) {
                res.send({status: "Failed", msg: "Understøtter kun: jpg, jpeg, png"})
                return
            }

            fs.readFile("./products.json", 'utf8', (err, data) => {
                if (err) {
                    console.log(err)
                }
                if (data) {
                    const parsedProducts = JSON.parse(data)
                    console.log("parsedProducts", parsedProducts)
                    const productExist = parsedProducts.filter((product) => {
                        return product.name === body.title
                    })
                    if (productExist.length < 1) {
                        console.log("No products with that name was found")
                        fs.writeFile(`./images/${body.imageName}`, buffer, (err) => {
                            if (err) {
                                console.log("Something went wrong")
                                console.log(err)
                                res.send({status: "Failed", msg: "Noget gik galt"})
                                return 
                            }
                            

                            const updatedProducts = [
                                ...parsedProducts,
                                {
                                    id: uuidv4(),
                                    title: body.title,
                                    price: body.price,
                                    description: body.description,
                                    imageRef: body.imageName,
                                }
                            ]
                            const stringedUpdatedProducts = JSON.stringify(updatedProducts)

                            fs.writeFile("./products.json", stringedUpdatedProducts, (err) => {
                                if (err) {
                                    console.log("Something went wrong creating a new product")
                                    console.log(err)
                                    res.send({status: "Failed", msg: "Noget gik galt"})
                                    return 
                                }
                                res.send({status: "Success", msg: `${body.title} blev oprettet`})
                            })
                        })

                    }
                }

            })

            
        })


    
      
})

/*=====  GET ALL PRODUCTS  ======*/
app.get("/ecommerce/allproducts", (req, res) => {
    // console.log("/allproducts got hit")
    fs.readFile("./products.json", "utf8", (err, data) => {
        if (err) {
            console.log(err)
        }
        if (data) {
            // console.log(data)
            // res.set('Cache-Control', 'private, max-age=60')
            res.contentType("application/json")
            res.send(data)
        }
    })
})

/*=====  GET SINGLE PRODUCT  ======*/
app.get("/ecommerce/product/:id", (req, res) => {
    const productid = req.params.id
    console.log(productid)

    fs.readFile("./products.json", 'utf8', (err, data) => {
        if (err) {
            console.log(err)
            res.send({
                status: "Failed",
                msg: "Fejl på serveren, prøv igen"
            })
        }
        if (data) {
            const parsedData = JSON.parse(data)
            const product = parsedData.filter((product) => {
                return product.id === productid
            })
            if (product.length < 1) {
                res.send({
                    status: "Failed",
                    msg: "Produkt ikke fundet."
                })
            }
            else {
                res.set('Cache-Control', 'private, max-age=1')
                res.contentType('application/json')
                res.send(product[0])
            }
        }
    })
    
})


/*=====  GET IMAGE  ======*/
app.get("/ecommerce/image/:imgname", async (req, res) => {
    const imageName = req.params.imgname
    // console.log(imageName)
    if (imageName === "undefined") {
        // console.log("Failed")
        res.status(404)
    }
    else {
        // console.log("Success")
        try {
            const image = await asyncFs.readFile(`./images/${req.params.imgname}`)
            res.set('Cache-Control', 'private, max-age=1')
            res.contentType('image/jpeg')
            res.status(200)
            res.send(image)

            const stream = fs.createReadStream(`./images/${req.params.imgname}`)
            stream.pipe(res)
        } 
        catch (error) {
            console.log("image error: ", error)
            res.status(404)
        }
    }
})



/*=====  REMOVE PRODUCT  ======*/
app.post("/ecommerce/removeproduct", (req, res) => {
    const employeeCookies = cookie.parse(req.headers.cookie || '')
    
    console.log("/removeproduct was hit")
    console.log(employeeCookies.uid)
    console.log(employeeCookies.session)
    console.log(employeeCookies.user)
    console.log(req.body)

    fs.readFile("./products.json", 'utf8', (err, data) => {
        if (err) {
            console.log(err)
            res.status(500).send({status: "Failed", msg: "Noget gik galt på serveren"})
        }
        if (data) {
            const parsedProducts = JSON.parse(data)
            // console.log("Current products: ", parsedProducts)

            
            const [productToRemove] = parsedProducts.filter((product) => {
                return product.id === req.body.id
            })
            // console.log("Product to remove: ", productToRemove)
            

            const updatedProductList = parsedProducts.filter((product) => {
                return product.id !== req.body.id
            })
            const stringedUpdatedProductList = JSON.stringify(updatedProductList)
            // console.log("Updated product list", updatedProductList)

            fs.unlink("./images/" + productToRemove.imageRef, (err) => {
                if (err) {
                    res.status(500).send({status: "Failed", msg: "Noget gik galt på serveren"})
                    return
                }

                fs.writeFile("./products.json", stringedUpdatedProductList, (err) => {
                    if (err) {
                        res.status(500).send({status: "Failed", msg: "Noget gik galt på serveren"})
                        return
                    }
                    res.send({status: "Success", msg: "Produktet er fjernet"})
                })
            })
            
        }
    })
})










app.listen(PORT, () => {
    console.log("Server is running on port: " + PORT)
})