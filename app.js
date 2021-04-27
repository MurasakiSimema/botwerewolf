//#region Dichiarazioni
const TelegramBot = require('node-telegram-bot-api');
const Database = require('better-sqlite3')
const express = require('express');
const app = express();
const port = process.env.PORT || 3000;

const ejs = require('ejs');

const db = new Database('./BotDB.db', { verbose: console.log });
const bot = new TelegramBot("1556225223:AAF_tvfI19gdRXCSwixOp7vBVxXrlKzIs9I", {
    polling: true
});

//#endregion

//#region Comandi
bot.onText(/\/start/, (msg) => {
    bot.sendMessage(msg.chat.id, "Bevenuto in LupusBot!");
})

bot.onText(/\/newgame/, (msg) => {
    let query = db.prepare('SELECT * FROM Partite WHERE ChatID = ?');
    let game = query.get(msg.chat.id);

    if (game == undefined) {
        let query = db.prepare('INSERT INTO Partite(ChatID, Stato) VALUES(?, 0)');
        query.run(msg.chat.id);

        bot.sendPhoto(msg.chat.id, "https://www.informatorevigevanese.it/resizer/600/315/true/1573715291765.jpg--luna_piena_in_toro__gli_effetti.jpg", {
            caption: "Game creato, unisciti alla partita facendo /add"
        });
    } else {
        bot.sendMessage(msg.chat.id, "[" + msg.from.first_name + "](tg://user?id=" + msg.from.id + ")" + " esiste già una partita, unisciti con /add", {
            parse_mode: "markdown"
        });
    }
})

bot.onText(/\/add/, (msg) => {
    let query = db.prepare('SELECT IDPartita, Stato FROM Partite WHERE ChatID = ?');
    let game = query.get(msg.chat.id);
    if (game != undefined && game.Stato == 0) {
        let query = db.prepare('SELECT * FROM Giocatori WHERE IDTelegram = ?');
        let giocatore = query.get(msg.from.id);
        if (giocatore == undefined) {
            query = db.prepare('INSERT INTO Giocatori (IDTelegram, IDPartita, Stato, Nome) VALUES(?, ?, 1, ?)');
            let str = msg.from.first_name;
            if (msg.from.last_name != undefined)
                str += " " + msg.from.last_name;

            let ok = query.run(msg.from.id, game.IDPartita, str);

            if (ok) {
                bot.sendMessage(msg.chat.id, "[" + msg.from.first_name + "](tg://user?id=" + msg.from.id + ")" + " si unisce alla partita", {
                    parse_mode: "markdown"
                });
            }
        }
    } else {
        bot.sendMessage(msg.chat.id, "[" + msg.from.first_name + "](tg://user?id=" + msg.from.id + ")" + " prima devi creare una partita con /newgame o devi aspettare che la partita finisca", {
            parse_mode: "markdown"
        });
    }
})

bot.onText(/\/gamestart/, (msg) => {
    let query = db.prepare('SELECT IDPartita, Stato FROM Partite WHERE ChatID = ?');
    let game = query.get(msg.chat.id);
    if (game != undefined) {
        if (!game.Stato) {
            query = db.prepare('SELECT IDGiocatore FROM Giocatori WHERE IDPartita = ?');
            let giocatori = query.all(game.IDPartita);
            let num = giocatori.length;
            if (num > 3) {
                let query = db.prepare('UPDATE Partite SET Stato = 1 WHERE IDPartita = ?');
                query.run(game.IDPartita);
                Ruoli(num, giocatori);

                Partita(game.IDPartita);
                bot.sendPhoto(msg.chat.id, "https://www.utadahikaru.jp/en/music/img/album/img_music_album_19.jpg", {
                    caption: "La partita è iniziata"
                });
            } else {
                bot.sendMessage(msg.chat.id, "Servono almeno 4 persone per iniziare la partita");
            }
        } else {
            bot.sendMessage(msg.chat.id, "[" + msg.from.first_name + "](tg://user?id=" + msg.from.id + ")" + " la partita è già iniziata", {
                parse_mode: "markdown"
            });
        }
    } else {
        bot.sendMessage(msg.chat.id, "[" + msg.from.first_name + "](tg://user?id=" + msg.from.id + ")" + " prima devi creare una partita con /newgame", {
            parse_mode: "markdown"
        });
    }
})

