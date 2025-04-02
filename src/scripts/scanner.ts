import { RESIDENT_ID_REGEX, SCAN_DEBOUNCE } from "./constants.js";
import {
  showDropdown,
  hideDropdown,
  showNotification,
  updateResidentUI,
  playSuccessSound,
  highlightProfileInfo,
} from "./ui.js";
import { searchResident, addResidentEntry } from "./api.js";

const inputField = document.getElementById("search-input") as HTMLInputElement;
let debounceTimer: number | null = null;

/**
 * Initializes the resident ID scanner input with debounce + key event support
 */
export function initScanner() {
  if (!inputField) return;

  // Debounced search on input
  inputField.addEventListener("input", () => {
    if (debounceTimer) clearTimeout(debounceTimer);
    debounceTimer = window.setTimeout(() => {
      processInput();
    }, SCAN_DEBOUNCE);
  });

  // Process input immediately on Enter or Tab
  inputField.addEventListener("keydown", (e) => {
    if (e.key === "Enter" || e.key === "Tab") {
      e.preventDefault();
      processInput();
    }
  });
}

/**
 * Processes the scanned or typed input:
 * - If valid resident ID, tries to add entry
 * - Otherwise, performs name-based search
 */
async function processInput() {
  if (debounceTimer) {
    clearTimeout(debounceTimer);
    debounceTimer = null;
  }

  const inputVal = inputField.value.trim();
  if (!inputVal) {
    hideDropdown();
    return;
  }

  // If ID is valid, attempt entry
  if (RESIDENT_ID_REGEX.test(inputVal)) {
    try {
      await addResidentEntry(inputVal);
      highlightProfileInfo("success");
      playSuccessSound();
      showNotification(`Resident entry added for ${inputVal}`, "success");
    } catch (error) {
      highlightProfileInfo("info");
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";

      if (errorMessage.includes("already has an active access record")) {
        showNotification(
          "Resident is already inside. Fetching latest logs...",
          "info",
        );
      } else {
        showNotification(
          `Error adding resident entry: ${errorMessage}`,
          "error",
        );
      }
    } finally {
      try {
        const found = await searchResident(inputVal);
        if (found.length > 0) {
          await updateResidentUI(found[0]);
        }
      } catch (err) {
        console.error("Error updating resident UI:", err);
        showNotification(
          "Error fetching resident data after entry attempt",
          "error",
        );
      }

      inputField.value = "";
      hideDropdown();
    }
  } else {
    // If input isn't a valid ID, perform search (e.g. by name or other field)
    try {
      const results = await searchResident(inputVal);
      showDropdown(results);
    } catch (err) {
      console.error("Search error:", err);
      showNotification("Error searching residents", "error");
    }
  }
}
