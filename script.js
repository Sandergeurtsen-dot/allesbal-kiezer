const STORAGE_KEY = "allesbal-dashboard-state-v2";

const DEFAULT_SPORT_IDS = [
  "voetbal",
  "basketbal",
  "frisbee",
  "hockey",
  "handbal",
  "trefbal",
];

const SPORT_LIBRARY = [
  {
    id: "voetbal",
    name: "Voetbal",
    defaultEnabled: true,
    image: "./assets/sports/voetbal.svg",
  },
  {
    id: "basketbal",
    name: "Basketbal",
    defaultEnabled: true,
    image: "./assets/sports/basketbal.svg",
  },
  {
    id: "frisbee",
    name: "Frisbee",
    defaultEnabled: true,
    image: "./assets/sports/frisbee.svg",
  },
  {
    id: "hockey",
    name: "Hockey",
    defaultEnabled: true,
    image: "./assets/sports/hockey.svg",
  },
  {
    id: "handbal",
    name: "Handbal",
    defaultEnabled: true,
    image: "./assets/sports/handbal.svg",
  },
  {
    id: "trefbal",
    name: "Trefbal",
    defaultEnabled: true,
    image: "./assets/sports/trefbal.svg",
  },
  {
    id: "volleybal",
    name: "Volleybal",
    mark: "VB",
    colors: ["#ff8a00", "#ff4d6d"],
  },
  {
    id: "tennis",
    name: "Tennis",
    mark: "TN",
    colors: ["#11b48c", "#0a7e7a"],
  },
  {
    id: "badminton",
    name: "Badminton",
    mark: "BD",
    colors: ["#7a4dff", "#3854d8"],
  },
  {
    id: "korfbal",
    name: "Korfbal",
    mark: "KB",
    colors: ["#ffb347", "#d96a1d"],
  },
  {
    id: "rugby",
    name: "Rugby",
    mark: "RG",
    colors: ["#d9485a", "#f28b2f"],
  },
];

const DEFAULT_SPORTS = DEFAULT_SPORT_IDS.map((sportId) =>
  buildSportFromDefinition(getSportDefinition(sportId))
);

const DEFAULT_TEAM_COLORS = [
  "#0e78ff",
  "#ff7a00",
  "#23a565",
  "#de4f6f",
  "#7a4dff",
  "#00a6b8",
  "#ffb24c",
  "#4b5b75",
];

const defaultState = {
  sports: DEFAULT_SPORTS,
  selectedSport: "Klaar om te kiezen",
  players: {
    current: 10,
    min: 6,
    max: 14,
  },
  teams: [
    { name: "Team 1", color: DEFAULT_TEAM_COLORS[0], score: 0 },
    { name: "Team 2", color: DEFAULT_TEAM_COLORS[1], score: 0 },
  ],
  timer: {
    minutes: 5,
    seconds: 0,
    remainingSeconds: 300,
    isRunning: false,
  },
};

const FALLBACK_SPORT = {
  id: "geen-sport",
  name: "Sport",
  enabled: false,
  image: createSportArtwork("Sport", "SP", ["#4f76a7", "#294667"]),
  removable: false,
};

const state = loadState();

const heroCard = document.querySelector("#heroCard");
const selectedSportDisplay = document.querySelector("#selectedSportDisplay");
const enabledSportsCount = document.querySelector("#enabledSportsCount");
const heroPlayersStat = document.querySelector("#heroPlayersStat");
const heroTeamsStat = document.querySelector("#heroTeamsStat");
const heroTimerStat = document.querySelector("#heroTimerStat");
const pickSportButton = document.querySelector("#pickSportButton");
const sportsList = document.querySelector("#sportsList");
const toggleAllSportsButton = document.querySelector("#toggleAllSportsButton");
const addSportSelect = document.querySelector("#addSportSelect");
const customSportInput = document.querySelector("#customSportInput");
const addSportButton = document.querySelector("#addSportButton");

const playersCard = document.querySelector(".players-card");
const currentPlayersDisplay = document.querySelector("#currentPlayersDisplay");
const currentPlayersLabel = document.querySelector("#currentPlayersLabel");
const allPlayersBadge = document.querySelector("#allPlayersBadge");
const minPlayersInput = document.querySelector("#minPlayersInput");
const maxPlayersInput = document.querySelector("#maxPlayersInput");
const randomPlayersButton = document.querySelector("#randomPlayersButton");

const teamCountInput = document.querySelector("#teamCountInput");
const teamsContainer = document.querySelector("#teamsContainer");
const resetScoresButton = document.querySelector("#resetScoresButton");

const timerDisplay = document.querySelector("#timerDisplay");
const timerMinutesInput = document.querySelector("#timerMinutesInput");
const timerSecondsInput = document.querySelector("#timerSecondsInput");
const applyTimerButton = document.querySelector("#applyTimerButton");
const openGameModeButton = document.querySelector("#openGameModeButton");
const startPauseTimerButton = document.querySelector("#startPauseTimerButton");
const resetTimerButton = document.querySelector("#resetTimerButton");

