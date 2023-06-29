// make a global definition for ttapi
declare module "ttapi" {
  class Bot {
    constructor(auth: string, userId: string, roomId: string);
  }
  export default Bot;
}
