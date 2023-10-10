#include <SDL.h>
#include <SDL_image.h>
#include <Windows.h>
#include <vector>
#include <iostream>

// Constantes

// Fenêtre
const int WINDOW_WIDTH = 800;
const int WINDOW_HEIGHT = 500;

// FPS
const int FPS = 60;
const int FRAME_DELAY = 1000 / FPS;

// Gravité
const double GRAVITY_FORCE = 0.5;

// Joueur
const double PLAYER_WIDTH = 50.0;
const double PLAYER_HEIGHT = 50.0 / 13.0 * 18.0;

const int TIME_PLAYER_CAN_JUMP_AFTER_LIVING_PLATEFORM = 5;

const double PLAYER_ACCELERATION = 0.3;
const double PLAYER_DECELERATION = 0.5;

// Vitesse

// Horizontale
const double PLAYER_DEFAULT_SPEED = 5.0;

// Saut
const double PLAYER_JUMP_FORCE = 10.0;

// Variables globales

// Fenêtre
int windowWidth = 0;
int windowHeight = 0;

// FPS
int frameStart = 0;
int frameTime = 0;

// Jeu
int world = 0;
int level = 0;

// Joueur
double playerX = 0.0;
double playerY = 0.0;

double playerSpeed = 0.0;
int playerDirection = 0; // 0 = aucun mouvement, 1 = gauche, 2 = right
double playerYVelocity = 0.0;

int playerCanJumpTimeRemaining = TIME_PLAYER_CAN_JUMP_AFTER_LIVING_PLATEFORM;
bool playerIsGrounded = false;
bool canDoubleJump = false;

int activeBonus = 0;

// Camera
double cameraX = 0.0;
double cameraY = 0.0;

// Inputs
bool leftPressed = false;
bool rightPressed = false;

bool haveSpaceReleased = false;

// Murs [world][level][wall][wall properties]
std::vector<std::vector<std::vector<std::vector<double>>>> walls {
	{
		{
			// Niveau 1
			/*{x1, y1, x2, y2}*/
			{0, 250, 75, 300},
			{225, 250, 275, 275},
			{475, 325, 525, 350},
			{625, 325, 1150, 350},
			{850, 275, 900, 325},
			{1625, 200, 1925, 250},
			{1025, 200, 1300, 225},
			{1450, 175, 1500, 200},
			{1875, 0, 1925, 150},
			{1800, 150, 1925, 200},
			{1625, 50, 1675, 100},
			{1375, 450, 1450, 500},
			{2125, 0, 2450, 50},
			{2525, 0, 2925, 50},
			{2625, -25, 2825, 0},
			{3125, 50, 3150, 75},
			{3150, 75, 3175, 100},
			{3175, 100, 3200, 125},
			{3200, 125, 3225, 150},
			{3225, 150, 3250, 175},
			{3250, 175, 3275, 200},
			{3275, 200, 3300, 225},
			{3300, 225, 3325, 250},
			{3425, 250, 3550, 275},
			{3750, 250, 4050, 300},
			{3875, 200, 3925, 250},
			{4000, 200, 4050, 250}
		},
		{
			// Niveau 2
			{0, 250, 675, 425},
			{0, -50, 675, 0},
			{625, 0, 675, 75},
			{575, 75, 675, 125},
			{525, 125, 675, 175},
			{475, 175, 675, 225},
			{425, 225, 675, 250}
		}
	}
};

// Triggers [world][level][wall][trigger properties]
std::vector<std::vector<std::vector<std::vector<double>>>> triggers = {
	{
		{
			/*{x, y, w, h, type}*/
			{4000, 150, 50, 50, 100} // Fin du niveau
		},
		{
			{4000, 150, 50, 50, 100} // Fin du niveau
		}
	}
};

