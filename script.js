const topBarElem = document.getElementById("topNav");
const sideBarElem = document.getElementById("sideNav");
const buildingStore = document.getElementById("buildingStore");
const upgradeStore = document.getElementById("upgradeStore");
const clickableCookie = document.getElementById("clickableImg");
const cookieInfo = document.getElementById("cookieInfo");

const upgradeTypes = [
  {
    name: "Better Clicks",
    buildingId: -1,
    cpsReq: -1,
    cost: 5000,
  },
  {
    name: "Auto-Click Upgrade",
    buildingId: 1,
    cpsReq: 100,
    cost: 1000,
  },
  {
    name: "Enchanced Oven Upgrade",
    buildingId: 2,
    cpsReq: 1000,
    cost: 6000,
  },
];

let cookieClicked = false;
let game;

// Fetch building info from api.
async function getBuildingTypes() {
  const buildings = await fetch(
    "https://cookie-upgrade-api.vercel.app/api/upgrades"
  );
  const json = await buildings.json();
  return json;
}

// Learned about classes for this.

// Holds info about game state. Used for saving, etc.
class GameObj {
  // Initialize info. Most is overwritten on save load.
  constructor() {
    this.cookies = 0;
    this.buildings = [1, 0, 0, 0, 0, 0, 0, 0, 0, 0];
    this.upgrades = [0, 0, 0];
    this.upgradeTypes = upgradeTypes;
    this.cps = 0;
    this.cookieInfo = "";

    // Do only after api is loaded - requires building info.
    getBuildingTypes().then((x) => {
      this.buildingTypes = x;
      createUpgradeStoreButtons();
      createBuildingStoreButtons();
      this.calcCps();
    });

    this.data = {
      cookies: this.cookies,
      buildings: this.buildings,
      upgrades: this.upgrades,
    };

    this.importLocalData();
    setInterval(this.harvestCookies.bind(this), 1000);
    setInterval(this.saveCookies.bind(this), 10000);
  }

  // Called on a timer once every 10 secs.
  saveCookies() {
    this.data.cookies = this.cookies;
    this.data.buildings = this.buildings;
    this.data.upgrades = this.upgrades;
    localStorage.setItem("saveData", JSON.stringify(this.data));
    console.log("Saving local data...");
  }

  // Loads data; if none, make new data.
  importLocalData() {
    console.log("Importing local data...");
    let saveData = JSON.parse(localStorage.getItem("saveData"));
    if (!saveData) {
      console.log("No data found. Creating new local data...");
      localStorage.setItem("saveData", JSON.stringify(this.data));
      console.log("Saving local data...");
    } else {
      console.log("Save data found.");
      cookieInfo.textContent = saveData.cookies;
      this.cookies = saveData.cookies;
      this.buildings = saveData.buildings;
      this.upgrades = saveData.upgrades;
    }
  }

  // Called on a timer every 1 sec. Calculates CPS.
  harvestCookies() {
    console.log("Harvesting cookies...");
    this.cookies += this.calcCps();
  }

  calcCps() {
    let newCookies = 0;
    let addAmt = 0;
    let mul = 1;
    for (let i = 0; i < this.buildingTypes.length; i++) {
      addAmt = this.buildingTypes[i].increase * this.buildings[i];
      mul = this.getRelevantUpgradesAmt(this.buildingTypes[i].id);
      newCookies += addAmt * mul;
    }
    this.cps = newCookies;
    this.updateCookieInfo();
    return newCookies;
  }

  // Matches building and upgrade to adjust CPS.
  getRelevantUpgradesAmt(id) {
    let mul = 1;
    for (let i = 0; i < this.upgradeTypes.length; i++) {
      if (id == this.upgradeTypes[i].buildingId) {
        mul *= this.upgrades[i] + 1;
      }
    }
    return mul;
  }

  // Updates the cookie counter and cps display
  updateCookieInfo() {
    cookieInfo.textContent = `${this.cookies} cookies. ${this.cps} cps.`;
  }
}

// Function called by dynamic upgrade buttons. To improve: Should have shared logic with building store buttons.
function doDynamicUpgradeButton(value, price, count) {
  let baseCost = game.upgradeTypes[value].cost;
  let currCost = parseInt(price.textContent);
  if (game.cookies >= currCost) {
    game.upgrades[value]++;
    game.cookies -= currCost;

    let num = game.upgrades[value];
    let costHike = (baseCost / 100) * num * ((baseCost / 100) * num);

    price.textContent = ` ${baseCost + costHike}`;
    count.textContent = `${num} `;
    game.calcCps();
  }
}

// Function called by dynamic building buttons. To improve: Should have shared logic with upgrade store buttons.
function doDynamicBuildingButton(value, price, count) {
  let baseCost = game.buildingTypes[value].cost;
  let currCost = parseInt(price.textContent);
  if (game.cookies >= currCost) {
    game.buildings[value]++;
    game.cookies -= currCost;

    let num = game.buildings[value];
    let costHike = (baseCost / 100) * num * ((baseCost / 100) * num);

    price.textContent = ` ${baseCost + costHike}`;
    count.textContent = `${num} `;
    game.calcCps();
  }
}

