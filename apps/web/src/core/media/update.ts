import { Effect, Match, Option } from "effect";
import { Dialog, FileDrop, Popover, VirtualList } from "@foldkit/ui";
import { Command } from "foldkit";
import { uploadImage, uploadSticker } from "./command";
import {
  GotEmojiListMessage,
  GotImagePopoverMessage,
  GotStickerPopoverMessage,
  GotUploadDialogMessage,
  RequestedUpload,
  type MediaMessage,
} from "./message";
import type { Model } from "./model";

type UpdateResult = readonly [Model, ReadonlyArray<Command.Command<MediaMessage>>];

export const update = (model: Model, message: MediaMessage): UpdateResult =>
  Match.value(message).pipe(
    Match.tagsExhaustive({
      GotImagePopoverMessage: ({ message }): UpdateResult => {
        const [imagePopover, commands] = Popover.update(model.imagePopover, message);
        return [
          { ...model, imagePopover },
          Command.mapMessages(commands, (child) => GotImagePopoverMessage({ message: child })),
        ];
      },
      LoadedImages: ({ images }): UpdateResult => [{ ...model, images }, []],
      FailedToLoadMedia: (): UpdateResult => [model, []],
      SelectedStoredImage: (): UpdateResult => [
        { ...model, imagePopover: Popover.close(model.imagePopover)[0] },
        [],
      ],
      GotStickerPopoverMessage: ({ message }): UpdateResult => {
        const [stickerPopover, commands] = Popover.update(model.stickerPopover, message);
        return [
          { ...model, stickerPopover },
          Command.mapMessages(commands, (child) => GotStickerPopoverMessage({ message: child })),
        ];
      },
      LoadedStickers: ({ stickers }): UpdateResult => [{ ...model, stickers }, []],
      SelectedSticker: (): UpdateResult => [
        { ...model, stickerPopover: Popover.close(model.stickerPopover)[0] },
        [],
      ],
      SelectedEmoji: (): UpdateResult => [
        { ...model, stickerPopover: Popover.close(model.stickerPopover)[0] },
        [],
      ],
      SelectedStickerTab: ({ tab }): UpdateResult => [
        {
          ...model,
          stickerTab: tab,
          emojiList:
            tab === "emoji"
              ? VirtualList.init({ id: "emoji-picker-list", rowHeightPx: 52 })
              : model.emojiList,
        },
        [],
      ],
      ChangedImageSearch: ({ value }): UpdateResult => [{ ...model, imageSearch: value }, []],
      ChangedStickerSearch: ({ value }): UpdateResult => [{ ...model, stickerSearch: value }, []],
      ChangedEmojiSearch: ({ value }): UpdateResult => [
        {
          ...model,
          emojiSearch: value,
          emojiList: VirtualList.init({ id: "emoji-picker-list", rowHeightPx: 52 }),
        },
        [],
      ],
      GotEmojiListMessage: ({ message }): UpdateResult => {
        const [emojiList, commands] = VirtualList.update(model.emojiList, message);
        return [
          { ...model, emojiList },
          Command.mapMessages(commands, (child) => GotEmojiListMessage({ message: child })),
        ];
      },
      UploadedSticker: ({ sticker }): UpdateResult => [
        { ...model, stickers: [...model.stickers, sticker], uploadState: "idle" },
        [],
      ],
      GotUploadDialogMessage: ({ message }): UpdateResult => {
        const [uploadDialog, commands] = Dialog.update(model.uploadDialog, message);
        return [
          { ...model, uploadDialog },
          Command.mapMessages(commands, (child) => GotUploadDialogMessage({ message: child })),
        ];
      },
      RequestedUpload: ({ file, kind }): UpdateResult => {
        const [uploadDialog, commands] = Dialog.open(model.uploadDialog);
        return [
          { ...model, uploadDialog, pendingUpload: { file, kind, title: (file as File).name } },
          Command.mapMessages(commands, (child) => GotUploadDialogMessage({ message: child })),
        ];
      },
      SelectedImage: ({ file }): UpdateResult =>
        update(model, RequestedUpload({ file, kind: "image" })),
      ChangedUploadTitle: ({ title }): UpdateResult => [
        {
          ...model,
          pendingUpload: model.pendingUpload === null ? null : { ...model.pendingUpload, title },
        },
        [],
      ],
      ConfirmedUpload: (): UpdateResult => {
        if (model.pendingUpload === null) return [model, []];
        const pending = model.pendingUpload;
        const [uploadDialog, commands] = Dialog.close(model.uploadDialog);
        return [
          { ...model, uploadDialog, pendingUpload: null, uploadState: "uploading" },
          [
            ...Command.mapMessages(commands, (child) => GotUploadDialogMessage({ message: child })),
            pending.kind === "image"
              ? uploadImage({ file: pending.file, title: pending.title })
              : uploadSticker({ file: pending.file, title: pending.title }),
          ],
        ];
      },
      GotStickerFileDropMessage: ({ message }): UpdateResult =>
        updateFileDrop(model, "stickerFileDrop", message, "sticker"),
      GotFileDropMessage: ({ message }): UpdateResult =>
        updateFileDrop(model, "fileDrop", message, "image"),
      UploadedImage: (): UpdateResult => [{ ...model, uploadState: "idle" }, []],
      FailedToUploadImage: (): UpdateResult => [{ ...model, uploadState: "failed" }, []],
    }),
  );

const updateFileDrop = (
  model: Model,
  key: "fileDrop" | "stickerFileDrop",
  message: FileDrop.Message,
  kind: "image" | "sticker",
): UpdateResult => {
  const [fileDrop, _commands, outMessage] = FileDrop.update(model[key], message);
  const next = { ...model, [key]: fileDrop };
  return Option.match(outMessage, {
    onNone: () => [next, []] as UpdateResult,
    onSome: (out) =>
      Match.value(out).pipe(
        Match.tagsExhaustive({
          ReceivedFiles: ({ files }) => [next, files.map((file) => requestUpload({ file, kind }))] as UpdateResult,
          RejectedNonFiles: () => [next, []] as UpdateResult,
        }),
      ),
  });
};

const requestUpload = (args: { readonly file: unknown; readonly kind: "image" | "sticker" }) => ({
  name: "requestUpload",
  args,
  effect: Effect.succeed(RequestedUpload(args)),
});
