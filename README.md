# Turing Touring

AI tour guide for tourists and local events


## Models 
We use `openai/gpt-5.6-luna-pro` as a default after testing multiple models, although other option are included. We use this model due to its high tool calling success rate in openrouters API. Tool calling is required for websearch. 

`qwen/qwen3-235b-a22b-2507` was used for initial testing. Can work well but much less consistent with worse results. Likely due to model power and an inability to effectively use tools. More powerful models with lower tool calling success rates like `deepseek/deepseek-v4-pro` and `deepseek/deepseek-v4-flash-0731` can be harder to make work than this older qwen variant. Tool calling is likely the biggest issue for these. 

## VLM


## Walking-Tour

Allow a streamed agent to describe the history of some local area, some interesting facts etc. 

## Talking-Tour

TTS tour guide. We'll just use the [Web Speech API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Speech_API/Using_the_Web_Speech_API) for TTS as its free to run on most modern devices and pretty good, little need for full generative TTS model.  











# create-next-app
This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.


## References
* https://maplibre.org/maplibre-gl-js/docs/
* https://maplibre.org/maplibre-gl-js/docs/examples/view-local-geojson/