// Créateur de monde
let canvas = document.getElementById('game');
let context = canvas.getContext('2d');

//#region CONSTANTES

const BLOCKSIZE = 25;

const TEXTURE_LIST = ["red", "green", "blue"];

//#endregion

//#region VARIABLES
let mouseScreenPosX = 0;
let mouseScreenPosY = 0;

let blockX = 0;
let blockY = 0;

let offsetX = 0;
let offsetY = 0;

let map = {
    blocks: [],
    ends: [],
    tiles: []
};

let blockType = 0; // 0 : mur, 1 : arrivé

let bigBlocs = [];
let bigLineBlocs = [];

let bigEnds = [];
let bigLineEnds = [];

let reset = false;

let isPlacing = false;
let isBreaking = false;

let menuOpened = false;
let debugMode = false;

let mapName = "map0";

let mode = false // false : edit, true : paint

let selectedTexture = 0;

//#endregion

//#region FONCTIONS
function isABloc(x, y) {
    if (mode) {
        // Mode peinture
        // Tiles
        for (let i = 0; i < map.tiles.length; i++) {
            if (map.tiles[i][0] === x && map.tiles[i][1] === y) {
                return true;
            }
        }
    } else {
        // Mode édition
        // Bloc
        for (let i = 0; i < map.blocks.length; i++) {
            if (map.blocks[i][0] === x && map.blocks[i][1] === y) {
                return true;
            }
        }

        // Fin de niveau
        for (let i = 0; i < map.ends.length; i++) {
            if (map.ends[i][0] === x && map.ends[i][1] === y) {
                return true;
            }
        }
    }

    return false;
}

const copyCode = async () => {
    try {
        await navigator.clipboard.writeText(calculateResult());
    } catch (err) {
    }
}

function calculateResult() {
    // blocs variables
    let result = "";

    // Blocs
    if (bigBlocs.length > 0) {
        result += "--- Walls\n";
    }
    for (let i = 0; i < bigBlocs.length; i++) {
        result += "{" + bigBlocs[i][0] + ".0, " + bigBlocs[i][1] + ".0, " + (bigBlocs[i][0] + bigBlocs[i][2]) + ".0, " + (bigBlocs[i][1] + bigBlocs[i][3])
        + ".0}" + (i < bigBlocs.length - 1 ? "," : "") + "\n";
    }

    // Fin de niveau
    if (bigEnds.length > 0) {
        result += "--- Ends\n";
    }

    for (let i = 0; i < bigEnds.length; i++) {
        result += "{" + bigEnds[i][0] + ".0, " + bigEnds[i][1] + ".0, " +
        bigEnds[i][2] + ".0, " + bigEnds[i][3] + ".0, 100.0}" + (i < bigEnds.length - 1 ? "," : "") + "\n";
    }

    // Tiles
    if (map.tiles.length > 0) {
        result += "--- Tiles\n";
    }
    
    for (let i = 0; i < map.tiles.length; i++) {
        result += "{" + map.tiles[i][0] + ".0, " + map.tiles[i][1] + ".0, " + map.tiles[i][2] + ".0}" + (i < map.tiles.length - 1 ? "," : "") + "\n";
    }

    return result;
}

function switchDebugMode() {
    debugMode = !debugMode;
    document.getElementById("debug-mode").innerHTML = "Debug mode : " + (debugMode ? "on" : "off");
}

function switchMode() {
    mode = !mode;
    if (mode) {
        document.querySelector("#edit").style.display = "inline";
        document.querySelector("#paint").style.display = "none";
    } else {
        document.querySelector("#edit").style.display = "none";
        document.querySelector("#paint").style.display = "inline";
    }
}

function deleteLevel() {
    map.blocks = [];
    map.ends = [];
    map.tiles = [];
}

function loadMap(name) {
    document.querySelector("title").innerHTML = name;
    mapName = name;
    if (localStorage.getItem(mapName) != null) {
        map = JSON.parse(localStorage.getItem(mapName));
    }
}

function exportMap() {
    console.log(JSON.stringify(map));
}

function importMap(mapString) {
    map = JSON.parse(mapString);
}

//#endregion

// Load
loadMap(mapName);

