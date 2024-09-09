declare module "trianglify" {
  interface Options {
    width?: number;
    height?: number;
    cell_size?: number;
    variance?: number;
    seed?: string;
    x_colors?: string | string[];
    y_colors?: string | string[];
    palette?: string[];
    color_space?: string;
    color_function?: (x: number, y: number) => string;
    stroke_width?: number;
    output?: "svg" | "canvas";
    xColors?: string | string[];
    yColors?: string | string[];
    fill?: boolean;
    strokeWidth?: number;
    cellSize?: number;
    colorFunction?: (x: number, y: number) => string;
  }

  interface Pattern {
    toSVG(): string;
    toCanvas(): HTMLElement;
    colorFunction?: (x: number, y: number) => string;
  }

  function trianglify(options?: Options): Pattern;

  export = trianglify;
}