bot.onText(/\/endgame/, (msg) => {
    let query = db.prepare('DELETE FROM Partite WHERE ChatID = ?');
    let del = query.run(msg.chat.id);
    bot.sendPhoto(msg.chat.id, "https://www.utadahikaru.jp/en/music/img/album/img_music_album_18.jpg", {
        caption: "Game eliminato"
    })
})

//#endregion

//#region Funzioni
function Ruoli(num, giocatori) {
    if (num < 7) {
        //#region Random
        let rndlupo = Math.ceil(Math.random() * (num - 1));
        let lupo = giocatori[rndlupo].IDGiocatore;

        let rndveggente
        do {
            rndveggente = Math.ceil(Math.random() * (num - 1));
        } while (rndveggente == rndlupo);
        let veggente = giocatori[rndveggente].IDGiocatore;

        //#endregion
        //#region AssegnaRuoli
        giocatori.forEach(giocatore => {
            if (giocatore.IDGiocatore != lupo) {
                if (giocatore.IDGiocatore != veggente) {
                    query = db.prepare('UPDATE Giocatori SET Ruolo = 1 WHERE IDGiocatore = ?')
                    ok = query.run(giocatore.IDGiocatore);
                } else {
                    query = db.prepare('UPDATE Giocatori SET Ruolo = 3 WHERE IDGiocatore = ?')
                    ok = query.run(veggente);
                }
            } else {
                query = db.prepare('UPDATE Giocatori SET Ruolo = 2 WHERE IDGiocatore = ?')
                ok = query.run(lupo);
            }
        });

        //#endregion
    } else if (num < 10) {
        //#region Random
        let rndlupo = Math.ceil(Math.random() * (num - 1));
        let lupo = giocatori[rndlupo].IDGiocatore;

        let rndlupo2
        do {
            rndlupo2 = Math.ceil(Math.random() * (num - 1));
        } while (rndlupo2 == rndlupo)
        let lupo2 = giocatori[rndlupo2].IDGiocatore;

        let rndveggente;
        do {
            rndveggente = Math.ceil(Math.random() * (num - 1));
        } while (rndveggente == rndlupo || rndveggente == rndlupo2);
        let veggente = giocatori[rndveggente].IDGiocatore;

        //#endregion
        //#region AssegnaRuoli
        giocatori.forEach(giocatore => {
            if (giocatore.IDGiocatore != lupo || giocatore.IDGiocatore != lupo2) {
                if (giocatore.IDGiocatore != veggente) {
                    query = db.prepare('UPDATE Giocatori SET Ruolo = 1 WHERE IDGiocatore = ?')
                    ok = query.run(giocatore.IDGiocatore);
                } else {
                    query = db.prepare('UPDATE Giocatori SET Ruolo = 3 WHERE IDGiocatore = ?')
                    ok = query.run(veggente);
                }
            } else {
                query = db.prepare('UPDATE Giocatori SET Ruolo = 2 WHERE IDGiocatore = ?')
                ok = query.run(giocatore.IDGiocatore);
            }
        });

        //#endregion
    } else {
        //#region Random
        let rndlupo = Math.ceil(Math.random() * (num - 1));
        let lupo = giocatori[rndlupo].IDGiocatore;

        let rndlupo2
        do {
            rndlupo2 = Math.ceil(Math.random() * (num - 1));
        } while (rndlupo2 == rndlupo)
        let lupo2 = giocatori[rndlupo2].IDGiocatore;

        let rndlupo3
        do {
            rndlupo3 = Math.ceil(Math.random() * (num - 1));
        } while (rndlupo3 == rndlupo || rndlupo3 == rndlupo)
        let lupo3 = giocatori[rndlupo3].IDGiocatore;

        let rndveggente
        do {
            rndveggente = Math.ceil(Math.random() * (num - 1));
        } while (rndveggente == rndlupo || rndveggente == rndlupo2 || rndveggente == rndlupo3);
        let veggente = giocatori[rndveggente].IDGiocatore;

        let rndveggente2
        do {
            rndveggente2 = Math.ceil(Math.random() * (num - 1));
        } while (rndveggente2 == rndlupo || rndveggente2 == rndlupo2 || rndveggente2 == rndlupo3 || rndveggente2 == rndveggente);
        let veggente2 = giocatori[rndveggente2].IDGiocatore;

        //#endregion
        //#region AssegnaRuoli
        giocatori.forEach(giocatore => {
            if (giocatore.IDGiocatore != lupo && giocatore.IDGiocatore != lupo2 && giocatore.IDGiocatore != lupo3) {
                if (giocatore.IDGiocatore != veggente && giocatore.IDGiocatore != veggente2) {
                    query = db.prepare('UPDATE Giocatori SET Ruolo = 1 WHERE IDGiocatore = ?')
                    ok = query.run(giocatore.IDGiocatore);
                } else {
                    query = db.prepare('UPDATE Giocatori SET Ruolo = 3 WHERE IDGiocatore = ?')
                    ok = query.run(veggente);
                }
            } else {
                query = db.prepare('UPDATE Giocatori SET Ruolo = 2 WHERE IDGiocatore = ?')
                ok = query.run(giocatore.IDGiocatore);
            }
        });

        //#endregion
    }
}

