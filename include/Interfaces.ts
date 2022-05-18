export interface Coach {
  id: number,
  name: string,
  ranking: string
}

export interface UserSettings {
  audio: boolean,
  hiddenCoaches: Coach[],
  zenMode: boolean,
};

// Expand to add more values using Typescript pipe (|) syntax
// e.g. = 'gamefinder.var1' | 'gamefinder.var2' | 'gamefinder.var3'
export type GameFinderVar = 'gamefinder.enableSound' | 'gamefinder.zenMode';