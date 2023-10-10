// Créateur de monde
var canvas = document.getElementById('game');
var context = canvas.getContext('2d');

//#region CONSTANTES

const BLOCKSIZE = 25;
/*const SPIKE = new Image();
SPIKE.src = "./spike.png";
const SPIKE_U = new Image();
SPIKE_U.src = "./spikeupsidedown.png";*/

//#endregion

//#region VARIABLES
var mouseScreenPosX = 0;
var mouseScreenPosY = 0;

var blockX = 0;
var blockY = 0;

var offsetX = 0;
var offsetY = 0;

var map = {
    blocs: [],
    spikes: []
}

var bigBlocs = [];
var bigLineBlocs = [];

var myBloc = 0;

var reset = false;

var isPlacing = false;
var isBreaking = false;

var menuOpened = false;
var debugMode = false;

let mapName = "map0";

//#endregion

//#region FONCTIONS
function isABloc(x, y, checkSpikes = false) {
    var result = false;
    for (var i = 0; i < map.blocs.length; i++) {
        if (map.blocs[i][0] === x && map.blocs[i][1] === y) {
            result = true;
        }
    }
    for (var i = 0; i < map.spikes.length; i++) {
        if (map.spikes[i][0] === x && map.spikes[i][1] === y) {
            result = checkSpikes;
        }
    }
    return result;
}

const copyCode = async () => {
    try {
        await navigator.clipboard.writeText(calculateResult());
    } catch (err) {
    }
}

function calculateResult() {
    var tab = "\t";
    // blocs variable
    var result = "";
    for (var i = 0; i < bigBlocs.length; i++) {
        result += "{" + bigBlocs[i][0] + ", " + bigBlocs[i][1] + ", " +
        (bigBlocs[i][0] + bigBlocs[i][2]) + ", " + (bigBlocs[i][1] + bigBlocs[i][3])
        + "}" + (i < bigBlocs.length - 1 ? "," : "") + "\n";
    }
    /* map.spikes variable
    result += "float spikes[" + map.spikes.length + "][2] = {";
    for (var i = 0; i < map.spikes.length; i++) {
        result += "{" + ((map.spikes[i][0] / (BLOCKSIZE / 10)) + 5) + ", DISPLAY_HEIGHT - " + ((BLOCKSIZE * offsetY - map.spikes[i][1]) / (BLOCKSIZE / 10)) + "}" + (i < map.spikes.length - 1 ? "," : "");
    }
    result += "};";*/
    // remove the "DISPLAY_HEIGHT - 0";
    result = result.replaceAll(" - 0", "");
    console.log(bigBlocs.length + " walls");
    return result;
}

function switchDebugMode() {
    debugMode = !debugMode;
    document.getElementById("debug-mode").innerHTML = "Debug mode : " + (debugMode ? "on" : "off");
}

function deleteLevel() {
    map.blocs = [];
    map.spikes = [];
}
//#endregion

// Load
function loadMap(name) {
    document.querySelector("title").innerHTML = name;
    mapName = name;
    if (localStorage.getItem(mapName) != null) {
        map = JSON.parse(localStorage.getItem(mapName));
    }
}
loadMap(mapName);