// Début du jeu
int main(int argc, char* argv[]) {
	if (SDL_Init(SDL_INIT_VIDEO) > 0) {
		std::cout << "SDL_Init HAS FAILED. SDL_ERROR : " << SDL_GetError() << std::endl;
	}

	// Créer la fenêtre
	SDL_Window* window = SDL_CreateWindow("Mario-like game", SDL_WINDOWPOS_UNDEFINED, SDL_WINDOWPOS_UNDEFINED, WINDOW_WIDTH, WINDOW_HEIGHT,
		SDL_WINDOW_SHOWN | SDL_WINDOW_RESIZABLE | SDL_WINDOW_MAXIMIZED);

	if (window == NULL) {
		std::cout << "Window failed to init. Error: " << SDL_GetError() << std::endl;
	}

	SDL_Renderer* renderer = SDL_CreateRenderer(window, -1, SDL_RENDERER_ACCELERATED);

	bool gameRunning = true;

	SDL_Event event;

	// Code de chaque image du jeu
	while (gameRunning) {
		// Gère les fps
		frameStart = SDL_GetTicks();

		// Récupère les évènements
		while (SDL_PollEvent(&event)) {
			if (event.type == SDL_QUIT) {
				gameRunning = false;
			}
		}

		// Récupère la taille de la fenêtre
		SDL_GetWindowSize(window, &windowWidth, &windowHeight);

		// Gère la camera
		cameraX += (playerX - static_cast<double>(windowWidth) / 2.0 - cameraX) / 30.0;
		cameraY += (playerY - static_cast<double>(windowHeight) / 2.0 - cameraY) / 30.0;

		#pragma region INPUTS

		// Saut (espace)
		if (GetKeyState(VK_SPACE) & 0x8000) {
			if (playerCanJumpTimeRemaining > 0 || (canDoubleJump && haveSpaceReleased)) {
				if (playerCanJumpTimeRemaining <= 0) {
					canDoubleJump = false;
				} else {
					playerCanJumpTimeRemaining = 0;
				}

				haveSpaceReleased = false;
				playerYVelocity = -PLAYER_JUMP_FORCE;
			}
		} else if (canDoubleJump) {
			haveSpaceReleased = true;
		}

		// Déplacement à gauche (A)
		if (GetKeyState('A') & 0x8000 && playerX > 0) {
			leftPressed = true;
			playerDirection = 1;
		} else {
			leftPressed = false;
		}

		// Déplacement à droite (D)
		if (GetKeyState('D') & 0x8000) {
			rightPressed = true;
			playerDirection = 2;
		} else {
			rightPressed = false;
		}

		// Si on appuie sur la gauche et la droite : pas de direction
		if (leftPressed && rightPressed) {
			playerDirection = 0;
		}

		#pragma endregion

		#pragma region CALCULES-PHYSIQUES

		// Triggers
		for (int i = 0; i < triggers[world][level].size(); i++) {
			// Si on entre en collision avec un trigger
			if (playerX > triggers[world][level][i][0] - PLAYER_WIDTH && playerX < triggers[world][level][i][0] + triggers[world][level][i][2] &&
				playerY > triggers[world][level][i][1] - PLAYER_HEIGHT && playerY < triggers[world][level][i][1] + triggers[world][level][i][3]) {
				// if type < 5 par exemple -> bonus
				// Liste des bonus :
				// 1 : Double jump
				// Autres triggers
				// 100 : fin de niveaux
				if (triggers[world][level][i][4] == 100) {
					level++;
					i = 0;
					playerX = 0.0;
					playerY = 0.0;
					playerYVelocity = 0.0;
				}
				else {
					activeBonus = static_cast<int>(triggers[world][level][i][2]);
				}
			}
		}

		// Accélère ou décélère le joueur
		if (leftPressed || rightPressed) {
			if (playerSpeed < PLAYER_DEFAULT_SPEED) {
				playerSpeed += PLAYER_ACCELERATION;
			}
		} else if (playerSpeed >= PLAYER_DECELERATION) {
			playerSpeed -= PLAYER_DECELERATION;
		}

		double fallDistance = playerYVelocity;
		double upDistance = playerYVelocity;
		double playerWallDistance = playerSpeed;
		playerIsGrounded = false;
		for (int i = 0; i < walls[world][level].size(); i++) {
			#pragma region GRAVITY

			// Vérifie que le mur soit en dessous du joueur
			if (walls[world][level][i][1] >= playerY + PLAYER_HEIGHT &&
				walls[world][level][i][0] < playerX + PLAYER_WIDTH && walls[world][level][i][2] > playerX) {
				// Calcule la distance avec le mur en Y
				double groundDistance = walls[world][level][i][1] - (playerY + PLAYER_HEIGHT);

				// Modifie la distance la plus petite avec le sol si la distance actuelle est plus petite
				if (groundDistance <= fallDistance) {
					fallDistance = groundDistance;
					playerIsGrounded = true;

					// Permet de double jump si on a le bonus activé
					if (activeBonus == 1) {
						canDoubleJump = true;
					}
				}
			}

			#pragma endregion

			#pragma region CEIL_COLLLISON
			// Vérifie que le mur soit au dessus du joueur
			if (walls[world][level][i][3] <= playerY && walls[world][level][i][0] < playerX + PLAYER_WIDTH && walls[world][level][i][2] > playerX) {
				// Calcule la distance avec le plafond
				double ceilDistance = walls[world][level][i][3] - playerY;

				// Modifie la distance la plus petite avec le plafond si la distance actuelle est plus petite
				if (ceilDistance > upDistance) {
					upDistance = ceilDistance;
				}

				// Téléporte le joueur au plafond et stop son élan si on va monter plus haut que le plafond
				if (fallDistance < 0.0 && fallDistance < upDistance) {
					fallDistance = upDistance;
					playerYVelocity = 0.0;
				}
			}

			#pragma endregion

			#pragma region WALLS_SIDES

			// Vérifie que le joueur soit en face du mur sur l'axe Y
			if (walls[world][level][i][1] < playerY + PLAYER_HEIGHT && walls[world][level][i][3] > playerY) {
				// Calcule les distance entre chaques cotés du joueur et chaques cotés du mur
				double wallDistanceLeft = playerX - walls[world][level][i][2];
				double wallDistanceRight = walls[world][level][i][0] - (playerX + PLAYER_WIDTH);

				// Change les distances avec le mur
				if (wallDistanceLeft >= 0.0 && wallDistanceLeft < playerWallDistance && playerDirection == 1) {
					playerWallDistance = wallDistanceLeft;
				}

				if (wallDistanceRight >= 0.0 && wallDistanceRight < playerWallDistance && playerDirection == 2) {
					playerWallDistance = wallDistanceRight;
				}
			}

			#pragma endregion
		}

		if (playerIsGrounded) {
			playerCanJumpTimeRemaining = TIME_PLAYER_CAN_JUMP_AFTER_LIVING_PLATEFORM;
		} else {
			playerCanJumpTimeRemaining--;
		}

		// Déplace le joueur latéralement
		if (playerSpeed >= PLAYER_DECELERATION) {
			if (playerDirection == 1 && playerX - playerWallDistance > 0.0) {
				playerX -= playerWallDistance;
			}
		
			if (playerDirection == 2) {
				playerX += playerWallDistance;
			}
		}

		// Ajoute à la position Y du joueur sa vélocité
		playerY += fallDistance;

		// change the player y velocity
		if (playerIsGrounded) {
			playerYVelocity = 0.0;
		} else {
			playerYVelocity += GRAVITY_FORCE;
		}

		// Si le joueur est trop bas, le téléporte au début
		if (playerY > 1000) {
			playerX = 0.0;
			playerY = 0.0;
			playerYVelocity = 0.0;
		}

		#pragma endregion

		#pragma region AFFICHAGE

		// Joueur
		SDL_Surface* playerArea;

		if (playerDirection == 1) {
			playerArea = IMG_Load("assets/sprites/player/player-left.png");
		} else {
			playerArea = IMG_Load("assets/sprites/player/player-right.png");
		}

		SDL_Texture* playerTexture = SDL_CreateTextureFromSurface(renderer, playerArea);
		SDL_FreeSurface(playerArea);

		SDL_Rect player;
		player.x = static_cast<int>(playerX - cameraX);
		player.y = static_cast<int>(playerY - cameraY);
		player.w = static_cast<int>(PLAYER_WIDTH);
		player.h = static_cast<int>(PLAYER_HEIGHT);

		SDL_RenderCopy(renderer, playerTexture, NULL, &player);

		// Dessine les trigger
		SDL_SetRenderDrawColor(renderer, 255, 255, 0, 255);
		for (int i = 0; i < triggers[world][level].size(); i++) {
			SDL_Rect Actualtrigger;
			Actualtrigger.x = static_cast<int>(triggers[world][level][i][0] - cameraX);
			Actualtrigger.y = static_cast<int>(triggers[world][level][i][1] - cameraY);
			Actualtrigger.w = static_cast<int>(triggers[world][level][i][2]);
			Actualtrigger.h = static_cast<int>(triggers[world][level][i][3]);
			SDL_RenderDrawRect(renderer, &Actualtrigger);
		}

		// Dessine les murs
		SDL_SetRenderDrawColor(renderer, 255, 0, 0, 255);
		for (int i = 0; i < walls[world][level].size(); i++) {
			SDL_Rect wall;
			wall.x = static_cast<int>(walls[world][level][i][0] - cameraX);
			wall.y = static_cast<int>(walls[world][level][i][1] - cameraY);
			wall.w = static_cast<int>(walls[world][level][i][2] - walls[world][level][i][0]);
			wall.h = static_cast<int>(walls[world][level][i][3] - walls[world][level][i][1]);
			SDL_RenderFillRect(renderer, &wall);
		}

		// Met à jour la fenêtre
		SDL_SetRenderDrawColor(renderer, 0, 0, 0, 255);
		SDL_RenderPresent(renderer);
		SDL_RenderClear(renderer);

		#pragma endregion

		// Gère les fps
		frameTime = SDL_GetTicks() - frameStart;

		if (FRAME_DELAY > frameTime) {
			SDL_Delay(FRAME_DELAY - frameTime);
		}
	}

	SDL_DestroyWindow(window);
	SDL_Quit();

	return 0;
}
