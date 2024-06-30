export type Colors = "green" | "blue" | "yellow" | "red";

const colors: { [name in Colors]: string } = {
  red: "#ef9a9a",
  green: "#6b9955",
  yellow: "#c5c599",
  blue: "#8dc5e3",
};

export default (
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
