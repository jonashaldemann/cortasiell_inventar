console.log("App gestartet");

let inventur = [];

async function ladeFragen() {

    const url =
        "https://script.google.com/macros/s/AKfycbwyULYD24vxZhq4wL0vdhqBgeMh9bqAeFl-ztSVnJcUb8G145OzfPaefyrtEeEjLuf7hg/exec";

    const response = await fetch(url);

    fragen = await response.json();

    console.log("Fragen geladen:", fragen);

    zeigeFrage();
}

let fragen = [];

let aktuelleFrage = 0;

ladeFragen();

function zeigeFrage() {

    if (!fragen[aktuelleFrage]) {

        console.log("Keine weitere Frage vorhanden");

        return;
    }

    const frage = fragen[aktuelleFrage];

    console.log(frage);

    console.log(
        "Typ:",
        "[" + frage.erfassungstyp + "]"
    );


    console.log(
        frage.produkt,
        frage.erfassungstyp,
        typeof frage.erfassungstyp
    );

    document.getElementById("fortschritt").innerHTML =
        "Schritt " +
        (aktuelleFrage + 1) +
        " von " +
        fragen.length;

    document.getElementById("ort").innerHTML =
        frage.ort;

const typ =
    String(frage.erfassungstyp).trim();

    if (typ === "Menge") {

        document.getElementById("frage").innerHTML = `
            <h2>${frage.produkt}</h2>

            <p>Einheit: ${frage.einheit}</p>

            <input
                type="number"
                id="anzahlFeld"
                value="${frage.info || 0}"
                min="0"
            >

            <button onclick="speichereAnzahl()">
                Speichern & Weiter
            </button>
        `;

    } else {

        let frageText = frage.produkt;

        if (typ === "vorhanden") {

            frageText =
                `Ist ${frage.produkt} vorhanden?`;

        } else if (typ === "genügend") {

            frageText =
                `Ist genügend ${frage.produkt} vorhanden?`;

        } else if (!isNaN(Number(typ))) {

            frageText =
                `Sind mindestens ${typ} ${frage.einheit} ${frage.produkt} vorhanden?`;

        }

        document.getElementById("frage").innerHTML = `
            <h2>${frageText}</h2>

            <button onclick="antwortJa()">Ja</button>

            <button onclick="antwortNein()">Nein</button>
        `;
    }    

}


function antwortJa() {

    inventur.push({
        zeile: fragen[aktuelleFrage].zeile,
        wert: "ja"
    });
    naechsteFrage();
}


function antwortNein() {

    inventur.push({
        zeile: fragen[aktuelleFrage].zeile,
        wert: "nein"
    });

    naechsteFrage();
}

function naechsteFrage() {

    aktuelleFrage++;

    if (aktuelleFrage < fragen.length) {

        zeigeFrage();

    } else {

        localStorage.setItem(
            "cortasiell_inventar",
            JSON.stringify(inventur)
        );

        document.getElementById("frage").innerHTML = `
            <h2>Inventur abgeschlossen ✅</h2>

            <pre>
${JSON.stringify(inventur, null, 2)}
            </pre>

            <button onclick="synchronisieren()">
                Synchronisieren
            </button>
        `;
    }

}

function speichereAnzahl() {

    const wert =
        document.getElementById("anzahlFeld").value;

    inventur.push({
        zeile: fragen[aktuelleFrage].zeile,
        wert: wert
    });

    naechsteFrage();
}

function zeigeSpeicher() {

    let ausgabe = "";

    for (let i = 0; i < localStorage.length; i++) {

        const key = localStorage.key(i);
        const value = localStorage.getItem(key);

        ausgabe += key + ": " + value + "\n";
    }

    alert(ausgabe);
}

if ("serviceWorker" in navigator) {

    navigator.serviceWorker
        .register("./service-worker.js")
        .then(() => {

            console.log("Service Worker registriert");

        });

}

async function synchronisieren() {

    const url =
        "https://script.google.com/macros/s/AKfycbwyULYD24vxZhq4wL0vdhqBgeMh9bqAeFl-ztSVnJcUb8G145OzfPaefyrtEeEjLuf7hg/exec";

    // Eindeutige ID für diese Übertragung, damit wir sie später
    // im Sheet wiederfinden und bestätigen können.
    const syncId =
        "sync_" + Date.now() + "_" +
        Math.random().toString(36).slice(2, 8);

    const payload = {
        id: syncId,
        daten: inventur
    };

    zeigeSyncStatus("Übertrage...");

    try {

        // Senden bleibt bewusst no-cors: die Antwort von doPost
        // wollen wir hier gar nicht lesen, nur die Daten hinschicken.
        await fetch(url, {
            method: "POST",
            mode: "no-cors",
            body: JSON.stringify(payload)
        });

        const bestaetigt = await warteAufBestaetigung(url, syncId);

        if (bestaetigt) {

            zeigeSyncStatus("Inventur übertragen ✅ (bestätigt)");

            localStorage.setItem(
                "synchronisiert",
                "ja"
            );

        } else {

            zeigeSyncStatus(
                "⚠️ Gesendet, aber nicht bestätigt. " +
                "Bitte später erneut versuchen."
            );

        }

    } catch (error) {

        console.error(error);

        zeigeSyncStatus("❌ Fehler beim Senden: " + error);

    }

}

// Fragt per doGet (normaler, unproblematischer Cross-Origin-GET)
// wiederholt nach, ob die gesendete ID im Sheet angekommen ist.
async function warteAufBestaetigung(url, syncId, versuche = 5, wartezeitMs = 1500) {

    for (let i = 0; i < versuche; i++) {

        await warte(wartezeitMs);

        try {

            const antwort = await fetch(
                url + "?checkId=" + encodeURIComponent(syncId)
            );

            const text = (await antwort.text()).trim();

            if (text === "OK") {
                return true;
            }

        } catch (error) {

            console.error("Prüfung fehlgeschlagen:", error);

        }

    }

    return false;

}

function warte(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

function zeigeSyncStatus(text) {

    let statusEl = document.getElementById("syncStatus");

    if (!statusEl) {

        statusEl = document.createElement("p");
        statusEl.id = "syncStatus";

        document.getElementById("frage").appendChild(statusEl);

    }

    statusEl.innerHTML = text;

}