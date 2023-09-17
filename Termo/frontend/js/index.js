const wordsLists = document.querySelectorAll(".words-lists");
const buttons = document.querySelectorAll(".buttons");
let wordlistIndex = 0, activeField = 0, temp = false;

const SetUser = () => {
    fetch(`http://localhost:1018/set-user`, { method: "GET" })
    .then(res => res.json())
    .then(data => {
        const id = data.userID;
        if(localStorage.getItem("userID") === null) localStorage.setItem("userID", id);
    })
    .catch(err => console.error(err));

    fetch(`http://localhost:1018/load-progress`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({ userID: localStorage.getItem("userID") })
    })
    .then(res => res.json())
    .then(data => {
        if(data.progress[0] != null){
            data.progress.forEach((element) => {
                element.progress.forEach((el, index) => {
                    wordlistIndex = element.wordlistIndex;
                    wordsLists[wordlistIndex].children[index].style.background = el.style;
                    wordsLists[wordlistIndex].children[index].innerHTML = el.letter;
                    wordsLists[wordlistIndex].children[index].style.border = "none";
                    DisableKeys(element.progress, index);
                });
                activeField = 0;
            });

            if(data.verificationWin[0] != null) TermoEnd(data.verificationWin[0], data.secret);
            if(data.verificationWin[0] === null) wordlistIndex = data.progress[data.progress.length - 1].wordlistIndex + 1;
        }

        WordsListsActived();
    })
    .catch(err => console.error(err));

    WordsListsActived();
}

const WordsListsActived = () => {
    buttons.forEach(btn => btn.style.pointerEvents = "auto");
    const wordsLists = document.querySelectorAll(".words-lists");
    wordsLists[wordlistIndex].children[activeField].style.borderBottom = "10px solid #4c4347";
    
    for(let i = 0; i < wordsLists.length; i++){
        if(wordlistIndex === i){
            const actived = wordsLists[wordlistIndex].children;
            for(let j = 0; j < actived.length; j++) actived[j].classList.add("activeField");
            break;  
        }
    }
    
    for(let i = 0; i < wordsLists[wordlistIndex].children.length; i++){
        wordsLists[wordlistIndex].children[i].addEventListener("click", () => {
            for(let field of wordsLists[wordlistIndex].children) field.style.borderBottom = "6px solid #4c4347";
            wordsLists[wordlistIndex].children[i].style.borderBottom = "10px solid #4c4347";
            activeField = i;
            temp = true;
        });
    }
}

const keyBoard = () => {
    let delet = false;

    buttons.forEach(btn => {
        const btnTarget = btn.dataset.buttonFunction;

        btn.addEventListener("click", () => {
            if(btnTarget === "letter"){
                temp = false;
                Game(btn.value, delet);
                activeField > 5 ? activeField = 5 : activeField++
            }
            
            if(btnTarget === "del"){
                if(temp === true) activeField++
                delet = true;
                activeField <= 0 ? activeField = 0 : activeField--
                Game("", delet);
                delet = false;
                temp = false;
            }
            
            if(btnTarget === "enter"){
                for(let field of wordsLists[wordlistIndex].children){
                    if(field.innerHTML === ""){
                        buttons.forEach(btn => btn.style.pointerEvents = "auto");
                        MessageAlert("Campo precisa ser preenchido.");
                        for(let field of wordsLists[wordlistIndex].children) field.innerHTML = "";
                        return;
                    }
                }

                GameEnter();
            }

            setTimeout(() => { for(let fields of wordsLists[wordlistIndex].children) if(fields.classList.contains("activeFieldTransition")) fields.classList.remove("activeFieldTransition") }, 200)
        });
    });
}

const Game = (letter, isDelete) => {
    try {
        for(let fields of wordsLists[wordlistIndex].children) fields.style = "";
        wordsLists[wordlistIndex].children[activeField].classList.add("activeFieldTransition");

        if(isDelete === false) {
            if(wordsLists[wordlistIndex].children[activeField].innerHTML != "") return;
            wordsLists[wordlistIndex].children[activeField].innerHTML = letter;
            wordsLists[wordlistIndex].children[activeField].style.borderBottom = "10px solid #4c4347";
        }

        if(isDelete === true){
            wordsLists[wordlistIndex].children[activeField].style.borderBottom = "10px solid #4c4347";
            wordsLists[wordlistIndex].children[activeField].innerHTML = letter;
        }

    } catch(err){ return }
}

