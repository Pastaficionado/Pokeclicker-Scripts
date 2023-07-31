// ==UserScript==
// @name          [Pokeclicker] Enhanced Auto Mine
// @namespace     Pokeclicker Scripts
// @author        Ephenia (Credit: falcon71, KarmaAlex, umbralOptimatum, Pastaficionado)
// @description   Automatically mines the Underground with Bombs. Features adjustable settings as well.
// @copyright     https://github.com/Ephenia
// @license       GPL-3.0 License
// @version       2.2

// @homepageURL   https://github.com/Ephenia/Pokeclicker-Scripts/
// @supportURL    https://github.com/Ephenia/Pokeclicker-Scripts/issues
// @downloadURL   https://raw.githubusercontent.com/Ephenia/Pokeclicker-Scripts/master/enhancedautomine.user.js
// @updateURL     https://raw.githubusercontent.com/Ephenia/Pokeclicker-Scripts/master/enhancedautomine.user.js

// @match         https://www.pokeclicker.com/
// @icon          https://www.google.com/s2/favicons?domain=pokeclicker.com
// @grant         none
// @run-at        document-idle
// ==/UserScript==

var scriptName = 'enhancedautomine';

var mineState;
var smallRestoreState;
var awaitAutoMine;
var setThreshold;
var autoMineTimer;
var busyMining;
//var autoMineSkip;
var layersMined;
var sellTreasureState;
var treasureHunter;
var itemThreshold;

