import p5 from "p5";
import PhishingSketch from "./sketch";

let sketch: ReturnType<typeof PhishingSketch> | undefined = undefined;
let p5Sketch: p5 | undefined = undefined;

/**
 * generatePhishingPrevention
 *
 * @param uuid The uuid to use as seed for noise and randomness generation.
 * @param size The size of the image.
 * @returns A base64 randomly generated anti-phishing image
 */
export const generatePhishingPrevention = async (
  uuid: string,
  size: number
) => {
  const imagePromise = new Promise<string>((resolve) => {
    sketch = PhishingSketch(uuid, size);

    p5Sketch = new p5((p) => {
      p.setup = () => sketch!.setup(p);
      p.draw = () => sketch!.draw(p, resolve);
    });

    // We force draw as we'll render this on background side
    p5Sketch.draw()
  });

  const base64Image = await imagePromise;
  if (p5Sketch) {
    p5Sketch.remove();
  }

  return base64Image;
};
