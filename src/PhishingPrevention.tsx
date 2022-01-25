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

/**
 * PhishingPrevention
 *
 * This components renders a phishing prevention canva based
 * on the provided uuid.
 */
const PhishingPrevention = ({ uuid, size }: PhishingPreventionProps) => {
  const { draw, setup } = PhishingSketch(uuid, size);
  return <Sketch setup={setup} draw={draw} />;
};

export default PhishingPrevention;