const gameModeOverlay = document.querySelector("#gameModeOverlay");
const gameModePanel = document.querySelector("#gameModePanel");
const gameOverlayBackdrop = document.querySelector("#gameOverlayBackdrop");
const closeGameModeButton = document.querySelector("#closeGameModeButton");
const overlaySportValue = document.querySelector("#overlaySportValue");
const overlayPlayersValue = document.querySelector("#overlayPlayersValue");
const overlayTeamsValue = document.querySelector("#overlayTeamsValue");
const overlayStatusValue = document.querySelector("#overlayStatusValue");
const overlayTimerDisplay = document.querySelector("#overlayTimerDisplay");
const overlayTeamsContainer = document.querySelector("#overlayTeamsContainer");
const overlayStartPauseButton = document.querySelector("#overlayStartPauseButton");
const overlayResetButton = document.querySelector("#overlayResetButton");
const overlayPickSportButton = document.querySelector("#overlayPickSportButton");

const resetAppButton = document.querySelector("#resetAppButton");

let timerIntervalId = null;
let isGameModeOpen = false;
let audioContext = null;
let hasPlayedTimerEndSound = false;

render();
attachEvents();

function loadState() {
  try {
    const savedState = readStorage();
    if (!savedState) {
      return cloneData(defaultState);
    }

    const parsedState = JSON.parse(savedState);
    const hasSavedSports = Array.isArray(parsedState?.sports);
    const savedSports = hasSavedSports ? parsedState.sports : [];
    const sports = hasSavedSports
      ? savedSports
          .map((savedSport) => buildSportFromSavedState(savedSport))
          .filter(Boolean)
      : cloneData(defaultState.sports);

    const teams =
      Array.isArray(parsedState?.teams) && parsedState.teams.length > 0
        ? parsedState.teams.map((team, index) => ({
            name: typeof team.name === "string" ? team.name : `Team ${index + 1}`,
            color: team.color || DEFAULT_TEAM_COLORS[index % DEFAULT_TEAM_COLORS.length],
            score: normalizeNumber(team.score, 0, 999, 0),
          }))
        : cloneData(defaultState.teams);

    const minutes = normalizeNumber(parsedState?.timer?.minutes, 0, 99, 5);
    const seconds = normalizeNumber(parsedState?.timer?.seconds, 0, 59, 0);
    const fallbackRemaining = minutes * 60 + seconds;
    const selectedSportName =
      typeof parsedState?.selectedSport === "string" &&
      sports.some((sport) => sport.name === parsedState.selectedSport)
        ? parsedState.selectedSport
        : defaultState.selectedSport;

    return {
      sports,
      selectedSport: selectedSportName,
      players: {
        current: normalizeNumber(parsedState?.players?.current, 1, 99, 10),
        min: normalizeNumber(parsedState?.players?.min, 1, 99, 6),
        max: normalizeNumber(parsedState?.players?.max, 1, 99, 14),
      },
      teams,
      timer: {
        minutes,
        seconds,
        remainingSeconds: normalizeNumber(
          parsedState?.timer?.remainingSeconds,
          0,
          5999,
          fallbackRemaining
        ),
        isRunning: false,
      },
    };
  } catch (error) {
    return cloneData(defaultState);
  }
}

function attachEvents() {
  document.addEventListener("pointerdown", primeAudioContext, { passive: true });
  document.addEventListener("keydown", primeAudioContext);
  document.addEventListener("click", handleStepperButtonClick);

  pickSportButton.addEventListener("click", pickRandomSport);
  toggleAllSportsButton.addEventListener("click", toggleAllSports);
  addSportSelect.addEventListener("change", updateAddSportButtonState);
  customSportInput.addEventListener("input", handleCustomSportInput);
  customSportInput.addEventListener("keydown", handleCustomSportKeydown);
  addSportButton.addEventListener("click", addSelectedSport);

  sportsList.addEventListener("click", handleSportTileClick);
  sportsList.addEventListener("change", handleSportToggleChange);

  randomPlayersButton.addEventListener("click", randomizePlayers);
  attachNumericFieldEvents([minPlayersInput, maxPlayersInput], handlePlayerInputs);

  attachNumericFieldEvents([teamCountInput], handleTeamCountChange);
  teamsContainer.addEventListener("change", handleTeamFieldChange);
  teamsContainer.addEventListener("click", handleTeamScoreAction);
  resetScoresButton.addEventListener("click", resetScores);

  applyTimerButton.addEventListener("click", applyTimerSettings);
  openGameModeButton.addEventListener("click", openGameMode);
  startPauseTimerButton.addEventListener("click", handleMainTimerToggle);
  resetTimerButton.addEventListener("click", resetTimer);
  attachNumericFieldEvents([timerMinutesInput, timerSecondsInput], handleTimerInput);

  gameOverlayBackdrop.addEventListener("click", closeGameMode);
  closeGameModeButton.addEventListener("click", closeGameMode);
  overlayStartPauseButton.addEventListener("click", handleOverlayTimerToggle);
  overlayResetButton.addEventListener("click", resetTimer);
  overlayPickSportButton.addEventListener("click", pickRandomSport);
  overlayTeamsContainer.addEventListener("click", handleOverlayTeamScoreAction);

  resetAppButton.addEventListener("click", resetApp);

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && isGameModeOpen) {
      closeGameMode();
    }
  });
}

