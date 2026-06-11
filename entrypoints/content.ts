import { GOOGLE_CONTENT_SCRIPT_MATCHES } from "@/src/shared/constants/contentScript";

export default defineContentScript({
  matches: [...GOOGLE_CONTENT_SCRIPT_MATCHES],
  main() {
    console.log('Hello content.');
  },
});
