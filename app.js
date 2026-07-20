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

    const daten = JSON.parse(
        localStorage.getItem("cortasiell_inventar")
    );

    const url =
        "https://script.google.com/macros/s/AKfycbzm_S1hQLlZ814kh8tjgA_36k_EIfw_QHx0uBRF_ONJYzBsmrkOk3DcaZE3AQ96NBiJIQ/exec";

    console.log(url);

    try {

        const response = await fetch(url, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(daten)
        });

        const result = await response.text();

        alert("Synchronisiert: " + result);

    } catch (error) {

        alert("Fehler: " + error);

    }

}