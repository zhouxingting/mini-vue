const PIXI = window.PIXI;

export const game = new PIXI.Application({
  width: 500,
  height: 500,
  backgroundColor: 0x1099bb,
});

document.body.append(game.view);

export function createRootContainer() {
  return game.stage;
}