async function Partita(id) {
    return Promise.resolve("Ciao").then(async function() {
        let controllo = -1;
        let querytempo = db.prepare('SELECT TempoTurno, TempoLinciaggio FROM Impostazioni LIMIT 1');
        let tempo = querytempo.get();
        let querynomi = db.prepare('SELECT Nome FROM Ruoli');
        let nomi = querynomi.all();
        //let lhandler = { handler: [] };

        do {
            Turno(id, nomi);
            await sleep(tempo.TempoTurno);
            //ClearHandler(lhandler);
            bot.removeAllListeners("message");

            Tutti(id, nomi);
            await sleep(tempo.TempoLinciaggio);
            //ClearHandler(lhandler);
            bot.removeAllListeners("message");


            ControlloVoti(id);
            await sleep(5000);
            controllo = await ControlloParita(id);
        } while (controllo == -1);
        let query = db.prepare('SELECT ChatID FROM Partite WHERE IDPartita = ?');
        let chatid = query.get(id);
        query = db.prepare('DELETE FROM Partite WHERE ChatID = ?')
        query.run(chatid.ChatID);
        if (!controllo)
            bot.sendMessage(chatid.ChatID, "Partita finita, vincono gli impostori");
        else
            bot.sendMessage(chatid.ChatID, "Partita finita, vince il villaggio");
    });
}

async function Turno(id, nomi) {
    let query = db.prepare('SELECT IDGiocatore, Ruolo, Stato, IDTelegram, Nome FROM Giocatori WHERE IDPartita = ?')
    let giocatori = query.all(id);
    giocatori = giocatori.filter(giocatore => giocatore.Stato)
    giocatori.forEach(giocatore => {
        if (giocatore.Ruolo == 1) {
            Contadino(giocatore.IDTelegram, nomi[0]);
        } else if (giocatore.Ruolo == 2) {
            Lupomannaro(giocatore.IDGiocatore, giocatore.IDTelegram, giocatori, nomi[1]);
        } else if (giocatore.Ruolo == 3) {
            Veggente(giocatore.IDGiocatore, giocatore.IDTelegram, giocatori, nomi[2])
        }
    });
}

async function ControlloParita(id) {
    let query = db.prepare('SELECT Ruolo, Stato FROM Giocatori WHERE IDPartita = ?');
    let giocatori = query.all(id);
    let vivi = giocatori.filter(giocatore => giocatore.Stato);
    let lupi = vivi.filter(giocatore => giocatore.Ruolo == 2);


    if (lupi.length >= (vivi.length - lupi.length))
        return 0;
    else if (lupi.length == 0)
        return 1;
    else
        return -1;
}

