import bloodborne from "./bloodborne.js";
import demonssouls from "./demonssouls.js";

export const games = [bloodborne, demonssouls];

export function getGame(id) {
  return games.find((game) => game.id === id) || games[0];
}