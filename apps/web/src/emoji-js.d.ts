declare module "emoji-js" {
  export default class EmojiConvertor {
    replace_mode: string;
    allow_native: boolean;
    data: Record<string, [ReadonlyArray<string>, ...ReadonlyArray<unknown>]>;
    replace_colons(value: string): string;
  }
}