function loop() {
    // Adapte le canvas
    canvas.width = window.innerWidth - 1;
    canvas.height = window.innerHeight - 1;
    
    // Arrondi l'emplacement de la souris sur la grille
    blockX = parseInt(mouseScreenPosX / BLOCKSIZE) * BLOCKSIZE;
    blockY = parseInt(mouseScreenPosY / BLOCKSIZE) * BLOCKSIZE;

    // Menu
    document.getElementById("menu-background").style.display = menuOpened ? "block" : "none";
    
    //#region CALCULER LES GROS BLOCS MUR

    bigBlocs = [];
    bigLineBlocs = [];
    // creer les lignes
    for (let i = 0; i < map.blocks.length; i++) {
        if (!isABloc(map.blocks[i][0] - BLOCKSIZE, map.blocks[i][1])) {
            let endFound = false;
            let lenght = 0;
            while (!endFound) {
                lenght ++;
                if (!isABloc(map.blocks[i][0] + (BLOCKSIZE * lenght), map.blocks[i][1])) {
                    endFound = true;
                }
            }
            bigLineBlocs.push([map.blocks[i][0], map.blocks[i][1], BLOCKSIZE * lenght, BLOCKSIZE]);
        }
    }
    // supprimer les lignes innutiles
    for (let i = 0; i < bigLineBlocs.length; i++) {
        let isOnTop = true;
        for (let j = 0; j < bigLineBlocs.length; j ++) {
            if (bigLineBlocs[j][2] === bigLineBlocs[i][2] && bigLineBlocs[j][1] + BLOCKSIZE === bigLineBlocs[i][1] && bigLineBlocs[j][0] === bigLineBlocs[i][0]) {
                isOnTop = false;
            }
        }
        if (isOnTop) {
            bigBlocs.push(bigLineBlocs[i]);
        }
    }
    // Créer les gros blocs
    for (let i = 0; i < bigBlocs.length; i++) {
        let endFound = false;
        let lenght = 0;
        while (!endFound) {
            lenght ++;
            for (let j = bigBlocs[i][0]; j < bigBlocs[i][0] + bigBlocs[i][2]; j += BLOCKSIZE) {
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

    //#region CALCULER LES GROS BLOCS FIN DE NIVEAU
    bigEnds = [];
    bigLineEnds = [];
    // creer les lignes
    for (let i = 0; i < map.ends.length; i++) {
        if (!isABloc(map.ends[i][0] - BLOCKSIZE, map.ends[i][1])) {
            let endFound = false;
            let lenght = 0;
            while (!endFound) {
                lenght ++;
                if (!isABloc(map.ends[i][0] + (BLOCKSIZE * lenght), map.ends[i][1])) {
                    endFound = true;
                }
            }
            bigLineEnds.push([map.ends[i][0], map.ends[i][1], BLOCKSIZE * lenght, BLOCKSIZE]);
        }
    }
    // supprimer les lignes innutiles
    for (let i = 0; i < bigLineEnds.length; i++) {
        let isOnTop = true;
        for (let j = 0; j < bigLineEnds.length; j ++) {
            if (bigLineEnds[j][2] === bigLineEnds[i][2] && bigLineEnds[j][1] + BLOCKSIZE === bigLineEnds[i][1] && bigLineEnds[j][0] === bigLineEnds[i][0]) {
                isOnTop = false;
            }
        }
        if (isOnTop) {
            bigEnds.push(bigLineEnds[i]);
        }
    }
    // creer les gros blocs
    for (let i = 0; i < bigEnds.length; i++) {
        let endFound = false;
        let lenght = 0;
        while (!endFound) {
            lenght ++;
            for (let j = bigEnds[i][0]; j < bigEnds[i][0] + bigEnds[i][2]; j += BLOCKSIZE) {
                if (!isABloc(j, bigEnds[i][1] + lenght*BLOCKSIZE)) {
                    endFound = true;
                }
            }
            if (isABloc(bigEnds[i][0] - BLOCKSIZE, bigEnds[i][1] + (lenght)*BLOCKSIZE) || isABloc(bigEnds[i][0] + bigEnds[i][2], bigEnds[i][1] + lenght*BLOCKSIZE)) {
                endFound = true
            }
        }
        bigEnds[i][3] = BLOCKSIZE * lenght;
    }
    //#endregion

    //#region AFFICHAGE

    // grid
    if (mode) {
        document.querySelector("canvas").style.backgroundColor = "black";
        context.fillStyle = "white";
    } else {
        document.querySelector("canvas").style.backgroundColor = "#265BB9";
        context.fillStyle = "#133F8E";
    }

    for (let x = 0; x < canvas.width; x += BLOCKSIZE) {
        context.fillRect(x, 0, 1, canvas.height);
    }
    for (let y = 0; y < canvas.height; y += BLOCKSIZE) {
        context.fillRect(0, y, canvas.width, 1);
    }

    // x0 line
    context.fillStyle = "red";
    context.fillRect(offsetX * BLOCKSIZE, 0, 2, canvas.height);

    // y0 line
    context.fillStyle = "yellow";
    context.fillRect(0, offsetY, canvas.width, 2);
    
    // Dessine les blocs
    for (let i = 0; i < map.blocks.length; i++) {
        if (mode) {
            context.strokeStyle = "red";
            context.lineWidth = 2;
            context.strokeRect(map.blocks[i][0] + offsetX * BLOCKSIZE, map.blocks[i][1] + offsetY, BLOCKSIZE, BLOCKSIZE);
        } else {
            context.fillStyle = "black";
            context.fillRect(map.blocks[i][0] + offsetX * BLOCKSIZE, map.blocks[i][1] + offsetY, BLOCKSIZE, BLOCKSIZE);
        }
    }
    
    // Dessine les fins de niveau
    context.fillStyle = "white";
    for (let i = 0; i < map.ends.length; i++) {
        context.fillRect(map.ends[i][0] + offsetX * BLOCKSIZE, map.ends[i][1] + offsetY, BLOCKSIZE, BLOCKSIZE);
    }

    // Dessine les tiles
    if (mode) {
        for (let i = 0; i < map.tiles.length; i++) {
            context.fillStyle = TEXTURE_LIST[map.tiles[i][2]];
            context.fillRect(map.tiles[i][0] + offsetX * BLOCKSIZE, map.tiles[i][1] + offsetY, BLOCKSIZE, BLOCKSIZE);
        }
    }
    
    // Dessine la case sélectionnée
    if (mode) {
        // Mode peinture
        context.fillStyle = TEXTURE_LIST[selectedTexture];
        context.fillRect(blockX, blockY, BLOCKSIZE, BLOCKSIZE);
    } else {
        // Mode édition
        if (blockType === 0) {
            context.strokeStyle = "black";
        } else {
            context.strokeStyle = "white";
        }
        
        context.lineWidth = 2;
        context.strokeRect(blockX, blockY, BLOCKSIZE, BLOCKSIZE);
    }

    // big blocs
    if (debugMode && !mode) {
        context.fillStyle = "red";
        // Blocs
        for (let i = 0; i < bigBlocs.length; i++) {
            context.fillRect(bigBlocs[i][0] + offsetX * BLOCKSIZE + 5, bigBlocs[i][1] + offsetY + 5, bigBlocs[i][2] - 10, bigBlocs[i][3] - 10);
        }

        // Fin de niveau
        for (let i = 0; i < bigEnds.length; i++) {
            context.fillRect(bigEnds[i][0] + offsetX * BLOCKSIZE + 5, bigEnds[i][1] + offsetY + 5, bigEnds[i][2] - 10, bigEnds[i][3] - 10);
        }
    }

    //#endregion

    //#region POSER/CASSER

    // Placer
    if (isPlacing && !isABloc(blockX-offsetX*BLOCKSIZE, blockY-offsetY, true)) {
        if (mode) {
            // Mode peinture
            map.tiles.push([blockX-offsetX*BLOCKSIZE, blockY-offsetY, selectedTexture]);
        } else {
            // Mode édition
            if (blockType === 0) {
                // Bloc
                map.blocks.push([blockX-offsetX*BLOCKSIZE, blockY-offsetY]);
            } else {
                // Fin de niveau
                map.ends.push([blockX-offsetX*BLOCKSIZE, blockY-offsetY]);
            }
        }
    }

    // Casser
    if (isBreaking) {
        if (mode) {
            // Mode peinture
            // Tiles
            for (let i = 0; i < map.tiles.length; i++) {
                if (map.tiles[i][0] + offsetX * BLOCKSIZE === blockX && map.tiles[i][1] + offsetY === blockY) {
                    map.tiles.splice(i, 1);
                    break;
                }
            }
        } else {
            // Mode édition
            // Bloc
            for (let i = 0; i < map.blocks.length; i++) {
                if (map.blocks[i][0] + offsetX * BLOCKSIZE === blockX && map.blocks[i][1] + offsetY === blockY) {
                    map.blocks.splice(i, 1);
                    break;
                }
            }

            // Fin de niveau
            for (let i = 0; i < map.ends.length; i++) {
                if (map.ends[i][0] + offsetX * BLOCKSIZE === blockX && map.ends[i][1] + offsetY === blockY) {
                    map.ends.splice(i, 1);
                    break;
                }
            }
        }
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

canvas.addEventListener('mousedown', function(e) {
    //detecte si on clique
    if (e.which === 1 && !menuOpened) {
        isPlacing = true;
    }
    //detecte si on clique droit
    if (e.which === 3 && !menuOpened) {
        isBreaking = true;
    }
});

canvas.addEventListener('mouseup', function(e) {
    //detecte si on clique droit
    if (e.which === 1 || e.which === 3) {
        isPlacing = false;
        isBreaking = false;
    }
});

document.addEventListener('keydown', function(e) {
    // Ouvre le menu
    if (e.which === 27) {
        menuOpened = !menuOpened;
    }

    // Change de type de bloc
    if (e.which === 32 && !mode) {
        if (blockType === 0) {
            blockType = 1;
        } else {
            blockType = 0;
        }
    }

    // +
    if (e.which === 107) {
        offsetY += BLOCKSIZE;
    }

    // -
    if (e.which === 109) {
        offsetY -= BLOCKSIZE;
    }

    // Flèche droite
    if (mode && e.which === 39) {
        selectedTexture++;

        if (selectedTexture === TEXTURE_LIST.length) {
            selectedTexture = 0;
        }
    }

    // Flèche gauche
    if (mode && e.which === 37) {
        selectedTexture--;
        
        if (selectedTexture === -1) {
            selectedTexture = TEXTURE_LIST.length - 1;
        }
    }
});

//#endregion

// Démarre le jeu
requestAnimationFrame(loop);