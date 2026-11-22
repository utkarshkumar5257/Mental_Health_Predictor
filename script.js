// (() => {
//   "use strict";

//   const API_BASE = "http://127.0.0.1:2200";

//   const form = document.getElementById("predict-form");
//   const submitBtn = document.getElementById("submit-btn");
//   const resetBtn = document.getElementById("reset-btn");
//   const errorRetryBtn = document.getElementById("error-retry-btn");

//   const stateIdle = document.getElementById("state-idle");
//   const stateLoading = document.getElementById("state-loading");
//   const stateResult = document.getElementById("state-result");
//   const stateError = document.getElementById("state-error");

//   const scoreNumberEl = document.getElementById("score-number");
//   const scoreBandEl = document.getElementById("score-band");
//   const scoreContextEl = document.getElementById("score-context");
//   const gaugeFill = document.getElementById("gauge-fill");
//   const errorLabelEl = document.getElementById("error-label");
//   const errorCopyEl = document.getElementById("error-copy");

//   const GAUGE_ARC_LENGTH = 314; // approx pi * r(100)

//   // ---------------------------------------------------------
//   // Draw tick marks on both gauges (0..10, every 2 units)
//   // ---------------------------------------------------------
//   function drawTicks() {
//     document.querySelectorAll(".gauge-ticks").forEach((g) => {
//       g.innerHTML = "";
//       const cx = 120, cy = 140, rOuter = 100, rInner = 90;
//       for (let i = 0; i <= 10; i += 2) {
//         const angle = Math.PI - (i / 10) * Math.PI; // 180deg -> 0deg
//         const x1 = cx + rOuter * Math.cos(angle);
//         const y1 = cy - rOuter * Math.sin(angle);
//         const x2 = cx + rInner * Math.cos(angle);
//         const y2 = cy - rInner * Math.sin(angle);
//         const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
//         line.setAttribute("x1", x1.toFixed(1));
//         line.setAttribute("y1", y1.toFixed(1));
//         line.setAttribute("x2", x2.toFixed(1));
//         line.setAttribute("y2", y2.toFixed(1));
//         g.appendChild(line);
//       }
//     });
//   }
//   drawTicks();

//   // ---------------------------------------------------------
//   // Segmented control (stress_level) wiring
//   // ---------------------------------------------------------
//   const segGroup = document.getElementById("stress_level_group");
//   const stressHiddenInput = document.getElementById("stress_level");
//   segGroup.querySelectorAll(".seg-btn").forEach((btn) => {
//     btn.addEventListener("click", () => {
//       segGroup.querySelectorAll(".seg-btn").forEach((b) => b.classList.remove("active"));
//       btn.classList.add("active");
//       stressHiddenInput.value = btn.dataset.value;
//       clearFieldError(stressHiddenInput);
//     });
//   });

//   // ---------------------------------------------------------
//   // Field-level error helpers
//   // ---------------------------------------------------------
//   function fieldWrapper(input) {
//     return input.closest(".field");
//   }

//   function setFieldError(input, message) {
//     const wrap = fieldWrapper(input);
//     if (!wrap) return;
//     wrap.classList.add("field-error");
//     const msgEl = wrap.querySelector(".error-msg");
//     if (msgEl) msgEl.textContent = message;
//   }

//   function clearFieldError(input) {
//     const wrap = fieldWrapper(input);
//     if (!wrap) return;
//     wrap.classList.remove("field-error");
//     const msgEl = wrap.querySelector(".error-msg");
//     if (msgEl) msgEl.textContent = "";
//   }

//   function clearAllErrors() {
//     form.querySelectorAll(".field").forEach((f) => f.classList.remove("field-error"));
//     form.querySelectorAll(".error-msg").forEach((m) => (m.textContent = ""));
//   }

//   // ---------------------------------------------------------
//   // Client-side validation mirroring the StudentData model
//   // ---------------------------------------------------------
//   function validate(payload) {
//     const errors = [];

