var ContactShadows = {

    uniforms: {

        'tDiffuse': { value: null },
        'tDepth': { value: null },
        'size': { value: null },
        'inverseProjection': { value: null },
        'inverseView': { value: null },
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
        uniform float logDepthBufferFC;
        uniform mat4 inverseProjection;
        uniform mat4 inverseView;
        uniform vec2 size;
		varying vec2 vUv;
        
  vec3 _ScreenToWorld(vec3 posS) {
    float depthValue = posS.z;
    float v_depth = pow(2.0, depthValue / (logDepthBufferFC * 0.5));
    float z_view = v_depth - 1.0;
    vec4 posCLIP = vec4(posS.xy * 2.0 - 1.0, 0.0, 1.0);
    vec4 posVS = inverseProjection * posCLIP;
    posVS = vec4(posVS.xyz / posVS.w, 1.0);
    posVS.xyz = normalize(posVS.xyz) * z_view;
    vec4 posWS = inverseView * posVS;
    return posWS.xyz;
  }
		void main() {
			vec4 texel = texture2D( tDiffuse, vUv );
            float depth = texture2D(tDepth, vUv).x;
            vec3 worldPos = _ScreenToWorld(vec3(vUv, depth));
            gl_FragColor = texel;
		}`

};

export { ContactShadows };