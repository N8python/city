var BloomShader = {

    uniforms: {

        'sceneDiffuse': { value: null },
        'sceneDepth': { value: null },
        'bloomDiffuse': { value: null },
        'bloomDepth': { value: null }
    },

    vertexShader: /* glsl */ `
		varying vec2 vUv;
		void main() {
			vUv = uv;
			gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
		}`,

    fragmentShader: /* glsl */ `
		uniform float opacity;
		uniform sampler2D sceneDiffuse;
        uniform sampler2D bloomDiffuse;
        uniform sampler2D sceneDepth;
        uniform sampler2D bloomDepth;
		varying vec2 vUv;
		void main() {
			vec4 texel = texture2D( bloomDiffuse, vUv );
            float bloomDepthAmt = texture2D( bloomDepth, vUv ).x;
            float sceneDepthAmt = texture2D( sceneDepth, vUv ).x;
            if (bloomDepthAmt <= sceneDepthAmt) {
                gl_FragColor = texel;
            } else {
                gl_FragColor = vec4(vec3(0.0), 1.0);
            }
		}`

};

export { BloomShader };