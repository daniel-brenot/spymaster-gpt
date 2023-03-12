import { cleanEnv } from "envalid";
import { str } from "envalid/dist/validators";

const env = cleanEnv(process.env, {
    OPENAI_API_KEY:     str({desc: "The API key from OpenAI used to get responses", default: "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"}),
});

export default env;