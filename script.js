const STORAGE_KEY = "allesbal-dashboard-state-v2";

const DEFAULT_SPORTS = [
  {
    id: "voetbal",
    name: "Voetbal",
    enabled: true,
    image: "./assets/sports/voetbal.svg",
  },
  {
    id: "basketbal",
    name: "Basketbal",
    enabled: true,
    image: "./assets/sports/basketbal.svg",
  },
  {
    id: "frisbee",
    name: "Frisbee",
    enabled: true,
    image: "./assets/sports/frisbee.svg",
  },
  {
    id: "hockey",
    name: "Hockey",
    enabled: true,
    image: "./assets/sports/hockey.svg",
  },
  {
    id: "handbal",
    name: "Handbal",
    enabled: true,
    image: "./assets/sports/handbal.svg",
  },
  {
    id: "trefbal",
    name: "Trefbal",
    enabled: true,
    image: "./assets/sports/trefbal.svg",
  },
];

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

const playersCard = document.querySelector(".players-card");
const currentPlayersStepper = document.querySelector("#currentPlayersStepper");
const currentPlayersInput = document.querySelector("#currentPlayersInput");
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
    const sports = DEFAULT_SPORTS.map((sport) => ({
      ...sport,
      enabled:
        parsedState?.sports?.find((savedSport) => savedSport.id === sport.id)
          ?.enabled ?? sport.enabled,
    }));

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

    return {
      sports,
      selectedSport: parsedState?.selectedSport || defaultState.selectedSport,
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

  sportsList.addEventListener("click", handleSportTileClick);
  sportsList.addEventListener("change", handleSportToggleChange);

  randomPlayersButton.addEventListener("click", randomizePlayers);
  attachNumericFieldEvents(
    [currentPlayersInput, minPlayersInput, maxPlayersInput],
    handlePlayerInputs
  );

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
  selectedSportDisplay.textContent = state.selectedSport;
  enabledSportsCount.textContent =
    enabledSports.length > 0
      ? `${enabledSports.length} sporten actief voor random`
      : "Zet minstens 1 sport aan";
  heroPlayersStat.textContent = getPlayersDisplayText();
  heroTeamsStat.textContent = state.teams.length;
  heroTimerStat.textContent = formatTime(state.timer.remainingSeconds);
  pickSportButton.disabled = enabledSports.length === 0;
}

function renderSportSelection() {
  const enabledSports = state.sports.filter((sport) => sport.enabled);
  toggleAllSportsButton.textContent =
    enabledSports.length === state.sports.length ? "Alles uit" : "Alles aan";

  sportsList.innerHTML = "";

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

  currentPlayersInput.value = state.players.current;
  currentPlayersInput.disabled = trefbalActive;
  currentPlayersStepper.hidden = trefbalActive;
  allPlayersBadge.hidden = !trefbalActive;
  minPlayersInput.value = state.players.min;
  maxPlayersInput.value = state.players.max;
  randomPlayersButton.disabled = trefbalActive;
  currentPlayersLabel.textContent = "Gekozen aantal";
  currentPlayersLabel.hidden = trefbalActive;
  currentPlayersLabel.htmlFor = trefbalActive ? "" : "currentPlayersInput";
  currentPlayersInput.setAttribute("aria-hidden", String(trefbalActive));
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
  overlaySportValue.textContent = state.selectedSport;
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
  const button = event.target.closest('[data-action="select-sport"]');
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
  if (targetId === "currentPlayersInput") {
    if (isTrefbalSelected()) {
      return;
    }

    state.players.current = normalizeNumber(
      state.players.current + delta,
      state.players.min,
      state.players.max,
      state.players.min
    );
    render();
    return;
  }

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
  state.players.current = normalizeNumber(currentPlayersInput.value, 1, 99, state.players.current);
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

  return state.sports.find((sport) => sport.enabled) || state.sports[0];
}

function isTrefbalSelected() {
  return getDisplaySport().id === "trefbal" && state.selectedSport === "Trefbal";
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
      ...state,
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
