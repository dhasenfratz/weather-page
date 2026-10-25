let database;
let dbRef;

const firebaseConfig = {
    apiKey: "AIzaSyAXckWU2EtVRwhYQ79y76mT2imiHM1mpmE",
    authDomain: "the-weather-a7ff2.firebaseapp.com",
    projectId: "the-weather-a7ff2",
    storageBucket: "the-weather-a7ff2.firebasestorage.app",
    messagingSenderId: "110141438628",
    appId: "1:110141438628:web:6f263dde4a566a69fec431",
    measurementId: "G-GTD2VM0LXS",
    databaseURL: "https://the-weather-a7ff2-default-rtdb.europe-west1.firebasedatabase.app"
};

// Initialize Firebase
if (typeof firebase !== "undefined") {
    firebase.initializeApp(firebaseConfig);
    database = firebase.database();
    // Reference the node where the Cloud Function saves the image data
    dbRef = database.ref("dailyImage");
} else {
    console.error("Firebase SDK not loaded. Check script tags in index.html.");
}

// DOM Elements
const imgElement = document.getElementById("daily-image");
const loader = document.getElementById("loader");
const statusText = document.getElementById("status-text");
const weatherText = document.getElementById("weather-text");
const eraRow = document.getElementById("era-row");
const eraButtons = document.getElementById("era-buttons");
const eraHeadline = document.getElementById("era-headline");

// Helper Functions
function showImage(image) {
    if (!imgElement) return;

    const reveal = () => {
        imgElement.classList.add("visible");
        if (loader) loader.style.display = "none";
        if (eraHeadline) eraHeadline.textContent = image.year ? `Zurich, ${image.year}` : "";
        if (statusText) statusText.textContent = image.note || "Today’s weather in Zurich, drawn in another year.";
    };

    imgElement.alt = image.year
        ? `Isometric miniature of Zurich in the year ${image.year}, in today’s weather`
        : "Isometric miniature of Zurich in today’s weather";

    // When the image loads, fade it in and hide loader text
    imgElement.onload = reveal;
    imgElement.src = image.imageUrl;

    // Handle case where image is already cached by the browser
    if (imgElement.complete && imgElement.naturalWidth > 0) {
        reveal();
    }
}

function setupEraButtons(images, selectedIndex) {
    if (!eraButtons || !eraRow) return;

    const buttons = images.map((image, index) => {
        const button = document.createElement("button");
        button.type = "button";
        button.className = "era-button";
        button.textContent = image.year;
        button.setAttribute("aria-pressed", String(index === selectedIndex));
        button.addEventListener("click", () => {
            buttons.forEach((b) => b.setAttribute("aria-pressed", String(b === button)));
            showImage(image);
        });
        return button;
    });

    eraButtons.replaceChildren(...buttons);
    eraRow.classList.remove("hidden");

    // Preload the other years so switching is instant
    images.forEach((image, index) => {
        if (index !== selectedIndex) new Image().src = image.imageUrl;
    });
}

function displayImages(serverState) {
    const images = (serverState.images || [])
        .filter((image) => image && image.imageUrl)
        .sort((a, b) => Number(a.year) - Number(b.year));

    if (!images.length) {
        // Older entries only have a single image without a year
        showImage({ imageUrl: serverState.imageUrl });
        return;
    }

    // Start with the image the function marked as the main one (the recent past)
    const mainIndex = images.findIndex((image) => image.imageUrl === serverState.imageUrl);
    const selectedIndex = mainIndex >= 0 ? mainIndex : Math.floor(images.length / 2);

    setupEraButtons(images, selectedIndex);
    showImage(images[selectedIndex]);
}

function displayWeather(serverState) {
    const { weather, temperature } = serverState;
    if (!weatherText || !weather || !temperature || temperature === "N/A") return;
    weatherText.textContent = `Today in Zurich: ${weather} · ${temperature}`;
}

function updateStatus(text) {
    if (loader) loader.textContent = text;
    if (statusText) statusText.textContent = text;
}

async function fetchCachedImage() {
    if (typeof firebase === "undefined" || !dbRef || !imgElement) {
        updateStatus("Error: Initialization failed.");
        return;
    }

    try {
        updateStatus("Connecting to the cache…");

        // Read the latest data from the database
        const snapshot = await dbRef.once("value");
        const serverState = snapshot.val();

        if (!serverState || !serverState.imageUrl) {
            const errorMsg = "Image not yet generated. The scheduler will drop in today’s picture soon.";
            updateStatus(errorMsg);
            console.error(errorMsg);
            return;
        }

        // Success, display the cached images
        updateStatus("Found today’s images. Loading…");
        displayWeather(serverState);
        displayImages(serverState);
    } catch (error) {
        console.error("Failed to fetch image from Firebase:", error);
        updateStatus("Error: Could not load the image cache.");
    }
}

// Run the function when the script loads
fetchCachedImage();
