const express = require('express');
const path = require("path");
const {open} = require("sqlite");
const sqlite3 = require("sqlite3"); 
const app = express();
app.use = express.json();

const dbPath = path.join(__dirname, "firstdatabase.db");

let db = null;
const intializeDBAndServer=async () => {
    try { 
        db = await open({
            filename: dbPath,
            driver: sqlite3.Database,
        });
        app.listen(3000, ()=> {
        console.log('server is running on localhost:3000');
        });
    } catch (e) {
        console.log('DB Error: ${e.message}')
        process.exit(1);
    };
};

intializeDBAndServer();

app.post("/users/", async(request, response) => {
    const {username, name, password, gender, location} = request.body;
    const hashedPassword = await bcrypt.hash(request.body.password, 10);
    const getUserQuery = 'SELECT * FROM user WHERE username="${username}"';
    const dbUser = await db.get(getUserQuery);
    if (dbUser === undefined) {
        const createUserQuery = `
            INSERT INTO 
                user (username, name, password, gender, location)
            VALUES 
                (
                    '${username}',
                    '${name}',
                    '${hashedPassword}',
                    '${gender}',
                    '${location}'
                )`;
        const dbResponse = await db.run(createUserQuery);              
        const newUserId = dbResponse.lastID;
        response.send('Created new user with ${newUserId}');
    }else {
        response.status(400);
        response.send("User already exists");
    }
})


app.post("/login/", async (request, response) => {
    let {username, password} = request.body;
    const selectUserQuery = 'SELECT * FROM user WHERE username = "${username}" ';
    const dbUser = await db.get(selectUserQuery);
    if (dbUser === undefined){
        response.status(400);
        response.send("invalid User");
    } else {
        const isPasswordMatched = await bcript.compare(password, dbUser.password);
        if (isPasswordMatched === true) {
            const payload = {
                username = username,
            };
            const jwtToken = jwt.sign(payload, "SECRET_TOKEN");
            response.send({jwtToken});
        }else {
            response.status(400);
            response.send("Invalid Password");
        }
    }
});

const authenticateToken = (request, response, next) => {
    let jwtToken;
    const authHeader = request.headers["authorization"];
    if (authHeader !== undefined) {
        jwtToken = authHeader.split(" ")[1];
    }
    if (jwtToken === undefined) {
        response.status(401);
        response.send("invalid JWT Token");
    }else {
        jwt.verify(jwtToken, "SECRET_TOKEN", async (error, payload) => {
            if(error) {
                response.status(401);
                response.send("invalid JWT Token");
            } else {
                request.username = payload.username;
                next();
            };
        });
    }
};

app.get("/profile/", authenticateToken, async (request, response) => {
    let {username} = request;
    const selectUserQuery = 'SELECT * FROM user WHERE username = '${username}' ';
    const userDetails = await db.get(selectUserQuery);
    response.send(userDetails);

});