async function Contadino(Chat, nomi) {
    bot.sendMessage(Chat, "Sei un " + nomi.Nome + " e sei andato a dormire sperando di svegliarti ancora vivo il giorno dopo");
}

async function Lupomannaro(idG, Chat, giocatori, nome) {
    let newgiocatori = giocatori.filter(giocatore => giocatore.IDGiocatore != idG);
    count = 0;
    let scelte = newgiocatori.map(giocatore => count++ + ": " + giocatore.Nome)
    let text = scelte.join('\n');

    bot.sendMessage(Chat, "sei un " + nome.Nome + ": \nchi vuoi uccidere?\n" + text + "\n(Scrivi il numero della persona scelta)");

    let handler = (msg) => {
        if (msg.chat.id == Chat) {
            n = parseInt(msg.text);
            if (n != NaN && n < newgiocatori.length) {
                let query = db.prepare("UPDATE giocatori SET Stato = 0 WHERE IDGiocatore = " + newgiocatori[n].IDGiocatore)
                query.run();

                bot.sendMessage(Chat, "Hai ucciso: " + newgiocatori[n].Nome);
                bot.removeListener("message", handler);
            }
        }
    };
    //lhandler.handler.push(handler);
    bot.on("message", handler);
}

async function Veggente(idG, Chat, giocatori, nome) {
    let newgiocatori = giocatori.filter(giocatore => giocatore.IDGiocatore != idG);
    count = 0;
    let scelte = newgiocatori.map(giocatore => count++ + ": " + giocatore.Nome)
    let text = scelte.join('\n');

    bot.sendMessage(Chat, "Sei un " + nome.Nome + ": \nDi chi vuoi vedere il ruolo?\n" + text + "\n(Scrivi il numero della persona scelta)");

    let handler = (msg) => {
        if (msg.chat.id == Chat) {
            n = parseInt(msg.text);
            if (n != NaN && n < giocatori.length) {
                let query = db.prepare("SELECT ruoli.Nome AS Role FROM giocatori INNER JOIN ruoli on giocatori.Ruolo = ruoli.IDRuolo WHERE IDGiocatore = ?");
                let ruolo = query.get(newgiocatori[n].IDGiocatore);

                bot.sendMessage(msg.chat.id, newgiocatori[n].Nome + " è un: " + ruolo.Role);
                bot.removeListener("message", handler);
            }
        }
    };
    //lhandler.handler.push(handler);
    bot.on("message", handler);
}

async function Tutti(id) {
    let query = db.prepare('SELECT IDGiocatore, Stato, IDTelegram, Nome FROM Giocatori WHERE IDPartita = ?')
    let giocatori = query.all(id);
    let stati = ["Morto", "Vivo"];
    let elenco = giocatori.map(giocatore => [giocatore.Nome, stati[giocatore.Stato]].join(": "));

    query = db.prepare('SELECT ChatID FROM Partite WHERE IDPartita = ?');
    let chatid = query.get(id);
    bot.sendMessage(chatid.ChatID, "Elenco giornaliero: \n" + elenco.join("\n"));

    giocatori = giocatori.filter(giocatore => giocatore.Stato)
    giocatori.forEach((giocatore) => {

        let newgiocatori = giocatori.filter(scelta => scelta.IDGiocatore != giocatore.IDGiocatore);
        let count = 0;
        let scelte = newgiocatori.map(giocatore => count++ + ": " + giocatore.Nome);

        bot.sendMessage(giocatore.IDTelegram, "Chi vuoi linciare?\n" + scelte.join("\n") + "\n(Scrivi il numero della persona scelta)");

        let handler = (msg) => {
            if (msg.chat.id == giocatore.IDTelegram) {
                n = parseInt(msg.text);
                if (n != NaN && n < giocatori.length) {
                    let query = db.prepare("INSERT INTO Voti(IDGiocatore, IDPartita) VALUES(?,?)");
                    query.run(newgiocatori[n].IDGiocatore, id);

                    bot.sendMessage(msg.chat.id, "Hai votato: " + newgiocatori[n].Nome);
                    bot.removeListener("message", handler);
                }
            }
        };
        //lhandler.handler.push(handler);
        bot.on("message", handler);
    });
}


