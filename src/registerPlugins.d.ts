declare function solidPlugin(): import("@yetifrozty/base-plugin-system").BaseHooks & {
    name: "solid-boot";
} & import("@yetifrozty/vite-plugin").ViteHooks & import("@yetifrozty/express-plugin").ExpressHooks;
export default solidPlugin;
