import bloodborne from "./bloodborne.js";
import demonssouls from "./demonssouls.js";
import darksouls from "./darksouls.js";

export const games = [bloodborne, demonssouls, darksouls];

export function getGame(id) {
  return games.find((game) => game.id === id) || games[0];
}