function attachNumericFieldEvents(inputs, commitHandler) {
  inputs.forEach((input) => {
    input.addEventListener("input", sanitizeNumericTextInput);
    input.addEventListener("change", commitHandler);
    input.addEventListener("blur", commitHandler);
    input.addEventListener("focus", selectNumericInputContent);
    input.addEventListener("keydown", handleNumericInputKeydown);
  });
}

function render() {
  renderHero();
  renderSportSelection();
  renderPlayers();
  renderTeams();
  renderTimer();
  renderGameMode();
  persistState();
}

function renderHero() {
  const activeSport = getDisplaySport();
  const enabledSports = state.sports.filter((sport) => sport.enabled);

  heroCard.style.setProperty("--hero-image", `url("${activeSport.image}")`);
  selectedSportDisplay.textContent = getSelectedSportLabel();
  enabledSportsCount.textContent =
    state.sports.length === 0
      ? "Voeg eerst een sport toe"
      : enabledSports.length > 0
        ? `${enabledSports.length} sporten actief om uit te kiezen`
        : "Zet minstens 1 sport aan";
  heroPlayersStat.textContent = getPlayersDisplayText();
  heroTeamsStat.textContent = state.teams.length;
  heroTimerStat.textContent = formatTime(state.timer.remainingSeconds);
  pickSportButton.disabled = enabledSports.length === 0;
}

function renderSportSelection() {
  const enabledSports = state.sports.filter((sport) => sport.enabled);
  toggleAllSportsButton.textContent =
    state.sports.length === 0
      ? "Geen sporten"
      : enabledSports.length === state.sports.length
        ? "Alles uit"
        : "Alles aan";
  toggleAllSportsButton.disabled = state.sports.length === 0;
  renderAddSportControls();

  sportsList.innerHTML = "";

  if (state.sports.length === 0) {
    sportsList.innerHTML = `
      <div class="sports-empty-state">
        <strong>Geen sporten in de lijst</strong>
        <span>Kies hierboven een sport of typ er zelf een.</span>
      </div>
    `;
    return;
  }

  state.sports.forEach((sport) => {
    const isSelected = state.selectedSport === sport.name;
    const tile = document.createElement("article");
    tile.className = [
      "sport-tile",
      sport.enabled ? "" : "is-disabled",
      isSelected ? "is-selected" : "",
    ]
      .filter(Boolean)
      .join(" ");
    tile.style.setProperty("--sport-image", `url("${sport.image}")`);
    tile.innerHTML = `
      ${
        sport.removable
          ? `<button
        class="sport-tile__remove"
        type="button"
        data-action="remove-sport"
        data-sport-id="${sport.id}"
        aria-label="${sport.name} verwijderen"
      >
        x
      </button>`
          : ""
      }
      <button
        class="sport-tile__select"
        type="button"
        data-action="select-sport"
        data-sport-id="${sport.id}"
      >
        <span class="sport-tile__status">${sport.enabled ? "Actief" : "Uit"}</span>
        <span class="sport-tile__name">${sport.name}</span>
        <span class="sport-tile__subtext">Tik om direct te tonen</span>
      </button>
      <label class="sport-toggle-switch" aria-label="${sport.name} aan of uit">
        <input type="checkbox" data-sport-id="${sport.id}" ${sport.enabled ? "checked" : ""} />
        <span></span>
      </label>
    `;

    sportsList.appendChild(tile);
  });
}

function renderAddSportControls() {
  const availableSports = getAvailableSportsToAdd();
  const currentValue = availableSports.some((sport) => sport.id === addSportSelect.value)
    ? addSportSelect.value
    : "";
  const placeholderLabel =
    availableSports.length > 0 ? "Sport toevoegen" : "Geen sporten over";

  addSportSelect.innerHTML = [
    `<option value="">${placeholderLabel}</option>`,
    ...availableSports.map(
      (sport) => `<option value="${sport.id}">${escapeHtml(sport.name)}</option>`
    ),
  ].join("");
  addSportSelect.value = currentValue;
  addSportSelect.disabled = availableSports.length === 0;
  updateAddSportButtonState();
}

