import p5Types from "p5";

const sketch = (uuid: string, size?: number) => {
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
   * The canvas object
   */
  var canvas: p5Types.Renderer;

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
  function setup(p5: p5Types, canvasParentRef?: Element) {
    SIZE = size || p5.min(p5.windowWidth, p5.windowHeight);

    canvas = p5.createCanvas(SIZE, SIZE);
    if (canvasParentRef) {
      canvas.parent(canvasParentRef);
    }

    RES_MULTIPLIER = SIZE / 800;

    NOISE_SEED = parseInt(uuid.replace(/-/g, "").slice(0, 13), 16); // p5.random(1000000000);
    RANDOM_SEED = parseInt(uuid.replace(/-/g, "").slice(-13), 16); // p5.random(1000000000);
    console.log(NOISE_SEED, RANDOM_SEED);
    p5.noiseSeed(NOISE_SEED);
    p5.randomSeed(RANDOM_SEED);

    setup_params(p5);
    setup_noise(p5);
    setup_palettes(p5);

    const EXTRA = 0.2;
    left_x = -160*RES_MULTIPLIER;
    right_x = 960*RES_MULTIPLIER;
    top_y = -160*RES_MULTIPLIER;
    bottom_y = 960*RES_MULTIPLIER;

    resolution = 11.2*RES_MULTIPLIER; // 1% of the width

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
  function setup_noise(p5: p5Types) {
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
    if (isCurl && lod > 5) lod = 5;

    p5.noiseDetail(lod, falloff);
  }

  /**
   * Fills the palettes array with pregenerated palette
   * @see palettes
   */
  function setup_palettes(p5: p5Types) {
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
    palettes.push([
        p5.color(226, 26, 95),
        p5.color(251, 58, 87),
        p5.color(288, 100, 70),
        p5.color(301, 100, 49),
    ]);
    palettes.push([
        p5.color(31, 38, 26),
        p5.color(78, 49, 36),
        p5.color(67, 7, 49),
        p5.color(225, 4, 72),
    ]);
    palettes.push([
        p5.color(342, 22, 31),
        p5.color(347, 8, 43),
        p5.color(60, 8, 62),
        p5.color(83, 15, 84),
    ]);
    palettes.push([
        p5.color(256, 46, 50),
        p5.color(349, 28, 67),
        p5.color(326, 53, 30),
        p5.color(347, 60, 72),
    ]);
    palettes.push([
        p5.color(51, 22, 93),
        p5.color(63, 34, 87),
        p5.color(36, 47, 92),
        p5.color(16, 78, 87),
    ]);
    palettes.push([
        p5.color(150, 1, 84),
        p5.color(137, 18, 77),
        p5.color(172, 13, 71),
        p5.color(217, 12, 60),
    ]);
    palettes.push([
        p5.color(6, 19, 84),
        p5.color(342, 22, 81),
        p5.color(339, 34, 41),
        p5.color(11, 34, 25),
    ]);
    palettes.push([
        p5.color(354, 62, 86),
        p5.color(70, 6, 41),
        p5.color(170, 15, 64),
        p5.color(207, 41, 40),
    ]);
    palettes.push([
        p5.color(137, 14, 85),
        p5.color(189, 23, 79),
        p5.color(205, 22, 69),
        p5.color(88, 16, 31),
    ]);
    palettes.push([
        p5.color(189, 68, 100),
        p5.color(271, 98, 51),
        p5.color(331, 77, 93),
        p5.color(0, 35, 100),
    ]);
    palettes.push([
        p5.color(236, 39, 100),
        p5.color(258, 19, 75),
        p5.color(23, 25, 62),
        p5.color(30, 62, 48),
    ]);
    palettes.push([
        p5.color(144, 23, 74),
        p5.color(91, 26, 73),
        p5.color(84, 48, 80),
        p5.color(42, 50, 50),
    ]);
    palettes.push([
        p5.color(27, 97, 15),
        p5.color(330, 100, 28),
        p5.color(292, 76, 40),
        p5.color(211, 67, 52),
    ]);
    palettes.push([
        p5.color(191, 24, 78),
        p5.color(160, 14, 59),
        p5.color(29, 20, 81),
        p5.color(19, 18, 91),
    ]);
    palettes.push([
        p5.color(152, 100, 6),
        p5.color(182, 50, 22),
        p5.color(10, 8, 30),
        p5.color(142, 4, 100),
    ]);
    palettes.push([
        p5.color(65, 5, 97),
        p5.color(8, 76, 91),
        p5.color(203, 12, 25),
        p5.color(207, 68, 77),
    ]);
    palettes.push([
        p5.color(7, 66, 94),
        p5.color(7, 52, 95),
        p5.color(6, 38, 97),
        p5.color(7, 25, 98),
    ]);
    palettes.push([
        p5.color(300, 100, 0),
        p5.color(2, 91, 17),
        p5.color(28, 100, 53),
        p5.color(30, 98, 74),
    ]);
    palettes.push([
        p5.color(270, 2, 76),
        p5.color(256, 9, 46),
        p5.color(265, 19, 24),
        p5.color(45, 71, 87),
    ]);
    palettes.push([
        p5.color(32, 100, 36),
        p5.color(27, 57, 40),
        p5.color(43, 27, 45),
        p5.color(145, 13, 53),
    ]);
    palettes.push([
        p5.color(126, 83, 50),
        p5.color(133, 59, 73),
        p5.color(170, 32, 92),
        p5.color(224, 30, 52),
    ]);
    palettes.push([
        p5.color(252, 24, 100),
        p5.color(240, 26, 95),
        p5.color(311, 17, 86),
        p5.color(334, 33, 81),
    ]);
    palettes.push([
        p5.color(352, 6, 96),
        p5.color(275, 12, 88),
        p5.color(254, 20, 78),
        p5.color(283, 24, 63),
    ]);
    palettes.push([
        p5.color(13, 13, 98),
        p5.color(30, 10, 90),
        p5.color(347, 22, 49),
        p5.color(341, 32, 46),
    ]);
    palettes.push([
        p5.color(347, 28, 39),
        p5.color(353, 31, 67),
        p5.color(21, 38, 84),
        p5.color(16, 47, 100),
    ]);
    palettes.push([
        p5.color(13, 24, 40),
        p5.color(245, 21, 62),
        p5.color(145, 35, 76),
        p5.color(94, 42, 94),
    ]);
    palettes.push([
        p5.color(209, 87, 40),
        p5.color(48, 19, 98),
        p5.color(47, 61, 96),
        p5.color(28, 68, 93),
    ]);
    palettes.push([
        p5.color(187, 38, 86),
        p5.color(241, 54, 86),
        p5.color(236, 83, 82),
        p5.color(224, 76, 26),
    ]);
    palettes.push([
        p5.color(194, 98, 21),
        p5.color(243, 49, 30),
        p5.color(274, 49, 63),
        p5.color(319, 29, 82),
    ]);
    palettes.push([
        p5.color(251, 32, 35),
        p5.color(165, 17, 77),
        p5.color(102, 16, 84),
        p5.color(71, 18, 94),
    ]);
    palettes.push([
        p5.color(94, 30, 96),
        p5.color(88, 24, 82),
        p5.color(221, 19, 62),
        p5.color(219, 65, 50),
    ]);
    palettes.push([
        p5.color(209, 59, 27),
        p5.color(145, 20, 44),
        p5.color(99, 34, 63),
        p5.color(80, 30, 85),
    ]);
    palettes.push([
        p5.color(81, 29, 96),
        p5.color(101, 36, 88),
        p5.color(56, 42, 80),
        p5.color(63, 52, 67),
    ]);
    palettes.push([
        p5.color(59, 49, 100),
        p5.color(18, 56, 100),
        p5.color(355, 69, 91),
        p5.color(20, 62, 71),
    ]);
    palettes.push([
        p5.color(166, 14, 98),
        p5.color(163, 24, 63),
        p5.color(80, 67, 33),
        p5.color(99, 47, 55),
    ]);
    palettes.push([
        p5.color(110, 83, 12),
        p5.color(154, 100, 31),
        p5.color(329, 43, 85),
        p5.color(351, 26, 98),
    ]);
    palettes.push([
        p5.color(309, 82, 15),
        p5.color(41, 40, 93),
        p5.color(50, 32, 86),
        p5.color(68, 16, 78),
    ]);
    palettes.push([
        p5.color(348, 38, 100),
        p5.color(348, 12, 98),
        p5.color(192, 96, 100),
        p5.color(166, 44, 67),
    ]);
    palettes.push([
        p5.color(211, 79, 82),
        p5.color(76, 98, 80),
        p5.color(47, 99, 93),
        p5.color(23, 100, 96),
    ]);
    palettes.push([
        p5.color(7, 50, 79),
        p5.color(40, 40, 74),
        p5.color(72, 28, 69),
        p5.color(107, 47, 64),
    ]);
    palettes.push([
        p5.color(22, 64, 92),
        p5.color(5, 65, 78),
        p5.color(4, 79, 68),
        p5.color(358, 82, 51),
    ]);
    palettes.push([
        p5.color(45, 100, 95),
        p5.color(39, 100, 98),
        p5.color(32, 98, 90),
        p5.color(23, 100, 100),
    ]);
    palettes.push([
        p5.color(206, 28, 10),
        p5.color(148, 37, 28),
        p5.color(153, 93, 51),
        p5.color(51, 31, 74),
    ]);
    palettes.push([
        p5.color(356, 82, 87),
        p5.color(132, 28, 73),
        p5.color(58, 24, 96),
        p5.color(27, 51, 87),
    ]);
    palettes.push([
        p5.color(190, 82, 48),
        p5.color(192, 60, 71),
        p5.color(190, 36, 80),
        p5.color(24, 4, 93),
    ]);

    selected_palette = p5.floor(p5.random(palettes.length));
  }

  /**
   * Sets up the properties of the instance
   */
  function setup_params(p5: p5Types) {
    strokeSize = p5.random(MIN_STROKE_SIZE, MAX_STROKE_SIZE) * RES_MULTIPLIER;

    if (p5.random(1) > 0.5) {
      selected_color_style = COLOR_STYLES[1]; //GRADIENT
    } else {
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
    if(!isShapes) {
        isColorPerShape = false;
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
  function set_background(p5: p5Types) {
    p5.background(0, 0, 97);
  }

  /**
   * Applies a noise texture on top of the canvas
   * @param {number} amount - the amount of noise to apply
   */
  function apply_noise_texture(p5: p5Types, amount: number = 50) {
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
  function draw(p5: p5Types, cb?: (base64Image: string) => void) {
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

    if (cb) {
      // Return base64 image
      cb(canvas.elt.toDataURL());
    }

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
  function get_grid_coords(
    p5: p5Types,
    x: number,
    y: number,
    grid: Array<any>,
    grid_resolution: number,
    grid_left_x: number,
    grid_top_y: number,
    shifted = false
  ) {
    let col = p5.floor((x - grid_left_x) / grid_resolution);
    let row = p5.floor((y - grid_top_y) / grid_resolution);

    // If shifted, assume that the first row/column is the "padding" row/column
    if (shifted) {
      col++;
      row++;
    }

    if (col < 0 || row < 0 || col >= grid.length || row >= grid[0].length) {
      return null;
    } else {
      return [col, row];
    }
  }

  /**
   * Draws curves based on a poisson distribution of source points
   * @param {Number} angleOffset the angle offset to be added to the angle of each point of each curve
   * @param {Number} r The distance between poisson points
   * @param {Number} k The number of tries to find a valid poisson point
   */
  function poisson_curves(
    p5: p5Types,
    angleOffset: number = 0,
    r: number = 10,
    k: number = 30
  ) {
    r = p5.map(
      strokeSize,
      MIN_STROKE_SIZE * RES_MULTIPLIER,
      MAX_STROKE_SIZE * RES_MULTIPLIER,
      20*RES_MULTIPLIER,
      100*RES_MULTIPLIER
    );
    // console.log("poisson distance: " + r);
    var poisson_grid: (p5Types.Vector | undefined)[] = [];
    var w = r / Math.sqrt(2);
    var active: p5Types.Vector[] = [];
    var cols: number, rows: number;
    var ordered: p5Types.Vector[] = [];

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
        var sample = p5Types.Vector.fromAngle(p5.random(0, 2*p5.PI));
        var m = p5.random(r, 2 * r);
        sample.setMag(m);
        // sample.add(pos); // NOTE: This was changed to x,y,z API due to error on generation
        sample.add(pos.x, pos.y, pos.z);

        var x_offset = sample.x - left_x;
        var y_offset = sample.y - top_y;

        var col = p5.floor(x_offset / w);
        var row = p5.floor(y_offset / w);

        if (
          col > -1 &&
          row > -1 &&
          col < cols &&
          row < rows &&
          !poisson_grid[col + row * cols]
        ) {
          var ok = true;
          for (var i = -1; i <= 1 && ok; i++) {
            for (var j = -1; j <= 1; j++) {
              var index = col + i + (row + j) * cols;
              var neighbor = poisson_grid[index];
              if (neighbor) {
                var d = p5Types.Vector.dist(sample, neighbor);
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
        set_color(p5, ordered[i].x, ordered[i].y, i);
        var x = ordered[i].x;
        var y = ordered[i].y;
        if (isCurl) {
          draw_curl(p5, ordered[i].x, ordered[i].y);
        } else {
          if (p5.random() < 0.5 && isCrossed) {
            draw_curve(p5, x, y, i, angleOffset * 2);
          } else {
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
  function random_curves(p5: p5Types, angleOffset: number = 0) {
    var n: number;
    n = p5.map(strokeSize/RES_MULTIPLIER, MAX_STROKE_SIZE, MIN_STROKE_SIZE, 200, 2000);
    // console.log("random curves number:", n);
    for (var i = 0; i < n; i++) {
      if (isCurl) {
        var x = p5.random(left_x, right_x);
        var y = p5.random(top_y, bottom_y);
        set_color(p5, x, y, i);
        draw_curl(p5, x, y);
      } else {
        let x = p5.random(left_x, right_x);
        let y = p5.random(top_y, bottom_y);
        if (p5.random() < 0.5 && isCrossed) {
          draw_curve(p5, x, y, i, angleOffset * 2);
        } else {
          draw_curve(p5, x, y, i, angleOffset);
        }
      }
    }
  }

  /**
   * Draws curves evenly spaced along the grid
   * @param {Number} angleOffset The angle offset to be added to the angle of each point of each curve
   */
  function grid_curves(p5: p5Types, angleOffset: number) {
    var mult: number;
    if (isShapes) {
      mult = (1 / 2) * strokeSize - 2 / 3;
    }

    var res_step = p5.map(
      strokeSize * RES_MULTIPLIER,
      MIN_STROKE_SIZE * RES_MULTIPLIER,
      MAX_STROKE_SIZE * RES_MULTIPLIER,
      5,
      50
    );
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
        } else {
          if (p5.random() < 0.5 && isCrossed) {
            draw_curve(p5, x, y, i, angleOffset * 2);
          } else {
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
  function calc_curl(p5: p5Types, x: number, y: number) {
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
    } catch (err) {
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
  function draw_curl(
    p5: p5Types,
    x: number,
    y: number,
    num_steps: number = 20,
    mul: number = 5
  ) {
    num_steps = p5.floor(strokeSize/RES_MULTIPLIER + 10);
    p5.curveTightness(0);
    p5.beginShape();
    for (var i = 0; i < num_steps; i++) {
      p5.curveVertex(x, y);
      var curl = calc_curl(p5, x, y);
      if (curl == -1) break;
      x += curl[0] * mul * RES_MULTIPLIER;
      y += curl[1] * mul * RES_MULTIPLIER;
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
  function spaced_curves(
    p5: p5Types,
    angleOffset,
    sep: number = strokeSize * 2.5,
    start: any = null,
    seed_every: number = 2,
    min_distance: any = null,
    step_length: number = 8*RES_MULTIPLIER,
    min_curve_length: number = 50*RES_MULTIPLIER,
    max_iterations: number = 2000
  ) {
    if (selected_color_style == "BW") {
      sep *= 2;
    }
    // console.log("sep:", sep);
    start = start || [p5.width / 2, p5.height / 2];
    min_distance = min_distance || sep / 2;
    const collision_grid: any[] = [];

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
      const index = p5.floor(p5.random() * seedpoints.length);
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
          if (
            inside_screen(p5, seed_x, seed_y) &&
            check_collision(
              p5,
              seed_x,
              seed_y,
              collision_grid,
              sep,
              min_distance,
              0,
              0
            )
          ) {
            if (isShadowed) {
              p5.push();
              var mult = p5.map(
                strokeSize * RES_MULTIPLIER,
                MIN_STROKE_SIZE * RES_MULTIPLIER,
                MAX_STROKE_SIZE * RES_MULTIPLIER,
                0.8,
                1.2
              );
              p5.translate(
                3 * RES_MULTIPLIER * mult,
                3 * RES_MULTIPLIER * mult
              );
              p5.strokeWeight(strokeSize);
              if (isFilled) {
                p5.fill(100, 100, 0, 0.3);
                p5.noStroke();
              } else {
                p5.noFill();
                p5.stroke(100, 100, 0, 0.3);
              }
              draw_spaced_curve(
                p5,
                angleOffset,
                seed_x,
                seed_y,
                sep,
                collision_grid,
                min_distance,
                step_length,
                min_curve_length,
                seed_every,
                -1
              );
              p5.pop();
            }
            // Draw the curve for the corresponding seed points
            set_color(p5, seed_x, seed_y, i);
            const [new_seedpoints, new_collision_points] = draw_spaced_curve(
              p5,
              angleOffset,
              seed_x,
              seed_y,
              sep,
              collision_grid,
              min_distance,
              step_length,
              min_curve_length,
              seed_every,
              i
            );
            // Add the new seedpoints
            seedpoints.push(
              ...new_seedpoints.filter(
                (p) =>
                  inside_screen(p5, p[0], p[1]) &&
                  check_collision(
                    p5,
                    p[0],
                    p[1],
                    collision_grid,
                    sep,
                    min_distance,
                    0,
                    0
                  )
              )
            );
            // Insert collision points into the collision grid
            for (const [newX, newY] of new_collision_points) {
              // Notice that we use grid_left_x = 0 and grid_top_y = 0 because the collision grid is already shifted
              const new_coords = get_grid_coords(
                p5,
                newX,
                newY,
                collision_grid,
                sep,
                0,
                0,
                true
              );
              if (new_coords) {
                const [col_index, row_index] = new_coords;
                if (
                  col_index >= 0 &&
                  col_index < collision_grid.length &&
                  row_index >= 0 &&
                  row_index < collision_grid[col_index].length
                ) {
                  collision_grid[col_index][row_index].push([newX, newY]);
                }
              }
            }
          }
        }
        i++;
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
  function draw_spaced_curve(
    p5: p5Types,
    angleOffset,
    seed_x: number,
    seed_y: number,
    sep: number,
    collision_grid: Array<any>,
    min_distance: number,
    step_length: number,
    min_curve_length: number,
    seed_every: number,
    curve_i
  ) {
    // Draw following the positive direction
    const [forward_seedpoints, forward_curve_points] = get_curve_points(
      p5,
      angleOffset,
      seed_x,
      seed_y,
      sep,
      collision_grid,
      min_distance,
      step_length,
      seed_every,
      false,
      curve_i
    );
    // Draw following the negative direction
    const [backward_seedpoints, backward_curve_points] = get_curve_points(
      p5,
      angleOffset,
      seed_x,
      seed_y,
      sep,
      collision_grid,
      min_distance,
      step_length,
      seed_every,
      true,
      curve_i
    );

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
          if (!isShapes) {
            p5.curveVertex(x, y);
          } else if (isShapes == 'circle') {
            if (isColorPerShape) {
              set_color(p5, x, y, curve_i)
            }
            p5.strokeWeight(1 * RES_MULTIPLIER)
            if(curve_i != -1) {
              p5.circle(x, y, strokeSize);
            }
          } else if (isShapes == 'rect') {
            p5.rectMode(p5.CENTER);
            if (isColorPerShape) {
              set_color(p5, x, y, curve_i)
            }
            if(curve_i == -1) {
              p5.fill(100, 100, 0, 0.3)
              p5.stroke(100, 100, 0, 0.3)
            }
            p5.push()
            p5.translate(x, y)
            if (i != 0 && curve_i != -1) {
              p5.rect(0, 0, strokeSize, strokeSize);
            }
            p5.pop()
          }
        }
        if (!isShapes) {
          p5.curveVertex(x, y);
        } else if (isShapes == 'circle') {
          if (isColorPerShape) {
            set_color(p5, x, y, curve_i)
          }
          if(curve_i == -1) {
            p5.fill(100, 100, 0, 0.3)
            p5.stroke(100, 100, 0, 0.3)
          }
          p5.strokeWeight(1 * RES_MULTIPLIER)
          p5.circle(x, y, strokeSize);
        } else if (isShapes == 'rect') {
          p5.strokeWeight(1 * RES_MULTIPLIER)
          p5.rectMode(p5.CENTER);
          if (isColorPerShape) {
            set_color(p5, x, y, curve_i)
          }
          if(curve_i == -1) {
            p5.fill(100, 100, 0, 0.3)
          }
          p5.push()
          p5.translate(x, y)
          if (i != 0) {
            p5.rect(0, 0, strokeSize, strokeSize);
          }
          p5.pop()
        }
      }
      p5.endShape();

      return [
        forward_seedpoints.concat(backward_seedpoints),
        merged_curve_points,
      ];
    } else {
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
  function get_curve_points(
    p5: p5Types,
    angleOffset,
    seed_x: number,
    seed_y: number,
    sep: number,
    collision_grid: Array<any>,
    min_distance: number,
    step_length: number,
    seed_every: number,
    reversed: boolean,
    curve_i
  ) {
    let [x, y] = [seed_x, seed_y];
    const new_seedpoints: any[] = [];
    let t = 0;

    const curve_points: any[] = [];

    let first_point = true;

    // Stop if you're too close to a collision point
    while (check_collision(p5, x, y, collision_grid, sep, min_distance, 0, 0)) {
      // Add a new seed every seed_every steps (as long as it's inside the screen)
      if (t % seed_every == 0 && inside_screen(p5, x, y)) {
        new_seedpoints.push([x, y]);
      }

      const coordinates = get_grid_coords(
        p5,
        x,
        y,
        grid,
        resolution,
        left_x,
        top_y
      );

      if (!coordinates) {
        break;
      }

      const [col_index, row_index] = coordinates;

      if (
        col_index < 0 ||
        col_index >= grid.length ||
        row_index < 0 ||
        row_index >= grid[col_index].length
      ) {
        break;
      }

      // Don't add the seed point to the list
      if (first_point) {
        first_point = false;
      } else {
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
  function inside_screen(p5: p5Types, x: any, y: any) {
    var eps: number = 0.001*RES_MULTIPLIER;
    return x - eps > 0 && x + eps < p5.width && y - eps > 0 && y + eps < p5.height;
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
  function check_collision(
    p5: p5Types,
    x: number,
    y: number,
    collision_grid: Array<any>,
    grid_resolution: number,
    min_distance: number,
    grid_left_x: number,
    grid_top_y: number
  ) {
    const grid_coords = get_grid_coords(
      p5,
      x,
      y,
      collision_grid,
      grid_resolution,
      grid_left_x,
      grid_top_y,
      true
    );

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
  function set_color(p5: p5Types, x: number, y: number, curve_i: number = 0) {
    var p = palettes[selected_palette];
    if (selected_color_style == "GRADIENT") {
      var h = bottom_y - top_y;
      var n = p.length;
      var step = h / n;
      var r = p5.random(-SIZE/2, SIZE/2);
      var i = p5.floor(p5.map(y+r, top_y, bottom_y, 0, n));
      if (i < 0) i = 0;
      var color = p[i];
      if (color) {
        p5.stroke(color);
        if (isFilled) {
          p5.fill(color);
          p5.noStroke();
        } else {
          p5.noFill();
          p5.stroke(color);
        }
        if (isShapes) {
          p5.fill(color);
        }
      }
    } else if (selected_color_style == "ORDERED") {
      var p_i = ((p5.floor(curve_i) % p.length) + p.length) % p.length;
      var color = p[p_i];
      if (isFilled) {
        p5.fill(color);
        p5.noStroke();
      } else {
        p5.noFill();
        p5.stroke(color);
      }
      if (isShapes) {
        p5.fill(color);
      }
    } else if (selected_color_style == "BW") {
      if (isFilled) {
        p5.fill(0, 0, 0);
        p5.noStroke();
      } else {
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
    } else if (isShapes && !hasBorder) {
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
  function draw_curve(
    p5: p5Types,
    x: number,
    y: number,
    curve_i: number = 0,
    angleOffset: number = 0
  ) {
    var i = 0;
    var num_steps = p5.floor(5.8 * strokeSize/RES_MULTIPLIER + 108);

    if (isShadowed && curve_i != -1) {
      draw_shadow(p5, x, y, -1, angleOffset);
    }
    if (curve_i == -1) {
      p5.strokeWeight(strokeSize);
      p5.stroke(100, 100, 0, 0.3);
      p5.noStroke();
    } else {
      set_color(p5, x, y, i);
    }

    var o_x = x;
    var o_y = y;

    var x_offset_ = x - left_x;
    var y_offset_ = y - top_y;

    var col_index_ = p5.floor(x_offset_ / resolution);
    var row_index_ = p5.floor(y_offset_ / resolution);

    if (
      !col_index_ ||
      col_index_ < 0 ||
      col_index_ >= grid.length ||
      row_index_ < 0 ||
      row_index_ >= grid[col_index_].length
    ) {
      return;
    }

    if (!isColorPerShape) {
      set_color(p5, x, y, curve_i);
    }

    if (curve_i == -1) {
      if (isFilled || isShapes) {
        p5.fill(100, 100, 0, 0.3);
        p5.noStroke();
      } else {
        p5.stroke(100, 100, 0, 0.3);
      }
    }

    var step_length = p5.width / 1000;

    if (isShapes) {
      step_length = 0.2 * strokeSize + 3*RES_MULTIPLIER;
    }

    p5.curveTightness(0);
    p5.beginShape();
    for (i = 0; i < num_steps; i++) {
      if (!isShapes) {
        p5.curveVertex(x, y);
      } else if (isShapes == "circle") {
        if (isColorPerShape) {
          set_color(p5, x, y, curve_i);
        }
        p5.strokeWeight(1 * RES_MULTIPLIER);
        p5.circle(x, y, strokeSize);
      } else if (isShapes == "rect") {
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

      if (
        !col_index ||
        col_index < 0 ||
        col_index >= grid.length ||
        row_index < 0 ||
        row_index >= grid[col_index].length
      ) {
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
  function draw_shadow(
    p5: p5Types,
    x: number,
    y: number,
    i: number,
    angleOffset: number = 0
  ) {
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
  function roundTo(p5: p5Types, num: number, step: number) {
    return p5.floor(num / step) * step;
  }

  return { setup, draw };
};

export default sketch;
