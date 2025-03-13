export interface LocalUser {
  id?: string;
}

const userInfoKey = "sp_user";

export class LocalUserInfoApi {
  static saveUserInfo(userInfo: LocalUser): void {
    localStorage.setItem(userInfoKey, JSON.stringify(userInfo));
  }

  static getUserInfo(): LocalUser | null {
    const userInfoValue = localStorage.getItem(userInfoKey);

    if (userInfoValue) {
      return JSON.parse(userInfoValue);
    }

    return null;
  }
}
