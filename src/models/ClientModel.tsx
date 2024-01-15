export type ClientModel = {
  id: string;
  loginUserId: string;
  mobile: MobileModel[];
  name: string;
};

type MobileModel = {
  id: string;
  pref: boolean;
  type: string;
  value: string;
};