function initAutoMine() {
    if (mineState) {
        let locatedRewards = [];
        autoMineTimer = setInterval(function () {
            doAutoMine(locatedRewards);
        }, 500);
    }

    setThreshold = +setThreshold;
    localStorage.setItem("undergroundLayersMined", App.game.statistics.undergroundLayersMined());
    layersMined = JSON.parse(localStorage.getItem('undergroundLayersMined'));

    const minerHTML = document.createElement("div");
    minerHTML.innerHTML = `<button id="auto-mine-start" class="col-12 col-md-2 btn btn-${mineState ? 'success' : 'danger'}">Auto Mine [${mineState ? 'ON' : 'OFF'}]</button>
<button id="small-restore-start" class="col-12 col-md-3 btn btn-${smallRestoreState ? 'success' : 'danger'}">Auto Small Restore [${smallRestoreState ? 'ON' : 'OFF'}]</button>
<div id="threshold-input" class="col-12 col-md-3 btn-secondary"><img title="Money" src="assets/images/currency/money.svg" height="25px">
<input title="Value at which to stop buying Small Restores." type="text" id="small-restore"></div>
<select id="treasure-hunter" class="col-12 col-md-2 btn">
  <option value="-1">All Items</option>
  <option value="0">Fossils</option>
  <option value="1">Evolution Items</option>
  <option value="2">Gem Plates</option>
  <option value="3">Shards</option>
  <option value="4">Mega Stones</option>
  <option value="5">Diamond Value</option>
</select>
<div id="item-threshold-input" class="col-12 col-md-2 btn-secondary"><img id="treasure-image" src="assets/images/currency/money.svg" height="25px">
<input title="Skips layers with fewer target items than this value." type="text" id="item-threshold"></div>`
    /* <div id="skip-input" class="col-12 col-md-3 btn-secondary">
    <input title="Automatically skips layers with fewer items than this value." type="text" id="auto-skip"></div> */
    document.querySelectorAll('#mineBody + div')[0].prepend(minerHTML);
    $("#auto-mine-start").unwrap();
    document.getElementById('small-restore').value = setThreshold.toLocaleString('en-US');
    document.getElementById('treasure-hunter').value = treasureHunter;
    document.getElementById('item-threshold').value = itemThreshold.toLocaleString('en-US');
    setTreasureImage();
    //document.getElementById('auto-skip').value = autoMineSkip.toLocaleString('en-US');
    const autoSeller = document.createElement("div");
    autoSeller.innerHTML = `<div>
    <button id="auto-sell-treasure" class="col-12 col-md-3 btn btn-${sellTreasureState ? 'success' : 'danger'}">Auto Sell Treasure [${sellTreasureState ? 'ON' : 'OFF'}]</button>
</div>`
    document.getElementById('treasures').prepend(autoSeller);

    document.getElementById('auto-mine-start').addEventListener('click', event => { startAutoMine(event); });
    document.getElementById('small-restore-start').addEventListener('click', event => { autoRestore(event); });
    document.getElementById('auto-sell-treasure').addEventListener('click', event => { autoSellTreasure(event); });
    document.getElementById('treasure-hunter').addEventListener('input', event => { treasureHunt(event); });

    document.querySelector('#small-restore').addEventListener('input', event => {
        setThreshold = +event.target.value.replace(/[A-Za-z!@#$%^&*()]/g, '').replace(/[,]/g, "");
        localStorage.setItem("autoBuyThreshold", setThreshold);
        event.target.value = setThreshold.toLocaleString('en-US');
    });
    document.querySelector('#item-threshold').addEventListener('input', event => {
        itemThreshold = +event.target.value.replace(/[A-Za-z!@#$%^&*()]/g, '').replace(/[,]/g, "");
        localStorage.setItem("itemThreshold", itemThreshold);
        event.target.value = itemThreshold.toLocaleString('en-US');
    });
    /*
    document.querySelector('#auto-skip').addEventListener('input', event => {
        autoMineSkip = +event.target.value.replace(/[A-Za-z!@#$%^&*()]/g, '').replace(/[,]/g, "");
        localStorage.setItem("autoMineSkip", autoMineSkip);
        event.target.value = autoMineSkip.toLocaleString('en-US');
    });
    */

    addGlobalStyle('#threshold-input { display:flex;flex-direction:row;flex-wrap:wrap;align-content:center;justify-content:space-evenly;align-items:center; }');
    addGlobalStyle('#item-threshold-input { display:flex;flex-direction:row;flex-wrap:wrap;align-content:center;justify-content:space-evenly;align-items:center; }');
    addGlobalStyle('#small-restore { width:150px; }');
    addGlobalStyle('#item-threshold { width:75px; }');
    //addGlobalStyle('#skip-input { display:flex;flex-direction:row;flex-wrap:wrap;align-content:center;justify-content:space-evenly;align-items:center; }');
    //addGlobalStyle('#auto-skip { width:100px; }');
}

function startAutoMine(event) {
    const element = event.target;
    mineState = !mineState
    mineState ? element.classList.replace('btn-danger', 'btn-success') : element.classList.replace('btn-success', 'btn-danger');
    element.textContent = `Auto Mine [${mineState ? 'ON' : 'OFF'}]`;
    if (mineState) {
        let locatedRewards = [];
        autoMineTimer = setInterval(function () {
            doAutoMine(locatedRewards);
        }, 1000); // Happens every 1 second
    } else {
        clearTimeout(busyMining);
        //clearTimeout(mineComplete);
        clearInterval(autoMineTimer)
    }
    localStorage.setItem('autoMineState', mineState);
}

function doAutoMine(locatedRewards) {
    let getEnergy = Math.floor(App.game.underground.energy);
    const getMoney = App.game.wallet.currencies[GameConstants.Currency.money]();
    const buriedItems = Mine.itemsBuried();
    const skipsRemain = Mine.skipsRemaining();
    const smallRestore = +player.itemList["SmallRestore"]();
    const mediumRestore = player.itemList["MediumRestore"]();
    const largeRestore = player.itemList["LargeRestore"]();
    const getCost = ItemList["SmallRestore"].price();
    const treasureHunting = Math.sign(treasureHunter) >= 0 && itemThreshold > 0;
    const treasureTypes = ['Fossils', 'Evolution Items', 'Gem Plates', 'Shards', 'Mega Stones', 'Diamond Value'];
    const surveyResult = Mine.surveyResult();
    let treasureAmount;
    if (Mine.loadingNewLayer) {
        locatedRewards.length = 0;;
        // Do nothing while the new layer is loading
        return;
    }
    if (treasureHunting && surveyResult) {
        // Parse survey for the treasure type we want
        try {
            let re = new RegExp(String.raw`${treasureTypes[treasureHunter]}: (\d+)`);
            treasureAmount = +re.exec(surveyResult)[1];
            // Count fossil pieces as fossils
            if (treasureHunter == 0) {
                re = new RegExp(`Fossil Pieces: (\d+)`);
                treasureAmount += +re.exec(surveyResult)[1];
                }
        } catch (err) {
            treasureAmount = 0;
        }
    }
    if (treasureHunting && !surveyResult) {
        // Survey the layer
        mineMain(locatedRewards);
    } else if (treasureHunting && treasureAmount < itemThreshold && skipsRemain > 0) {
        // Too few of the desired treasure type, skip
        resetLayer();
    } else if (!treasureHunting && buriedItems < itemThreshold && skipsRemain > 0) {
        // Too few items, skip
        resetLayer();
    } else {
        // Either the layer meets requirements or we're out of skips
        mineMain(locatedRewards);
    }
    if (layersMined != App.game.statistics.undergroundLayersMined()) {
        if (sellTreasureState) {
            Underground.sellAllMineItems();
        }
        localStorage.setItem('undergroundLayersMined', App.game.statistics.undergroundLayersMined());
        layersMined = JSON.parse(localStorage.getItem('undergroundLayersMined'));
    }

    function mineMain(locatedRewards) {
        if (smallRestoreState) {
            if ((getCost == 30000) && (getMoney >= setThreshold + 30000)) {
                ItemList["SmallRestore"].buy(1);
            }
            if (getEnergy < 15) {
                if (largeRestore > 0) {
                    ItemList["LargeRestore"].use();
                } else if (mediumRestore > 0) {
                    ItemList["MediumRestore"].use();
                } else {
                    while(+player.itemList["SmallRestore"]() >= 1 && Math.floor(App.game.underground.energy) < 125){
                        ItemList["SmallRestore"].use();
                    }
                }
                // Refresh energy count so we can use it immediately
                getEnergy = Math.floor(App.game.underground.energy);
            }
        }
        if (!surveyResult && treasureHunting && skipsRemain != 0) {
            if (getEnergy >= App.game.underground.getSurvey_Cost()) {
                Mine.survey();
                $('#mine-survey-result').tooltip("hide");
            }
            return true;
        } else {
            let minedThisInterval = false;
            if (getEnergy >= 1) {
                if (Mine.toolSelected() != 0) {
                    Mine.toolSelected(Mine.Tool.Chisel);
                }
                let mineBody = document.querySelector(`div[id="mineBody"]`);
                let mineGrid = mineBody.children;
                let rewards = mineBody.querySelectorAll('.mineReward');

                for (var ii = 0; ii < rewards.length; ii++) {
                    var reward = rewards[ii];
                    var rewardParent = reward.parentNode;
                    var ri = +reward.parentNode.getAttribute('data-i');
                    var rj = +reward.parentNode.getAttribute('data-j');
                    //the tile's classes describe the dimensions of the shape, the coordinates of the tile within the image, and the rotation of the image
                    let classList = reward.classList;
                    let rotations = +classList[3].split("-")[1]; //e.g. 1
                    const sizeString = classList[1].split("-"); //e.g. ["size", "3", "3"]
                    let size = [+sizeString[1], +sizeString[2]]
                    const positionString = classList[2].split("-"); //e.g. ["pos", "1", "1"];
                    const originalPos = [+positionString[1], +positionString[2]];
                    let pos;

                    //originalPos is relative to the top left corner [0,0] of the unrotated image
                    //we will update pos to be relative to the new top left and reverse the size dimensions as rotation requires
                    switch (rotations) {
                        case 0: //rotations-0: initial orientation
                            pos = originalPos;
                            break;
                        case 1: //rotations-1: 1 turn clockwise
                            size = size.reverse();
                            pos = [size[0] - 1 - originalPos[1], originalPos[0]];
                            break;
                        case 2: //rotations-2: 3 turns clockwise!?!?
                            size = size.reverse();
                            pos = [originalPos[1], (size[1] - 1 - originalPos[0])];
                            break;
                        case 3: //rotations-3: 2 turns clockwise
                            pos = [(size[0] - 1 - originalPos[0]), (size[1] - 1 - originalPos[1])];
                            break;
                        default:
                            console.log("Switch statement fallthrough. Suggests unexpected class structure.")
                    }
                    const verticalOrigin = ri - pos[1];
                    const horizontalOrigin = rj - pos[0];
                    const coordinateString = `${verticalOrigin}-${horizontalOrigin}`
                    if (locatedRewards.length >= buriedItems || !locatedRewards.includes(coordinateString)) {
                        for (let i = 0; i < size[1]; i++) {
                            for (let j = 0; j < size[0]; j++) {
                                //ri, pos[1], and i are vertical - rj, pos[0], and j are horizontal
                                const verticalCoordinate = verticalOrigin + i;
                                const horizontalCoordinate = horizontalOrigin + j;
                                if (mineGrid[verticalCoordinate] && mineGrid[verticalCoordinate].children[horizontalCoordinate]) {
                                    let selectedTile = mineGrid[verticalCoordinate].children[horizontalCoordinate];
                                    //highlights entire reward before chiseling for testing purposes
                                    // selectedTile.style.filter = "sepia(50%) saturate(120%) brightness(80%) hue-rotate(320deg)";
                                    //we will store the origin point as the identifier of each object. once we locate all of them, we chisel
                                    if (i == 0 && j == 0 && !locatedRewards.includes(coordinateString)) {
                                        locatedRewards.push(coordinateString);
                                        selectedTile.style.filter = "sepia(50%) saturate(120%) brightness(80%) hue-rotate(320deg)";
                                    }
                                    if (!selectedTile.className.includes("Reward") &&
                                        !selectedTile.className.includes("rock0") &&
                                        locatedRewards.length >= buriedItems
                                    ) {
                                        Mine.click(verticalCoordinate, horizontalCoordinate);
                                        getEnergy -= 1;
                                        minedThisInterval = true;
                                    }
                                }
                            }
                        }
                    }
                }
                if (getEnergy >= 10 && !minedThisInterval) {
                    // Only bomb if out of places to chisel
                    Mine.bomb();
                }
            }
        }
    }
    function resetLayer() {
        if (!Mine.loadingNewLayer) {
            locatedRewards.length = 0;
            Mine.loadingNewLayer = true;
            setTimeout(Mine.completed, 1500);
            //GameHelper.incrementObservable(App.game.statistics.undergroundLayersMined);
            if (Mine.skipsRemaining() > 0) {
                GameHelper.incrementObservable(Mine.skipsRemaining, -1);
            }
        }
    }
}


function autoRestore(event) {
    const element = event.target;
    smallRestoreState = !smallRestoreState;
    smallRestoreState ? element.classList.replace('btn-danger', 'btn-success') : element.classList.replace('btn-success', 'btn-danger');
    element.textContent = `Auto Small Restore [${smallRestoreState ? 'ON' : 'OFF'}]`;
    localStorage.setItem('autoSmallRestore', smallRestoreState);
}

function autoSellTreasure(event) {
    const element = event.target;
    sellTreasureState = !sellTreasureState;
    sellTreasureState ? element.classList.replace('btn-danger', 'btn-success') : element.classList.replace('btn-success', 'btn-danger');
    element.textContent = `Auto Sell Treasure [${sellTreasureState ? 'ON' : 'OFF'}]`;
    localStorage.setItem('autoSellTreasure', sellTreasureState);
}

function treasureHunt(event) {
    const element = event.target;
    const value = +element.value;
    treasureHunter = value;
    localStorage.setItem('treasureHunter', value);
    setTreasureImage();
}

function setTreasureImage() {
    const imageSources = ['items/underground/Hard Stone.png', 'breeding/Helix Fossil.png', 'items/evolution/Fire_stone.png',
        'items/underground/Flame Plate.png', 'items/underground/Red Shard.png', 'megaStone/142.png', 'currency/diamond.svg'];
    const imageTitles = ['Item', 'Fossil', 'Evolution Stone', 'Plate', 'Shard', 'Mega Stone', 'Diamond'];
    document.getElementById('treasure-image').src = `assets/images/${imageSources[1 + treasureHunter]}`;
    document.getElementById('treasure-image').title = imageTitles[1 + treasureHunter];
}

if (!validParse(localStorage.getItem('autoMineState'))) {
    localStorage.setItem("autoMineState", false);
}
if (!validParse(localStorage.getItem('autoSmallRestore'))) {
    localStorage.setItem("autoSmallRestore", false);
}
if (!validParse(localStorage.getItem('autoBuyThreshold'))) {
    localStorage.setItem("autoBuyThreshold", 0);
}
if (!validParse(localStorage.getItem('autoSellTreasure'))) {
    localStorage.setItem("autoSellTreasure", false);
}
if (!validParse(localStorage.getItem('treasureHunter'))) {
    localStorage.setItem("treasureHunter", -1);
}
if (!validParse(localStorage.getItem('itemThreshold'))) {
    localStorage.setItem("itemThreshold", 0);
}
/*if (!localStorage.getItem('autoMineSkip')) {
    localStorage.setItem("autoMineSkip", 0);
}*/
mineState = JSON.parse(localStorage.getItem('autoMineState'));
smallRestoreState = JSON.parse(localStorage.getItem('autoSmallRestore'));
setThreshold = JSON.parse(localStorage.getItem('autoBuyThreshold'));
//autoMineSkip = JSON.parse(localStorage.getItem('autoMineSkip'));
sellTreasureState = JSON.parse(localStorage.getItem('autoSellTreasure'));
treasureHunter = JSON.parse(localStorage.getItem('treasureHunter'));
itemThreshold = JSON.parse(localStorage.getItem('itemThreshold'));

function loadScript() {
    var oldInit = Preload.hideSplashScreen

    Preload.hideSplashScreen = function () {
        var result = oldInit.apply(this, arguments)
        initAutoMine()
        return result
    }
}

var scriptName = 'enhancedautomine'

if (document.getElementById('scriptHandler') != undefined) {
    var scriptElement = document.createElement('div')
    scriptElement.id = scriptName
    document.getElementById('scriptHandler').appendChild(scriptElement)
    if (localStorage.getItem(scriptName) != null) {
        if (localStorage.getItem(scriptName) == 'true') {
            loadScript()
        }
    }
    else {
        localStorage.setItem(scriptName, 'true')
        loadScript()
    }
}
else {
    loadScript();
}

function validParse(key) {
    try {
        if (key === null) {
            throw new Error;
        }
        JSON.parse(key);
        return true;
    } catch (e) {
        return false;
    }
}

function addGlobalStyle(css) {
    var head, style;
    head = document.getElementsByTagName('head')[0];
    if (!head) { return; }
    style = document.createElement('style');
    style.type = 'text/css';
    style.innerHTML = css;
    head.appendChild(style);
}

if (!App.isUsingClient || localStorage.getItem(scriptName) === 'true') {
    loadScript();
}