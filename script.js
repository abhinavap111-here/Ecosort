
/*
  ECOSORT - Waste Classification

  Replace MODEL_URL with your Teachable Machine model URL.
  Keep the URL inside quotation marks and include the final slash.
*/

const MODEL_URL = "https://teachablemachine.withgoogle.com/models/JGTvJGg8U/";

// Website elements
const imageInput = document.getElementById("imageInput");
const previewImage = document.getElementById("previewImage");
const uploadPrompt = document.getElementById("uploadPrompt");
const dropzone = document.getElementById("dropzone");
const fileInfo = document.getElementById("fileInfo");
const classifyBtn = document.getElementById("classifyBtn");

const emptyResult = document.getElementById("emptyResult");
const loadingResult = document.getElementById("loadingResult");
const predictionResult = document.getElementById("predictionResult");
const errorMessage = document.getElementById("errorMessage");

const categoryName = document.getElementById("categoryName");
const categoryIcon = document.getElementById("categoryIcon");
const confidenceValue = document.getElementById("confidenceValue");
const confidenceBar = document.getElementById("confidenceBar");
const allPredictions = document.getElementById("allPredictions");

let model = null;
let imageReady = false;
let isClassifying = false;
let imageObjectURL = null;

// Change these icons to match your model's class names if desired.
function getCategoryIcon(label) {
  const name = label.toLowerCase();

  if (/plastic/.test(name)) return "🧴";
  if (/paper|cardboard/.test(name)) return "📄";
  if (/glass/.test(name)) return "🍾";
  if (/metal|aluminium|aluminum|tin|can/.test(name)) return "🥫";
  if (/organic|food|compost|biodegradable/.test(name)) return "🌱";
  if (/electronic|e-waste|battery/.test(name)) return "🔋";
  if (/general|mixed|residual|landfill/.test(name)) return "🗑️";

  return "♻️";
}

function showError(message) {
  errorMessage.textContent = message;
  errorMessage.hidden = false;
}

function hideError() {
  errorMessage.hidden = true;
  errorMessage.textContent = "";
}

// Display the selected image.
imageInput.addEventListener("change", () => {
  const file = imageInput.files[0];

  if (!file) return;

  hideError();

  if (!file.type.startsWith("image/")) {
    showError("Please choose a valid image file.");
    return;
  }

  if (imageObjectURL) {
    URL.revokeObjectURL(imageObjectURL);
  }

  imageObjectURL = URL.createObjectURL(file);
  imageReady = false;
  classifyBtn.disabled = true;
  fileInfo.textContent = "Loading image...";

  previewImage.onload = () => {
    imageReady = true;
    previewImage.hidden = false;
    uploadPrompt.hidden = true;
    fileInfo.textContent = file.name;
    classifyBtn.disabled = false;

    // Clear the previous prediction when a new image is selected.
    predictionResult.hidden = true;
    emptyResult.hidden = false;
  };

  previewImage.onerror = () => {
    imageReady = false;
    classifyBtn.disabled = true;
    fileInfo.textContent = "Could not load image.";
    showError("This image could not be opened. Please try another file.");
  };

  previewImage.src = imageObjectURL;
});

// Load the hosted Teachable Machine model.
async function loadModel() {
  if (model) return model;

  if (
    MODEL_URL.includes("PASTE_YOUR") ||
    !MODEL_URL.startsWith("https://")
  ) {
    throw new Error(
      "Add your actual Teachable Machine model URL at the top of script.js."
    );
  }

  const baseURL = MODEL_URL.endsWith("/")
    ? MODEL_URL
    : MODEL_URL + "/";

  model = await tmImage.load(
    baseURL + "model.json",
    baseURL + "metadata.json"
  );

  return model;
}

// Run the model on the uploaded image.
classifyBtn.addEventListener("click", async () => {
  if (!imageReady || isClassifying) return;

  isClassifying = true;
  classifyBtn.disabled = true;
  classifyBtn.innerHTML = "<span>✦</span> Analyzing...";
  hideError();

  emptyResult.hidden = true;
  predictionResult.hidden = true;
  loadingResult.hidden = false;

  try {
    const trainedModel = await loadModel();
    const predictions = await trainedModel.predict(previewImage);

    // Highest-scoring class first.
    predictions.sort((a, b) => b.probability - a.probability);

    const best = predictions[0];
    const confidence = best.probability * 100;

    categoryName.textContent = best.className;
    categoryIcon.textContent = getCategoryIcon(best.className);
    confidenceValue.textContent = confidence.toFixed(1) + "%";
    confidenceBar.style.width = confidence + "%";

    // Show the score for every class.
    allPredictions.replaceChildren();

    for (const prediction of predictions) {
      const score = prediction.probability * 100;

      const row = document.createElement("div");
      row.className = "prediction-row";

      const name = document.createElement("span");
      name.className = "prediction-name";
      name.textContent = prediction.className;

      const track = document.createElement("div");
      track.className = "mini-track";

      const fill = document.createElement("div");
      fill.className = "mini-fill";
      fill.style.width = score + "%";
      track.appendChild(fill);

      const percentage = document.createElement("span");
      percentage.className = "prediction-score";
      percentage.textContent = score.toFixed(1) + "%";

      row.append(name, track, percentage);
      allPredictions.appendChild(row);
    }

    loadingResult.hidden = true;
    predictionResult.hidden = false;

  } catch (error) {
    console.error("Classification error:", error);
    loadingResult.hidden = true;
    emptyResult.hidden = false;

    showError(
      error.message ||
      "Could not load the model. Check your internet connection and model URL."
    );
  } finally {
    isClassifying = false;
    classifyBtn.disabled = !imageReady;
    classifyBtn.innerHTML = "<span>✦</span> Classify Waste";
  }
});

// Allow users to drag and drop images onto the upload area.
dropzone.addEventListener("dragover", (event) => {
  event.preventDefault();
});

dropzone.addEventListener("drop", (event) => {
  event.preventDefault();

  const file = event.dataTransfer.files[0];

  if (file && file.type.startsWith("image/")) {
    imageInput.files = event.dataTransfer.files;
    imageInput.dispatchEvent(new Event("change"));
  }
});