//     const numericChecks = [
//       ["age", 10, 100],
//       ["avg_daily_usage_hours", 0, 24],
//       ["daily_unlocks", 0, Infinity],
//       ["study_hours", 0, 24],
//       ["physical_activity_hours", 0, 24],
//       ["sleep_hours_per_night", 0, 24],
//     ];

//     numericChecks.forEach(([key, min, max]) => {
//       const input = document.getElementById(key);
//       const val = payload[key];
//       if (val === "" || val === null || Number.isNaN(val)) {
//         errors.push([input, "This field is required."]);
//       } else if (val < min || val > max) {
//         errors.push([input, `Must be between ${min} and ${max === Infinity ? "0+" : max}.`]);
//       }
//     });

//     ["gender", "country", "academic_level", "most_used_platform", "purpose_of_use"].forEach((key) => {
//       const input = document.getElementById(key);
//       if (!payload[key] || String(payload[key]).trim() === "") {
//         errors.push([input, "This field is required."]);
//       }
//     });

//     if (!payload.stress_level) {
//       errors.push([stressHiddenInput, "Pick a stress level."]);
//     }

//     return errors;
//   }

//   // ---------------------------------------------------------
//   // Gather form data into the exact StudentData shape
//   // ---------------------------------------------------------
//   function collectPayload() {
//     const fd = new FormData(form);
//     return {
//       age: fd.get("age") === "" ? NaN : parseInt(fd.get("age"), 10),
//       gender: fd.get("gender") || "",
//       country: (fd.get("country") || "").trim(),
//       academic_level: fd.get("academic_level") || "",
//       most_used_platform: fd.get("most_used_platform") || "",
//       purpose_of_use: fd.get("purpose_of_use") || "",
//       avg_daily_usage_hours: fd.get("avg_daily_usage_hours") === "" ? NaN : parseFloat(fd.get("avg_daily_usage_hours")),
//       daily_unlocks: fd.get("daily_unlocks") === "" ? NaN : parseInt(fd.get("daily_unlocks"), 10),
//       study_hours: fd.get("study_hours") === "" ? NaN : parseFloat(fd.get("study_hours")),
//       physical_activity_hours: fd.get("physical_activity_hours") === "" ? NaN : parseFloat(fd.get("physical_activity_hours")),
//       sleep_hours_per_night: fd.get("sleep_hours_per_night") === "" ? NaN : parseFloat(fd.get("sleep_hours_per_night")),
//       stress_level: fd.get("stress_level") || "",
//     };
//   }

//   // ---------------------------------------------------------
//   // UI state switching
//   // ---------------------------------------------------------
//   function showState(name) {
//     [stateIdle, stateLoading, stateResult, stateError].forEach((el) => (el.hidden = true));
//     ({ idle: stateIdle, loading: stateLoading, result: stateResult, error: stateError }[name]).hidden = false;
//   }

//   function setSubmitting(isSubmitting) {
//     submitBtn.disabled = isSubmitting;
//     submitBtn.classList.toggle("loading", isSubmitting);
//   }

//   function bandFor(score) {
//     if (score < 4) {
//       return {
//         label: "Signal: strained",
//         context: "Your responses suggest elevated strain right now. Small shifts in sleep or screen time can go a long way.",
//       };
//     }
//     if (score < 7) {
//       return {
//         label: "Signal: balanced",
//         context: "Your rhythm looks fairly steady, with some room to recover and reset.",
//       };
//     }
//     return {
//       label: "Signal: strong",
//       context: "Your habits point to a well-supported, resilient baseline. Keep it up.",
//     };
//   }

//   function renderResult(score) {
//     const clamped = Math.max(0, Math.min(10, score));
//     const { label, context } = bandFor(clamped);

//     scoreNumberEl.textContent = score.toFixed(2);
//     scoreBandEl.textContent = label;
//     scoreContextEl.textContent = context;

