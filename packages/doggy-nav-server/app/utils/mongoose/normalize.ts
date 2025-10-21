import type { Schema } from 'mongoose';

// Mongoose plugin to normalize JSON/Object output across all models
// - Remove __v and _id
// - Add id (string) derived from _id
// - Preserve any existing schema-level transforms
export default function normalizePlugin(schema: Schema) {
  const composeTransform = (
    existing?: (doc: any, ret: any, options: any) => any,
  ) => {
    return function (doc: any, ret: any, options: any) {
      const maybeRet = typeof existing === 'function' ? existing(doc, ret, options) : ret;
      const out = maybeRet || ret || {};

      if (out && out.id == null) {
        const rawId = out._id != null ? out._id : doc?._id;
        if (rawId != null) {
          out.id = typeof rawId.toString === 'function' ? rawId.toString() : rawId;
        }
      }

      if (out) {
        delete out._id;
        delete out.__v;
      }

      return out;
    };
  };

  const toJSON = (schema.get('toJSON') || {}) as any;
  schema.set('toJSON', {
    ...toJSON,
    versionKey: false,
    transform: composeTransform(typeof toJSON.transform === 'function' ? toJSON.transform : undefined),
  });

  const toObject = (schema.get('toObject') || {}) as any;
  schema.set('toObject', {
    ...toObject,
    versionKey: false,
    transform: composeTransform(typeof toObject.transform === 'function' ? toObject.transform : undefined),
  });
}