function renderPlayers() {
  const trefbalActive = isTrefbalSelected();
  const normalizedRange = normalizePlayerRange(state.players.min, state.players.max);
  state.players.min = normalizedRange.min;
  state.players.max = normalizedRange.max;
  state.players.current = normalizeNumber(
    state.players.current,
    state.players.min,
    state.players.max,
    state.players.min
  );

  currentPlayersDisplay.textContent = String(state.players.current);
  currentPlayersDisplay.hidden = trefbalActive;
  allPlayersBadge.hidden = !trefbalActive;
  minPlayersInput.value = state.players.min;
  maxPlayersInput.value = state.players.max;
  randomPlayersButton.disabled = trefbalActive;
  currentPlayersLabel.textContent = "Gekozen aantal";
  currentPlayersLabel.hidden = trefbalActive;
  playersCard.classList.toggle("is-all-players", trefbalActive);
}

function renderTeams() {
  teamCountInput.value = state.teams.length;
  teamsContainer.innerHTML = "";

  state.teams.forEach((team, index) => {
    const displayName = team.name.trim() || `Team ${index + 1}`;
    const teamCard = document.createElement("article");
    teamCard.className = "team-card";
    teamCard.style.borderTop = `6px solid ${team.color}`;
    teamCard.innerHTML = `
      <div class="team-card__header">
        <div class="team-card__title">
          <div class="team-preview" style="background:${team.color}"></div>
          <strong>${escapeHtml(displayName)}</strong>
        </div>
        <div class="team-score">${team.score}</div>
      </div>
      <label class="field">
        <span>Naam team ${index + 1}</span>
        <input type="text" data-team-index="${index}" data-field="name" value="${escapeHtml(
          team.name
        )}" />
      </label>
      <label class="field">
        <span>Kleur</span>
        <input type="color" data-team-index="${index}" data-field="color" value="${team.color}" />
      </label>
      <div class="team-actions">
        <button class="team-minus" type="button" data-team-index="${index}" data-action="minus">
          -1
        </button>
        <button class="team-plus" type="button" data-team-index="${index}" data-action="plus">
          +1
        </button>
        <button class="team-reset" type="button" data-team-index="${index}" data-action="reset">
          0
        </button>
      </div>
    `;

    teamsContainer.appendChild(teamCard);
  });
}

function renderTimer() {
  timerMinutesInput.value = state.timer.minutes;
  timerSecondsInput.value = state.timer.seconds;
  timerDisplay.textContent = formatTime(state.timer.remainingSeconds);
  timerDisplay.classList.toggle("is-finished", state.timer.remainingSeconds === 0);
  startPauseTimerButton.textContent = state.timer.isRunning ? "Pauze" : "Start";
}

function renderGameMode() {
  const activeSport = getDisplaySport();
  gameModePanel.style.setProperty("--hero-image", `url("${activeSport.image}")`);
  overlaySportValue.textContent = getSelectedSportLabel();
  overlayPlayersValue.textContent = getPlayersDisplayText();
  overlayTeamsValue.textContent = state.teams.length;
  overlayStatusValue.textContent = getTimerStatusLabel();
  overlayTimerDisplay.textContent = formatTime(state.timer.remainingSeconds);
  overlayTimerDisplay.classList.toggle("is-finished", state.timer.remainingSeconds === 0);
  overlayStartPauseButton.textContent = state.timer.isRunning ? "Pauze" : "Start";

  overlayTeamsContainer.innerHTML = "";
  state.teams.forEach((team, index) => {
    const displayName = team.name.trim() || `Team ${index + 1}`;
    const overlayTeam = document.createElement("article");
    overlayTeam.className = "overlay-team";
    overlayTeam.style.borderTop = `6px solid ${team.color}`;
    overlayTeam.innerHTML = `
      <div class="overlay-team__header">
        <div class="team-preview" style="background:${team.color}"></div>
        <strong>${escapeHtml(displayName)}</strong>
      </div>
      <div class="overlay-team__score">${team.score}</div>
      <div class="overlay-team__actions">
        <button
          class="overlay-team__minus"
          type="button"
          data-team-index="${index}"
          data-action="minus"
        >
          -1
        </button>
        <button
          class="overlay-team__plus"
          type="button"
          data-team-index="${index}"
          data-action="plus"
        >
          +1
        </button>
        <button
          class="overlay-team__reset"
          type="button"
          data-team-index="${index}"
          data-action="reset"
        >
          0
        </button>
      </div>
    `;

    overlayTeamsContainer.appendChild(overlayTeam);
  });

  gameModeOverlay.classList.toggle("is-open", isGameModeOpen);
  document.body.classList.toggle("game-mode-open", isGameModeOpen);
  gameModeOverlay.setAttribute("aria-hidden", String(!isGameModeOpen));
}

function handleSportTileClick(event) {
  const target = event.target;
  if (!(target instanceof Element)) {
    return;
  }

  const removeButton = target.closest('[data-action="remove-sport"]');
  if (removeButton instanceof HTMLButtonElement) {
    removeSport(removeButton.dataset.sportId);
    return;
  }

  const button = target.closest('[data-action="select-sport"]');
  if (!(button instanceof HTMLButtonElement)) {
    return;
  }

  const sportId = button.dataset.sportId;
  const sport = state.sports.find((item) => item.id === sportId);
  if (!sport) {
    return;
  }

  if (!sport.enabled) {
    sport.enabled = true;
  }

  selectSport(sport.name);
}