// Add buttons to upgrade store based on upgradeTypes object.
function createUpgradeStoreButtons() {
  for (let i = 0; i < game.upgradeTypes.length; i++) {
    let div = document.createElement("div");
    let button = document.createElement("button");
    let p = document.createElement("span");
    let p2 = document.createElement("span");
    let br = document.createElement("br");
    let name = game.upgradeTypes[i].name;
    let cost = game.upgradeTypes[i].cost;
    let num = game.upgrades[i];
    let costHike = (cost / 100) * num * ((cost / 100) * num);
    button.textContent = `${name}`;
    p2.textContent = `${num} `;
    p.textContent = ` ${cost + costHike}`;
    button.onclick = function () {
      doDynamicUpgradeButton(i, p, p2);
    };
    div.appendChild(p2);
    div.appendChild(button);
    div.appendChild(p);
    upgradeStore.appendChild(div);
    upgradeStore.appendChild(br);
  }
}

// Add buttons to building store based on api.
function createBuildingStoreButtons() {
  for (let i = 0; i < game.buildingTypes.length; i++) {
    let div = document.createElement("div");
    let button = document.createElement("button");
    let p = document.createElement("span");
    let p2 = document.createElement("span");
    let br = document.createElement("br");
    let name = game.buildingTypes[i].name;
    let cost = game.buildingTypes[i].cost;
    let num = game.buildings[i];
    let costHike = (cost / 100) * num * ((cost / 100) * num);
    button.textContent = `${name}`;
    p2.textContent = `${num} `;
    p.textContent = ` ${cost + costHike}`;
    button.onclick = function () {
      doDynamicBuildingButton(i, p, p2);
    };
    div.appendChild(p2);
    div.appendChild(button);
    div.appendChild(p);
    buildingStore.appendChild(div);
    buildingStore.appendChild(br);
  }
}

// Create +X number when clicks cookie.
function createFlyingCounter(amount, event) {
  let p = document.createElement("p");
  p.textContent = `+${amount}`;
  p.classList.add("flyAnim");
  let x = event.clientX;
  let y = event.clientY;
  let randX = Math.floor(Math.random() * 11) - 5;
  let randY = Math.floor(Math.random() * 11) - 5;
  p.style.left = `${x - 10 + randX}px`;
  p.style.top = `${y - 60 + randY}px`;
  document.body.appendChild(p);
  setTimeout(function () {
    p.remove();
  }, 4000);
}

// Don't load game obj until window is loaded.

window.addEventListener("load", (event) => {
  game = new GameObj();
  game.updateCookieInfo();
});

// Animation for cookie, when mouse leaves area while clicked.
clickableCookie.addEventListener("mouseleave", function () {
  if (cookieClicked) {
    clickableCookie.classList.add("releaseAnim");
    clickableCookie.classList.remove("clickAnim");
    setTimeout(function () {
      clickableCookie.classList.remove("releaseAnim");
      clickableCookie.style.scale = 1;
    }, 40);
    cookieClicked = false;
  }
});

// Animation for cookie, when mouse is unclicked.
clickableCookie.addEventListener("mouseup", function () {
  if (cookieClicked) {
    clickableCookie.classList.add("releaseAnim");
    clickableCookie.classList.remove("clickAnim");
    setTimeout(function () {
      clickableCookie.classList.remove("releaseAnim");
      clickableCookie.style.scale = 1;
    }, 40);
    cookieClicked = false;
  }
});

// Animation for cookie, when mouse is clicked.
clickableCookie.addEventListener("mousedown", function () {
  clickableCookie.classList.add("clickAnim");
  clickableCookie.classList.remove("releaseAnim");
  setTimeout(function () {
    clickableCookie.classList.remove("clickAnim");
    clickableCookie.style.scale = 0.85;
  }, 40);
  cookieClicked = true;
});

// Function for adding cookies when cookie is clicked.
clickableCookie.addEventListener("click", function (event) {
  let amount = 1 * (1 + game.upgrades[0]);
  game.cookies += amount;
  createFlyingCounter(amount, event);
  game.updateCookieInfo();
});

// Following functions all reposition store when hovered over.
sideBarElem.addEventListener("mouseover", function () {
  if (window.innerWidth > 800) {
    topBarElem.style.width = "80vw";
    return;
  }
  topBarElem.style.width = "100vw";
});

sideBarElem.addEventListener("mouseleave", function () {
  if (window.innerWidth > 800) {
    topBarElem.style.width = "90vw";
    return;
  }
  topBarElem.style.width = "100vw";
});

window.addEventListener("resize", function () {
  if (window.innerWidth <= 800) {
    topBarElem.style.width = "100vw";
    return;
  }
  topBarElem.style.width = "90vw";
});
