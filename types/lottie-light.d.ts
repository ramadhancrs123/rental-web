declare module "lottie-web/build/player/lottie_light.min.js" {
  import type { AnimationConfigWithData, AnimationItem } from "lottie-web"

  const lottie: {
    loadAnimation: (
      params: AnimationConfigWithData<"svg">
    ) => AnimationItem
  }

  export default lottie
}
