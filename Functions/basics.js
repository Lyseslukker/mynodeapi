const fs = require("fs")
const promiseFs = require("fs").promises

const readAllUsers = () => {
    return new Promise((resolve, reject) => {
        fs.readFile("./users.json", 'utf8', (err, data) => {
            if (err) {
                reject(err)
            }
            else {
                resolve(data)
            }
        })
    })
}


const userCheck = (uid, session) => {
    // console.log(uid)
    // console.log(session)
    return new Promise((resolve, reject) => {
        // If no UID or SESSION => send user back to login
        if (uid === undefined || session === undefined) {
            reject({
                status: "Failed",
                msg: "Mangler id",
                data: "/login"
            })
        }

        fs.readFile("./sessions.json", 'utf8', (err, data) => {
            if (err) {
                reject({
                    status: "Failed",
                    msg: "Fejl på serveren, prøv igen",
                    data: "/login"
                })
            }
            else {
                const parsedSessions = JSON.parse(data)
                const userSessionSearch = parsedSessions.filter((user) => {
                    return user.myEncryption === uid && user.myIv === session
                })
                if (userSessionSearch.length < 1) {
                    reject({
                        status: "Failed",
                        msg: "Kunne ikke finde bruger",
                        data: "/login"
                    })
                }
                else {
                    // console.log(userSessionSearch[0])
                    resolve({
                        myEncryption: userSessionSearch[0].myEncryption,
                        myIv: userSessionSearch[0].myIv,
                        expiresAt: userSessionSearch[0].expiresAt,
                        user: userSessionSearch[0].user
                    })
                }
            }
        })
    })
}


const findUser = (userCredentials) => {
    return new Promise((resolve, reject) => {
        fs.readFile("./users.json", 'utf8', (err, data) => {
            if (err) {
                console.log(err)
                reject("Fejl på serveren, prøv igen")
                return
            }
            const parsedUsers = JSON.parse(data)
            const findUser = parsedUsers.filter((user) => {
                return user.email === userCredentials.email && user.password === userCredentials.password
            })
            if (findUser.length < 1) {
                reject("Fandt ingen bruger med den mail og password")
            }
            resolve(findUser[0])
        })
    })
}


const createNewSession = (encryption) => {
    return new Promise((resolve, reject) => {
        fs.readFile("./sessions.json", 'utf8', (err, data) => {
            if (err) {
                console.log(err)
                reject("Fejl på serveren, prøv igen")
            }
            const parsedSessions = JSON.parse(data)
            const removedOldUserSessionFromSession = parsedSessions.filter((userSession) => {
                return userSession.userEmail !== encryption.userEmail
            })
            // console.log("Old: ", parsedSessions)
            // console.log("Removed Usersession: ", removedOldUserSessionFromSession)
            const updatedSessions = [
                ...removedOldUserSessionFromSession,
                encryption
            ]
            const stringedUpdatedSessions = JSON.stringify(updatedSessions)

            fs.writeFile("./sessions.json", stringedUpdatedSessions, (err) => {
                if (err) {
                    reject("Fejl på serveren, prøv igen")
                }
                resolve(encryption)
            })
        })
    })
}


const findExistingSession = (uid, session) => {
    return new Promise((resolve, reject) => {
        fs.readFile("./sessions.json", 'utf8', (err, data) => {
            if (err) {
                reject({
                    status: "Failed",
                    msg: "Fejl på serveren, prøv igen"
                })
                console.log(err)
            }
            if (!uid && !session) {
                reject({
                    status: "Failed",
                    msg: "Mangler brugernavn & password"
                })
            }

            const parsedSessions = JSON.parse(data)
            const userSession = parsedSessions.filter((user) => {
                return user.myEncryption === uid
            })
            
            if (uid && !session) {
                if (userSession.length < 1) {
                    console.log("Could not find session")
                    reject({
                        status: "Failed",
                        msg: "Kunne ikke finde bruger session"
                    })
                }
                else {
                    resolve({
                        status: "Pending",
                        msg: "Mangler password",
                        data: userSession[0].userEmail
                    })
                }
            }
            if (uid && session) {
                if (userSession.length < 1) {
                    console.log("Could not find session")
                    reject({
                        status: "Failed",
                        msg: "Kunne ikke finde bruger session"
                    })
                }
                else {
                    console.log(userSession)
                    resolve({
                        status: "Success",
                        data: `/${userSession[0].user}`
                    })
                }
            }
        })
    })
}





/*=============================================
=                   ORDERS                    =
=============================================*/
/*----------  GET ALL ORDERS  ----------*/
const getAllOrders = async () => {
    try {
        const allOrders = await promiseFs.readFile("./orders.json", 'utf8')
        const parsedOrders = JSON.parse(allOrders)
        return parsedOrders
    } 
    catch (error) {
        throw {
            status: "Failed",
            msg: "Fejl i getAllOrders()"
        }
    }
}


const saveOrder = async (orderObject) => {
    try {
        const allOrders = await getAllOrders()
        const updatedOrders = [
            ...allOrders,
            orderObject
        ]
        const stringed = JSON.stringify(updatedOrders)
        const saveUpdatedOrders = await promiseFs.writeFile("./orders.json", stringed, 'utf8')
        return {
            status: "Success",
            msg: "Ordre er gemt"
        }
    } 
    catch (error) {
        throw {
            status: "Failed",
            msg: "Kunne ikke gemme ordre"
        }       
    }
}


const isStringSafe = async (stringToCheck) => {
    const regex = /^[^<>=\\s\\x00-\\x1F\\x7F-\\xFF]+$/;
    return regex.test(stringToCheck)
}












module.exports = {
    readAllUsers, 
    findUser, 
    createNewSession, 
    findExistingSession,
    userCheck,
    getAllOrders,
    saveOrder,
    isStringSafe
}