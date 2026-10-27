/* ==========================================================================
   Vedvan — home section 3: location & connectivity — editable content

   Everything shown in the section comes from this object: list order,
   names, travel times, descriptions, preview images and marker positions.
   Edit here; location.js and the map renderers read it as-is.

   MAP COORDINATES ARE SCHEMATIC. The map is an illustration, not survey
   data: x runs west → east, z runs north → south (negative z = north), one
   unit is not a fixed distance, and destinations are placed only in their
   general direction from the site, compressed to fit. Roads other than the
   expressway alignment are decorative. Replace `x`/`z` values (and
   map.arterials) once a verified site plan is available.
   ========================================================================== */
(function () {
  'use strict';

  window.VedvanLocationData = {
    project: {
      name: 'Vedvan',
      // Site footprint (map units): centre, length along the road, depth, height
      x: 0.6,
      z: -0.7,
      length: 3.4,
      depth: 1.1,
      height: 0.32,
      rotation: 0.56
    },

    // Selected on load
    defaultId: 'meerut',

    destinations: [
      {
        id: 'meerut',
        name: 'Meerut',
        travelTime: '15 mins',
        description: 'Placeholder description — replace with verified details about the connection to Meerut.',
        image: 'assets/home/location/placeholder-fields.jpg',
        imageAlt: 'Illustrative placeholder: open fields at sunset (not a photo of Meerut)',
        x: 8.6,
        z: -6.4,
        arrow: 'right'
      },
      {
        id: 'modinagar',
        name: 'Modinagar',
        travelTime: '10 mins',
        description: 'Placeholder description — replace with verified details about the connection to Modinagar.',
        image: 'assets/home/location/placeholder-open-road.jpg',
        imageAlt: 'Illustrative placeholder: an open road (not a photo of Modinagar)',
        x: -4.4,
        z: 1.5
      },
      {
        id: 'ghaziabad',
        name: 'Ghaziabad',
        travelTime: '15 mins',
        description: 'Placeholder description — replace with verified details about the connection to Ghaziabad.',
        image: 'assets/home/location/placeholder-interchange.jpg',
        imageAlt: 'Illustrative placeholder: a highway interchange seen from above (not a photo of Ghaziabad)',
        x: -7.4,
        z: 3.6
      },
      {
        id: 'noida',
        name: 'Noida',
        travelTime: '25 mins',
        description: 'Placeholder description — replace with verified details about the connection to Noida.',
        image: 'assets/home/location/placeholder-city-lights.jpg',
        imageAlt: 'Illustrative placeholder: city lights at night (not a photo of Noida)',
        x: -6.2,
        z: 8.2
      },
      {
        id: 'akshardham',
        name: 'Akshardham, Delhi',
        travelTime: '35 mins',
        description: 'Placeholder description — replace with verified details about the connection to Akshardham, Delhi.',
        image: 'assets/home/location/placeholder-sunlit-forest.jpg',
        imageAlt: 'Illustrative placeholder: a sunlit forest (not a photo of Akshardham)',
        x: -11.2,
        z: 6.4,
        arrow: 'left'
      }
    ],

    map: {
      // Visible extent the camera keeps in frame (half-width, half-depth)
      fitWidth: 11.5,
      fitDepth: 8.6,
      // Area roads are generated within
      bounds: { minX: -18, maxX: 18, minZ: -13, maxZ: 13 },
      camera: {
        fov: 30,
        elevation: 38,   // degrees above the map plane
        azimuth: -8,     // degrees, rotation around the vertical axis
        target: { x: -2, z: 1.4 }
      },
      // Pointer parallax amplitude in degrees (desktop; tablet uses half)
      parallax: { yaw: 2.2, pitch: 1.2 },
      seed: 7,
      // Main roads as control points (smoothed). Only the first, the
      // expressway alignment past the site, carries meaning; the rest are
      // illustrative.
      arterials: [
        { width: 0.42, tone: 'major', points: [[-19, 12.4], [-11, 7.1], [-4.5, 2.6], [0, 0.4], [5, -2.6], [10, -5.6], [19, -11.2]] },
        { width: 0.2, tone: 'major', points: [[-7.6, 4.2], [-7.2, 7.4], [-6.6, 10.4], [-6.2, 13]] },
        { width: 0.2, tone: 'major', points: [[-7.8, 4.6], [-11, 6.1], [-14.5, 6.9], [-19, 7.4]] },
        { width: 0.16, tone: 'major', points: [[3.5, 13], [4.6, 6.5], [3.6, 1.2], [1.6, -4.5], [1.2, -13]] },
        { width: 0.14, tone: 'major', points: [[-19, -4.5], [-10, -3.2], [-3, -4.8], [6, -8.4], [12, -13]] }
      ]
    }
  };
})();
