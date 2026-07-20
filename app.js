console.log("App gestartet");

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

    localStorage.setItem(
        fragen[aktuelleFrage].artikel,
        "ja"
    );

    naechsteFrage();
}


function antwortNein() {

    localStorage.setItem(
        fragen[aktuelleFrage].artikel,
        "nein"
    );

    naechsteFrage();
}

function naechsteFrage() {

    aktuelleFrage++;

    if (aktuelleFrage < fragen.length) {

        zeigeFrage();

    } else {

        document.getElementById("frage").innerHTML =
            "<h2>Inventur abgeschlossen ✅</h2>";
    }

}

function speichereAnzahl() {

    const wert =
        document.getElementById("anzahlFeld").value;

    localStorage.setItem(
        fragen[aktuelleFrage].artikel,
        wert
    );

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