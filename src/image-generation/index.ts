import Replicate from "replicate";

interface ImageGeneratorInput {
  prompt: string;
  lora_scale?: number;
  aspect_ratio?: string;
  output_format?: string;
}

export async function generateImage(
  input: ImageGeneratorInput
): Promise<Buffer[]> {
  const replicate = new Replicate();

  const defaultConfig = {
    lora_scale: 1.1,
    aspect_ratio: "16:9",
    output_format: "jpg",
  };

  const processedInput = {
    ...defaultConfig,
    ...input,
  };

  const output = await replicate.run(
    "levelsio/90s-anime-aesthetics:a9c9af2d6fba4072c73064b213d6588f2193624728999cf8bf1cc0911b51c708",
    { input: processedInput }
  );

  return output as Buffer[];
}
