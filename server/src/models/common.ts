import { Schema } from 'mongoose';

/** A file attachment shared by lessons and assignment submissions. */
export interface IAttachment {
  name: string;
  url: string;
  size?: number;
  mimeType?: string;
}

/** Reusable `_id`-less subdocument schema for {@link IAttachment}. */
export const attachmentSchema = new Schema<IAttachment>(
  {
    name: { type: String, required: true },
    url: { type: String, required: true },
    size: { type: Number, min: 0 },
    mimeType: { type: String },
  },
  { _id: false },
);