const GameEnter = () => {
    buttons.forEach(btn => btn.style.pointerEvents = "none");
    let letters = [];
    for(let field of wordsLists[wordlistIndex].children) letters.push(field.innerHTML);
    const id = localStorage.getItem("userID");

    const request = { userID: id, [id]: { wordlistIndex: wordlistIndex, letters: letters }}

    fetch(`http://localhost:1018/wordslists`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(request)
    })
    .then(res => res.json())
    .then(data => {
        VerificationWord(data)
    })
    .catch(err => console.error(err));

    letters = [];
}

const VerificationWord = (data) => {
    if(data.request[0].verification.wordExist === false){ 
        buttons.forEach(btn => { btn.style.pointerEvents = "auto" });
        MessageAlert("Essa palavra não existe.");
        for(field of wordsLists[wordlistIndex].children){
            field.innerHTML = "";
            activeField = 0;
        }
        return;
    };

    const progress = data.request[0].data[0][localStorage.getItem("userID")].progress;
    const time = 600;
    let index = 0;

    const ForTimer = setInterval(() => {
        DisableKeys(progress, index);
        wordsLists[wordlistIndex].children[index].innerHTML = progress[index].letter;
        wordsLists[wordlistIndex].children[index].style.background = progress[index].style;
        wordsLists[wordlistIndex].children[index].style.border = "none";
        wordsLists[wordlistIndex].children[index].classList.add("transition");
        index++

        if(index === progress.length){
            let word = "";
            clearInterval(ForTimer);
            for(letter of progress) word += letter.letter;
            HitWord(word);
        }
    }, time)
}

const DisableKeys = (progress, index) => {
    buttons.forEach(btn => {
        if(btn.value === progress[index].letter){
            if(progress[index].style === "#312a2c"){
                btn.disabled = false;
                btn.style.background = progress[index].style
            }

            if(progress[index].style === "#3aa394"){
                btn.disabled = false;
                btn.style.background = progress[index].style
            }

            if(progress[index].style === "#d3ad69"){
                btn.disabled = false;
                btn.style.background = progress[index].style
            }
        }
    });
}

const HitWord = (word) => {
    activeField = 0;

    fetch(`http://localhost:1018/verificationwin`, { 
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({ word: word, wordlistIndex: wordlistIndex, userID: localStorage.getItem("userID") })
    })
    .then(res => res.json())
    .then(data => {
        const win = data.verificationWin[0];

        if(win === null){
            wordlistIndex++
            WordsListsActived();
            wordsLists[wordlistIndex].children[activeField].style.borderBottom = "10px solid #4c4347";
        }

        if(win === true){
            TermoEnd(true);
        }

        if(win === false){
            TermoEnd(false, data.secret);
        }
    })
    .catch(err => console.error(err));
}

const TermoEnd = (victory, secret) => {
    const winner = document.querySelector(".winner");
    const table = document.querySelector(".table");
    const message = document.querySelector("#message-word-etc");
    const area = document.querySelectorAll(".area");
    
    if(victory === false){
        winner.classList.add("active");
        buttons.forEach(btn => {
            btn.style.opacity = 0.5;
            btn.style.pointerEvents = "none";
        });

        table.style.pointerEvents = "none";
        if(wordlistIndex < 5){
            area[wordlistIndex].style.background = "#009afe";
        } else {
            area[wordlistIndex + 1].style.background = "#009afe";
        }
        message.innerHTML = `A palavra era <strong>${secret}</strong>`;
    } else {
        winner.classList.add("active");
        buttons.forEach(btn => {
            btn.style.opacity = 0.5;
            btn.style.pointerEvents = "none";
        });

        table.style.pointerEvents = "none";
        area[wordlistIndex].style.background = "#009afe";
    }
}

const MessageAlert = (msg) => {
    const timeAlert = 1500;
    const timeAlertransition = 300;
    const alert = document.querySelector(".alert");
    const msgalert = document.querySelector("#alert-message");
    alert.classList.add("active");
    msgalert.innerHTML = msg;
    setTimeout(() => { alert.classList.remove("active") }, timeAlert);
    setTimeout(() => { alert.classList.add("trasition") }, timeAlert - timeAlertransition);
    setTimeout(() => { alert.classList.remove("trasition") }, timeAlert);
}

const timer = () => {
    const spanTimer = document.querySelector("#timer");

    fetch(`http://localhost:1018/time-termo`, { method: "GET" })
    .then(res => res.json())
    .then(data => {
        spanTimer.innerHTML = `${data.hours}:${data.minutes}:${data.secunds}`

        if(data.hours === 23 && data.minutes === 59 && data.secunds === 59){
            fetch(`http://localhost:1018/restart`, { method: "GET" })
            .then(response => response.json())
            .then(reboot => {
                window.location.reload();
            })
            .catch(err => console.error(err));
        }
    })
    .catch(err => console.error(err));
}

setInterval(() => { timer() }, 1000);
SetUser();
keyBoard();