function handleSportToggleChange(event) {
  const target = event.target;
  if (!(target instanceof HTMLInputElement)) {
    return;
  }

  const sport = state.sports.find((item) => item.id === target.dataset.sportId);
  if (!sport) {
    return;
  }

  sport.enabled = target.checked;
  render();
}

function updateAddSportButtonState() {
  addSportButton.disabled =
    !getCustomSportName() && (!addSportSelect.value || addSportSelect.disabled);
}

function addSelectedSport() {
  const customSportName = getCustomSportName();
  if (customSportName) {
    const existingSport = state.sports.find(
      (sport) => sport.name.toLowerCase() === customSportName.toLowerCase()
    );
    if (existingSport) {
      existingSport.enabled = true;
      state.selectedSport = existingSport.name;
      customSportInput.value = "";
      addSportSelect.value = "";
      render();
      return;
    }

    const customDefinition = createCustomSportDefinition(customSportName);
    state.sports.push(buildSportFromDefinition(customDefinition, true));
    state.selectedSport = customDefinition.name;
    customSportInput.value = "";
    addSportSelect.value = "";
    render();
    return;
  }

  const sportId = addSportSelect.value;
  const definition = getSportDefinition(sportId);
  if (!definition || state.sports.some((sport) => sport.id === sportId)) {
    return;
  }

  state.sports.push(buildSportFromDefinition(definition, true));
  addSportSelect.value = "";
  render();
}

function handleCustomSportInput(event) {
  const target = event.target;
  if (!(target instanceof HTMLInputElement)) {
    return;
  }

  target.value = target.value.replace(/\s+/g, " ").replace(/^\s+/, "");
  updateAddSportButtonState();
}

function handleCustomSportKeydown(event) {
  if (event.key !== "Enter") {
    return;
  }

  event.preventDefault();
  addSelectedSport();
}

function removeSport(sportId) {
  const sportToRemove = state.sports.find((sport) => sport.id === sportId);
  if (!sportToRemove) {
    return;
  }

  state.sports = state.sports.filter((sport) => sport.id !== sportId);

  if (state.selectedSport === sportToRemove.name) {
    const fallbackSport = state.sports.find((sport) => sport.enabled) || state.sports[0];
    state.selectedSport = fallbackSport ? fallbackSport.name : defaultState.selectedSport;
  }

  render();
}

function sanitizeNumericTextInput(event) {
  const target = event.target;
  if (!(target instanceof HTMLInputElement)) {
    return;
  }

  const digitsOnly = target.value.replace(/[^\d]/g, "");
  if (digitsOnly !== target.value) {
    target.value = digitsOnly;
  }
}

function selectNumericInputContent(event) {
  const target = event.target;
  if (!(target instanceof HTMLInputElement)) {
    return;
  }

  requestAnimationFrame(() => {
    target.select();
  });
}

function handleNumericInputKeydown(event) {
  if (event.key !== "Enter") {
    return;
  }

  const target = event.target;
  if (!(target instanceof HTMLInputElement)) {
    return;
  }

  event.preventDefault();
  target.blur();
}

function handleStepperButtonClick(event) {
  const target = event.target;
  if (!(target instanceof Element)) {
    return;
  }

  const button = target.closest("button[data-step-target]");
  if (!(button instanceof HTMLButtonElement)) {
    return;
  }

  const targetId = button.dataset.stepTarget;
  const direction = button.dataset.stepDirection === "down" ? -1 : 1;

  if (!targetId) {
    return;
  }

  adjustStepperValue(targetId, direction);
}

function adjustStepperValue(targetId, delta) {
  if (targetId === "minPlayersInput") {
    state.players.min = normalizeNumber(state.players.min + delta, 1, 99, 6);
    render();
    return;
  }

  if (targetId === "maxPlayersInput") {
    state.players.max = normalizeNumber(state.players.max + delta, 1, 99, 14);
    render();
    return;
  }

  if (targetId === "teamCountInput") {
    teamCountInput.value = normalizeNumber(state.teams.length + delta, 1, 8, state.teams.length);
    handleTeamCountChange();
    return;
  }

  if (targetId === "timerMinutesInput") {
    state.timer.minutes = normalizeNumber(state.timer.minutes + delta, 0, 99, 5);
    if (!state.timer.isRunning) {
      state.timer.remainingSeconds = state.timer.minutes * 60 + state.timer.seconds;
    }
    render();
    return;
  }

  if (targetId === "timerSecondsInput") {
    state.timer.seconds = normalizeNumber(state.timer.seconds + delta, 0, 59, 0);
    if (!state.timer.isRunning) {
      state.timer.remainingSeconds = state.timer.minutes * 60 + state.timer.seconds;
    }
    render();
  }
}

