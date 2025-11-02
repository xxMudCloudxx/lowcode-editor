import type { IActionHandler } from "./type";

export const goToLinkHander: IActionHandler = (action) => {
  const url = JSON.stringify(action.config.url);
  return `window.open(${url}, "_blank)`;
};
