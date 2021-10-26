var DefferedLighting = {

    uniforms: {

        'tDiffuse': { value: null },
        'tDepth': { value: null },
        'size': { value: null },
        'inverseProjection': { value: null },
        'inverseView': { value: null },
        'lightTexture': { value: null },
        'lightAmount': { value: null },
        'cameraPos': { value: null },
        'logDepthBufferFC': {
            value: 2.0 / (Math.log(1000.0 + 1) / Math.LN2)
        }
    },

    vertexShader: /* glsl */ `
		varying vec2 vUv;
		void main() {
			vUv = uv;
			gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
		}`,

    fragmentShader: /* glsl */ `
		uniform float opacity;
		uniform sampler2D tDiffuse;
    uniform sampler2D tDepth;
    uniform sampler2D lightTexture;
    uniform float logDepthBufferFC;
    uniform float lightAmount;
    uniform mat4 inverseProjection;
    uniform mat4 inverseView;
    uniform vec3 cameraPos;
    uniform vec2 size;
		varying vec2 vUv;
    vec3 rayDirection(float fieldOfView, vec2 size, vec2 fragCoord) {
      vec2 xy = fragCoord - size / 2.0;
      float z = size.y / tan(radians(fieldOfView) / 2.0);
      return normalize(vec3(xy, -z));
  }   
  vec3 _ScreenToWorld(vec3 posS) {
    vec2 uv = posS.xy;
    float z = posS.z;
    float nearZ = 0.1;
    float farZ = 1000.0;
    float depth = pow(2.0, z * log2(farZ + 1.0)) - 1.0;
    float a = farZ / (farZ - nearZ);
    float b = farZ * nearZ / (nearZ - farZ);
    float linDepth = a + b / depth;
    vec4 clipVec = vec4(uv, linDepth, 1.0) * 2.0 - 1.0;
    vec4 wpos = inverseView * inverseProjection * clipVec;
    return wpos.xyz / wpos.w;
  }
  vec3 computeNormal(vec3 worldPos) {
    vec2 downUv = vUv + vec2(0.0, 1.0 / size.y);
    vec3 downPos = _ScreenToWorld(vec3(downUv, texture2D(tDepth, downUv).x));
    vec2 rightUv = vUv + vec2(1.0 / size.x, 0.0);;
    vec3 rightPos = _ScreenToWorld(vec3(rightUv, texture2D(tDepth, rightUv).x));
    return normalize(cross(rightPos - worldPos, downPos - worldPos));
  }
		void main() {
			vec4 texel = texture2D( tDiffuse, vUv );
            float depth = texture2D(tDepth, vUv).x;
            vec3 worldPos = _ScreenToWorld(vec3(vUv, depth));
            vec3 normal = computeNormal(worldPos) ;
            for(float i = 0.0; i < lightAmount; i += 1.0) {
            vec3 lightMetadata = texture2D(lightTexture, vec2(1.0, i / lightAmount)).xyz;
            float enabled = lightMetadata.z;
              float intensity = lightMetadata.x;
              float range = lightMetadata.y;
              vec3 lightPos = texture2D(lightTexture, vec2(0.0, i / lightAmount)).xyz;
              vec3 dirToLight = normalize(lightPos-worldPos);
              texel += vec4(intensity * enabled * texture2D(lightTexture, vec2(0.5, i / lightAmount)).xyz * max((1.0 - (length(worldPos - lightPos) / range)), 0.0) * max(dot(dirToLight, normal), 0.0), 1.0);
            }
            gl_FragColor = texel;
            
		}`

};

export { DefferedLighting };