function pickRandomSport() {
  if (state.sports.length === 0) {
    state.selectedSport = "Voeg eerst een sport toe";
    render();
    return;
  }

  const enabledSports = state.sports.filter((sport) => sport.enabled);
  if (enabledSports.length === 0) {
    state.selectedSport = "Zet eerst een sport aan";
    render();
    return;
  }

  const availableSports =
    enabledSports.length > 1
      ? enabledSports.filter((sport) => sport.name !== state.selectedSport)
      : enabledSports;
  const randomSport =
    availableSports[Math.floor(Math.random() * availableSports.length)];
  selectSport(randomSport.name);
}

function selectSport(sportName) {
  state.selectedSport = sportName;
  autoPickPlayersForSelectedSport();
  render();
}

function toggleAllSports() {
  if (state.sports.length === 0) {
    return;
  }

  const enabledSports = state.sports.filter((sport) => sport.enabled);
  const shouldEnableAll = enabledSports.length !== state.sports.length;

  state.sports.forEach((sport) => {
    sport.enabled = shouldEnableAll;
  });

  render();
}

function handlePlayerInputs() {
  state.players.min = normalizeNumber(minPlayersInput.value, 1, 99, 6);
  state.players.max = normalizeNumber(maxPlayersInput.value, 1, 99, 14);
  state.players.current = normalizeNumber(state.players.current, 1, 99, state.players.min);
  render();
}

function randomizePlayers() {
  const { min, max } = normalizePlayerRange(state.players.min, state.players.max);
  state.players.current = Math.floor(Math.random() * (max - min + 1)) + min;
  render();
}

function autoPickPlayersForSelectedSport() {
  if (isTrefbalSelected()) {
    return;
  }

  const { min, max } = normalizePlayerRange(state.players.min, state.players.max);
  state.players.current = Math.floor(Math.random() * (max - min + 1)) + min;
}

function handleTeamCountChange() {
  const requestedCount = normalizeNumber(teamCountInput.value, 1, 8, state.teams.length);

  if (requestedCount > state.teams.length) {
    for (let index = state.teams.length; index < requestedCount; index += 1) {
      state.teams.push({
        name: `Team ${index + 1}`,
        color: DEFAULT_TEAM_COLORS[index % DEFAULT_TEAM_COLORS.length],
        score: 0,
      });
    }
  } else {
    state.teams = state.teams.slice(0, requestedCount);
  }

  render();
}

function handleTeamFieldChange(event) {
  const target = event.target;
  if (!(target instanceof HTMLInputElement)) {
    return;
  }

  const teamIndex = Number(target.dataset.teamIndex);
  const field = target.dataset.field;
  const team = state.teams[teamIndex];

  if (!team || !field) {
    return;
  }

  if (field === "name") {
    team.name = target.value;
  }

  if (field === "color") {
    team.color = target.value;
  }

  render();
}

function handleTeamScoreAction(event) {
  const button = event.target.closest("button[data-action]");
  if (!(button instanceof HTMLButtonElement)) {
    return;
  }

  updateTeamScore(Number(button.dataset.teamIndex), button.dataset.action);
}

function handleOverlayTeamScoreAction(event) {
  const button = event.target.closest("button[data-action]");
  if (!(button instanceof HTMLButtonElement)) {
    return;
  }

  updateTeamScore(Number(button.dataset.teamIndex), button.dataset.action);
}

function updateTeamScore(teamIndex, action) {
  const team = state.teams[teamIndex];
  if (!team) {
    return;
  }

  if (action === "plus") {
    team.score += 1;
  }

  if (action === "minus") {
    team.score = Math.max(0, team.score - 1);
  }

  if (action === "reset") {
    team.score = 0;
  }

  render();
}

function resetScores() {
  state.teams.forEach((team) => {
    team.score = 0;
  });

  render();
}

function handleTimerInput() {
  state.timer.minutes = normalizeNumber(timerMinutesInput.value, 0, 99, 5);
  state.timer.seconds = normalizeNumber(timerSecondsInput.value, 0, 59, 0);

  if (!state.timer.isRunning) {
    state.timer.remainingSeconds = state.timer.minutes * 60 + state.timer.seconds;
  }

  render();
}

function applyTimerSettings() {
  state.timer.minutes = normalizeNumber(timerMinutesInput.value, 0, 99, 5);
  state.timer.seconds = normalizeNumber(timerSecondsInput.value, 0, 59, 0);
  state.timer.remainingSeconds = state.timer.minutes * 60 + state.timer.seconds;
  state.timer.isRunning = false;
  hasPlayedTimerEndSound = false;
  stopTimerInterval();
  render();
}

function handleMainTimerToggle() {
  toggleTimer(true);
}

function handleOverlayTimerToggle() {
  toggleTimer(false);
}

function toggleTimer(openModeOnStart) {
  if (state.timer.remainingSeconds === 0) {
    applyTimerSettings();
    if (state.timer.remainingSeconds === 0) {
      render();
      return;
    }
  }

  state.timer.isRunning = !state.timer.isRunning;

  if (state.timer.isRunning) {
    hasPlayedTimerEndSound = false;
    primeAudioContext();
    startTimerInterval();
    if (openModeOnStart) {
      openGameMode();
    }
  } else {
    stopTimerInterval();
  }

  render();
}

