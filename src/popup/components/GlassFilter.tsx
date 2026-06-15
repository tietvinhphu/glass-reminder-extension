/** Filter SVG tạo hiệu ứng kính lỏng — CSS tham chiếu qua url(#glass-distortion) */
export const GlassFilter = () => (
  <svg style={{ display: "none" }} aria-hidden="true">
    <defs>
      <filter
        id="glass-distortion"
        x="-5%"
        y="-5%"
        width="110%"
        height="110%"
        colorInterpolationFilters="sRGB"
      >
        {/* Tạo nhiễu fractal làm nền cho hiệu ứng dịch chuyển pixel */}
        <feTurbulence
          type="fractalNoise"
          baseFrequency="0.003 0.008"
          numOctaves={1}
          seed={17}
          result="turbulence"
        />
        <feComponentTransfer in="turbulence" result="mapped">
          <feFuncR type="gamma" amplitude={1} exponent={10} offset={0.5} />
          <feFuncG type="gamma" amplitude={0} exponent={1} offset={0} />
          <feFuncB type="gamma" amplitude={0} exponent={1} offset={0.5} />
        </feComponentTransfer>
        {/* Làm mờ map nhiễu để tạo dịch chuyển mượt */}
        <feGaussianBlur in="turbulence" stdDeviation={3} result="softMap" />
        <feSpecularLighting
          in="softMap"
          surfaceScale={5}
          specularConstant={1}
          specularExponent={100}
          lightingColor="white"
          result="specLight"
        >
          <fePointLight x={-200} y={-200} z={300} />
        </feSpecularLighting>
        <feComposite
          in="specLight"
          operator="arithmetic"
          k1={0}
          k2={1}
          k3={1}
          k4={0}
          result="litImage"
        />
        {/* Dịch chuyển pixel nguồn theo map nhiễu — tạo hiệu ứng kính lỏng */}
        <feDisplacementMap
          in="SourceGraphic"
          in2="softMap"
          scale={80}
          xChannelSelector="R"
          yChannelSelector="G"
        />
      </filter>
    </defs>
  </svg>
);
