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
const imageCard = document.querySelector(".image-card");

// Helper Functions
function displayImage(url) {
    if (!imgElement) return;

    imgElement.src = url;

    // When the image loads, fade it in and hide loader text
    imgElement.onload = () => {
        imgElement.classList.remove("hidden");
        imgElement.classList.add("visible");
        if (loader) loader.style.display = "none";
        if (statusText) statusText.textContent = "Today’s weather snapshot from Zurich, Switzerland.";
        if (imageCard) imageCard.classList.add("image-card--ready");
    };

    // Handle case where image is already cached by the browser
    if (imgElement.complete) {
        imgElement.classList.remove("hidden");
        imgElement.classList.add("visible");
        if (loader) loader.style.display = "none";
        if (statusText) statusText.textContent = "Today’s weather snapshot from Zurich, Switzerland.";
        if (imageCard) imageCard.classList.add("image-card--ready");
    }
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

        // Success, display the cached image
        const imageUrl = serverState.imageUrl;
        updateStatus("Found today’s image. Loading…");
        displayImage(imageUrl);
    } catch (error) {
        console.error("Failed to fetch image from Firebase:", error);
        updateStatus("Error: Could not load the image cache.");
    }
}

// Run the function when the script loads
fetchCachedImage();

