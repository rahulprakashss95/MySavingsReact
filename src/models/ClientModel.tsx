export type ClientModel = {
  id: string;
  loginUserId: string;
  mobile: MobileModel[] | null;
  name: string;
};

type MobileModel = {
  id: string;
  pref: boolean;
  type: string;
  value: string;
};
