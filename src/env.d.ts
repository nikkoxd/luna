import { z } from "zod";

const env = z.object({
    TOKEN: z.string(),
    OWNER_ID: z.string().optional(),
    POSTGRES_HOST: z.string(),
    POSTGRES_USER: z.string(),
    POSTGRES_PASSWORD: z.string(),
    POSTGRES_DB: z.string(),
});

env.parse(process.env);

declare global {
	namespace NodeJS {
        // eslint-disable-next-line @typescript-eslint/no-empty-object-type
        interface ProcessEnv extends z.infer<typeof env> {}
	}
}
