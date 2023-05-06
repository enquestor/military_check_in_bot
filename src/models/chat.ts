import { CheckIn } from "./check_in";

export interface Chat {
  checkIns: CheckIn[];
  format: string;
  example: string;
  ids: number[];
}
