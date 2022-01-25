"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const react_p5_1 = __importDefault(require("react-p5"));
const react_1 = __importDefault(require("react"));
const sketch_1 = __importDefault(require("./sketch"));
/**
 * PhishingPrevention
 *
 * This components renders a phishing prevention canva based
 * on the provided uuid.
 */
const PhishingPrevention = ({ uuid, size }) => {
    const { draw, setup } = (0, sketch_1.default)(uuid, size);
    return react_1.default.createElement(react_p5_1.default, { setup: setup, draw: draw });
};
exports.default = PhishingPrevention;
