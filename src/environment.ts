import { cleanEnv } from "envalid";
import { str } from "envalid/dist/validators";

const env = cleanEnv(process.env, {
    OPENAI_API_KEY:     str({desc: "The API key from OpenAI used to get responses"}),
});

export default env;
