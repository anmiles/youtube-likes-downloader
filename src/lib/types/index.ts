import type z from 'zod';

import type { videoInfoSchema, videoJSONSchema } from './schema';

export type VideoInfo = z.infer<typeof videoInfoSchema>;
export type VideoJSON = z.infer<typeof videoJSONSchema>;