//     // reset then animate the arc fill on next frame
//     gaugeFill.style.transition = "none";
//     gaugeFill.style.strokeDashoffset = String(GAUGE_ARC_LENGTH);
//     requestAnimationFrame(() => {
//       gaugeFill.style.transition = "";
//       const offset = GAUGE_ARC_LENGTH * (1 - clamped / 10);
//       gaugeFill.style.strokeDashoffset = String(offset);
//     });

//     showState("result");
//   }

//   function renderError(label, copy) {
//     errorLabelEl.textContent = label;
//     errorCopyEl.textContent = copy;
//     showState("error");
//   }

//   // ---------------------------------------------------------
//   // Parse FastAPI / Pydantic 422 error responses into
//   // field-level messages where possible
//   // ---------------------------------------------------------
//   function applyServerValidationErrors(detail) {
//     if (!Array.isArray(detail)) return false;
//     let matched = false;
//     detail.forEach((err) => {
//       const field = Array.isArray(err.loc) ? err.loc[err.loc.length - 1] : null;
//       const input = field ? document.getElementById(field) : null;
//       const target = field === "stress_level" ? stressHiddenInput : input;
//       if (target) {
//         setFieldError(target, err.msg || "Invalid value.");
//         matched = true;
//       }
//     });
//     return matched;
//   }

//   // ---------------------------------------------------------
//   // Submit handler
//   // ---------------------------------------------------------
//   form.addEventListener("submit", async (e) => {
//     e.preventDefault();
//     clearAllErrors();

//     const payload = collectPayload();
//     const clientErrors = validate(payload);

//     if (clientErrors.length > 0) {
//       clientErrors.forEach(([input, msg]) => input && setFieldError(input, msg));
//       clientErrors[0][0]?.focus?.();
//       return;
//     }

//     setSubmitting(true);
//     showState("loading");

//     try {
//       const res = await fetch(`${API_BASE}/predict`, {
//         method: "POST",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify(payload),
//       });

//       if (res.status === 422) {
//         const body = await res.json().catch(() => null);
//         const matched = body && applyServerValidationErrors(body.detail);
//         renderError(
//           "Check your inputs",
//           matched
//             ? "The API rejected a few fields — details are marked on the form."
//             : "The API rejected this submission. Please review your inputs and try again."
//         );
//         return;
//       }

//       if (!res.ok) {
//         let detailMsg = `The API responded with status ${res.status}.`;
//         const body = await res.json().catch(() => null);
//         if (body && typeof body.detail === "string") detailMsg = body.detail;
//         renderError("Prediction failed", detailMsg);
//         return;
//       }

//       const data = await res.json();
//       if (typeof data.predicted_mental_health_score !== "number") {
//         renderError("Unexpected response", "The API responded, but the score was missing or malformed.");
//         return;
//       }

//       renderResult(data.predicted_mental_health_score);
//     } catch (err) {
//       renderError(
//         "Can't reach the server",
//         `Couldn't connect to ${API_BASE}. Make sure the backend is running (uvicorn main:app --port 2200 --reload) and reachable from this page.`
//       );
//     } finally {
//       setSubmitting(false);
//     }
//   });

//   // live-clear errors as the user edits
//   form.querySelectorAll("input, select").forEach((el) => {
//     el.addEventListener("input", () => clearFieldError(el));
//     el.addEventListener("change", () => clearFieldError(el));
//   });

//   resetBtn.addEventListener("click", () => {
//     showState("idle");
//   });

//   errorRetryBtn.addEventListener("click", () => {
//     showState("idle");
//   });
// })();