async function ControlloVoti(id) {
    let queryvoti = db.prepare("SELECT IDGiocatore FROM Voti WHERE IDPartita = ?");
    let voti = queryvoti.all(id);
    let countvoti = [];
    let idvoti = [];
    voti.forEach((voto) => {
        let idx
        if (idvoti.includes(voto.IDGiocatore)) {
            idx = idvoti.indexOf(voto.IDGiocatore);
            countvoti[idx]++;
        } else {
            idvoti.push(voto.IDGiocatore);
            countvoti.push(1);
        }
    });
    console.log(countvoti);

    let deletequery = db.prepare("DELETE FROM Voti WHERE IDPartita = ?");
    deletequery.run(id);

    let scelta = indexOfMax(countvoti);
    let idquery = db.prepare("SELECT ChatID FROM Partite WHERE IDPartita = ?");
    let idchat = idquery.get(id);
    if (scelta != -1 && scelta != undefined) {
        let query = db.prepare("UPDATE giocatori SET Stato = 0 WHERE IDGiocatore = ?")
        query.run(idvoti[scelta]);

        query = db.prepare("SELECT Nome FROM Giocatori WHERE IDGiocatore = ?");
        giocatore = query.get(idvoti[scelta]);

        bot.sendMessage(idchat.ChatID, "Avete ucciso: " + giocatore.Nome);
    } else {
        bot.sendMessage(idchat.ChatID, "La comunità non è arrivata ad una decisione quindi non è stato ucciso nessuno");
    }
}

function ClearHandler(lhandler) {
    lhandler.handler.forEach((handler) => {
        bot.removeListener("message", handler);
    })
}

function indexOfMax(arr) {
    if (arr.length === 0) {
        return -1;
    }

    var max = arr[0];
    var maxIndex = 0;

    for (var i = 1; i < arr.length; i++) {
        if (arr[i] > max) {
            maxIndex = i;
            max = arr[i];
        } else if (arr[i] = max) {
            maxIndex = -1;
        }
    }

    return maxIndex;
}

function sleep(ms) {
    return new Promise((resolve) => {
        setTimeout(resolve, ms);
    });
}
//#endregion


//#region Web
app.set("view engine", "ejs");
app.use(express.urlencoded({
    extended: true
}))

app.get("/", function(req, res) {
    let querytempo = db.prepare("SELECT * FROM impostazioni");
    let tempi = querytempo.get();
    let queryruoli = db.prepare("SELECT Nome FROM ruoli");
    let ruoli = queryruoli.all();

    res.render("admin", { Notte: tempi.TempoTurno, Giorno: tempi.TempoLinciaggio, Cont: ruoli[0].Nome, Lupo: ruoli[1].Nome, Vegg: ruoli[2].Nome });
})

app.post("/settings", function(req, res) {
    if (req.body.notte && req.body.giorno && req.body.cont && req.body.lupo && req.body.vegg) {

        let querytempi = db.prepare("UPDATE impostazioni SET TempoTurno = ?, TempoLinciaggio = ?");
        querytempi.run(req.body.notte, req.body.giorno);

        let ruoli = [req.body.cont, req.body.lupo, req.body.vegg];
        let count = 1;
        let queryruoli = db.prepare("UPDATE ruoli SET Nome = ? WHERE IDRuolo = ?");

        ruoli.forEach(ruolo => {
            queryruoli.run(ruolo, count);
            count++;
        });
    }


    res.redirect("/");
})

app.listen(port, () => console.log('In ascolto sulla porta ' + port));

//#endregion

//TODO
//TODO: Debug
//TODO: Admin per personalizzazione


/*{
    "userId": "666",
    "title": "10 ragioni per cui simpare per Eris",
    "body": "1. è una loli 2. è una tsundere 3. ha gli occhi rossi 4. è ricca 5. ha una mamma con delle nice oppai 6. il padre te la cede volentieri 7. fa dei bei regali 8. è innocente 9. la sua familgia ha un harem di nekomimi 10. perchè non dovresti?",
    "id": 101
  }*/