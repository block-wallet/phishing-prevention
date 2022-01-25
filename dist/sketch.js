"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const p5_1 = __importDefault(require("p5"));
const sketch = (uuid, size) => {
    // ============= GLOBAL VARIABLES =============
    /*
     * The sourcess of randomness.
     * They should be based on the UUID.
     *
     * @example Since UUID is a 128-bit number, we could use the first 64 bits for NOISE_SEED and the last 64 bits for RANDOM_SEED.
     */
    var NOISE_SEED;
    var RANDOM_SEED;
    /**
     * The size of the actual canvas in pixels.
     * @type {Number}
     * @constant
     */
    var SIZE;
    /**
     * The 2D array of angles.
     * @type {Array}
     */
    var grid;
    /**
     * The resolution of the grid.
     *
     * @type {Number}
     */
    var resolution;
    /*
     * The corners of the virtual canvas.
     * The virtual canvas is bigger than the actual canvas.
     */
    var left_x;
    var right_x;
    var top_y;
    var bottom_y;
    /**
     * Number of columns of the grid.
     * @type {Number}
     */
    var num_columns;
    /**
     * Number of rows of the grid.
     * @type {Number}
     */
    var num_rows;
    var num_steps;
    /*
     * Properties of the instance.
     */
    var isShapes;
    var isContinuous;
    var isCurl;
    var isShadowed;
    var isCrossed;
    var isZigZag;
    var isColorPerShape;
    var isFilled;
    var isSquaresRotated;
    var hasBorder;
    /**
     * Stroke size in pixels of the curves.
     * @type {Number}
     */
    var strokeSize;
    /**
     * Minimum stroke size.
     * To convert it to pixels, multiply by RES_MULTIPLIER.
     * @type {Number}
     */
    const MIN_STROKE_SIZE = 2;
    /**
     * Maximum stroke size.
     * To convert it to pixels, multiply by RES_MULTIPLIER.
     * @type {Number}
     */
    const MAX_STROKE_SIZE = 50;
    /**
     * Possible color styles.
     *
     * BW = black and white
     *
     * GRADIENT = the palette is used as a vertical gradient
     *
     * ORDERED = the colors of the palette are cycled in the order of line insertion
     *
     * @type {Array}
     */
    const COLOR_STYLES = ["BW", "GRADIENT", "ORDERED"];
    /**
     * The selected color style among COLOR_STYLES.
     * @type {String}
     * @see COLOR_STYLES
     */
    var selected_color_style;
    /**
     * The collection of palettes.
     * Each palette is an array of colors.
     * @type {Array}
     */
    var palettes;
    /**
     * The selected palette among palettes.
     * @type {Array}
     * @see palettes
     */
    var selected_palette;
    /**
     * Scale factor to convert absolute values to pixels.
     * @type {Number}
     */
    var RES_MULTIPLIER;
    // ============= SETUP =============
    /**
     * p5js setup function
     */
    function setup(p5, canvasParentRef) {
        SIZE = size || p5.min(p5.windowWidth, p5.windowHeight);
        p5.createCanvas(SIZE, SIZE).parent(canvasParentRef);
        RES_MULTIPLIER = SIZE / 800;
        NOISE_SEED = parseInt(uuid.replace(/-/g, "").slice(0, 13), 16); // p5.random(1000000000);
        RANDOM_SEED = parseInt(uuid.replace(/-/g, "").slice(-13), 16); // p5.random(1000000000);
        p5.noiseSeed(NOISE_SEED);
        p5.randomSeed(RANDOM_SEED);
        setup_params(p5);
        setup_noise(p5);
        setup_palettes(p5);
        const EXTRA = 0.2;
        left_x = p5.floor(SIZE * -EXTRA);
        right_x = p5.floor(SIZE * (1 + EXTRA));
        top_y = p5.floor(SIZE * -EXTRA);
        bottom_y = p5.floor(SIZE * (1 + EXTRA));
        resolution = (right_x - left_x) * 0.01; // 1% of the width
        num_columns = p5.round((right_x - left_x) / resolution);
        num_rows = p5.round((bottom_y - top_y) / resolution);
        grid = new Array(num_columns);
        for (var i = 0; i < num_columns; i++) {
            grid[i] = new Array(num_rows);
        }
        /**
         * The step between angles if the instance is not continuous.
         * @see isContinuous
         */
        var angle_step = p5.PI / p5.floor(p5.random(3, 10));
        // initialize the grid
        for (var col = 0; col < num_columns; col++) {
            for (var row = 0; row < num_rows; row++) {
                var scaled_x = col * 0.005;
                var scaled_y = row * 0.005;
                var noise_val = p5.noise(scaled_x, scaled_y);
                var angle = p5.map(noise_val, 0.0, 1.0, 0, p5.PI * 2);
                if (!isContinuous) {
                    angle = roundTo(p5, angle, angle_step);
                }
                // var angle = (row/float(num_rows)) * PI;
                grid[col][row] = angle;
            }
        }
    }
    /**
     * Sets up the noiseDetail
     */
    function setup_noise(p5) {
        /**
         * The number of octaves to be used in the noise function.
         * @type {Number}
         */
        var lod = p5.floor(p5.random(2, 10));
        /**
         * The falloff factor for each octave.
         * @type {Number}
         */
        var falloff = p5.random(0.5, 0.9);
        // limits the number of octaves if curl noise is used to avoid too much noise
        if (isCurl && lod > 5)
            lod = 5;
        p5.noiseDetail(lod, falloff);
    }
    /**
     * Fills the palettes array with pregenerated palette
     * @see palettes
     */
    function setup_palettes(p5) {
        palettes = [];
        palettes.push([
            p5.color(209, 74, 54),
            p5.color(358, 79, 76),
            p5.color(52, 99, 95),
            p5.color(30, 100, 1),
        ]);
        palettes.push([
            p5.color(25, 99, 80),
            p5.color(26, 87, 89),
            p5.color(35, 98, 100),
            p5.color(40, 85, 100),
        ]);
        palettes.push([
            p5.color(338, 23, 43),
            p5.color(45, 28, 46),
            p5.color(70, 42, 58),
            p5.color(66, 52, 71),
        ]);
        palettes.push([
            p5.color(349, 13, 33),
            p5.color(96, 4, 97),
            p5.color(156, 27, 78),
            p5.color(348, 68, 70),
        ]);
        palettes.push([
            p5.color(80, 2, 21),
            p5.color(64, 18, 35),
            p5.color(94, 54, 100),
            p5.color(116, 48, 91),
        ]);
        palettes.push([
            p5.color(38, 6, 75),
            p5.color(185, 33, 44),
            p5.color(325, 27, 52),
            p5.color(356, 47, 69),
        ]);
        palettes.push([
            p5.color(227, 66, 31),
            p5.color(222, 73, 56),
            p5.color(224, 48, 66),
            p5.color(27, 19, 19),
        ]);
        palettes.push([
            p5.color(12, 29, 85),
            p5.color(8, 28, 68),
            p5.color(284, 75, 22),
            p5.color(294, 97, 46),
        ]);
        palettes.push([
            p5.color(324, 34, 73),
            p5.color(322, 28, 76),
            p5.color(14, 23, 82),
            p5.color(34, 27, 87),
        ]);
        palettes.push([
            p5.color(199, 91, 36),
            p5.color(355, 80, 80),
            p5.color(200, 24, 55),
            p5.color(26, 37, 95),
        ]);
        palettes.push([
            p5.color(316, 26, 67),
            p5.color(219, 40, 90),
            p5.color(203, 70, 71),
            p5.color(200, 98, 65),
        ]);
        palettes.push([
            p5.color(71, 35, 77),
            p5.color(76, 32, 91),
            p5.color(339, 69, 57),
            p5.color(325, 74, 31),
        ]);
        palettes.push([
            p5.color(0, 1, 81),
            p5.color(329, 37, 62),
            p5.color(349, 7, 99),
            p5.color(84, 29, 7),
        ]);
        palettes.push([
            p5.color(73, 53, 7),
            p5.color(36, 75, 14),
            p5.color(178, 100, 96),
            p5.color(198, 9, 87),
        ]);
        palettes.push([
            p5.color(0, 0, 2),
            p5.color(221, 100, 100),
            p5.color(194, 77, 83),
            p5.color(348, 69, 56),
        ]);
        palettes.push([
            p5.color(322, 91, 27),
            p5.color(316, 96, 50),
            p5.color(324, 28, 90),
            p5.color(27, 19, 92),
        ]);
        palettes.push([
            p5.color(324, 39, 60),
            p5.color(17, 63, 92),
            p5.color(60, 74, 97),
            p5.color(62, 52, 86),
        ]);
        palettes.push([
            p5.color(10, 15, 94),
            p5.color(46, 11, 76),
            p5.color(77, 9, 61),
            p5.color(110, 25, 45),
        ]);
        palettes.push([
            p5.color(258, 5, 93),
            p5.color(184, 13, 100),
            p5.color(205, 35, 87),
            p5.color(162, 56, 93),
        ]);
        palettes.push([
            p5.color(355, 65, 24),
            p5.color(4, 87, 41),
            p5.color(24, 100, 64),
            p5.color(31, 75, 84),
        ]);
        palettes.push([
            p5.color(346, 70, 94),
            p5.color(42, 60, 100),
            p5.color(164, 97, 84),
            p5.color(195, 90, 70),
        ]);
        palettes.push([
            p5.color(180, 1, 100),
            p5.color(349, 92, 69),
            p5.color(0, 100, 34),
            p5.color(0, 100, 16),
        ]);
        palettes.push([
            p5.color(0, 0, 41),
            p5.color(258, 27, 94),
            p5.color(240, 38, 91),
            p5.color(207, 60, 67),
        ]);
        palettes.push([
            p5.color(190, 21, 93),
            p5.color(252, 7, 80),
            p5.color(339, 15, 70),
            p5.color(3, 30, 60),
        ]);
        palettes.push([
            p5.color(93, 13, 27),
            p5.color(250, 41, 95),
            p5.color(220, 26, 97),
            p5.color(164, 38, 95),
        ]);
        palettes.push([
            p5.color(1, 95, 72),
            p5.color(22, 94, 42),
            p5.color(150, 1, 91),
            p5.color(30, 2, 72),
        ]);
        palettes.push([
            p5.color(201, 60, 64),
            p5.color(178, 57, 66),
            p5.color(30, 4, 89),
            p5.color(36, 38, 83),
        ]);
        palettes.push([
            p5.color(159, 15, 99),
            p5.color(148, 30, 100),
            p5.color(175, 16, 84),
            p5.color(233, 8, 78),
        ]);
        palettes.push([
            p5.color(77, 22, 58),
            p5.color(128, 38, 68),
            p5.color(120, 26, 74),
            p5.color(73, 25, 80),
        ]);
        palettes.push([
            p5.color(77, 3, 89),
            p5.color(70, 6, 83),
            p5.color(98, 4, 74),
            p5.color(180, 9, 59),
        ]);
        palettes.push([
            p5.color(353, 39, 79),
            p5.color(4, 52, 66),
            p5.color(316, 63, 49),
            p5.color(257, 77, 32),
        ]);
        palettes.push([
            p5.color(24, 87, 98),
            p5.color(33, 87, 100),
            p5.color(48, 59, 73),
            p5.color(89, 45, 43),
        ]);
        palettes.push([
            p5.color(37, 46, 100),
            p5.color(41, 57, 98),
            p5.color(47, 81, 100),
            p5.color(42, 81, 96),
        ]);
        palettes.push([
            p5.color(330, 54, 35),
            p5.color(151, 45, 52),
            p5.color(152, 55, 72),
            p5.color(106, 20, 83),
        ]);
        palettes.push([
            p5.color(62, 146, 204),
            p5.color(42, 98, 143),
            p5.color(19, 41, 61),
            p5.color(22, 50, 79),
        ]);
        palettes.push([
            p5.color(205, 247, 246),
            p5.color(143, 184, 222),
            p5.color(154, 148, 188),
            p5.color(155, 80, 148),
        ]);
        palettes.push([
            p5.color(34, 46, 80),
            p5.color(0, 121, 145),
            p5.color(67, 154, 134),
            p5.color(188, 216, 193),
        ]);
        palettes.push([
            p5.color(89, 79, 59),
            p5.color(119, 98, 88),
            p5.color(137, 98, 121),
            p5.color(156, 124, 165),
        ]);
        palettes.push([
            p5.color(213, 223, 229),
            p5.color(201, 177, 189),
            p5.color(180, 149, 148),
            p5.color(127, 145, 114),
        ]);
        palettes.push([
            p5.color(234, 122, 244),
            p5.color(180, 62, 143),
            p5.color(98, 0, 179),
            p5.color(59, 0, 134),
        ]);
        palettes.push([
            p5.color(214, 195, 201),
            p5.color(180, 144, 130),
            p5.color(152, 71, 62),
            p5.color(163, 124, 64),
        ]);
        palettes.push([
            p5.color(60, 22, 66),
            p5.color(8, 99, 117),
            p5.color(29, 211, 176),
            p5.color(175, 252, 65),
        ]);
        palettes.push([
            p5.color(51, 12, 47),
            p5.color(123, 40, 125),
            p5.color(112, 103, 207),
            p5.color(183, 192, 238),
        ]);
        selected_palette = p5.floor(p5.random(palettes.length));
    }
    /**
     * Sets up the properties of the instance
     */
    function setup_params(p5) {
        strokeSize = p5.random(MIN_STROKE_SIZE, MAX_STROKE_SIZE) * RES_MULTIPLIER;
        if (p5.random(1) > 0.5) {
            selected_color_style = COLOR_STYLES[1]; //GRADIENT
        }
        else {
            selected_color_style = COLOR_STYLES[2]; //ORDERED
        }
        if (p5.random(1) > 0.95) {
            selected_color_style = COLOR_STYLES[0]; //BW
        }
        p5.colorMode(p5.HSB);
        const SHAPES_STYLES = ["rect", "circle"];
        if (p5.random(1) > 0.8) {
            // 20% chance
            isShapes = SHAPES_STYLES[p5.floor(p5.random(SHAPES_STYLES.length))];
        }
        isSquaresRotated = p5.random(1) > 0.5; // 50% chance
        isContinuous = p5.random(1) > 0.5; // 50% chance
        isFilled = p5.random(1) > 0.9; // 10% chance
        isCurl = p5.random(1) > 0.75; // 25% chance
        isShadowed = p5.random(1) > 0.75; // 25% chance
        isCrossed = p5.random(1) > 0.9; // 10% chance
        isZigZag = p5.random(1) > 0.8; // 20% chance
        isColorPerShape = p5.random(1) > 0.5; // 50% chance
        hasBorder = p5.random(1) > 0.5; // 50% chance
        // avoiding weird edge cases or unpleasant combinations
        if (isCrossed) {
            isZigZag = false;
        }
        if (isCurl) {
            isContinuous = true;
            isShapes = "";
        }
        if (isFilled) {
            isZigZag = false;
            isShapes = "";
        }
        if (!isContinuous) {
            isFilled = false;
        }
        if (isZigZag) {
            isShadowed = false;
        }
        if (selected_color_style == "BW") {
            strokeSize *= p5.random(0.2, 0.3);
            isShadowed = false;
        }
        // console.log("strokeSize: ", strokeSize);
        // console.log(
        //   "isContinuous: " +
        //     isContinuous +
        //     "\nisShapes: " +
        //     isShapes +
        //     "\nisCurl: " +
        //     isCurl +
        //     "\nisShadowed: " +
        //     isShadowed +
        //     "\nisCrossed: " +
        //     isCrossed +
        //     "\nisZigZag: " +
        //     isZigZag +
        //     "\nisColorPerShape: " +
        //     isColorPerShape +
        //     "\nhasBorder: " +
        //     hasBorder +
        //     "\nisFilled: " +
        //     isFilled +
        //     "\nselected_color_style: " +
        //     selected_color_style +
        //     "\nisSquaresRotated: " +
        //     isSquaresRotated
        // );
    }
    /**
     * Sets up the background
     */
    function set_background(p5) {
        p5.background(0, 0, 97);
    }
    /**
     * Applies a noise texture on top of the canvas
     * @param {number} amount - the amount of noise to apply
     */
    function apply_noise_texture(p5, amount = 50) {
        var overAllTexture = p5.createGraphics(p5.width, p5.height);
        p5.colorMode(p5.RGB, 255, 255, 255, 400);
        overAllTexture.loadPixels();
        for (var i = 0; i < p5.width; i++) {
            for (var o = 0; o < p5.height; o++) {
                overAllTexture.set(i, o, p5.color(100, 100, 100, p5.random() * amount));
            }
        }
        overAllTexture.updatePixels();
        p5.push();
        p5.blendMode(p5.BURN);
        p5.image(overAllTexture, 0, 0);
        p5.pop();
    }
    /**
     * p5js draw function
     */
    function draw(p5) {
        set_background(p5);
        p5.strokeWeight(strokeSize);
        p5.strokeCap(p5.SQUARE);
        // -----0-----  ------1------  ------2-------  ------3------
        const CURVES_STYLES = [
            grid_curves,
            random_curves,
            poisson_curves,
            spaced_curves,
        ];
        let selected_curve_style = p5.floor(p5.random(CURVES_STYLES.length));
        selected_curve_style = p5.floor(p5.random(CURVES_STYLES.length));
        // console.log(
        //   "curves_style: " +
        //     ["grid", "random", "poisson", "spaced"][selected_curve_style]
        // );
        if (!isFilled) {
            p5.noFill();
        }
        CURVES_STYLES[selected_curve_style](p5, p5.PI / 2);
        apply_noise_texture(p5);
        // console.log("finished drawing");
        p5.noLoop();
    }
    /**
     * Converts screen coordinates into grid coordinates
     * @param {Number} x Screen X coordinate
     * @param {Number} y Screen Y coordinate
     * @param {Array} grid Reference grid
     * @param {Number} grid_resolution Size (in screen pixels) of a single grid cell
     * @param {Number} grid_left_x Grid X coordinate of the leftmost grid cell
     * @param {Number} grid_top_y Grid Y coordinate of the topmost grid cell
     * @returns [column, row] if the coordinates are inside the grid, null otherwise
     */
    function get_grid_coords(p5, x, y, grid, grid_resolution, grid_left_x, grid_top_y, shifted = false) {
        let col = p5.floor((x - grid_left_x) / grid_resolution);
        let row = p5.floor((y - grid_top_y) / grid_resolution);
        // If shifted, assume that the first row/column is the "padding" row/column
        if (shifted) {
            col++;
            row++;
        }
        if (col < 0 || row < 0 || col >= grid.length || row >= grid[0].length) {
            return null;
        }
        else {
            return [col, row];
        }
    }
    /**
     * Draws curves based on a poisson distribution of source points
     * @param {Number} angleOffset the angle offset to be added to the angle of each point of each curve
     * @param {Number} r The distance between poisson points
     * @param {Number} k The number of tries to find a valid poisson point
     */
    function poisson_curves(p5, angleOffset = 0, r = 10, k = 30) {
        r = p5.map(strokeSize, MIN_STROKE_SIZE * RES_MULTIPLIER, MAX_STROKE_SIZE * RES_MULTIPLIER, 4, 50);
        // console.log("poisson distance: " + r);
        var poisson_grid = [];
        var w = r / Math.sqrt(2);
        var active = [];
        var cols, rows;
        var ordered = [];
        // STEP 0
        cols = (1.5 * p5.width) / w;
        rows = (1.5 * p5.height) / w;
        for (var i = 0; i < cols * rows; i++) {
            poisson_grid[i] = undefined;
        }
        // STEP 1
        var x = p5.width / 2;
        var y = p5.height / 2;
        var i = p5.floor(x / w);
        var j = p5.floor(y / w);
        var pos = p5.createVector(x, y);
        poisson_grid[i + j * cols] = pos;
        active.push(pos);
        while (active.length > 0) {
            var randIndex = p5.floor(p5.random(active.length));
            var pos = active[randIndex];
            var found = false;
            for (var n = 0; n < k; n++) {
                var sample = p5_1.default.Vector.random2D();
                var m = p5.random(r, 2 * r);
                sample.setMag(m);
                // sample.add(pos); // NOTE: This was changed to x,y,z API due to error on generation
                sample.add(pos.x, pos.y, pos.z);
                var x_offset = sample.x - left_x;
                var y_offset = sample.y - top_y;
                var col = p5.floor(x_offset / w);
                var row = p5.floor(y_offset / w);
                if (col > -1 &&
                    row > -1 &&
                    col < cols &&
                    row < rows &&
                    !poisson_grid[col + row * cols]) {
                    var ok = true;
                    for (var i = -1; i <= 1 && ok; i++) {
                        for (var j = -1; j <= 1; j++) {
                            var index = col + i + (row + j) * cols;
                            var neighbor = poisson_grid[index];
                            if (neighbor) {
                                var d = p5_1.default.Vector.dist(sample, neighbor);
                                if (d < r) {
                                    ok = false;
                                    break;
                                }
                            }
                        }
                    }
                    if (ok) {
                        found = true;
                        poisson_grid[col + row * cols] = sample;
                        active.push(sample);
                        ordered.push(sample);
                        break;
                    }
                }
            }
            if (!found) {
                active.splice(randIndex, 1);
            }
        }
        for (var i = 0; i < ordered.length; i++) {
            if (ordered[i]) {
                var x = ordered[i].x;
                var y = ordered[i].y;
                if (isCurl) {
                    set_color(p5, ordered[i].x, ordered[i].y, i);
                    draw_curl(p5, ordered[i].x, ordered[i].y);
                }
                else {
                    if (p5.random() < 0.5 && isCrossed) {
                        draw_curve(p5, x, y, i, angleOffset * 2);
                    }
                    else {
                        draw_curve(p5, x, y, i, angleOffset);
                    }
                }
            }
        }
    }
    /**
     * Draws curves based on a uniform distribution of source points
     * @param {Number} angleOffset The angle offset to be added to the angle of each point of each curve
     */
    function random_curves(p5, angleOffset = 0) {
        var n;
        if (isShapes) {
            n = 2000 / strokeSize + 50;
        }
        else {
            n = 5000 / strokeSize;
        }
        n = p5.map(strokeSize * RES_MULTIPLIER, MAX_STROKE_SIZE * RES_MULTIPLIER, MIN_STROKE_SIZE * RES_MULTIPLIER, 200, 2000);
        // console.log("random curves number:", n);
        for (var i = 0; i < n; i++) {
            if (isCurl) {
                var x = p5.random(left_x, right_x);
                var y = p5.random(top_y, bottom_y);
                set_color(p5, x, y, i);
                draw_curl(p5, x, y);
            }
            else {
                let x = p5.random(left_x, right_x);
                let y = p5.random(top_y, bottom_y);
                if (p5.random() < 0.5 && isCrossed) {
                    draw_curve(p5, x, y, i, angleOffset * 2);
                }
                else {
                    draw_curve(p5, x, y, i, angleOffset);
                }
            }
        }
    }
    /**
     * Draws curves evenly spaced along the grid
     * @param {Number} angleOffset The angle offset to be added to the angle of each point of each curve
     */
    function grid_curves(p5, angleOffset) {
        var mult;
        if (isShapes) {
            mult = (1 / 2) * strokeSize - 2 / 3;
        }
        var res_step = p5.map(strokeSize * RES_MULTIPLIER, MIN_STROKE_SIZE * RES_MULTIPLIER, MAX_STROKE_SIZE * RES_MULTIPLIER, 5, 50);
        if (res_step < 5) {
            res_step = 5;
        }
        if (res_step < 15 && selected_color_style == "BW") {
            res_step = 15;
        }
        // console.log("res_step: ", res_step);
        var i = 0;
        // console.log("grid style SIZE: " + (right_x - left_x) / res_step);
        for (var x = left_x; x < right_x; x += res_step) {
            for (var y = top_y; y < bottom_y; y += res_step) {
                if (isCurl) {
                    set_color(p5, x, y, i);
                    draw_curl(p5, x, y);
                }
                else {
                    if (p5.random() < 0.5 && isCrossed) {
                        draw_curve(p5, x, y, i, angleOffset * 2);
                    }
                    else {
                        draw_curve(p5, x, y, i, angleOffset);
                    }
                }
                i++;
            }
        }
    }
    /**
     * Converts a pair of coordinates into the corresponding curl coordinates
     * @param {Number} x Screen x coordinate
     * @param {Number} y Screen y coordinate
     * @returns The new curl coordinates
     */
    function calc_curl(p5, x, y) {
        var x_offset = x - left_x;
        var y_offset = y - top_y;
        try {
            var col_index = p5.floor(x_offset / resolution);
            var row_index = p5.floor(y_offset / resolution);
            var n1 = grid[col_index + 1][row_index];
            var n2 = grid[col_index - 1][row_index];
            var dx = (n1 - n2) / (2 * resolution);
            //rate of change in y direction
            var n3 = grid[col_index][row_index + 1];
            var n4 = grid[col_index][row_index - 1];
            var dy = (n3 - n4) / (2 * resolution);
        }
        catch (err) {
            // console.log(err);
            return -1;
        }
        var curl = p5.createVector(dx, dy);
        curl.setMag(1);
        dx = curl.x;
        dy = curl.y;
        return [dy, -dx];
    }
    /**
     * Draws a curve based on curl noise
     * @param {Number} x Screen x coordinate
     * @param {Number} y Screen y coordinate
     * @param {Number} num_steps Number of curve steps
     * @param {Number} mul Coordinates multiplier
     */
    function draw_curl(p5, x, y, num_steps = 20, mul = 5) {
        num_steps = p5.floor(strokeSize + 10);
        p5.curveTightness(0);
        p5.beginShape();
        for (var i = 0; i < num_steps; i++) {
            p5.curveVertex(x, y);
            var curl = calc_curl(p5, x, y);
            if (curl == -1)
                break;
            x += curl[0] * mul;
            y += curl[1] * mul;
        }
        p5.endShape();
    }
    /**
     * Draws curves that don't overlap with each other
     * @param {Number} sep Separation between lines
     * @param {Array} start Start point
     * @param {Number} seed_every How often a drawing point should be treated as a seed point
     * @param {Number} min_distance Minimum distance between two curves
     * @param {Number} step_length Length of a single drawing step
     * @param {Number} min_curve_length Minimum length of a curve to be drawn
     * @param {Number} max_iterations Max iterations
     */
    function spaced_curves(p5, angleOffset, sep = strokeSize * 2.5 + 2 * RES_MULTIPLIER, start = null, seed_every = 2, min_distance = null, step_length = 8, min_curve_length = 50, max_iterations = 2000) {
        if (selected_color_style == "BW") {
            sep *= 2;
        }
        // console.log("sep:", sep);
        start = start || [p5.width / 2, p5.height / 2];
        min_distance = min_distance || sep / 2;
        const collision_grid = [];
        const num_columns = p5.ceil(p5.width / sep);
        const num_rows = p5.ceil(p5.height / sep);
        // Add one padding row/column to each side
        for (let i = 0; i < num_columns + 2; i++) {
            collision_grid[i] = [];
            for (let j = 0; j < num_rows + 2; j++) {
                collision_grid[i][j] = [];
            }
        }
        let count = 0;
        const seedpoints = [start];
        var i = 0;
        while (seedpoints.length > 0) {
            const index = Math.floor(Math.random() * seedpoints.length);
            const [[x, y]] = seedpoints.splice(index, 1);
            const coords = get_grid_coords(p5, x, y, grid, resolution, left_x, top_y);
            if (coords) {
                const [col, row] = coords;
                const deg = grid[col][row];
                for (const sign of [1, -1]) {
                    // Compute the perpendicular angle
                    const effective_deg = deg + (p5.PI / 2) * sign;
                    // Convert to cartesian and add to the point
                    const [seed_x, seed_y] = [
                        x + p5.cos(effective_deg) * sep,
                        y + p5.sin(effective_deg) * sep,
                    ];
                    // If the seedpoint is valid (= inside the screen and not colliding with any other points), draw the corresponding curve
                    if (inside_screen(p5, seed_x, seed_y) &&
                        check_collision(p5, seed_x, seed_y, collision_grid, sep, min_distance, 0, 0)) {
                        if (isShadowed) {
                            p5.push();
                            var mult = p5.map(strokeSize * RES_MULTIPLIER, MIN_STROKE_SIZE * RES_MULTIPLIER, MAX_STROKE_SIZE * RES_MULTIPLIER, 0.8, 1.2);
                            p5.translate(3 * RES_MULTIPLIER * mult, 3 * RES_MULTIPLIER * mult);
                            p5.strokeWeight(strokeSize);
                            if (isFilled) {
                                p5.fill(100, 100, 0, 0.3);
                                p5.noStroke();
                            }
                            else {
                                p5.noFill();
                                p5.stroke(100, 100, 0, 0.3);
                            }
                            draw_spaced_curve(p5, angleOffset, seed_x, seed_y, sep, collision_grid, min_distance, step_length, min_curve_length, seed_every, i);
                            p5.pop();
                        }
                        // Draw the curve for the corresponding seed points
                        set_color(p5, seed_x, seed_y, i);
                        const [new_seedpoints, new_collision_points] = draw_spaced_curve(p5, angleOffset, seed_x, seed_y, sep, collision_grid, min_distance, step_length, min_curve_length, seed_every, i);
                        // Add the new seedpoints
                        seedpoints.push(...new_seedpoints.filter((p) => inside_screen(p, p[0], p[1]) &&
                            check_collision(p, p[0], p[1], collision_grid, sep, min_distance, 0, 0)));
                        i++;
                        // Insert collision points into the collision grid
                        for (const [newX, newY] of new_collision_points) {
                            // Notice that we use grid_left_x = 0 and grid_top_y = 0 because the collision grid is already shifted
                            const new_coords = get_grid_coords(p5, newX, newY, collision_grid, sep, 0, 0, true);
                            if (new_coords) {
                                const [col_index, row_index] = new_coords;
                                if (col_index >= 0 &&
                                    col_index < collision_grid.length &&
                                    row_index >= 0 &&
                                    row_index < collision_grid[col_index].length) {
                                    collision_grid[col_index][row_index].push([newX, newY]);
                                }
                            }
                        }
                    }
                }
            }
            count++;
            if (count == max_iterations) {
                break;
            }
        }
    }
    /**
     * Draws a single curve, following both directions
     * @param {Number} seed_x X coordinate of the seed point
     * @param {Number} seed_y Y coordinate of the seed point
     * @param {Number} sep Separation between lines
     * @param {Array} collision_grid Grid containing collision points
     * @param {Number} min_distance Minimum distance between two curves
     * @param {Number} step_length Length of a single drawing step
     * @param {Number} min_curve_length Minimum length of a curve to be drawn
     * @param {Number} seed_every How often a drawing point should be treated as a seed point
     * @returns A [seedpoints, collision_points] tuple
     */
    function draw_spaced_curve(p5, angleOffset, seed_x, seed_y, sep, collision_grid, min_distance, step_length, min_curve_length, seed_every, curve_i) {
        // Draw following the positive direction
        const [forward_seedpoints, forward_curve_points] = get_curve_points(p5, angleOffset, seed_x, seed_y, sep, collision_grid, min_distance, step_length, seed_every, false, curve_i);
        // Draw following the negative direction
        const [backward_seedpoints, backward_curve_points] = get_curve_points(p5, angleOffset, seed_x, seed_y, sep, collision_grid, min_distance, step_length, seed_every, true, curve_i);
        // Merge the two curves into one
        const merged_curve_points = [
            ...backward_curve_points.reverse(),
            [seed_x, seed_y],
            ...forward_curve_points,
        ];
        // If the curve is long enough, draw it
        const curve_length = (merged_curve_points.length - 1) * step_length;
        if (curve_length >= min_curve_length) {
            p5.curveTightness(0);
            p5.beginShape();
            for (let i = 0; i < merged_curve_points.length; i++) {
                const [x, y] = merged_curve_points[i];
                // Add an EXTRA vertex at the beginning and end (which p5.js will use to
                // determine the direction)
                if (i == 0 || i == merged_curve_points.length - 1) {
                    p5.curveVertex(x, y);
                }
                p5.curveVertex(x, y);
            }
            p5.endShape();
            return [
                forward_seedpoints.concat(backward_seedpoints),
                merged_curve_points,
            ];
        }
        else {
            return [[], []];
        }
    }
    /**
     * Computes the points of a curve along a specific direction.
     * @param {Number} seed_x X coordinate of the seed point
     * @param {Number} seed_y Y coordinate of the seed point
     * @param {Number} sep Separation between lines
     * @param {Array} collision_grid Grid containing collision points
     * @param {Number} min_distance Minimum distance between two curves
     * @param {Number} step_length Length of a single drawing step
     * @param {Number} seed_every How often a drawing point should be treated as a seed point
     * @param {boolean} reversed True if the curve should be drawn in the negative direction
     * @returns A [seedpoints, curve_points] tuple
     */
    function get_curve_points(p5, angleOffset, seed_x, seed_y, sep, collision_grid, min_distance, step_length, seed_every, reversed, curve_i) {
        let [x, y] = [seed_x, seed_y];
        const new_seedpoints = [];
        let t = 0;
        const curve_points = [];
        let first_point = true;
        // Stop if you're too close to a collision point
        while (check_collision(p5, x, y, collision_grid, sep, min_distance, 0, 0)) {
            // Add a new seed every seed_every steps (as long as it's inside the screen)
            if (t % seed_every == 0 && inside_screen(p5, x, y)) {
                new_seedpoints.push([x, y]);
            }
            const coordinates = get_grid_coords(p5, x, y, grid, resolution, left_x, top_y);
            if (!coordinates) {
                break;
            }
            const [col_index, row_index] = coordinates;
            if (col_index < 0 ||
                col_index >= grid.length ||
                row_index < 0 ||
                row_index >= grid[col_index].length) {
                break;
            }
            // Don't add the seed point to the list
            if (first_point) {
                first_point = false;
            }
            else {
                curve_points.push([x, y]);
            }
            let angle = grid[col_index][row_index];
            if (reversed) {
                angle += p5.PI;
            }
            if (isZigZag) {
                if (p5.floor(p5.noise(t * (curve_i + 1)) * 1000) % 2 == 0) {
                    angle += angleOffset;
                }
            }
            const x_step = step_length * p5.cos(angle);
            const y_step = step_length * p5.sin(angle);
            x += x_step;
            y += y_step;
            t++;
        }
        return [new_seedpoints, curve_points];
    }
    /**
     * Checks if a point is inside the screen
     * @param {*} x X coordinate
     * @param {*} y Y coordinate
     * @returns True if and only if the point is inside the screen
     */
    function inside_screen(p5, x, y) {
        return x > 0 && x < p5.width && y > 0 && y < p5.height;
    }
    /**
     * Checks if a point is colliding with any other point
     * @param {Number} x Screen X coordinate
     * @param {Number} y Screen Y coordinate
     * @param {Array} collision_grid Grid containing collision points
     * @param {Number} grid_resolution Size (in screen pixels) of a single grid cell
     * @param {Number} min_distance Minimum distance between points to count as a collision
     * @param {Number} grid_left_x Grid X coordinate of the leftmost grid cell
     * @param {Number} grid_top_y Grid Y coordinate of the topmost grid cell
     * @returns True if and only if the point is colliding with any other point
     */
    function check_collision(p5, x, y, collision_grid, grid_resolution, min_distance, grid_left_x, grid_top_y) {
        const grid_coords = get_grid_coords(p5, x, y, collision_grid, grid_resolution, grid_left_x, grid_top_y, true);
        if (!grid_coords) {
            return false;
        }
        const [col, row] = grid_coords;
        const check_steps = p5.ceil(min_distance / grid_resolution) * 2;
        for (let i = -check_steps; i <= check_steps; i++) {
            for (let j = -check_steps; j <= check_steps; j++) {
                if (collision_grid[col + i] && collision_grid[col + i][row + j]) {
                    for (const [point_x, point_y] of collision_grid[col + i][row + j]) {
                        if (p5.dist(x, y, point_x, point_y) < min_distance) {
                            return false;
                        }
                    }
                }
            }
        }
        return true;
    }
    /**
     * Selects the color for the curve
     * @param {Number} x Screen X coordinate of the curve
     * @param {Number} y Screen Y coordinate of the curve
     * @param {Number} curve_i Index of the curve
     */
    function set_color(p5, x, y, curve_i = 0) {
        var p = palettes[selected_palette];
        if (selected_color_style == "GRADIENT") {
            var h = bottom_y - top_y;
            var n = p.length;
            var step = h / n;
            var i = p5.floor((y + p5.random(-200, 200) - top_y) / step);
            if (i < 0)
                i = 0;
            var color = p[i];
            if (color) {
                p5.stroke(color);
                if (isFilled) {
                    p5.fill(color);
                    p5.noStroke();
                }
                else {
                    p5.noFill();
                    p5.stroke(color);
                }
                if (isShapes) {
                    p5.fill(color);
                }
            }
        }
        else if (selected_color_style == "ORDERED") {
            var p_i = ((p5.floor(curve_i) % p.length) + p.length) % p.length;
            var color = p[p_i];
            if (isFilled) {
                p5.fill(color);
                p5.noStroke();
            }
            else {
                p5.noFill();
                p5.stroke(color);
            }
            if (isShapes) {
                p5.fill(color);
            }
        }
        else if (selected_color_style == "BW") {
            if (isFilled) {
                p5.fill(0, 0, 0);
                p5.noStroke();
            }
            else {
                p5.noFill();
                p5.stroke(0, 0, 0);
            }
            if (isShapes) {
                p5.fill(0, 0, 0);
            }
        }
        if (isShapes && hasBorder) {
            p5.stroke(0, 0, 100, 0.4);
            p5.strokeWeight(0.5);
        }
        else if (isShapes && !hasBorder) {
            p5.noStroke();
        }
    }
    /**
     * Draws a single standard curve
     * @param {Number} x Screen X coordinate of the curve
     * @param {Number} y Screen Y coordinate of the curve
     * @param {Number} curve_i Index of the curve
     * @param {Number} angleOffset Angle offset for each point of the curve
     */
    function draw_curve(p5, x, y, curve_i = 0, angleOffset = 0) {
        var i = 0;
        var num_steps = p5.floor(5.8 * strokeSize + 108);
        if (isShadowed && curve_i != -1) {
            draw_shadow(p5, x, y, -1, angleOffset);
        }
        if (curve_i == -1) {
            p5.strokeWeight(strokeSize);
            p5.stroke(100, 100, 0, 0.3);
            p5.noStroke();
        }
        else {
            set_color(p5, x, y, i);
        }
        var o_x = x;
        var o_y = y;
        var x_offset_ = x - left_x;
        var y_offset_ = y - top_y;
        var col_index_ = p5.floor(x_offset_ / resolution);
        var row_index_ = p5.floor(y_offset_ / resolution);
        if (!col_index_ ||
            col_index_ < 0 ||
            col_index_ >= grid.length ||
            row_index_ < 0 ||
            row_index_ >= grid[col_index_].length) {
            return;
        }
        if (!isColorPerShape) {
            set_color(p5, x, y, curve_i);
        }
        if (curve_i == -1) {
            if (isFilled || isShapes) {
                p5.fill(100, 100, 0, 0.3);
                p5.noStroke();
            }
            else {
                p5.stroke(100, 100, 0, 0.3);
            }
        }
        var step_length = p5.width / 1000;
        if (isShapes) {
            step_length = 0.2 * strokeSize + 3;
        }
        p5.curveTightness(0);
        p5.beginShape();
        for (i = 0; i < num_steps; i++) {
            if (!isShapes) {
                p5.curveVertex(x, y);
            }
            else if (isShapes == "circle") {
                if (isColorPerShape) {
                    set_color(p5, x, y, curve_i);
                }
                p5.strokeWeight(1 * RES_MULTIPLIER);
                p5.circle(x, y, strokeSize);
            }
            else if (isShapes == "rect") {
                p5.rectMode(p5.CENTER);
                if (isColorPerShape) {
                    set_color(p5, x, y, curve_i);
                }
                p5.push();
                p5.translate(x, y);
                if (isSquaresRotated) {
                    p5.rotate(angle + p5.PI / 4);
                }
                if (i != 0) {
                    p5.rect(0, 0, strokeSize, strokeSize);
                }
                p5.pop();
            }
            var x_offset = x - left_x;
            var y_offset = y - top_y;
            var col_index = p5.floor(x_offset / resolution);
            var row_index = p5.floor(y_offset / resolution);
            if (!col_index ||
                col_index < 0 ||
                col_index >= grid.length ||
                row_index < 0 ||
                row_index >= grid[col_index].length) {
                p5.endShape();
                return;
            }
            var angle = grid[col_index][row_index];
            angle += angleOffset;
            if (isZigZag) {
                if (p5.floor(p5.noise((i + 1) * (curve_i + 1)) * 1000) % 2 == 0) {
                    angle += angleOffset;
                }
            }
            var x_step = step_length * p5.cos(angle);
            var y_step = step_length * p5.sin(angle);
            x += x_step;
            y += y_step;
        }
        p5.endShape();
    }
    /**
     * Draws the shadow of a curve.
     * @param {Number} x Screen X coordinate
     * @param {Number} y Screen Y coordinate
     * @param {Number} i The index of the curve
     * @param {Number} angleOffset The angle offset to be added to the angle of each point of the curve
     */
    function draw_shadow(p5, x, y, i, angleOffset = 0) {
        p5.push();
        p5.translate(3 * RES_MULTIPLIER, 3 * RES_MULTIPLIER);
        draw_curve(p5, x, y, i, angleOffset);
        p5.pop();
    }
    // /**
    //  * Debug function to draw the grid.
    //  *
    //  * Can be deleted.
    //  */
    // function draw_grid(p5: p5Types) {
    //   for (var col = 0; col < grid.length; col++) {
    //     for (var row = 0; row < grid[col].length; row++) {
    //       p5.push();
    //       p5.translate(col * resolution, row * resolution);
    //       p5.rotate(grid[col][row]);
    //       p5.line(0, 0, resolution * 0.8, 0);
    //       p5.circle(0, 0, resolution / 6);
    //       p5.pop();
    //     }
    //   }
    // }
    /**
     * Rounds a number to the nearest multiple of step.
     * @param {Number} num Number to be rounded
     * @param {Number} step Distance between numbers
     * @returns The rounded number
     */
    function roundTo(p5, num, step) {
        return p5.floor(num / step) * step;
    }
    return { setup, draw };
};
exports.default = sketch;
