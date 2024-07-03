type Colors = "green" | "blue" | "yellow" | "red";

const colors: { [name in Colors]: string } = {
  red: "#ef9a9a",
  green: "#6b9955",
  yellow: "#c5c599",
  blue: "#8dc5e3",
};

const generateMsg = (
  content: string,
  colorName: Colors = null,
  bolder: boolean = false
): string => {
  const colorStyle = colorName ? `color: ${colors[colorName]};` : "";
  const bolderStyle = bolder ? "font-weight: bolder;" : "";

  return `<text style="${[colorStyle, bolderStyle].join(
    " "
  )}">${content}</text>`;
};

export const info = (content: string) => {
  console.log(generateMsg(content, "green"));
};

export const warning = (content: string) => {
  console.log(generateMsg(content, "yellow"));
};

export const error = (content: string) => {
  console.log(generateMsg(content, "red"));
};

export const debug = (content: string) => {
  if ((Memory as any).$isDebug) {
    console.log(generateMsg(content, "blue"));
  }
};