(() => {
  "use strict";

  const API_BASE = "http://127.0.0.1:2200";

  const form = document.getElementById("predict-form");
  const submitBtn = document.getElementById("submit-btn");
  const resetBtn = document.getElementById("reset-btn");
  const errorRetryBtn = document.getElementById("error-retry-btn");

  const stateIdle = document.getElementById("state-idle");
  const stateLoading = document.getElementById("state-loading");
  const stateResult = document.getElementById("state-result");
  const stateError = document.getElementById("state-error");

  const scoreNumberEl = document.getElementById("score-number");
  const scoreBandEl = document.getElementById("score-band");
  const scoreContextEl = document.getElementById("score-context");
  const gaugeFill = document.getElementById("gauge-fill");
  const errorLabelEl = document.getElementById("error-label");
  const errorCopyEl = document.getElementById("error-copy");

  const GAUGE_ARC_LENGTH = 314;

  // Map backend field names to HTML element IDs
  const FIELD_IDS = {
    age: "age",
    gender: "gender",
    country: "country",
    academic_Level: "academic_level",
    most_Used_Platform: "most_used_platform",
    purpose_Of_Use: "purpose_of_use",
    avg_Daily_Usage_Hours: "avg_daily_usage_hours",
    daily_Unlocks: "daily_unlocks",
    study_Hours: "study_hours",
    physical_Activity_Hours: "physical_activity_hours",
    sleep_Hours_Per_Night: "sleep_hours_per_night",
    stress_Level: "stress_level"
  };

  // Draw gauge tick marks
  function drawTicks() {
    document.querySelectorAll(".gauge-ticks").forEach((g) => {
      g.innerHTML = "";

      const cx = 120;
      const cy = 140;
      const rOuter = 100;
      const rInner = 90;

      for (let i = 0; i <= 10; i += 2) {
        const angle = Math.PI - (i / 10) * Math.PI;

        const x1 = cx + rOuter * Math.cos(angle);
        const y1 = cy - rOuter * Math.sin(angle);
        const x2 = cx + rInner * Math.cos(angle);
        const y2 = cy - rInner * Math.sin(angle);

        const line = document.createElementNS(
          "http://www.w3.org/2000/svg",
          "line"
        );

        line.setAttribute("x1", x1.toFixed(1));
        line.setAttribute("y1", y1.toFixed(1));
        line.setAttribute("x2", x2.toFixed(1));
        line.setAttribute("y2", y2.toFixed(1));

        g.appendChild(line);
      }
    });
  }

  drawTicks();

  // Stress level segmented control
  const segGroup = document.getElementById("stress_level_group");
  const stressHiddenInput = document.getElementById("stress_level");

  if (segGroup && stressHiddenInput) {
    segGroup.querySelectorAll(".seg-btn").forEach((btn) => {
      btn.addEventListener("click", () => {
        segGroup.querySelectorAll(".seg-btn").forEach((b) => {
          b.classList.remove("active");
        });

        btn.classList.add("active");
        stressHiddenInput.value = btn.dataset.value;

        clearFieldError(stressHiddenInput);
      });
    });
  }

  // Field error helpers
  function fieldWrapper(input) {
    return input ? input.closest(".field") : null;
  }

  function setFieldError(input, message) {
    const wrap = fieldWrapper(input);
    if (!wrap) return;

    wrap.classList.add("field-error");

    const msgEl = wrap.querySelector(".error-msg");
    if (msgEl) msgEl.textContent = message;
  }

  function clearFieldError(input) {
    const wrap = fieldWrapper(input);
    if (!wrap) return;

    wrap.classList.remove("field-error");

    const msgEl = wrap.querySelector(".error-msg");
    if (msgEl) msgEl.textContent = "";
  }

  function clearAllErrors() {
    form.querySelectorAll(".field").forEach((field) => {
      field.classList.remove("field-error");
    });

    form.querySelectorAll(".error-msg").forEach((msg) => {
      msg.textContent = "";
    });
  }

  // Collect form data using backend field names
  function collectPayload() {
    const fd = new FormData(form);

    const getNumber = (name, integer = false) => {
      const value = fd.get(name);

      if (value === null || value === "") {
        return NaN;
      }

      return integer ? parseInt(value, 10) : parseFloat(value);
    };

    return {
      age: getNumber("age", true),
      gender: fd.get("gender") || "",
      country: (fd.get("country") || "").trim(),

      academic_Level: fd.get("academic_level") || "",
      most_Used_Platform: fd.get("most_used_platform") || "",
      purpose_Of_Use: fd.get("purpose_of_use") || "",

      avg_Daily_Usage_Hours: getNumber("avg_daily_usage_hours"),
      daily_Unlocks: getNumber("daily_unlocks", true),
      study_Hours: getNumber("study_hours"),
      physical_Activity_Hours: getNumber("physical_activity_hours"),
      sleep_Hours_Per_Night: getNumber("sleep_hours_per_night"),

      stress_Level: fd.get("stress_level") || ""
    };
  }

  // Validate form data
  function validate(payload) {
    const errors = [];

    const numericChecks = [
      ["age", 10, 100, true],
      ["avg_Daily_Usage_Hours", 0, 24, false],
      ["daily_Unlocks", 0, Infinity, true],
      ["study_Hours", 0, 24, false],
      ["physical_Activity_Hours", 0, 24, false],
      ["sleep_Hours_Per_Night", 0, 24, false]
    ];

    numericChecks.forEach(([key, min, max, integer]) => {
      const input = document.getElementById(FIELD_IDS[key]);
      const value = payload[key];

      if (!Number.isFinite(value)) {
        errors.push([input, "Please enter a valid number."]);
      } else if (value < min || value > max) {
        errors.push([
          input,
          `Must be between ${min} and ${
            max === Infinity ? "0 or more" : max
          }.`
        ]);
      } else if (integer && !Number.isInteger(value)) {
        errors.push([input, "Please enter a whole number."]);
      }
    });

    const requiredFields = [
      "gender",
      "country",
      "academic_Level",
      "most_Used_Platform",
      "purpose_Of_Use",
      "stress_Level"
    ];

    requiredFields.forEach((key) => {
      const input = document.getElementById(FIELD_IDS[key]);

      if (!payload[key] || String(payload[key]).trim() === "") {
        errors.push([
          input,
          key === "stress_Level"
            ? "Pick a stress level."
            : "This field is required."
        ]);
      }
    });

    const allowedValues = {
      gender: ["Male", "Female"],

      academic_Level: [
        "Undergraduate",
        "Graduate",
        "High School"
      ],

      most_Used_Platform: [
        "Facebook",
        "LinkedIn",
        "Instagram",
        "Snapchat",
        "Twitter",
        "YouTube",
        "TikTok",
        "LINE",
        "KakaoTalk",
        "VKontakte",
        "WhatsApp",
        "WeChat"
      ],

      purpose_Of_Use: [
        "Networking",
        "Education",
        "Entertainment",
        "News"
      ],

      stress_Level: [
        "Medium",
        "Low",
        "Very High",
        "High"
      ]
    };

    Object.entries(allowedValues).forEach(([key, allowed]) => {
      const value = payload[key];

      if (value && !allowed.includes(value)) {
        const input = document.getElementById(FIELD_IDS[key]);
        errors.push([input, "Please select a valid option."]);
      }
    });

    return errors;
  }

  // Change UI states
  function showState(name) {
    [stateIdle, stateLoading, stateResult, stateError].forEach((el) => {
      if (el) el.hidden = true;
    });

    const states = {
      idle: stateIdle,
      loading: stateLoading,
      result: stateResult,
      error: stateError
    };

    if (states[name]) states[name].hidden = false;
  }

  function setSubmitting(isSubmitting) {
    submitBtn.disabled = isSubmitting;
    submitBtn.classList.toggle("loading", isSubmitting);
  }

  // Score interpretation
  function bandFor(score) {
    if (score < 4) {
      return {
        label: "Signal: strained",
        context:
          "Your responses suggest elevated strain right now. Small shifts in sleep or screen time can go a long way."
      };
    }

    if (score < 7) {
      return {
        label: "Signal: balanced",
        context:
          "Your rhythm looks fairly steady, with some room to recover and reset."
      };
    }

    return {
      label: "Signal: strong",
      context:
        "Your habits point to a well-supported, resilient baseline. Keep it up."
    };
  }

  // Display prediction result
  function renderResult(score) {
    const clamped = Math.max(0, Math.min(10, score));

    const { label, context } = bandFor(clamped);

    scoreNumberEl.textContent = score.toFixed(2);
    scoreBandEl.textContent = label;
    scoreContextEl.textContent = context;

    gaugeFill.style.transition = "none";
    gaugeFill.style.strokeDashoffset = String(GAUGE_ARC_LENGTH);

    requestAnimationFrame(() => {
      gaugeFill.style.transition = "";

      const offset = GAUGE_ARC_LENGTH * (1 - clamped / 10);

      gaugeFill.style.strokeDashoffset = String(offset);
    });

    showState("result");
  }

  // Display errors
  function renderError(label, copy) {
    errorLabelEl.textContent = label;
    errorCopyEl.textContent = copy;

    showState("error");
  }

  // Map backend validation errors to HTML fields
  function applyServerValidationErrors(detail) {
    if (!Array.isArray(detail)) return false;

    let matched = false;

    detail.forEach((err) => {
      const backendField = Array.isArray(err.loc)
        ? err.loc[err.loc.length - 1]
        : null;

      const htmlId = FIELD_IDS[backendField] || backendField;

      const input = htmlId
        ? document.getElementById(htmlId)
        : null;

      if (input) {
        setFieldError(input, err.msg || "Invalid value.");
        matched = true;
      }
    });

    return matched;
  }

  // Submit prediction form
  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    clearAllErrors();

    const payload = collectPayload();
    const clientErrors = validate(payload);

    if (clientErrors.length > 0) {
      clientErrors.forEach(([input, message]) => {
        if (input) setFieldError(input, message);
      });

      clientErrors[0][0]?.focus?.();

      return;
    }

    setSubmitting(true);
    showState("loading");

    try {
      const res = await fetch(`${API_BASE}/predict`, {
        method: "POST",

        headers: {
          "Content-Type": "application/json"
        },

        body: JSON.stringify(payload)
      });

      if (res.status === 422) {
        const body = await res.json().catch(() => null);

        const matched =
          body && applyServerValidationErrors(body.detail);

        renderError(
          "Check your inputs",
          matched
            ? "The API rejected a few fields — details are marked on the form."
            : "The API rejected this submission. Please review your inputs and try again."
        );

        return;
      }

      if (!res.ok) {
        let detailMsg =
          `The API responded with status ${res.status}.`;

        const body = await res.json().catch(() => null);

        if (body && typeof body.detail === "string") {
          detailMsg = body.detail;
        }

        renderError("Prediction failed", detailMsg);

        return;
      }

      const data = await res.json();

      if (
        typeof data.predicted_mental_health_score !== "number"
      ) {
        renderError(
          "Unexpected response",
          "The API responded, but the score was missing or malformed."
        );

        return;
      }

      renderResult(data.predicted_mental_health_score);

    } catch (err) {
      console.error("Prediction request failed:", err);

      renderError(
        "Can't reach the server",
        `Couldn't connect to ${API_BASE}. Make sure the backend is running.`
      );

    } finally {
      setSubmitting(false);
    }
  });

  // Clear errors when user edits fields
  form.querySelectorAll("input, select").forEach((el) => {
    el.addEventListener("input", () => clearFieldError(el));
    el.addEventListener("change", () => clearFieldError(el));
  });

  // Reset button
  resetBtn.addEventListener("click", () => {
    clearAllErrors();
    showState("idle");
  });

  // Retry button
  errorRetryBtn.addEventListener("click", () => {
    showState("idle");
  });

})();
