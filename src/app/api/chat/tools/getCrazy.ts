
import { tool } from "ai";
import { z } from "zod";


export const getCrazy = tool({
  description:
    "This tool will the craziest thing I've ever done. use it when the user ask someting like : 'What the craziest thing you've ever done?'",
  parameters: z.object({}),
  execute: async () => {
    return "Above is a photo of Me On top of Mont Blanc, the highest mountain in the Alps and the highest in Europe. I made it with a friends of mine without guide, it was a great experience! You can see the 80km/h of wind on the photo! I made a youtube video of this adventure here: https://www.youtube.com/watch?v=rufGMSgzUOk&ab_channel=Toukoum";
  },
});