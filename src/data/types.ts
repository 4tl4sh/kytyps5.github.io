export type Status = "doesnt-boot" | "logo" | "main-menu" | "in-game";
export type OS = "windows" | "linux" | "macos";
export interface Game {
  key: string;
  title: string;
  titleId: string;
  cover?: string;
  overall: Status;
  os: Partial<Record<OS, Status>>;
  reportCounts: Partial<Record<OS, number>>;
  latestTested?: string;
  latestReport?: { os: OS; testedDate: string };
  reportRevision?: string;
  screenshot?: string;
  screenshots?: {
    title: string;
    screenshot: string;
    testedDate?: string;
    os?: OS;
  }[];
  aliases?: string[];
  allTitleIds?: string[];
  publisher?: string;
  releaseDate?: string;
  genres?: string[];
}
export interface Report {
  slug: string;
  title: string;
  titleId: string;
  status: Status;
  testedVersion: string;
  testedDate: string;
  os: OS;
  hardware?: string;
  score?: number;
  gameVersion?: string;
  screenshot?: string;
  screenshots?: string[];
  notes: string;
  source?: { label: string; url?: string };
}
export type CompatibilityPeak = Pick<
  Report,
  | "slug"
  | "titleId"
  | "os"
  | "status"
  | "testedVersion"
  | "testedDate"
  | "gameVersion"
> & { recordUrl?: string };
export const statusMeta: Record<
  Status,
  { label: string; description: string }
> = {
  "in-game": {
    label: "In game",
    description:
      "Reaches controllable gameplay. Bugs and performance issues may remain.",
  },
  "main-menu": {
    label: "Main menu",
    description: "Reaches the menus, but does not enter gameplay.",
  },
  logo: {
    label: "Logo",
    description:
      "Displays a startup screen or logo, but does not reach the menu.",
  },
  "doesnt-boot": {
    label: "Doesn’t boot",
    description: "Does not show the first logo or startup screen.",
  },
};
export const statuses: Status[] = [
  "in-game",
  "main-menu",
  "logo",
  "doesnt-boot",
];
export const osNames: Record<OS, string> = {
  windows: "Windows",
  linux: "Linux",
  macos: "macOS",
};
export const repoUrl = "https://github.com/KytyPS5/KytyPS5";
export const reportUrl = `${repoUrl}/issues/new?template=kytyps5-game-emulation.yaml`;
