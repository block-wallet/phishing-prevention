import Sketch from "react-p5";
import React from "react";

import PhishingSketch from "./sketch";

export type PhishingPreventionProps = {
  /**
   * The uuid to use as seed for noise and randomness generation.
   */
  uuid: string;

  /**
   * The size of the object.
   *
   * It defaults to the screen size, but it is rendered based on its parent size
   */
  size?: number;
};

let sketch: ReturnType<typeof PhishingSketch> | undefined = undefined;

/**
 * PhishingPrevention
 *
 * This components renders a phishing prevention canva based
 * on the provided uuid.
 */
const PhishingPrevention = ({ uuid, size }: PhishingPreventionProps) => {
  if (!sketch) {
    sketch = PhishingSketch(uuid, size);
  }
  return sketch && <Sketch setup={sketch.setup} draw={sketch.draw} />;
};

export default PhishingPrevention;