function resetTimer() {
  state.timer.isRunning = false;
  stopTimerInterval();
  state.timer.remainingSeconds = state.timer.minutes * 60 + state.timer.seconds;
  hasPlayedTimerEndSound = false;
  render();
}

function startTimerInterval() {
  stopTimerInterval();

  timerIntervalId = window.setInterval(() => {
    if (!state.timer.isRunning) {
      stopTimerInterval();
      return;
    }

    if (state.timer.remainingSeconds <= 1) {
      state.timer.remainingSeconds = 0;
      state.timer.isRunning = false;
      stopTimerInterval();
      playTimerFinishedSound();
      render();
      return;
    }

    state.timer.remainingSeconds -= 1;
    render();
  }, 1000);
}

function stopTimerInterval() {
  if (timerIntervalId !== null) {
    window.clearInterval(timerIntervalId);
    timerIntervalId = null;
  }
}

function openGameMode() {
  isGameModeOpen = true;
  renderGameMode();
}

function closeGameMode() {
  isGameModeOpen = false;
  renderGameMode();
}

function resetApp() {
  stopTimerInterval();
  isGameModeOpen = false;
  hasPlayedTimerEndSound = false;

  const freshState = cloneData(defaultState);
  state.sports = freshState.sports;
  state.selectedSport = freshState.selectedSport;
  state.players = freshState.players;
  state.teams = freshState.teams;
  state.timer = freshState.timer;

  render();
}

function getDisplaySport() {
  const selected = state.sports.find((sport) => sport.name === state.selectedSport);
  if (selected) {
    return selected;
  }

  return state.sports.find((sport) => sport.enabled) || state.sports[0] || FALLBACK_SPORT;
}

function isTrefbalSelected() {
  return getDisplaySport().id === "trefbal" && state.selectedSport === "Trefbal";
}

function getSelectedSportLabel() {
  return state.sports.length === 0 ? "Voeg sport toe" : state.selectedSport;
}

function getPlayersDisplayText() {
  return isTrefbalSelected() ? "Allemaal" : String(state.players.current);
}

function getTimerStatusLabel() {
  if (state.timer.isRunning) {
    return "Loopt";
  }

  if (state.timer.remainingSeconds === 0) {
    return "Klaar";
  }

  return "Gepauzeerd";
}

function getSportDefinition(sportId) {
  return SPORT_LIBRARY.find((sport) => sport.id === sportId);
}

function buildSportFromDefinition(definition, enabled = true) {
  if (!definition) {
    return null;
  }

  return {
    id: definition.id,
    name: definition.name,
    enabled,
    custom: Boolean(definition.custom),
    image:
      definition.image ||
      createSportArtwork(definition.name, definition.mark, definition.colors || [
        "#0e78ff",
        "#23a565",
      ]),
    removable: true,
  };
}

function getAvailableSportsToAdd() {
  return SPORT_LIBRARY.filter(
    (sport) => !state.sports.some((activeSport) => activeSport.id === sport.id)
  );
}

function normalizePlayerRange(minValue, maxValue) {
  const min = normalizeNumber(minValue, 1, 99, 6);
  const max = normalizeNumber(maxValue, 1, 99, 14);
  return min <= max ? { min, max } : { min: max, max: min };
}

function normalizeNumber(value, min, max, fallback) {
  const parsed = Number.parseInt(value, 10);
  if (Number.isNaN(parsed)) {
    return fallback;
  }

  return Math.min(max, Math.max(min, parsed));
}

