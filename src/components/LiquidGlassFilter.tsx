export function LiquidGlassFilter() {
  return (
    <svg
      width="0"
      height="0"
      className="fixed pointer-events-none opacity-0"
      aria-hidden="true"
    >
      <defs>
        <filter
          id="ios-liquid-glass"
          x="-12%"
          y="-12%"
          width="124%"
          height="124%"
          colorInterpolationFilters="sRGB"
        >
          <feTurbulence
            type="fractalNoise"
            baseFrequency="0.012 0.018"
            numOctaves="2"
            seed="7"
            result="waveNoise"
          />
          <feGaussianBlur in="waveNoise" stdDeviation="3" result="softLensMap" />
          <feDisplacementMap
            in="SourceGraphic"
            in2="softLensMap"
            scale="10"
            xChannelSelector="R"
            yChannelSelector="G"
            result="refracted"
          />
          <feSpecularLighting
            in="softLensMap"
            surfaceScale="3"
            specularConstant="0.75"
            specularExponent="28"
            lightingColor="#ffffff"
            result="specularRim"
          >
            <fePointLight x="-120" y="-160" z="220" />
          </feSpecularLighting>
          <feComposite
            in="specularRim"
            in2="SourceAlpha"
            operator="in"
            result="clippedSpecular"
          />
          <feBlend in="refracted" in2="clippedSpecular" mode="screen" />
        </filter>
      </defs>
    </svg>
  );
}
