const express = require("express");
const cors = require("cors");
const fs = require("fs");
const { connected } = require("process");
const app = express();
app.use(cors());
app.use(express.json());
const port = 1018;
let secretsWords = [], request = [], secret = [], words = [], VarPlayersProgress = [], data = [], obj = [], verificationWin = [], lastVerificationWin = [];
let IDusers = 0;
let word = "";

app.get("/time-termo", (_req, res) => {
    const date = new Date();
    let hh = date.getHours();
    let mm = date.getMinutes();
    let ss = date.getSeconds();

    hh = Number(hh);
    mm = Number(mm);
    ss = Number(ss);

    let hhs = 23 - hh;
    let mms = 59 - mm;
    let sss = 59 - ss;

    hhs < 10 ? hhs = `0${hhs}` : hhs;
    mms < 10 ? mms = `0${mms}` : mms;
    sss < 10 ? sss = `0${sss}` : sss;

    res.json({ hours: hhs, minutes: mms, secunds: sss });
});

app.get("/restart", (_req, res) => {
    secretsWords = [], request = [], secret = [], words = [], VarPlayersProgress = [], data = [], obj = [], verificationWin = [], lastVerificationWin = [];
    word = "";
    WordsFunc();
    SecretsWords();
    res.json({ message: "Server Restarted" });
});

app.post("/load-progress", (req, res) => {
    const userID = req.body.userID;
    const progrees = [];

    VarPlayersProgress.forEach(element => {if((element[0][userID] != null && element[0][userID] != undefined)) progrees.push(element[0][userID])});
    
    if(verificationWin.length > 0){
        verificationWin.forEach(el => {
            if(el.userID === userID){
                lastVerificationWin.pop();
                lastVerificationWin.push(el.value);
            }
        });

        res.json({ progress: progrees, verificationWin: lastVerificationWin, secret: secret[0] });
        return;
    }

    res.json({ progress: progrees, verificationWin: null });
});

const WordsFunc = () => {
    fs.readFile("./words/words.json", "utf8", (err, data) => {
        if(err) console.error(err);
    
        try {
            const json = JSON.parse(data);
            words.push(json);
        } catch(err){ console.error(err) }
    });
}

const SecretsWords = () => {
    fs.readFile("./words/secrets-words.json", "utf8", (err, data) => {
        if(err) console.error(err);
    
        try {
            const json = JSON.parse(data);
            secretsWords.push(json);
        } catch(err){ console.error(err) }
    
        const secretLength = secretsWords[0]["secrets-words"].length;
        const srt = Math.floor(Math.random() * secretLength);
        secret.push(secretsWords[0]["secrets-words"][srt]);
        console.log(`palavra Secreta: ${secret[0]}`);
    });
}

WordsFunc();
SecretsWords();

app.get("/set-user", (_req, res) => {
    res.json({ userID: IDusers });
    IDusers++
});

app.post("/wordslists", (req, res) => {
    const data = req.body;
    VerificationExistWord(data);
    res.json({ request: request });
});

const AccentRemove = (word) => {
    return word.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

const VerificationExistWord = (data) => {
    const userID = data.userID;
    for(let letter of data[userID].letters) word += letter;

    for(let i = 0; i < words[0].words.length; i++){
        if((words[0].words.length - 1) === i){
            const value = { wordExist: false }
            request.pop();
            request.push({ verification: value, data: data });
            break;
        }

        if(AccentRemove(words[0].words[i]) === word){
            WordVerification(words[0].words[i], userID, data[userID].wordlistIndex);
            break;
        }
    }

    word = "";
}

app.post("/verificationwin", (req, res) => {
    const wordlistIndex = req.body.wordlistIndex;
    const lastWord = req.body.word;
    const userID = req.body.userID;

    if(wordlistIndex >= 0 && wordlistIndex < 5) verificationWin.push({ userID: userID, value: null });
    if(lastWord === secret[0]) verificationWin.push({ userID: userID, value: true });
    if(wordlistIndex >= 5) verificationWin.push({ userID: userID, value: false });

    verificationWin.forEach(el => {
        if(el.userID === userID){
            lastVerificationWin.pop();
            lastVerificationWin.push(el.value);
        }
    });

    res.json({ verificationWin: lastVerificationWin, secret: secret[0] });
});

const WordVerification = (word, userID, wordlistIndex) => {
    const secretRemoveAccent = AccentRemove(secret[0]);
    const value = { wordExist: true }

    for(let i = 0; i < secretRemoveAccent.length; i++){
        if(secretRemoveAccent[i] === AccentRemove(word[i])){
            obj.push({ letter: word[i], style: "#3aa394" });
        } else if(secretRemoveAccent.includes(word[i])){
            obj.push({ letter: word[i], style: "#d3ad69" });
        } else if(AccentRemove(word[i])){
            obj.push({ letter: word[i], style: "#312a2c" });
        }        
    }

    data.push({ [userID]: { wordlistIndex: wordlistIndex, progress: obj }});
    request.pop();
    request.push({ verification: value, data: data });
    VarPlayersProgress.push(data);
    data = [], obj = [];
}

app.listen(port, console.log(`Server Running, Port ${port}`));