function loop() {
    canvas.width = window.innerWidth - 1;
    canvas.height = window.innerHeight - 1;
    
    // arrondi l'emplacement de la souris sur la grille
    blockX = parseInt(mouseScreenPosX / BLOCKSIZE) * BLOCKSIZE;
    blockY = parseInt(mouseScreenPosY / BLOCKSIZE) * BLOCKSIZE;

    //#region MENU
    document.getElementById("menu-background").style.display = menuOpened ? "block" : "none";
    //#endregion
    
    //#region CALCULER LES GROS BLOCS
    bigBlocs = [];
    bigLineBlocs = [];
    // creer les lignes
    for (var i = 0; i < map.blocs.length; i++) {
        if (!isABloc(map.blocs[i][0] - BLOCKSIZE, map.blocs[i][1])) {
            var endFound = false;
            var lenght = 0;
            while (!endFound) {
                lenght ++;
                if (!isABloc(map.blocs[i][0] + (BLOCKSIZE * lenght), map.blocs[i][1])) {
                    endFound = true;
                }
            }
            bigLineBlocs.push([map.blocs[i][0], map.blocs[i][1], BLOCKSIZE * lenght, BLOCKSIZE]);
        }
    }
    // supprimer les lignes innutiles
    for (var i = 0; i < bigLineBlocs.length; i++) {
        var isOnTop = true;
        for (var j = 0; j < bigLineBlocs.length; j ++) {
            if (bigLineBlocs[j][2] === bigLineBlocs[i][2] && bigLineBlocs[j][1] + BLOCKSIZE === bigLineBlocs[i][1] && bigLineBlocs[j][0] === bigLineBlocs[i][0]) {
                isOnTop = false;
            }
        }
        if (isOnTop) {
            bigBlocs.push(bigLineBlocs[i]);
        }
    }
    // creer les gros blocs
    for (var i = 0; i < bigBlocs.length; i++) {
        var endFound = false;
        var lenght = 0;
        while (!endFound) {
            lenght ++;
            for (var j = bigBlocs[i][0]; j < bigBlocs[i][0] + bigBlocs[i][2]; j += BLOCKSIZE) {
                if (!isABloc(j, bigBlocs[i][1] + lenght*BLOCKSIZE)) {
                    endFound = true;
                }
            }
            if (isABloc(bigBlocs[i][0] - BLOCKSIZE, bigBlocs[i][1] + (lenght)*BLOCKSIZE) || isABloc(bigBlocs[i][0] + bigBlocs[i][2], bigBlocs[i][1] + lenght*BLOCKSIZE)) {
                endFound = true
            }
        }
        bigBlocs[i][3] = BLOCKSIZE * lenght;
    }
    //#endregion

    //#region AFFICHAGE
    // grid
    context.fillStyle = "#133F8E";
    for (var x = 0; x < canvas.width; x+=BLOCKSIZE) {
        context.fillRect(x, 0, 1, canvas.height);
    }
    for (var y = 0; y < canvas.height; y+=BLOCKSIZE) {
        context.fillRect(0, y, canvas.width, 1);
    }
    // x0 line
    context.fillStyle = "yellow"
    context.fillRect(offsetX * BLOCKSIZE, 0, 1, canvas.height);
    // y0 line
    context.fillRect(0, offsetY, canvas.width, 1);
    // black square
    context.strokeStyle = "black";
    context.lineWidth = 2;
    context.strokeRect(blockX, blockY, BLOCKSIZE, BLOCKSIZE);
    // blocs
    context.fillStyle = "black";
    for (var i = 0; i < map.blocs.length; i++) {
        context.fillRect(map.blocs[i][0] + offsetX * BLOCKSIZE, map.blocs[i][1] + offsetY, BLOCKSIZE, BLOCKSIZE);
    }
    // spikes
    for (var i = 0; i < map.spikes.length; i++) {
        if (isABloc(map.spikes[i][0], map.spikes[i][1] - BLOCKSIZE)) {
            context.drawImage(SPIKE_U, map.spikes[i][0] + offsetX * BLOCKSIZE, map.spikes[i][1], BLOCKSIZE, BLOCKSIZE);
        } else {
            context.drawImage(SPIKE, map.spikes[i][0] + offsetX * BLOCKSIZE, map.spikes[i][1], BLOCKSIZE, BLOCKSIZE);
        }
    }
    // big blocs
    if (debugMode) {
        context.fillStyle = "red";
        for (var i = 0; i < bigBlocs.length; i++) {
            context.fillRect(bigBlocs[i][0] + offsetX * BLOCKSIZE + 5, bigBlocs[i][1] + offsetY + 5, bigBlocs[i][2] - 10, bigBlocs[i][3] - 10);
        }
    }
    // myBloc
    context.fillStyle = "white";
    context.fillRect(BLOCKSIZE / 2, BLOCKSIZE / 2, BLOCKSIZE * 2, BLOCKSIZE * 2);
    context.fillStyle = "black";
    if (myBloc === 0) {
        context.fillRect(BLOCKSIZE, BLOCKSIZE, BLOCKSIZE, BLOCKSIZE);
    } else {
        context.drawImage(SPIKE, BLOCKSIZE, BLOCKSIZE, BLOCKSIZE, BLOCKSIZE);
    }
    // ground
    context.fillStyle = "#122c5a";
    context.fillRect(0, BLOCKSIZE * 25, canvas.width, canvas.height - BLOCKSIZE * 25);
    //#endregion

    //#region POSER/CASSER
    //detecte si on clique
    if (isPlacing && !isABloc(blockX-offsetX*BLOCKSIZE, blockY-offsetY, true)) {
        if (myBloc === 0) {
            map.blocs.push([blockX-offsetX*BLOCKSIZE, blockY-offsetY]);
        } else {
            map.spikes.push([blockX-offsetX*BLOCKSIZE, blockY-offsetY]);
        }
        setTimeout(calculateResult, 100);
    }
    //detecte si on clique droit
    if (isBreaking) {
        for (var i = 0; i < map.blocs.length; i++) {
            if (map.blocs[i][0] + offsetX * BLOCKSIZE === blockX && map.blocs[i][1] + offsetY === blockY) {
                map.blocs.splice(i, 1);
            }
        }
        for (var i = 0; i < map.spikes.length; i++) {
            if (map.spikes[i][0] + offsetX * BLOCKSIZE === blockX && map.spikes[i][1] + offsetY === blockY) {
                map.spikes.splice(i, 1);
            }
        }
        setTimeout(calculateResult, 100);
    }
    //#endregion

    requestAnimationFrame(loop);
    if (!reset) {
        localStorage.setItem(mapName, JSON.stringify(map));
    } else {
        localStorage.removeItem(mapName);
    }
}
//#region INPUTS
//position de la souris
canvas.addEventListener("mousemove", (e) => {
    mouseScreenPosX = e.clientX;
    mouseScreenPosY = e.clientY;
});
//molette
canvas.addEventListener("wheel", (e) => {
    if (e.deltaY < 0) {
        offsetX++;
    }
    if (e.deltaY > 0) {
        offsetX--;
    }
});
document.addEventListener('mousedown', function(e) {
    //detecte si on clique
    if (e.which === 1 && !menuOpened) {
        isPlacing = true;
    }
    //detecte si on clique droit
    if (e.which === 3 && !menuOpened) {
        isBreaking = true;
    }
});
document.addEventListener('mouseup', function(e) {
    //detecte si on clique droit
    if (e.which === 1 || e.which === 3) {
        isPlacing = false;
        isBreaking = false;
    }
});
document.addEventListener('keydown', function(e) {
    if (e.which === 27) {
        menuOpened = !menuOpened;
    }
    if (e.which === 32) {
        myBloc ++;
        myBloc %= 2;
    }
    // +
    if (e.which === 107) {
        offsetY += BLOCKSIZE;
    }
    // -
    if (e.which === 109) {
        offsetY -= BLOCKSIZE;
    }
});
//#endregion

// demarre le jeu
requestAnimationFrame(loop);