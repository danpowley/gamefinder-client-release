export interface Coach {
  id: number,
  name: string,
  ranking: string
}

export interface UserSettings {
  audio: boolean,
  hiddenCoaches: Coach[]
};