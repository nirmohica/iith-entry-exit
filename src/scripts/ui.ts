let hasAttachedKeyboard = false;
let selectedIndex = -1;
let hideTimeout: ReturnType<typeof setTimeout> | null = null;

export function initUI() {
  if (!hasAttachedKeyboard) {
    attachGlobalKeyboardListener();
    hasAttachedKeyboard = true;
  }

  const visitorsSection = document.getElementById("visitors-section");
  const otpGroup = document.getElementById("otp-group");

  if (!visitorsSection || !otpGroup) {
    console.error("[initUI] Required UI elements not found.");
    return;
  }

  visitorsSection.classList.add("disabled");
  otpGroup.classList.add("hidden");
}

export function playSuccessSound() {
  const audio = new Audio("/assets/success.mov");
  audio.volume = 0.2;
  audio.play().catch((err) => console.error("Audio play error:", err));
}

/**
 * Renders a dropdown with resident search results
 */
export function showDropdown(results: any[]) {
  const dropdown = document.getElementById("search-results");
  if (!dropdown) return;

  if (!results.length) {
    hideDropdown();
    return;
  }

  const wasHidden = !dropdown.classList.contains("show");
  if (wasHidden) {
    dropdown.classList.add("show");
    dropdown.classList.remove("hidden");
    dropdown.offsetHeight;
  }

  const oldHeight = dropdown.offsetHeight;
  dropdown.innerHTML = "";
  selectedIndex = -1;

  results.forEach((res: any, idx: number) => {
    const li = document.createElement("li");
    li.setAttribute("data-index", idx.toString());

    const img = document.createElement("img");
    img.classList.add("thumb");
    img.src = res.photo || "/assets/photo-placeholder.jpg";
    li.appendChild(img);

    const title = document.createElement("div");
    title.classList.add("title");
    title.textContent = res.name || "Unknown";

    const subtitle = document.createElement("div");
    subtitle.classList.add("subtitle");
    subtitle.textContent = `${res.resident_id || ""} · ${res.department || ""}`;

    li.appendChild(title);
    li.appendChild(subtitle);

    li.addEventListener("click", async () => {
      const input = document.getElementById("search-input") as HTMLInputElement;
      if (input) input.value = "";
      hideDropdown();
      await updateResidentUI(res);
    });

    li.addEventListener("mouseover", () => {
      clearHighlights(dropdown);
      li.classList.add("highlight");
      selectedIndex = idx;
    });

    dropdown.appendChild(li);
  });

  const newHeight = dropdown.scrollHeight;
  dropdown.style.height = `${oldHeight}px`;
  dropdown.offsetHeight;
  dropdown.style.transition = "height 0.3s ease, opacity 0.3s ease";
  dropdown.style.height = `${newHeight}px`;
  dropdown.style.opacity = "1";

  dropdown.addEventListener("transitionend", function handler(e) {
    if (e.propertyName === "height") {
      dropdown.style.height = "auto";
      dropdown.style.transition = "";
      dropdown.removeEventListener("transitionend", handler);
    }
  });

  // Auto-highlight first item
  const items = dropdown.querySelectorAll("li");
  if (items.length > 0) {
    selectedIndex = 0;
    highlightItem(items, 0, dropdown);
  }
}

/**
 * Hides the dropdown with transition
 */
export function hideDropdown() {
  const dropdown = document.getElementById("search-results");
  if (!dropdown || !dropdown.classList.contains("show")) return;

  const oldHeight = dropdown.offsetHeight;
  dropdown.style.height = `${oldHeight}px`;
  dropdown.offsetHeight;

  dropdown.style.transition = "height 0.3s ease, opacity 0.3s ease";
  dropdown.style.height = "0px";
  dropdown.style.opacity = "0";

  dropdown.addEventListener("transitionend", function handler(e) {
    if (e.propertyName === "height") {
      dropdown.classList.remove("show");
      dropdown.classList.add("hidden");
      dropdown.style.height = "";
      dropdown.style.transition = "";
      dropdown.style.opacity = "";
      dropdown.removeEventListener("transitionend", handler);
    }
  });
}

function attachGlobalKeyboardListener() {
  document.addEventListener("keydown", (e) => {
    const dropdown = document.getElementById("search-results");
    if (!dropdown || !dropdown.classList.contains("show")) return;

    const items = dropdown.querySelectorAll("li");
    if (!items.length) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      selectedIndex = (selectedIndex + 1) % items.length;
      highlightItem(items, selectedIndex, dropdown);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      selectedIndex = (selectedIndex - 1 + items.length) % items.length;
      highlightItem(items, selectedIndex, dropdown);
    } else if (e.key === "Enter" && selectedIndex >= 0) {
      e.preventDefault();
      (items[selectedIndex] as HTMLLIElement).click();
    }
  });
}

