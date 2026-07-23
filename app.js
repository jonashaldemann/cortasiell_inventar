console.log("App gestartet");

let inventur = {};

const fragen = [
    {
        typ: "info",
        text: "Zuerst beginnen wir mit der Haushaltskiste."
    },
    {
        typ: "ja_nein",
        ort: "Haushaltskiste",
        artikel: "Handseife"
    },
    {
        typ: "ja_nein",
        ort: "Haushaltskiste",
        artikel: "Abfallsäcke"
    },
    {
        typ: "info",
        text: "Nun gehen wir rüber zum Küchenregal."
    },
    {
        typ: "anzahl",
        ort: "Küchenregal",
        artikel: "Rotwein"
    }
];

let aktuelleFrage = 0;

zeigeFrage();

function zeigeFrage() {

    const frage = fragen[aktuelleFrage];

    document.getElementById("fortschritt").innerHTML =
        "Schritt " +
        (aktuelleFrage + 1) +
        " von " +
        fragen.length;

    if (frage.typ === "info") {

        document.getElementById("ort").innerHTML = "";

        document.getElementById("frage").innerHTML = `
            <h2>${frage.text}</h2>
            <button onclick="naechsteFrage()">Weiter</button>
        `;

    } else if (frage.typ === "ja_nein") {

        document.getElementById("ort").innerHTML =
            frage.ort;

        document.getElementById("frage").innerHTML = `
            <h2>${frage.artikel}</h2>
            <button onclick="antwortJa()">Ja</button>
            <button onclick="antwortNein()">Nein</button>
        `;

    } else if (frage.typ === "anzahl") {

        document.getElementById("ort").innerHTML =
            frage.ort;

        document.getElementById("frage").innerHTML = `
            <h2>${frage.artikel}</h2>

            <input
                type="number"
                id="anzahlFeld"
                value="0"
                min="0"
            >

            <button onclick="speichereAnzahl()">
                Speichern & Weiter
            </button>
        `;
    }
}


function antwortJa() {

    inventur[fragen[aktuelleFrage].artikel] = "ja";

    naechsteFrage();
}


function antwortNein() {

    inventur[fragen[aktuelleFrage].artikel] = "nein";

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

        document.getElementById("frage").innerHTML =
            "<h2>Inventur abgeschlossen ✅</h2>";
        
        document.getElementById("frage").innerHTML =
        `
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

    inventur[fragen[aktuelleFrage].artikel] = wert;

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
        "https://script.google.com/macros/s/AKfycbyAGvyV0_YfkcEzUfZ3Kc7jPHrerYB9_ljW_N2zYLqBzrHO0SgiB0rsfRD1phSgHWg7rQ/exec";

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