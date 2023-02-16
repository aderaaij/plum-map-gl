import { useEffect, useState, useMemo, useCallback } from "react";
import { useControls } from "leva";
import Map from "react-map-gl";
import { csv } from "d3-fetch";

import {
  AmbientLight,
  PointLight,
  LightingEffect,
  Material,
  Color,
  FlyToInterpolator
} from "@deck.gl/core/typed";

import { HeatmapLayer, HexagonLayer } from "@deck.gl/aggregation-layers/typed";
import { ScatterplotLayer } from "@deck.gl/layers/typed";
import DeckGL from "@deck.gl/react/typed";

import * as count from "./assets/listing-bookings-count.json";
import * as listingData from "./assets/listing-latlng.json";

const ambientLight = new AmbientLight({
  color: [255, 255, 255],
  intensity: 1.0
});

const pointLight1 = new PointLight({
  color: [255, 255, 255],
  intensity: 0.8,
  position: [-0.144528, 49.739968, 80000]
});

const pointLight2 = new PointLight({
  color: [255, 255, 255],
  intensity: 0.8,
  position: [-3.807751, 54.104682, 8000]
});

const lightingEffect = new LightingEffect({
  ambientLight,
  pointLight1,
  pointLight2
});

const material: Material = {
  ambient: 0.64,
  diffuse: 0.6,
  shininess: 30,
  specularColor: [51, 51, 51]
};

const INITIAL_VIEW_STATE = {
  longitude: -1.415727,
  latitude: 52.232395,
  zoom: 6.6,
  minZoom: 1,
  maxZoom: 15,
  pitch: 40.5
  // bearing: -27
};

export const colorRange: number[][] & Color[] = [
  [186, 240, 246],
  [141, 246, 245],
  [89, 251, 233],
  [8, 254, 210],
  [0, 255, 176],
  [0, 255, 132]
];

const MAPGL_TOKEN =
  "pk.eyJ1IjoiYWRlcmFhaWotcGx1bSIsImEiOiJjbGU1aDg2d3cwOXNwM29tdjBvano3cGxkIn0.JRPNSRIyj631zH8KKWmwJg";
const MAP_STYLE =
  "https://basemaps.cartocdn.com/gl/dark-matter-nolabels-gl-style/style.json";

export const BookingMap = ({
  mapStyle = MAP_STYLE,
  radius = 1000,
  upperPercentile = 100,
  coverage = 1
}) => {
  const [data, setData] = useState([]);
  const [initialViewState, setInitialViewState] = useState<any>(
    INITIAL_VIEW_STATE
  );

  useEffect(() => {
    const fetchData = async () => {
      const csvData = await csv("listings-LNG-LAT.csv");
      setData(csvData.map((d) => [Number(d.LNG), Number(d.LAT)]));
    };

    fetchData();
  }, []);

  const { hexLayer, heatLayer, scatterLayer, select } = useControls({
    hexLayer: false,
    heatLayer: false,
    scatterLayer: true,
    select: { options: ["LDN", "NYC"] }
  });

  const goToNYC = useCallback(() => {
    setInitialViewState({
      longitude: -74,
      latitude: 40.7,
      zoom: 6.6,
      pitch: 40.5,
      bearing: 0,
      transitionDuration: 3000,
      transitionInterpolator: new FlyToInterpolator()
    });
  }, []);

  const goToLDN = useCallback(() => {
    setInitialViewState({
      ...INITIAL_VIEW_STATE,
      transitionDuration: 3000,
      transitionInterpolator: new FlyToInterpolator()
    });
  }, []);

  useEffect(() => {
    if (select === "NYC") {
      goToNYC();
    }
    if (select === "LDN") {
      goToLDN();
    }
  }, [select, goToNYC, goToLDN]);

  const layers = useMemo(
    () => [
      new HexagonLayer({
        id: "hexLayer",
        colorRange,
        coverage,
        data,
        visible: hexLayer,
        elevationRange: [0, 5000],
        elevationScale: data && data.length ? 30 : 0,
        extruded: true,
        getPosition: (d) => d,
        pickable: true,
        radius,
        upperPercentile,
        material,
        transitions: {
          elevationScale: 1500
        }
      }),
      new HeatmapLayer({
        id: "heatmapLayer",
        data,
        getPosition: (d) => d,
        // getWeight: d => 10,
        aggregation: "SUM",
        visible: heatLayer
      }),
      new ScatterplotLayer({
        id: "scatterplot-layer",
        data,
        pickable: true,
        opacity: 1,
        stroked: false,
        filled: true,
        visible: scatterLayer,
        radiusScale: 6,
        radiusMinPixels: 1,
        radiusMaxPixels: 100,
        lineWidthMinPixels: 1,
        getPosition: (d) => d,
        getFillColor: (d) => [253, 187, 48],
        getLineColor: (d) => [0, 0, 0]
      })
    ],
    [coverage, data, radius, upperPercentile, hexLayer, heatLayer, scatterLayer]
  );

  return (
    <DeckGL
      layers={layers}
      effects={[lightingEffect]}
      initialViewState={initialViewState}
      controller={true}
    >
      <Map reuseMaps mapStyle={mapStyle} mapboxAccessToken={MAPGL_TOKEN} />;
    </DeckGL>
  );
};
