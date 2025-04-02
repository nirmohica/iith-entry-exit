import {
  addVisitorEntry,
  cancelVisitorAccess,
  verifyVisitorOTP,
} from "./api.js";
import { showNotification } from "./ui.js";

let pendingAccessId: number | null = null;

/**
 * Initializes visitor entry UI: form handlers, OTP logic, and cancel flow
 */
export function initGuests() {
  const addVisitorBtn = document.getElementById("add-visitor-btn");
  const confirmBtn = document.getElementById("confirm-visitors-btn");
  const visitorsListEl = document.getElementById("visitors-list");
  const cancelBtn = document.getElementById("cancel-visitors-btn");
  const otpGroup = document.getElementById("otp-group");
  const validateOtpBtn = document.getElementById("validate-otp-btn");
  const otpInput = document.getElementById("otp-input") as HTMLInputElement;

  if (
    !addVisitorBtn ||
    !confirmBtn ||
    !visitorsListEl ||
    !cancelBtn ||
    !validateOtpBtn ||
    !otpGroup
  ) {
    console.error("Guests: Required elements not found in the DOM.");
    return;
  }

  // Add new visitor row
  addVisitorBtn.addEventListener("click", () => {
    const row = createVisitorRow();
    visitorsListEl.appendChild(row);
  });

  // Confirm and submit visitor entries
  confirmBtn.addEventListener("click", async () => {
    const rows = visitorsListEl.querySelectorAll(".visitor-row");
    if (!rows.length) {
      showNotification("No visitors to confirm!", "error");
      return;
    }

    const visitorNames: string[] = [];
    const visitorAddresses: string[] = [];

    rows.forEach((row) => {
      const nameEl = row.querySelector(".visitor-name") as HTMLInputElement;
      const addrEl = row.querySelector(".visitor-address") as HTMLInputElement;

      const name = nameEl.value.trim();
      const address = addrEl.value.trim();

      if (!name) {
        showNotification(
          "One of the visitor names is blank, ignoring this row.",
          "error",
        );
        return;
      }

      visitorNames.push(name);
      visitorAddresses.push(address);
    });

    if (!visitorNames.length) {
      showNotification(
        "All visitors were blank – nothing to confirm.",
        "error",
      );
      return;
    }

    const vehicleNumberEl = document.getElementById(
      "vehicle-number",
    ) as HTMLInputElement;
    const vehicleNumber = vehicleNumberEl?.value.trim() || null;
    const vehicleType = null;
    const expectedStay = "3 days";

    const residentIdEl = document.getElementById("resident-roll");
    if (!residentIdEl || !residentIdEl.textContent) {
      showNotification("No resident ID found on the page.", "error");
      return;
    }
    const residentId = residentIdEl.textContent.trim();

    try {
      const data = await addVisitorEntry(
        residentId,
        visitorNames,
        vehicleNumber,
        vehicleType,
        expectedStay,
      );

      pendingAccessId = data.accessId;

      if (/.*OTP.*/.test(data.message)) {
        showNotification(`OTP generated: ${data.otp}`, "info");
        otpGroup.classList.remove("hidden");
      } else {
        showNotification(
          "Visitors added successfully (no OTP required).",
          "success",
        );
      }
    } catch (error) {
      console.error("Error adding visitor entry:", error);
      showNotification("Error adding visitors", "error");
    }
  });

  // Cancel pending visitor entry
  cancelBtn.addEventListener("click", async () => {
    if (!pendingAccessId) {
      showNotification("No pending visitor entry to cancel.", "error");
      return;
    }

    try {
      await cancelVisitorAccess(pendingAccessId);
      showNotification("Visitor access canceled.", "success");
    } catch (err) {
      console.error("Cancel visitor access error:", err);
      showNotification("Error canceling visitor access", "error");
    } finally {
      pendingAccessId = null;
      otpGroup.classList.add("hidden");
    }
  });

  // Validate OTP
  validateOtpBtn.addEventListener("click", async () => {
    if (!pendingAccessId) {
      showNotification("No pending visitor entry to validate.", "error");
      return;
    }
    const typedOtp = otpInput.value.trim();
    if (!typedOtp) {
      showNotification("Please enter the OTP.", "error");
      return;
    }

    try {
      await verifyVisitorOTP(pendingAccessId, typedOtp);
      showNotification("OTP verified successfully!", "success");
      otpGroup.classList.add("hidden");
      pendingAccessId = null;
    } catch (err) {
      console.error("OTP verify error:", err);
      showNotification("Invalid or expired OTP!", "error");
    }
  });
}

/**
 * Creates a new DOM row for entering visitor details
 */
function createVisitorRow(): HTMLDivElement {
  const row = document.createElement("div");
  row.classList.add("visitor-row");

  const nameInput = document.createElement("input");
  nameInput.type = "text";
  nameInput.classList.add("visitor-name");
  nameInput.placeholder = "Visitor name";

  const addressInput = document.createElement("input");
  addressInput.type = "text";
  addressInput.classList.add("visitor-address");
  addressInput.placeholder = "From address";

  const removeBtn = document.createElement("button");
  removeBtn.type = "button";
  removeBtn.classList.add("remove-visitor-btn");
  removeBtn.innerHTML = `<span data-lucide="trash-2"></span>`;

  removeBtn.addEventListener("click", () => {
    row.remove();
    showNotification("Visitor row removed.", "info");
  });

  row.appendChild(nameInput);
  row.appendChild(addressInput);
  row.appendChild(removeBtn);

  return row;
}
