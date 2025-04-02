import { RESIDENT_ID_REGEX, SCAN_DEBOUNCE } from "./constants.js";
import { addResidentExit, latestAccesses, searchResident } from "./api.js";
import {
  showNotification,
  updateAccessLogTable,
  updateResidentUI,
} from "./ui.js";

const inputField = document.getElementById("search-input") as HTMLInputElement;
let debounceTimer: number | null = null;

/**
 * Highlights the profile info section with success or error glow for 3 seconds
 */
function highlightProfileInfo(status: "success" | "error"): void {
  const profileInfo = document.getElementById("profile-info");
  if (!profileInfo) return;

  profileInfo.classList.remove("success-glow", "error-glow");
  profileInfo.classList.add(
    status === "success" ? "success-glow" : "error-glow",
  );

  setTimeout(() => {
    profileInfo.classList.remove("success-glow", "error-glow");
  }, 3000);
}

/**
 * Processes resident exit: validates input, calls API, updates UI
 */
const processExit = async () => {
  const input = inputField.value.trim();

  if (debounceTimer) {
    clearTimeout(debounceTimer);
    debounceTimer = null;
  }

  if (!input) {
    highlightProfileInfo("error");
    showNotification("Please scan a resident ID.", "error");
    return;
  }

  if (!RESIDENT_ID_REGEX.test(input)) {
    highlightProfileInfo("error");
    showNotification("Invalid resident ID format.", "error");
    return;
  }

  try {
    await addResidentExit(input);
    highlightProfileInfo("success");
    showNotification("Resident exit recorded.", "success");
  } catch (error) {
    highlightProfileInfo("error");
    const message =
      error instanceof Error ? error.message : "Error recording resident exit";
    showNotification(message, "error");
  } finally {
    inputField.value = "";

    // Update access logs
    try {
      const accesses = await latestAccesses(input);
      updateAccessLogTable(accesses);
    } catch {
      console.error("Failed to fetch access logs after exit.");
    }

    // Update resident UI
    try {
      const found = await searchResident(input);
      if (found.length > 0) {
        await updateResidentUI(found[0]);
      }
    } catch {
      console.error("Failed to update resident UI after exit.");
      showNotification("Error updating resident UI after exit", "error");
    }
  }
};

/**
 * Initializes the exit scanner with debounced input + keyboard handling
 */
export const initExitScanner = () => {
  if (!inputField) return;

  // Debounced input handler
  inputField.addEventListener("input", () => {
    if (debounceTimer) clearTimeout(debounceTimer);
    debounceTimer = window.setTimeout(() => processExit(), SCAN_DEBOUNCE);
  });

  // Enter or Tab triggers immediate exit processing
  inputField.addEventListener("keydown", (e) => {
    if (e.key === "Enter" || e.key === "Tab") {
      e.preventDefault();
      processExit();
    }
  });

  // On blur, process if there's a value
  inputField.addEventListener("blur", () => {
    if (inputField.value.trim() !== "") {
      processExit();
    }
  });
};