function formatTime(totalSeconds) {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

function persistState() {
  writeStorage(
    JSON.stringify({
      sports: state.sports.map((sport) => ({
        id: sport.id,
        name: sport.name,
        enabled: sport.enabled,
        custom: Boolean(sport.custom),
      })),
      selectedSport: state.selectedSport,
      players: state.players,
      teams: state.teams,
      timer: {
        ...state.timer,
        isRunning: false,
      },
    })
  );
}

function escapeHtml(text) {
  return String(text)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function cloneData(value) {
  return JSON.parse(JSON.stringify(value));
}

function buildSportFromSavedState(savedSport) {
  if (!savedSport || typeof savedSport.id !== "string") {
    return null;
  }

  const definition =
    getSportDefinition(savedSport.id) ||
    (savedSport.custom && typeof savedSport.name === "string"
      ? createCustomSportDefinition(savedSport.name, savedSport.id)
      : null);

  if (!definition) {
    return null;
  }

  return buildSportFromDefinition(
    definition,
    savedSport.enabled ?? definition.defaultEnabled ?? true
  );
}

function getCustomSportName() {
  return customSportInput.value.trim().replace(/\s+/g, " ");
}

function createCustomSportDefinition(name, existingId) {
  const trimmedName = name.trim().replace(/\s+/g, " ");
  const sportId = existingId || createUniqueCustomSportId(trimmedName);
  const colors = getCustomSportColors(sportId);

  return {
    id: sportId,
    name: trimmedName,
    mark: getSportMark(trimmedName),
    colors,
    custom: true,
  };
}

function createUniqueCustomSportId(name) {
  const baseId = `eigen-${slugifySportName(name) || "sport"}`;
  if (!state.sports.some((sport) => sport.id === baseId)) {
    return baseId;
  }

  let suffix = 2;
  while (state.sports.some((sport) => sport.id === `${baseId}-${suffix}`)) {
    suffix += 1;
  }

  return `${baseId}-${suffix}`;
}

function slugifySportName(name) {
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function getSportMark(name) {
  const words = name
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  const letters =
    words.length >= 2
      ? `${words[0][0] || ""}${words[1][0] || ""}`
      : name.replace(/[^A-Za-z0-9]/g, "").slice(0, 2);

  return (letters || "SP").toUpperCase();
}

function getCustomSportColors(seed) {
  const palettes = [
    ["#0e78ff", "#23a565"],
    ["#ff8a00", "#ff4d6d"],
    ["#11b48c", "#0a7e7a"],
    ["#7a4dff", "#3854d8"],
    ["#ffb347", "#d96a1d"],
    ["#d9485a", "#f28b2f"],
    ["#00a6b8", "#0e78ff"],
  ];
  let hash = 0;

  for (const character of seed) {
    hash = (hash * 31 + character.charCodeAt(0)) >>> 0;
  }

  return palettes[hash % palettes.length];
}

function createSportArtwork(label, mark, colors) {
  const [primary, secondary] = colors;
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 900 520" role="img" aria-label="${label}">
      <defs>
        <linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="${primary}" />
          <stop offset="100%" stop-color="${secondary}" />
        </linearGradient>
      </defs>
      <rect width="900" height="520" fill="url(#g)" />
      <circle cx="130" cy="130" r="86" fill="rgba(255,255,255,0.15)" />
      <circle cx="762" cy="112" r="58" fill="rgba(255,255,255,0.18)" />
      <circle cx="726" cy="378" r="126" fill="rgba(255,255,255,0.08)" />
      <path d="M90 400c130-112 246-138 356-136 136 1 235 43 340 114" fill="none" stroke="rgba(255,255,255,0.22)" stroke-width="18" stroke-linecap="round"/>
      <path d="M150 456c86-88 154-128 242-164" fill="none" stroke="rgba(255,255,255,0.18)" stroke-width="14" stroke-linecap="round"/>
      <text x="68" y="92" fill="rgba(255,255,255,0.84)" font-family="Inter, Arial, sans-serif" font-size="48" font-weight="700">${label}</text>
      <text x="480" y="354" fill="rgba(255,255,255,0.24)" font-family="Inter, Arial, sans-serif" font-size="204" font-weight="900">${mark}</text>
    </svg>
  `.trim();

  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
}

function getAudioContext() {
  const AudioContextClass = window.AudioContext || window.webkitAudioContext;
  if (!AudioContextClass) {
    return null;
  }

  if (!audioContext) {
    audioContext = new AudioContextClass();
  }

  return audioContext;
}

function primeAudioContext() {
  const context = getAudioContext();
  if (!context || context.state !== "suspended") {
    return;
  }

  context.resume().catch(() => {
    // Ignore audio resume errors and keep the rest of the app functional.
  });
}

function playTimerFinishedSound() {
  if (hasPlayedTimerEndSound) {
    return;
  }

  hasPlayedTimerEndSound = true;

  const context = getAudioContext();
  if (!context) {
    return;
  }

  const startPlayback = () => {
    const now = context.currentTime;
    const notes = [784, 988, 1175];

    notes.forEach((frequency, index) => {
      const oscillator = context.createOscillator();
      const gainNode = context.createGain();
      const startTime = now + index * 0.24;
      const endTime = startTime + 0.18;

      oscillator.type = "sine";
      oscillator.frequency.setValueAtTime(frequency, startTime);
      gainNode.gain.setValueAtTime(0.0001, startTime);
      gainNode.gain.exponentialRampToValueAtTime(0.12, startTime + 0.025);
      gainNode.gain.exponentialRampToValueAtTime(0.0001, endTime);

      oscillator.connect(gainNode);
      gainNode.connect(context.destination);
      oscillator.start(startTime);
      oscillator.stop(endTime + 0.02);
    });
  };

  if (context.state === "suspended") {
    context.resume().then(startPlayback).catch(() => {
      // Ignore audio playback errors silently.
    });
    return;
  }

  startPlayback();
}

function readStorage() {
  try {
    return window.localStorage.getItem(STORAGE_KEY);
  } catch (error) {
    return null;
  }
}

function writeStorage(value) {
  try {
    window.localStorage.setItem(STORAGE_KEY, value);
  } catch (error) {
    // Ignore storage errors so the app keeps working without persistence.
  }
}