function highlightItem(
  items: NodeListOf<HTMLLIElement>,
  index: number,
  dropdown: HTMLElement,
) {
  clearHighlights(dropdown);
  if (index >= 0 && index < items.length) {
    const li = items[index];
    li.classList.add("highlight");
    li.scrollIntoView({ block: "nearest" });
  }
}

function clearHighlights(dropdown: HTMLElement) {
  dropdown
    .querySelectorAll(".highlight")
    .forEach((el) => el.classList.remove("highlight"));
}

/**
 * Temporarily highlights profile info with glow
 */
export function highlightProfileInfo(status: "success" | "error" | "info") {
  const profileInfo = document.getElementById("profile-info");
  if (!profileInfo) return;

  profileInfo.classList.remove("success-glow", "error-glow", "info-glow");
  profileInfo.classList.add(`${status}-glow`);

  setTimeout(() => {
    profileInfo.classList.remove("success-glow", "error-glow", "info-glow");
  }, 5000);
}

/**
 * Displays a temporary notification box with message
 */
export function showNotification(message: string, type: string) {
  const notification = document.getElementById("notification");
  if (!notification) return;

  if (hideTimeout) {
    clearTimeout(hideTimeout);
    hideTimeout = null;
  }

  notification.className = "notification";
  notification.style.display = "block";

  const iconName = "info"; // Customize per type if desired
  notification.innerHTML = `<span data-lucide="${iconName}"></span><span class="msg-text">${message}</span>`;

  if (window.lucide) window.lucide.createIcons();

  notification.classList.add("show");

  hideTimeout = setTimeout(() => hideNotification(), 20000);
  notification.onclick = () => hideNotification();
}

function hideNotification() {
  const notification = document.getElementById("notification");
  if (!notification) return;

  if (hideTimeout) {
    clearTimeout(hideTimeout);
    hideTimeout = null;
  }

  notification.classList.add("fade-out");

  notification.addEventListener(
    "transitionend",
    function handler(e) {
      if (e.propertyName === "opacity") {
        notification.style.display = "none";
        notification.classList.remove("show", "fade-out");
        notification.removeEventListener("transitionend", handler);
      }
    },
    { once: true },
  );
}

/**
 * Fills the access log table with resident entry/exit data
 */
function formatMyDate(ts: string): string {
  const d = new Date(ts);
  const time = d.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
  const date = d.toLocaleDateString("en-US", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
  return `${time} · ${date}`;
}

export function updateAccessLogTable(accesses: any[]) {
  const tbody = document.querySelector("#access-log-table tbody");
  if (!tbody) return;
  tbody.innerHTML = "";

  accesses.forEach((a: any) => {
    const tr = document.createElement("tr");

    const tdEntry = document.createElement("td");
    tdEntry.textContent = a.entry_time ? formatMyDate(a.entry_time) : "";

    const tdExit = document.createElement("td");
    tdExit.textContent = a.exit_time ? formatMyDate(a.exit_time) : "---";

    tr.appendChild(tdEntry);
    tr.appendChild(tdExit);
    tbody.appendChild(tr);
  });
}

/**
 * Updates the main UI with resident profile + recent accesses
 */
export async function updateResidentUI(res: any) {
  const photoEl = document.getElementById("profile-photo") as HTMLImageElement;
  const nameEl = document.getElementById("resident-name") as HTMLHeadingElement;
  const deptEl = document.getElementById(
    "resident-department",
  ) as HTMLSpanElement;
  const rollEl = document.getElementById("resident-roll") as HTMLSpanElement;

  if (photoEl) photoEl.src = res.photo || "/assets/photo-placeholder.jpg";
  if (nameEl) nameEl.textContent = res.name || "Unknown";
  if (deptEl) deptEl.textContent = res.department || "";
  if (rollEl) rollEl.textContent = res.resident_id || "";

  const visitorsSection = document.getElementById("visitors-section");
  if (visitorsSection) {
    visitorsSection.classList.toggle("disabled", !res || !res.resident_id);
  }

  if (res.resident_id) {
    const { latestAccesses } = await import("./api.js");
    const accesses = await latestAccesses(res.resident_id);
    updateAccessLogTable(accesses);
  }
}
